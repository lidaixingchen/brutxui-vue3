import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrutalistHero } from '../../components/brutalist-hero';

describe('BrutalistHero', () => {
    it('renders heading, description text, and mock visual component', () => {
        render(
            <BrutalistHero 
                title="Bold Hero Title"
                subtitle="Neon brutalist card subheadings."
            />
        );
        expect(screen.getByText('Bold Hero Title')).toBeInTheDocument();
        expect(screen.getByText('Neon brutalist card subheadings.')).toBeInTheDocument();
        expect(screen.getByText('brutx-terminal')).toBeInTheDocument();
    });

    it('fires primary and secondary button click callbacks correctly', async () => {
        const onPrimary = vi.fn();
        const onSecondary = vi.fn();

        render(
            <BrutalistHero 
                primaryCtaText="Join Priority"
                secondaryCtaText="Learn More"
                onPrimaryCtaClick={onPrimary}
                onSecondaryCtaClick={onSecondary}
            />
        );

        const primaryBtn = screen.getByRole('button', { name: 'Join Priority' });
        const secondaryBtn = screen.getByRole('button', { name: 'Learn More' });

        await userEvent.click(primaryBtn);
        expect(onPrimary).toHaveBeenCalledOnce();

        await userEvent.click(secondaryBtn);
        expect(onSecondary).toHaveBeenCalledOnce();
    });
});
