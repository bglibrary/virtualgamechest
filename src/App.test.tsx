import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { routes } from './App';

describe('App', () => {
  it('renders the game selection page at /', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
    });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Choisir un jeu')).toBeInTheDocument();
  });

  it('renders the editor dashboard at /editor', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/editor'],
    });
    const { container } = render(<RouterProvider router={router} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Game Editor')).toBeInTheDocument();
  });

  it('renders the new game page at /editor/new', () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ['/editor/new'],
    });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });
});
