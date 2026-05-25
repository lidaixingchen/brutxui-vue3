import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/badge';

describe('Badge', () => {
    it('renders correctly', () => {
        render(<Badge>New</Badge>);
        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
        render(<Badge data-testid="badge">Default</Badge>);
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveClass('bg-brutal-bg');
    });

    it('renders with primary variant', () => {
        render(
            <Badge variant="primary" data-testid="badge">
                Primary
            </Badge>
        );
        expect(screen.getByTestId('badge')).toHaveClass('bg-brutal-primary');
    });

    it('renders with secondary variant', () => {
        render(
            <Badge variant="secondary" data-testid="badge">
                Secondary
            </Badge>
        );
        expect(screen.getByTestId('badge')).toHaveClass('bg-brutal-secondary');
    });

    it('renders with accent variant', () => {
        render(
            <Badge variant="accent" data-testid="badge">
                Accent
            </Badge>
        );
        expect(screen.getByTestId('badge')).toHaveClass('bg-brutal-accent');
    });

    it('renders with outline variant', () => {
        render(
            <Badge variant="outline" data-testid="badge">
                Outline
            </Badge>
        );
        expect(screen.getByTestId('badge')).toHaveClass('bg-transparent');
    });

    it('applies custom className', () => {
        render(
            <Badge className="custom-badge" data-testid="badge">
                Custom
            </Badge>
        );
        expect(screen.getByTestId('badge')).toHaveClass('custom-badge');
    });

    it('has neo-brutalism border styles', () => {
        render(<Badge data-testid="badge">Styled</Badge>);
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveClass('border-2');
        expect(badge).toHaveClass('border-brutal');
    });
});
