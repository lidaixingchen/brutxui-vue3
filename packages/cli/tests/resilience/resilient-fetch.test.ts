import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { resilientFetch } from '../../src/lib/resilience/resilient-fetch.js';

const HTTP_OK = 200;
const HTTP_NOT_MODIFIED = 304;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVICE_UNAVAILABLE = 503;
const ONE_ATTEMPT = 1;
const TWO_ATTEMPTS = 2;
const THREE_ATTEMPTS = 3;
const BODY_TIMEOUT_MS = 25;
const LOCAL_HTTP_BODY_TIMEOUT_MS = 300;

interface LocalHttpServer {
    readonly server: Server;
    readonly origin: string;
}

function createResponsePausedUntilAbort(signal: AbortSignal): Response {
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>): void {
            streamController = controller;
            signal.addEventListener('abort', () => {
                streamController?.error(new Error('Request aborted.'));
            }, { once: true });
        },
        pull(): Promise<void> {
            return new Promise<void>(() => undefined);
        },
    });
    return new Response(body, { status: HTTP_OK });
}

async function startLocalHttpServer(
    handler: (request: IncomingMessage, response: ServerResponse) => void,
): Promise<LocalHttpServer> {
    const server: Server = createServer(handler);
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });

    const address = server.address();
    if (address === null || typeof address === 'string') {
        throw new Error('Expected a local TCP address.');
    }

    const { port } = address;
    return { server, origin: `http://127.0.0.1:${port}` };
}

async function closeLocalHttpServer(server: Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
        server.closeAllConnections();
    });
}

describe('resilientFetch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('returns the original native response with a readable body and releases its timer and parent listener', async () => {
        const responseBody = JSON.stringify({ ready: true });
        const nativeResponse = new Response(responseBody, {
            status: HTTP_OK,
            headers: { 'content-type': 'application/json', 'x-response-meta': 'preserved' },
        });
        const fetchMock = vi.fn(async (): Promise<Response> => nativeResponse);
        vi.stubGlobal('fetch', fetchMock);
        const parentController = new AbortController();
        const removeListenerSpy = vi.spyOn(parentController.signal, 'removeEventListener');

        const response = await resilientFetch('https://example.com/test.json', {
            signal: parentController.signal,
            maxRetries: ONE_ATTEMPT,
        });

        expect(response).toBe(nativeResponse);
        expect(response.status).toBe(HTTP_OK);
        expect(response.headers.get('x-response-meta')).toBe('preserved');
        expect(await response.json()).toEqual({ ready: true });
        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
        expect(removeListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps the per-attempt timeout active while a native response body is paused', async () => {
        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            if (!init?.signal) {
                throw new Error('Expected an attempt signal.');
            }
            return createResponsePausedUntilAbort(init.signal);
        });
        vi.stubGlobal('fetch', fetchMock);

        const responsePromise = resilientFetch('https://example.com/paused.json', {
            maxRetries: ONE_ATTEMPT,
            singleAttemptTimeoutMs: BODY_TIMEOUT_MS,
        });
        const rejection = expect(responsePromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        await vi.advanceTimersByTimeAsync(BODY_TIMEOUT_MS);

        await rejection;
        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels a paused body when the parent signal aborts and does not retry', async () => {
        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            if (!init?.signal) {
                throw new Error('Expected an attempt signal.');
            }
            return createResponsePausedUntilAbort(init.signal);
        });
        vi.stubGlobal('fetch', fetchMock);
        const parentController = new AbortController();

        const responsePromise = resilientFetch('https://example.com/cancelled.json', {
            signal: parentController.signal,
            maxRetries: THREE_ATTEMPTS,
        });
        const rejection = expect(responsePromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        parentController.abort();

        await rejection;
        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('returns a native 304 response without retrying', async () => {
        const notModifiedResponse = new Response(null, {
            status: HTTP_NOT_MODIFIED,
            headers: { etag: '"registry-v1"' },
        });
        const fetchMock = vi.fn(async (): Promise<Response> => notModifiedResponse);
        vi.stubGlobal('fetch', fetchMock);

        const response = await resilientFetch('https://example.com/registry.json', {
            maxRetries: THREE_ATTEMPTS,
        });

        expect(response).toBe(notModifiedResponse);
        expect(response.status).toBe(HTTP_NOT_MODIFIED);
        expect(response.headers.get('etag')).toBe('"registry-v1"');
        expect((await response.arrayBuffer()).byteLength).toBe(0);
        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
    });

    it('returns terminal HTTP responses without retrying and keeps their body readable', async () => {
        const notFoundResponse = new Response('missing', {
            status: HTTP_NOT_FOUND,
            statusText: 'Not Found',
        });
        const fetchMock = vi.fn(async (): Promise<Response> => notFoundResponse);
        vi.stubGlobal('fetch', fetchMock);

        const response = await resilientFetch('https://example.com/missing.json', {
            maxRetries: THREE_ATTEMPTS,
        });

        expect(response).toBe(notFoundResponse);
        expect(response.status).toBe(HTTP_NOT_FOUND);
        expect(response.statusText).toBe('Not Found');
        expect(await response.text()).toBe('missing');
        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
    });

    it('reports a terminal HTTP body failure after one request', async (): Promise<void> => {
        const failedBody: ReadableStream<Uint8Array> = new ReadableStream<Uint8Array>({
            start(controller: ReadableStreamDefaultController<Uint8Array>): void {
                controller.error(new Error('terminal response body failed'));
            },
        });
        const failedResponse: Response = new Response(failedBody, { status: HTTP_NOT_FOUND });
        const fetchMock: Mock<() => Promise<Response>> = vi.fn(async (): Promise<Response> => failedResponse);
        vi.stubGlobal('fetch', fetchMock);

        const responsePromise: Promise<Response> = resilientFetch('https://example.com/missing.json', {
            maxRetries: THREE_ATTEMPTS,
        });
        const rejection: Promise<void> = expect(responsePromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        await vi.runAllTimersAsync();
        await rejection;

        expect(fetchMock).toHaveBeenCalledTimes(ONE_ATTEMPT);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels a retryable response body before retrying and returns the recovered response', async () => {
        const cancelSpy = vi.fn<() => void>();
        const retryBody = new ReadableStream<Uint8Array>({
            start(controller: ReadableStreamDefaultController<Uint8Array>): void {
                controller.enqueue(new TextEncoder().encode('temporary error'));
            },
            cancel: cancelSpy,
        });
        const retryableResponse = new Response(retryBody, {
            status: HTTP_SERVICE_UNAVAILABLE,
            headers: { 'retry-after': '0' },
        });
        const recoveredResponse = new Response(JSON.stringify({ ready: true }), {
            status: HTTP_OK,
            headers: { 'content-type': 'application/json' },
        });
        let attempt = 0;
        const fetchMock = vi.fn(async (): Promise<Response> => {
            attempt += 1;
            return attempt === ONE_ATTEMPT ? retryableResponse : recoveredResponse;
        });
        vi.stubGlobal('fetch', fetchMock);

        const responsePromise = resilientFetch('https://example.com/retry.json', {
            maxRetries: TWO_ATTEMPTS,
        });
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(cancelSpy).toHaveBeenCalledTimes(ONE_ATTEMPT);
        expect(response).toBe(recoveredResponse);
        expect(await response.json()).toEqual({ ready: true });
        expect(fetchMock).toHaveBeenCalledTimes(TWO_ATTEMPTS);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('retries when receiving a response body fails and returns the next complete response', async () => {
        const failedBody = new ReadableStream<Uint8Array>({
            start(controller: ReadableStreamDefaultController<Uint8Array>): void {
                controller.error(new Error('body stream failed'));
            },
        });
        const failedResponse = new Response(failedBody, { status: HTTP_OK });
        const recoveredResponse = new Response(JSON.stringify({ recovered: true }), {
            status: HTTP_OK,
            headers: { 'content-type': 'application/json' },
        });
        let attempt = 0;
        const fetchMock = vi.fn(async (): Promise<Response> => {
            attempt += 1;
            return attempt === ONE_ATTEMPT ? failedResponse : recoveredResponse;
        });
        vi.stubGlobal('fetch', fetchMock);

        const responsePromise = resilientFetch('https://example.com/body-retry.json', {
            maxRetries: TWO_ATTEMPTS,
        });
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(response).toBe(recoveredResponse);
        expect(await response.json()).toEqual({ recovered: true });
        expect(fetchMock).toHaveBeenCalledTimes(TWO_ATTEMPTS);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('times out a real local HTTP response that pauses after sending headers and partial JSON', async () => {
        vi.useRealTimers();
        let hangRequestCount = 0;
        let hangSocket: Socket | undefined;
        const { server, origin } = await startLocalHttpServer((request: IncomingMessage, response: ServerResponse): void => {
            if (request.url === '/hang') {
                hangRequestCount += 1;
                hangSocket = request.socket;
                response.writeHead(HTTP_OK, { 'content-type': 'application/json' });
                response.write('{"partial":');
                return;
            }

            response.writeHead(HTTP_OK, {
                'content-type': 'application/json',
                'x-response-meta': 'preserved',
            });
            response.end(JSON.stringify({ ready: true }));
        });

        try {
            const completeResponse = await resilientFetch(`${origin}/json`, {
                maxRetries: ONE_ATTEMPT,
                singleAttemptTimeoutMs: LOCAL_HTTP_BODY_TIMEOUT_MS,
            });
            expect(completeResponse.url).toBe(`${origin}/json`);
            expect(completeResponse.status).toBe(HTTP_OK);
            expect(completeResponse.headers.get('x-response-meta')).toBe('preserved');
            expect(await completeResponse.json()).toEqual({ ready: true });

            await expect(resilientFetch(`${origin}/hang`, {
                maxRetries: ONE_ATTEMPT,
                singleAttemptTimeoutMs: LOCAL_HTTP_BODY_TIMEOUT_MS,
            })).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
            expect(hangRequestCount).toBe(ONE_ATTEMPT);
        } finally {
            await closeLocalHttpServer(server);
        }

        expect(hangSocket?.destroyed).toBe(true);
    });

    it('throws REGISTRY_FETCH_FAILED after exhausting retries on network errors', async () => {
        const fetchMock = vi.fn(async (): Promise<Response> => {
            throw new TypeError('Failed to fetch');
        });
        vi.stubGlobal('fetch', fetchMock);

        const responsePromise = resilientFetch('https://example.com/network-down.json', {
            maxRetries: TWO_ATTEMPTS,
        });
        const rejection = expect(responsePromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        await vi.runAllTimersAsync();

        await rejection;
        expect(fetchMock).toHaveBeenCalledTimes(TWO_ATTEMPTS);
        expect(vi.getTimerCount()).toBe(0);
    });
});
