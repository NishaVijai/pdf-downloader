import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from './Header';

describe('Header component', () => {
  it('renders the heading', () => {
    render(<Header />);
    expect(screen.getByRole('heading', { name: /pdf downloader/i })).toBeInTheDocument();
  });
});
