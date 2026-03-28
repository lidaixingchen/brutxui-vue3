import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
} from '../../components/select';

function TestSelect({
    value,
    onValueChange,
    defaultValue,
    disabled = false,
}: {
    value?: string;
    onValueChange?: (v: string) => void;
    defaultValue?: string;
    disabled?: boolean;
}) {
    return (
        <Select value={value} onValueChange={onValueChange} defaultValue={defaultValue} disabled={disabled}>
            <SelectTrigger aria-label="Pick a fruit">
                <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Fruits</SelectLabel>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="banana">Banana</SelectItem>
                    <SelectItem value="cherry">Cherry</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="disabled-item" disabled>
                        Disabled Item
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

describe('Select', () => {
    it('renders trigger with placeholder', () => {
        render(<TestSelect />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Select a fruit')).toBeInTheDocument();
    });

    it('opens dropdown when trigger is clicked', async () => {
        render(<TestSelect />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    });

    it('shows options when open', async () => {
        render(<TestSelect />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.getByText('Banana')).toBeInTheDocument();
            expect(screen.getByText('Cherry')).toBeInTheDocument();
        });
    });

    it('calls onValueChange when an option is selected', async () => {
        const onValueChange = vi.fn();
        render(<TestSelect onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Apple'));
        await userEvent.click(screen.getByText('Apple'));
        expect(onValueChange).toHaveBeenCalledWith('apple');
    });

    it('displays selected value in trigger', async () => {
        render(<TestSelect defaultValue="banana" />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
    });

    it('works as controlled component', async () => {
        const { rerender } = render(<TestSelect value="apple" onValueChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Apple');

        rerender(<TestSelect value="cherry" onValueChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Cherry');
    });

    it('is disabled when disabled prop is true', () => {
        render(<TestSelect disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('disabled item cannot be selected', async () => {
        const onValueChange = vi.fn();
        render(<TestSelect onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Disabled Item'));

        const disabledOption = screen.getByText('Disabled Item').closest('[data-disabled]');
        expect(disabledOption).toBeInTheDocument();
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('closes on Escape key', async () => {
        render(<TestSelect />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByRole('listbox'));

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    });

    it('has proper ARIA attributes on trigger', () => {
        render(<TestSelect />);
        const trigger = screen.getByRole('combobox');
        expect(trigger).toHaveAttribute('aria-label', 'Pick a fruit');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when open', async () => {
        render(<TestSelect />);
        const trigger = screen.getByRole('combobox');
        await userEvent.click(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });
});
