import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Slider } from '../../components/slider';

describe('Slider', () => {
    it('renders with standard range slider accessibility role', () => {
        render(<Slider defaultValue={[50]} max={100} step={1} />);
        const thumb = screen.getByRole('slider');
        expect(thumb).toBeInTheDocument();
        expect(thumb).toHaveAttribute('aria-valuenow', '50');
    });

    it('applies custom max and min attributes correctly', () => {
        render(<Slider defaultValue={[20]} min={10} max={90} step={5} />);
        const thumb = screen.getByRole('slider');
        expect(thumb).toHaveAttribute('aria-valuemin', '10');
        expect(thumb).toHaveAttribute('aria-valuemax', '90');
    });

    it('respects disabled state properties', () => {
        render(<Slider defaultValue={[50]} disabled />);
        const thumb = screen.getByRole('slider');
        expect(thumb).toHaveAttribute('data-disabled');
    });
});
