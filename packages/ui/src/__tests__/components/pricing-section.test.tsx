import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricingSection } from '../../components/pricing-section';

describe('PricingSection', () => {
    it('renders plans correctly', () => {
        render(<PricingSection title="Custom Plans Title" />);
        expect(screen.getByText('Custom Plans Title')).toBeInTheDocument();

        expect(screen.getByText('Indie Creator')).toBeInTheDocument();
        expect(screen.getByText('Pro Developer')).toBeInTheDocument();
        expect(screen.getByText('Team Studio')).toBeInTheDocument();

        expect(screen.getByText('$9')).toBeInTheDocument();
        expect(screen.getByText('$29')).toBeInTheDocument();
        expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('renders the popular plan badge badge layout', () => {
        render(<PricingSection />);
        expect(screen.getByText('Most Popular Tier')).toBeInTheDocument();
    });
});
