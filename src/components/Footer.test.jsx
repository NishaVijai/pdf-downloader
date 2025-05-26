import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from './Footer';

describe('Footer component', () => {
  it('renders the copyright with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`PDF Downloader Web App © ${year} - ${year}`)).toBeInTheDocument();
  });

  it('renders the GitHub link with correct attributes', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /repo/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/NishaVijai/pdf-downloader');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('title', expect.stringContaining('GitHub repository'));
  });

  it('renders the "PDF Downloader Web App" text', () => {
    render(<Footer />);
    expect(screen.getByText(/PDF Downloader Web App/i)).toBeInTheDocument();
  });

  it('renders the "Repo" link text', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /repo/i })).toBeInTheDocument();
  });
});
