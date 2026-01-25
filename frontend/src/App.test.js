import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Basic App component tests
 * Requirements: 6.1, 6.2 - Verify React app setup
 */

test('renders dating app navigation', () => {
  render(<App />);
  const titleElement = screen.getByText(/Dating App/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders swipe and matches navigation links', () => {
  render(<App />);
  const swipeLink = screen.getByText(/Swipe/i);
  const matchesLink = screen.getByText(/Matches/i);
  
  expect(swipeLink).toBeInTheDocument();
  expect(matchesLink).toBeInTheDocument();
});

test('renders main content area', () => {
  render(<App />);
  const mainContent = document.querySelector('.main-content');
  expect(mainContent).toBeInTheDocument();
});