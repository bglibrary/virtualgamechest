import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { routes } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/editor'],
    });
    const { container } = render(<RouterProvider router={router} />);
    expect(container).toBeInTheDocument();
  });
});
