import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/tabs';

function TestTabs({
    value,
    onValueChange,
    defaultValue = 'tab1',
}: {
    value?: string;
    onValueChange?: (v: string) => void;
    defaultValue?: string;
}) {
    return (
        <Tabs value={value} onValueChange={onValueChange} defaultValue={defaultValue}>
            <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3" disabled>
                    Tab 3
                </TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content 1</TabsContent>
            <TabsContent value="tab2">Content 2</TabsContent>
            <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
    );
}

describe('Tabs', () => {
    it('renders all tabs', () => {
        render(<TestTabs />);
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
    });

    it('shows active tab content by default', () => {
        render(<TestTabs defaultValue="tab1" />);
        expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('switches content when a tab is clicked', async () => {
        render(<TestTabs />);
        await userEvent.click(screen.getByRole('tab', { name: 'Tab 2' }));
        expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('calls onValueChange when a tab is clicked', async () => {
        const onValueChange = vi.fn();
        render(<TestTabs onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('tab', { name: 'Tab 2' }));
        expect(onValueChange).toHaveBeenCalledWith('tab2');
    });

    it('active tab has aria-selected=true', () => {
        render(<TestTabs defaultValue="tab2" />);
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'false');
    });

    it('disabled tab is not selectable', async () => {
        const onValueChange = vi.fn();
        render(<TestTabs onValueChange={onValueChange} />);
        await userEvent.click(screen.getByRole('tab', { name: 'Tab 3' }));
        expect(onValueChange).not.toHaveBeenCalled();
        // Tab 1 content should remain active
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
    });

    it('disabled tab has disabled attribute', () => {
        render(<TestTabs />);
        expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeDisabled();
    });

    it('navigates with arrow keys', async () => {
        render(<TestTabs />);
        const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
        tab1.focus();

        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });

    it('works as controlled component', async () => {
        const { rerender } = render(<TestTabs value="tab1" onValueChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');

        rerender(<TestTabs value="tab2" onValueChange={vi.fn()} />);
        expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
    });

    it('each tab has correct aria-controls linking to panel', () => {
        render(<TestTabs />);
        const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
        const panelId = tab1.getAttribute('aria-controls');
        expect(panelId).toBeTruthy();
        expect(document.getElementById(panelId!)).toBeInTheDocument();
    });

    it('tabpanel has correct role', () => {
        render(<TestTabs />);
        const panels = screen.getAllByRole('tabpanel');
        expect(panels.length).toBeGreaterThanOrEqual(1);
    });
});
