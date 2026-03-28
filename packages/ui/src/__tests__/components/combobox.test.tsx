import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox, ComboboxMulti } from '../../components/combobox';

const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'disabled-item', label: 'Disabled Fruit', disabled: true },
];

describe('Combobox', () => {
    it('renders trigger with placeholder', () => {
        render(<Combobox options={fruits} placeholder="Pick a fruit" />);
        expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
    });

    it('opens dropdown when trigger is clicked', async () => {
        render(<Combobox options={fruits} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        });
    });

    it('shows all options when opened', async () => {
        render(<Combobox options={fruits} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.getByText('Banana')).toBeInTheDocument();
            expect(screen.getByText('Cherry')).toBeInTheDocument();
        });
    });

    it('calls onValueChange when an option is selected', async () => {
        const onValueChange = vi.fn();
        render(<Combobox options={fruits} onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Apple'));
        await userEvent.click(screen.getByText('Apple'));
        expect(onValueChange).toHaveBeenCalledWith('apple');
    });

    it('displays selected value label in trigger', () => {
        render(<Combobox options={fruits} value="banana" onValueChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Banana');
    });

    it('deselects value when selected option is clicked again', async () => {
        const onValueChange = vi.fn();
        render(<Combobox options={fruits} value="apple" onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByRole('option', { name: 'Apple' }));
        await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onValueChange).toHaveBeenCalledWith('');
    });

    it('filters options by search input', async () => {
        render(<Combobox options={fruits} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByPlaceholderText('Search...'));
        await userEvent.type(screen.getByPlaceholderText('Search...'), 'ban');
        await waitFor(() => {
            expect(screen.getByText('Banana')).toBeInTheDocument();
            expect(screen.queryByText('Apple')).not.toBeInTheDocument();
        });
    });

    it('shows empty text when no results match', async () => {
        render(<Combobox options={fruits} emptyText="Nothing found" />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByPlaceholderText('Search...'));
        await userEvent.type(screen.getByPlaceholderText('Search...'), 'zzz');
        await waitFor(() => expect(screen.getByText('Nothing found')).toBeInTheDocument());
    });

    it('is disabled when disabled prop is true', () => {
        render(<Combobox options={fruits} disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('shows check icon next to selected option', async () => {
        render(<Combobox options={fruits} value="apple" onValueChange={vi.fn()} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByRole('option', { name: 'Apple' }));
        // The selected option has aria-selected=true (set by cmdk)
        expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
        // The check icon on the selected option has opacity-100
        const checkIcon = screen.getByRole('option', { name: 'Apple' }).querySelector('svg');
        expect(checkIcon).toHaveClass('opacity-100');
    });
});

describe('ComboboxMulti', () => {
    it('renders trigger with placeholder', () => {
        render(<ComboboxMulti options={fruits} placeholder="Pick fruits" />);
        expect(screen.getByText('Pick fruits')).toBeInTheDocument();
    });

    it('adds a value when an option is clicked', async () => {
        const onValueChange = vi.fn();
        render(<ComboboxMulti options={fruits} value={[]} onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Apple'));
        await userEvent.click(screen.getByText('Apple'));
        expect(onValueChange).toHaveBeenCalledWith(['apple']);
    });

    it('removes a value when an already-selected option is clicked', async () => {
        const onValueChange = vi.fn();
        render(
            <ComboboxMulti options={fruits} value={['apple', 'banana']} onValueChange={onValueChange} />
        );
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Apple'));
        await userEvent.click(screen.getByText('Apple'));
        expect(onValueChange).toHaveBeenCalledWith(['banana']);
    });

    it('displays selected labels in trigger', () => {
        render(<ComboboxMulti options={fruits} value={['apple', 'cherry']} onValueChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('Apple, Cherry');
    });

    it('shows count when selections exceed maxDisplay', () => {
        render(
            <ComboboxMulti
                options={fruits}
                value={['apple', 'banana', 'cherry']}
                onValueChange={vi.fn()}
                maxDisplay={2}
            />
        );
        expect(screen.getByRole('combobox')).toHaveTextContent('3 selected');
    });

    it('is disabled when disabled prop is true', () => {
        render(<ComboboxMulti options={fruits} disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('can select multiple items', async () => {
        const selected: string[] = [];
        const onValueChange = vi.fn((v: string[]) => selected.push(...v));

        const { rerender } = render(
            <ComboboxMulti options={fruits} value={[]} onValueChange={onValueChange} />
        );
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => screen.getByText('Apple'));
        await userEvent.click(screen.getByText('Apple'));
        expect(onValueChange).toHaveBeenLastCalledWith(['apple']);

        rerender(<ComboboxMulti options={fruits} value={['apple']} onValueChange={onValueChange} />);
        await userEvent.click(screen.getByText('Banana'));
        expect(onValueChange).toHaveBeenLastCalledWith(['apple', 'banana']);
    });
});
