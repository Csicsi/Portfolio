import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

import App from './App';
import Terminal from './components/Terminal';

test('renders router with terminal home page', () => {
  const { container } = render(<App />);
  const terminalInput = container.querySelector('input[type="text"]');
  expect(terminalInput).not.toBeNull();
});

test('terminal component renders', () => {
  const { container } = render(<Terminal />);
  const terminalInput = container.querySelector('input[type="text"]');
  expect(terminalInput).not.toBeNull();
});
