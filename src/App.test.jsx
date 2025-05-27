import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./components/Header', () => ({
  Header: () => <header>Header</header>,
}));
vi.mock('./components/Footer', () => ({
  Footer: () => <footer>Footer</footer>,
}));
vi.mock('./components/MainComponent', () => ({
  MainComponent: (props) => (
    <div>
      MainComponent
      <span data-testid="columns-prop">{JSON.stringify(props.columns)}</span>
    </div>
  ),
}));

describe('App Component', () => {
  it('should render Header component', () => {
    render(<App />);
    expect(screen.getByText(/header/i)).toBeInTheDocument();
  });

  it('should render Footer component', () => {
    render(<App />);
    expect(screen.getByText(/footer/i)).toBeInTheDocument();
  });

  it('should render MainComponent component with columns prop', () => {
    render(<App />);
    expect(screen.getByText(/MainComponent/i)).toBeInTheDocument();

    const columnsProp = screen.getByTestId('columns-prop').textContent;
    expect(columnsProp).not.toBeUndefined();
    expect(columnsProp).not.toBe('{}');
  });
});
