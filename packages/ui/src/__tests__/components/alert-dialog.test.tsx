import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '../../components/alert-dialog';
import { Button } from '../../components/button';

function TestAlertDialog({
    defaultOpen = false,
    onOpenChange,
}: {
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    return (
        <AlertDialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>
                <Button>Open Alert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Test Alert</AlertDialogTitle>
                    <AlertDialogDescription>Alert description context</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline">Discard</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild variant="destructive">
                        <Button variant="danger">Confirm Action</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

describe('AlertDialog', () => {
    it('is closed by default', () => {
        render(<TestAlertDialog />);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('opens when trigger is clicked', async () => {
        render(<TestAlertDialog />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Alert' }));
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText('Test Alert')).toBeInTheDocument();
    });

    it('closes when Cancel is clicked', async () => {
        render(<TestAlertDialog defaultOpen />);
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    it('closes when Action is clicked', async () => {
        render(<TestAlertDialog defaultOpen />);
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Confirm Action' }));
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });
});
