import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthCard } from '../../components/auth-card';

describe('AuthCard', () => {
    it('renders login components, inputs and OAuth button rows', () => {
        render(<AuthCard title="Login Gateway" description="Demo description" />);
        expect(screen.getByText('Login Gateway')).toBeInTheDocument();
        expect(screen.getByText('Demo description')).toBeInTheDocument();
        
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        
        expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument();
    });

    it('submits email/password credential input values correctly', async () => {
        const onSubmit = vi.fn();
        render(<AuthCard onLoginSubmit={onSubmit} />);

        const emailInput = screen.getByLabelText('Email Address');
        const passwordInput = screen.getByLabelText('Password');
        const submitBtn = screen.getByRole('button', { name: 'Access Account console' });

        await userEvent.type(emailInput, 'creator@brutxui.site');
        await userEvent.type(passwordInput, 'admin123');
        await userEvent.click(submitBtn);

        expect(onSubmit).toHaveBeenCalledOnce();
    });
});
