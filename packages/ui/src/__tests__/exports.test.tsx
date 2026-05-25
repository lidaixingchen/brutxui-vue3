import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Smoke test importing from built CJS and ESM distributions
import { Button } from '../../dist/index.js';
import { Card } from '../../dist/index.js';
import { Calendar } from '../../dist/calendar.js';
import { SubmitButton } from '../../dist/submit-button.js';

describe('Built Library Exports Smoke Tests', () => {
    it('should successfully render Button imported from built index bundle', () => {
        render(<Button>Smoke Test Button</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Smoke Test Button');
    });

    it('should successfully render Card components', () => {
        render(<Card>Smoke Test Card</Card>);
        expect(screen.getByText('Smoke Test Card')).toBeInTheDocument();
    });

    it('should successfully render Calendar imported from separate built calendar bundle', () => {
        const { container } = render(<Calendar />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('should successfully render SubmitButton from separate submit-button bundle', () => {
        render(<SubmitButton>Submit</SubmitButton>);
        expect(screen.getByRole('button')).toHaveTextContent('Submit');
    });
});
