import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuRadioGroup,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '../../components/dropdown-menu';

describe('DropdownMenu', () => {
    it('is closed by default', () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('opens when trigger is clicked', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => expect(screen.getByText('Item 1')).toBeInTheDocument());
    });

    it('calls onClick handler when item is clicked', async () => {
        const onClick = vi.fn();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={onClick}>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Item 1'));
        await userEvent.click(screen.getByText('Item 1'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('closes after item is selected', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Item 1'));
        await userEvent.click(screen.getByText('Item 1'));
        await waitFor(() => expect(screen.queryByText('Item 1')).not.toBeInTheDocument());
    });

    it('closes on Escape key', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Item 1'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByText('Item 1')).not.toBeInTheDocument());
    });

    it('disabled item does not trigger onSelect', async () => {
        const onSelect = vi.fn();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem disabled onSelect={onSelect}>
                        Disabled Item
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Disabled Item'));
        await userEvent.click(screen.getByText('Disabled Item'));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('renders label and separator', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Group A</DropdownMenuLabel>
                    <DropdownMenuItem>Item A</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Item B</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => {
            expect(screen.getByText('Group A')).toBeInTheDocument();
            expect(screen.getByText('Item A')).toBeInTheDocument();
            expect(screen.getByText('Item B')).toBeInTheDocument();
        });
    });

    it('checkbox item toggles checked state', async () => {
        let checked = false;
        const onCheckedChange = vi.fn((v: boolean) => {
            checked = v;
        });
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={onCheckedChange}>
                        Checkbox Option
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Checkbox Option'));
        await userEvent.click(screen.getByText('Checkbox Option'));
        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('radio group selects a single item', async () => {
        const onValueChange = vi.fn();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
                        <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => screen.getByText('Option B'));
        await userEvent.click(screen.getByText('Option B'));
        expect(onValueChange).toHaveBeenCalledWith('b');
    });
});
