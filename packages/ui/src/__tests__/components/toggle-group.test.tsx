import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup, ToggleGroupItem } from '../../components/toggle-group';

describe('ToggleGroup', () => {
    it('renders single-select toggle items correctly', async () => {
        const onValueChange = vi.fn();
        render(
            <ToggleGroup type="single" onValueChange={onValueChange}>
                <ToggleGroupItem value="left" aria-label="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="right">Right</ToggleGroupItem>
            </ToggleGroup>
        );

        const leftBtn = screen.getByRole('radio', { name: 'left' });
        const centerBtn = screen.getByRole('radio', { name: 'center' });

        expect(leftBtn).toHaveAttribute('aria-checked', 'false');
        expect(centerBtn).toHaveAttribute('aria-checked', 'false');

        await userEvent.click(leftBtn);
        expect(onValueChange).toHaveBeenCalledWith('left');
        expect(leftBtn).toHaveAttribute('aria-checked', 'true');

        await userEvent.click(centerBtn);
        expect(onValueChange).toHaveBeenCalledWith('center');
        expect(leftBtn).toHaveAttribute('aria-checked', 'false');
        expect(centerBtn).toHaveAttribute('aria-checked', 'true');
    });

    it('renders multi-select toggle items correctly', async () => {
        const onValueChange = vi.fn();
        render(
            <ToggleGroup type="multiple" onValueChange={onValueChange}>
                <ToggleGroupItem value="bold" aria-label="bold">Bold</ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="italic">Italic</ToggleGroupItem>
            </ToggleGroup>
        );

        const boldBtn = screen.getByRole('button', { name: 'bold' });
        const italicBtn = screen.getByRole('button', { name: 'italic' });

        await userEvent.click(boldBtn);
        expect(onValueChange).toHaveBeenCalledWith(['bold']);
        expect(boldBtn).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(italicBtn);
        expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic']);
        expect(boldBtn).toHaveAttribute('aria-pressed', 'true');
        expect(italicBtn).toHaveAttribute('aria-pressed', 'true');
    });
});
