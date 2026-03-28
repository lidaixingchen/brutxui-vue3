import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

// Radix Tooltip requires a Provider ancestor.
// In tests, we wrap in TooltipProvider with delayDuration=0 to skip the hover delay.
// Note: Radix renders tooltip content in two places —
//   1. A visible styled <div> (our TooltipContent)
//   2. A visually-hidden <span role="tooltip"> (the ARIA widget)
// We use getByRole('tooltip') / queryByRole('tooltip') throughout.

function TestTooltip({
    content = 'Tooltip text',
    delayDuration = 0,
    open,
    defaultOpen,
    onOpenChange,
}: {
    content?: string;
    delayDuration?: number;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (v: boolean) => void;
}) {
    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>{content}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

describe('Tooltip', () => {
    it('renders the trigger', () => {
        render(<TestTooltip />);
        expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('tooltip content is not visible by default', () => {
        render(<TestTooltip />);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows content when open=true (controlled)', () => {
        render(<TestTooltip open />);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text');
    });

    it('shows content on mouse hover (delayDuration=0)', async () => {
        render(<TestTooltip delayDuration={0} />);
        await userEvent.hover(screen.getByText('Hover me'));
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
    });

    it('hides content when trigger loses focus', async () => {
        render(<TestTooltip delayDuration={0} />);
        // Open via focus
        await act(async () => screen.getByText('Hover me').focus());
        await waitFor(() => screen.getByRole('tooltip'));
        // Close via blur
        await act(async () => screen.getByText('Hover me').blur());
        await waitFor(() =>
            expect(screen.getByText('Hover me')).toHaveAttribute('data-state', 'closed')
        );
    });

    it('shows content on focus', async () => {
        render(<TestTooltip delayDuration={0} />);
        await act(async () => screen.getByText('Hover me').focus());
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
    });

    it('hides content on blur', async () => {
        render(<TestTooltip delayDuration={0} />);
        await act(async () => screen.getByText('Hover me').focus());
        await waitFor(() => screen.getByRole('tooltip'));
        await act(async () => screen.getByText('Hover me').blur());
        // Radix keeps content mounted during exit animation; verify trigger closed state
        await waitFor(() =>
            expect(screen.getByText('Hover me')).toHaveAttribute('data-state', 'closed')
        );
    });

    it('shows content when defaultOpen=true', () => {
        render(<TestTooltip defaultOpen />);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('calls onOpenChange when tooltip opens on hover', async () => {
        const onOpenChange = vi.fn();
        render(<TestTooltip delayDuration={0} onOpenChange={onOpenChange} />);
        await userEvent.hover(screen.getByText('Hover me'));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    });

    it('calls onOpenChange(false) when trigger loses focus', async () => {
        const onOpenChange = vi.fn();
        render(<TestTooltip delayDuration={0} onOpenChange={onOpenChange} />);
        await act(async () => screen.getByText('Hover me').focus());
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
        await act(async () => screen.getByText('Hover me').blur());
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('renders custom content', () => {
        render(
            <TooltipProvider>
                <Tooltip open>
                    <TooltipTrigger>Trigger</TooltipTrigger>
                    <TooltipContent>
                        <strong>Bold tip</strong>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        // The visually-hidden role="tooltip" span contains the text content
        expect(screen.getByRole('tooltip')).toHaveTextContent('Bold tip');
    });

    it('applies brutalist styling classes to content', () => {
        render(<TestTooltip open content="Styled tip" />);
        // The hidden <span role="tooltip"> is a child of the visible styled <div>
        const tooltipSpan = screen.getByRole('tooltip');
        const visibleContent = tooltipSpan.parentElement!;
        expect(visibleContent).toHaveClass('bg-black', 'text-white', 'font-bold', 'border-2');
    });

    it('TooltipProvider is required — Radix throws without it', () => {
        // Radix v2 enforces Provider context — this documents the requirement
        expect(() =>
            render(
                <Tooltip>
                    <TooltipTrigger>Btn</TooltipTrigger>
                    <TooltipContent>Tip</TooltipContent>
                </Tooltip>
            )
        ).toThrow();
    });
});

