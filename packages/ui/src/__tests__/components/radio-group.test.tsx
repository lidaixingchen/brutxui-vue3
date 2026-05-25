import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from '../../components/radio-group';
import { Label } from '../../components/label';

function TestRadioGroup({ onValueChange }: { onValueChange?: (val: string) => void }) {
    return (
        <RadioGroup defaultValue="apple" onValueChange={onValueChange}>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="apple" id="apple" />
                <Label htmlFor="apple">Apple</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange" id="orange" />
                <Label htmlFor="orange">Orange</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="banana" id="banana" disabled />
                <Label htmlFor="banana">Banana</Label>
            </div>
        </RadioGroup>
    );
}

describe('RadioGroup', () => {
    it('renders radio options correctly', () => {
        render(<TestRadioGroup />);
        expect(screen.getByLabelText('Apple')).toBeInTheDocument();
        expect(screen.getByLabelText('Orange')).toBeInTheDocument();
        expect(screen.getByLabelText('Banana')).toBeInTheDocument();
    });

    it('sets default checked state correctly', () => {
        render(<TestRadioGroup />);
        expect(screen.getByLabelText('Apple')).toBeChecked();
        expect(screen.getByLabelText('Orange')).not.toBeChecked();
    });

    it('changes value on clicking other enabled option', async () => {
        const onValueChange = vi.fn();
        render(<TestRadioGroup onValueChange={onValueChange} />);

        await userEvent.click(screen.getByLabelText('Orange'));
        expect(onValueChange).toHaveBeenCalledWith('orange');
        expect(screen.getByLabelText('Orange')).toBeChecked();
    });

    it('does not select disabled radio option on click', async () => {
        const onValueChange = vi.fn();
        render(<TestRadioGroup onValueChange={onValueChange} />);

        await userEvent.click(screen.getByLabelText('Banana'));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Banana')).not.toBeChecked();
    });
});
