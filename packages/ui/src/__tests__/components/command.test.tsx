import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
    CommandDialog,
} from '../../components/command';

function TestCommand({
    onSelect,
}: {
    onSelect?: (value: string) => void;
}) {
    return (
        <Command>
            <CommandInput placeholder="Type a command..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Actions">
                    <CommandItem value="copy" onSelect={() => onSelect?.('copy')}>
                        Copy
                    </CommandItem>
                    <CommandItem value="paste" onSelect={() => onSelect?.('paste')}>
                        Paste
                    </CommandItem>
                    <CommandItem value="disabled-item" disabled onSelect={() => onSelect?.('disabled-item')}>
                        Disabled Action
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Navigation">
                    <CommandItem value="home" onSelect={() => onSelect?.('home')}>
                        Home
                        <CommandShortcut>⌘H</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </Command>
    );
}

describe('Command', () => {
    it('renders search input', () => {
        render(<TestCommand />);
        expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });

    it('renders all items', () => {
        render(<TestCommand />);
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Paste')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders group headings', () => {
        render(<TestCommand />);
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('filters items as user types', async () => {
        render(<TestCommand />);
        await userEvent.type(screen.getByPlaceholderText('Type a command...'), 'copy');
        await waitFor(() => {
            expect(screen.getByText('Copy')).toBeInTheDocument();
            expect(screen.queryByText('Paste')).not.toBeInTheDocument();
            expect(screen.queryByText('Home')).not.toBeInTheDocument();
        });
    });

    it('shows empty state when no results match', async () => {
        render(<TestCommand />);
        await userEvent.type(screen.getByPlaceholderText('Type a command...'), 'zzz');
        await waitFor(() => expect(screen.getByText('No results found.')).toBeInTheDocument());
    });

    it('calls onSelect with correct value when item is clicked', async () => {
        const onSelect = vi.fn();
        render(<TestCommand onSelect={onSelect} />);
        await userEvent.click(screen.getByText('Copy'));
        expect(onSelect).toHaveBeenCalledWith('copy');
    });

    it('calls onSelect for paste item', async () => {
        const onSelect = vi.fn();
        render(<TestCommand onSelect={onSelect} />);
        await userEvent.click(screen.getByText('Paste'));
        expect(onSelect).toHaveBeenCalledWith('paste');
    });

    it('disabled item does not fire onSelect when clicked', async () => {
        const onSelect = vi.fn();
        render(<TestCommand onSelect={onSelect} />);
        await userEvent.click(screen.getByText('Disabled Action'));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('disabled item has data-disabled attribute', () => {
        render(<TestCommand />);
        const disabledItem = screen.getByText('Disabled Action').closest('[data-slot="command-item"]');
        expect(disabledItem).toHaveAttribute('data-disabled', 'true');
    });

    it('renders keyboard shortcut', () => {
        render(<TestCommand />);
        expect(screen.getByText('⌘H')).toBeInTheDocument();
    });
});

describe('CommandDialog', () => {
    it('is closed by default', () => {
        render(
            <CommandDialog>
                <CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandItem value="new">New File</CommandItem>
                </CommandList>
            </CommandDialog>
        );
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('shows content when open=true', () => {
        render(
            <CommandDialog open>
                <CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandItem value="new">New File</CommandItem>
                </CommandList>
            </CommandDialog>
        );
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        expect(screen.getByText('New File')).toBeInTheDocument();
    });

    it('renders default accessible title (screen-reader only)', () => {
        render(<CommandDialog open title="My Palette" />);
        expect(screen.getByText('My Palette')).toBeInTheDocument();
    });

    it('calls onOpenChange when Escape is pressed', async () => {
        const onOpenChange = vi.fn();
        render(
            <CommandDialog open onOpenChange={onOpenChange}>
                <CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandItem value="new">New File</CommandItem>
                </CommandList>
            </CommandDialog>
        );
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('filters items inside dialog', async () => {
        render(
            <CommandDialog open>
                <CommandInput placeholder="Search commands" />
                <CommandList>
                    <CommandEmpty>Nothing.</CommandEmpty>
                    <CommandItem value="open-file">Open File</CommandItem>
                    <CommandItem value="settings">Settings</CommandItem>
                </CommandList>
            </CommandDialog>
        );
        await userEvent.type(screen.getByPlaceholderText('Search commands'), 'open');
        await waitFor(() => {
            expect(screen.getByText('Open File')).toBeInTheDocument();
            expect(screen.queryByText('Settings')).not.toBeInTheDocument();
        });
    });
});
