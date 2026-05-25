import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '../../components/dialog';
import { Button } from '../../components/button';

function TestDialog({
    defaultOpen = false,
    showCloseButton = true,
    onOpenChange,
}: {
    defaultOpen?: boolean;
    showCloseButton?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    return (
        <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent showCloseButton={showCloseButton}>
                <DialogHeader>
                    <DialogTitle>Test Dialog</DialogTitle>
                    <DialogDescription>Dialog description</DialogDescription>
                </DialogHeader>
                <p>Dialog body content</p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

describe('Dialog', () => {
    it('is closed by default', () => {
        render(<TestDialog />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens when trigger is clicked', async () => {
        render(<TestDialog />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    it('renders title and description for accessibility', async () => {
        render(<TestDialog defaultOpen />);
        expect(screen.getByText('Test Dialog')).toBeInTheDocument();
        expect(screen.getByText('Dialog description')).toBeInTheDocument();
    });

    it('closes when close button is clicked', async () => {
        render(<TestDialog />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        const closeBtn = screen.getByRole('button', { name: 'Close' });
        await userEvent.click(closeBtn);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes when DialogClose button is clicked', async () => {
        render(<TestDialog />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes on Escape key press', async () => {
        render(<TestDialog />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('calls onOpenChange when opening and closing', async () => {
        const onOpenChange = vi.fn();
        render(<TestDialog onOpenChange={onOpenChange} />);

        await userEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
        expect(onOpenChange).toHaveBeenCalledWith(true);

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('can be rendered open by default with defaultOpen', () => {
        render(<TestDialog defaultOpen />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton=false', async () => {
        render(<TestDialog defaultOpen showCloseButton={false} />);
        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });

    it('has aria-labelledby pointing to the title', async () => {
        render(<TestDialog defaultOpen />);
        const dialog = screen.getByRole('dialog');
        const titleId = screen.getByText('Test Dialog').id;
        expect(dialog).toHaveAttribute('aria-labelledby', titleId);
    });
});
