import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from '../../components/form';
import { Input } from '../../components/input';
import { Button } from '../../components/button';

const testSchema = z.object({
    username: z.string().min(3, { message: 'Username too short' }),
});

function TestForm({ onSubmit }: { onSubmit: (values: any) => void }) {
    const form = useForm<z.infer<typeof testSchema>>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            username: '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Type here" {...field} />
                            </FormControl>
                            <FormDescription>Must be 3+ chars</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}

describe('Form', () => {
    it('renders form inputs, labels and descriptions correctly', () => {
        const onSubmit = vi.fn();
        render(<TestForm onSubmit={onSubmit} />);

        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
        expect(screen.getByText('Must be 3+ chars')).toBeInTheDocument();
    });

    it('triggers validation errors on invalid submit', async () => {
        const onSubmit = vi.fn();
        render(<TestForm onSubmit={onSubmit} />);

        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(screen.getByText('Username too short')).toBeInTheDocument();
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits successfully when form input is valid', async () => {
        const onSubmit = vi.fn();
        render(<TestForm onSubmit={onSubmit} />);

        const input = screen.getByPlaceholderText('Type here');
        await userEvent.type(input, 'johndoe');
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ username: 'johndoe' }),
                expect.any(Object)
            );
        });
    });
});
