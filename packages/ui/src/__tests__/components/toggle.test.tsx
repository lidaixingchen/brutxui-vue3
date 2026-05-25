import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../../components/toggle';

describe('Toggle', () => {
    it('renders with button role', () => {
        render(<Toggle aria-label="bold">Bold</Toggle>);
        const btn = screen.getByRole('button', { name: 'bold' });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    it('changes state when clicked', async () => {
        const onPressedChange = vi.fn();
        render(<Toggle aria-label="bold" onPressedChange={onPressedChange}>Bold</Toggle>);

        const btn = screen.getByRole('button', { name: 'bold' });
        await userEvent.click(btn);

        expect(onPressedChange).toHaveBeenCalledWith(true);
        expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    it('remains unclickable when disabled', async () => {
        const onPressedChange = vi.fn();
        render(<Toggle aria-label="bold" disabled onPressedChange={onPressedChange}>Bold</Toggle>);

        const btn = screen.getByRole('button', { name: 'bold' });
        await userEvent.click(btn);

        expect(onPressedChange).not.toHaveBeenCalled();
        expect(btn).toBeDisabled();
    });
});
