import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardShell } from '../../components/dashboard-shell';

describe('DashboardShell', () => {
    it('renders sidebar, topbar, statistics cards, and receipts logs table', () => {
        render(<DashboardShell userEmail="developer@my-saas.com" />);
        
        expect(screen.getByText('BrutxConsole')).toBeInTheDocument();
        expect(screen.getByText('developer@my-saas.com')).toBeInTheDocument();
        
        // Navigation sidebars
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Deployments')).toBeInTheDocument();
        
        // Stat items
        expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
        expect(screen.getByText('Active Licenses')).toBeInTheDocument();
        
        // Transaction Table items
        expect(screen.getByText('Recent Transaction Ledgers')).toBeInTheDocument();
        expect(screen.getByText('Alpha Agency')).toBeInTheDocument();
        expect(screen.getByText('Delta Studio')).toBeInTheDocument();
    });

    it('triggers signout callback triggers correctly', async () => {
        const onSignOut = vi.fn();
        render(<DashboardShell onSignOutClick={onSignOut} />);
        
        const signOutBtn = screen.getByRole('button', { name: 'Sign Out' });
        await userEvent.click(signOutBtn);
        
        expect(onSignOut).toHaveBeenCalledOnce();
    });
});
