import { render, screen } from '@testing-library/react';
import App from './App';

describe('TrichAI smoke', () => {
  test('renders home with brand', () => {
    render(<App />);
    expect(screen.getAllByText(/TrichAI/i).length).toBeGreaterThan(0);
  });

  test('renders dropzone CTA', () => {
    render(<App />);
    expect(screen.getByText(/Haz clic o arrastra/i)).toBeInTheDocument();
  });

  test('analyze button is disabled with no image', () => {
    render(<App />);
    const btn = screen.getByRole('button', { name: /Analizar imagen/i });
    expect(btn).toBeDisabled();
  });

  test('shows tabs for analyze and contribute', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^Analizar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contribuir foto/i })).toBeInTheDocument();
  });
});
