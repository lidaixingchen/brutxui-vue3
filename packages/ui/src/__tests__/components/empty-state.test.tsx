import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../../components/empty-state';

describe('EmptyState', () => {
    it('renders state titles, desc tags, and icons', () => {
        render(
            <EmptyState 
                title="Workspace Empty"
                description="Please initialize a cluster."
                actionText="Propose Deploy"
            />
        );
        
        expect(screen.getByText('Workspace Empty')).toBeInTheDocument();
        expect(screen.getByText('Please initialize a cluster.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Propose Deploy' })).toBeInTheDocument();
    });

    it('triggers action click callback correctly', async () => {
        const onClick = vi.fn();
        render(<EmptyState onActionClick={onClick} actionText="New Deployment" />);
        
        const btn = screen.getByRole('button', { name: 'New Deployment' });
        await userEvent.click(btn);
        
        expect(onClick).toHaveBeenCalledOnce();
    });
});
