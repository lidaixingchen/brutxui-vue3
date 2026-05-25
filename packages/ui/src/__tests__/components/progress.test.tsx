import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../../components/progress';

describe('Progress', () => {
    it('renders with correct aria attributes', () => {
        render(<Progress value={45} />);
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toBeInTheDocument();
        expect(progressbar).toHaveAttribute('aria-valuenow', '45');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('handles custom max values or null/undefined correctly', () => {
        render(<Progress value={undefined} />);
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).not.toHaveAttribute('aria-valuenow');
    });
});
