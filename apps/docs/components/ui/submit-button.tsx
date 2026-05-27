'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';

export interface SubmitButtonProps extends ButtonProps {
    pendingText?: string;
}

/**
 * Renders a submit button that follows React form pending state.
 *
 * @param props - Submit button props.
 * @returns Submit button with pending state.
 */
function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={disabled || pending} loading={pending} {...props}>
            {pending && pendingText ? pendingText : children}
        </Button>
    );
}

SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
