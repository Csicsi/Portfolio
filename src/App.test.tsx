import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

import App from './App';

test('renders canvas', () => {
  const { container } = render(<App />);
  const canvas = container.querySelector('canvas');
  expect(canvas).not.toBeNull();
});
