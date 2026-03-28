import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import { Toast, ToastContainer, useToast } from '../../components/toast';

describe('Toast', () => {
    it('renders with title', () => {
        render(<Toast title="Hello" />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders with description', () => {
        render(<Toast title="Title" description="Some details here" />);
        expect(screen.getByText('Some details here')).toBeInTheDocument();
    });

    it('has role=alert for screen readers', () => {
        render(<Toast title="Alert" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
        const onClose = vi.fn();
        render(<Toast title="Toast" onClose={onClose} />);
        await userEvent.click(screen.getByRole('button', { name: /close/i }));
        // Allow 200ms leaving animation via fake timers is complex — just assert onClose is eventually called
        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 500 });
    });

    it('shows close button only when onClose is provided', () => {
        const { rerender } = render(<Toast title="No close" />);
        expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();

        rerender(<Toast title="With close" onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('renders progress bar when duration and onClose are provided', () => {
        const { container } = render(<Toast title="Progress" onClose={vi.fn()} duration={3000} />);
        // The progress bar div exists inside the toast
        const progressBar = container.querySelector('.animate-nb-shrink');
        expect(progressBar).toBeInTheDocument();
    });

    it('does not render progress bar without onClose', () => {
        const { container } = render(<Toast title="No Progress" duration={3000} />);
        expect(container.querySelector('.animate-nb-shrink')).not.toBeInTheDocument();
    });

    it('renders children when provided', () => {
        render(<Toast><span>Custom child</span></Toast>);
        expect(screen.getByText('Custom child')).toBeInTheDocument();
    });

    it('renders action slot', () => {
        render(<Toast title="Action toast" action={<button>Undo</button>} />);
        expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it.each([
        ['default', 'bg-white'],
        ['success', 'bg-[#7FB069]'],
        ['error', 'bg-[#FF6B6B]'],
        ['warning', 'bg-[#FFE66D]'],
        ['info', 'bg-[#4ECDC4]'],
    ] as const)('applies correct background class for variant=%s', (variant, expectedClass) => {
        const { container } = render(<Toast variant={variant} title="Test" />);
        expect(container.firstChild).toHaveClass(expectedClass);
    });
});

describe('ToastContainer', () => {
    it('renders children', () => {
        render(
            <ToastContainer>
                <Toast title="Toast 1" />
                <Toast title="Toast 2" />
            </ToastContainer>
        );
        expect(screen.getByText('Toast 1')).toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });

    it('applies bottom-right position by default', () => {
        const { container } = render(<ToastContainer><Toast title="T" /></ToastContainer>);
        expect(container.firstChild).toHaveClass('bottom-4', 'right-4');
    });

    it('applies top-left position when specified', () => {
        const { container } = render(<ToastContainer position="top-left"><Toast title="T" /></ToastContainer>);
        expect(container.firstChild).toHaveClass('top-4', 'left-4');
    });
});

describe('useToast', () => {
    it('starts with no toasts', () => {
        const { result } = renderHook(() => useToast());
        expect(result.current.toasts).toEqual([]);
    });

    it('adds a toast with addToast', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.addToast({ title: 'Hello', variant: 'default' });
        });
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe('Hello');
        expect(result.current.toasts[0].variant).toBe('default');
    });

    it('addToast returns an id string', () => {
        const { result } = renderHook(() => useToast());
        let id!: string;
        act(() => {
            id = result.current.addToast({ title: 'Test' });
        });
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('removeToast removes the correct toast', () => {
        const { result } = renderHook(() => useToast());
        let id!: string;
        act(() => {
            id = result.current.addToast({ title: 'Removable' });
            result.current.addToast({ title: 'Keep me' });
        });
        act(() => {
            result.current.removeToast(id);
        });
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe('Keep me');
    });

    it('clearToasts removes all toasts', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.addToast({ title: 'A' });
            result.current.addToast({ title: 'B' });
            result.current.addToast({ title: 'C' });
        });
        act(() => {
            result.current.clearToasts();
        });
        expect(result.current.toasts).toHaveLength(0);
    });

    it('success shorthand sets variant=success', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.success('Done!', 'All good');
        });
        expect(result.current.toasts[0].variant).toBe('success');
        expect(result.current.toasts[0].title).toBe('Done!');
        expect(result.current.toasts[0].description).toBe('All good');
    });

    it('error shorthand sets variant=error', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.error('Oops');
        });
        expect(result.current.toasts[0].variant).toBe('error');
    });

    it('warning shorthand sets variant=warning', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.warning('Careful');
        });
        expect(result.current.toasts[0].variant).toBe('warning');
    });

    it('info shorthand sets variant=info', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.info('FYI');
        });
        expect(result.current.toasts[0].variant).toBe('info');
    });

    it('accumulates multiple toasts', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.addToast({ title: 'First' });
            result.current.addToast({ title: 'Second' });
            result.current.addToast({ title: 'Third' });
        });
        expect(result.current.toasts).toHaveLength(3);
    });

    it('each toast has a unique id', () => {
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.addToast({ title: 'A' });
            result.current.addToast({ title: 'B' });
        });
        const ids = result.current.toasts.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
