import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitlistPage } from '../../components/waitlist-page';

describe('WaitlistPage', () => {
    it('renders titles, social proof elements, and submit button', () => {
        render(<WaitlistPage title="Join private beta waitlist" description="Beta keys daily" />);
        
        expect(screen.getByText('Join private beta waitlist')).toBeInTheDocument();
        expect(screen.getByText('Beta keys daily')).toBeInTheDocument();
        expect(screen.getByText('1,840+ Developers on waitlist')).toBeInTheDocument();
        expect(screen.getByText('4.9/5 stars rating')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Secure Priority Access' })).toBeInTheDocument();
    });

    it('triggers waitlist form submission callback with email string', async () => {
        const onSubmit = vi.fn((e, val) => e.preventDefault());
        render(<WaitlistPage onWaitlistSubmit={onSubmit} ctaText="Submit Waitlist" />);
        
        const emailInput = screen.getByPlaceholderText('Enter your personal email...');
        const submitBtn = screen.getByRole('button', { name: 'Submit Waitlist' });
        
        await userEvent.type(emailInput, 'hacker@brutx.io');
        await userEvent.click(submitBtn);
        
        expect(onSubmit).toHaveBeenCalledOnce();
    });
});
