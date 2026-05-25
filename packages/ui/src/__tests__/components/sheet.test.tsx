import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '../../components/sheet';
import { Button } from '../../components/button';

function TestSheet({
    side = 'right' as const,
    defaultOpen = false,
}) {
    return (
        <Sheet defaultOpen={defaultOpen}>
            <SheetTrigger asChild>
                <Button>Open Drawer</Button>
            </SheetTrigger>
            <SheetContent side={side}>
                <SheetHeader>
                    <SheetTitle>Test Sheet</SheetTitle>
                    <SheetDescription>Sheet description context</SheetDescription>
                </SheetHeader>
                <p>Sheet body</p>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Done</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

describe('Sheet', () => {
    it('is closed by default', () => {
        render(<TestSheet />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens when trigger is clicked', async () => {
        render(<TestSheet />);
        await userEvent.click(screen.getByRole('button', { name: 'Open Drawer' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Test Sheet')).toBeInTheDocument();
    });

    it('closes when close is clicked', async () => {
        render(<TestSheet defaultOpen />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
});
