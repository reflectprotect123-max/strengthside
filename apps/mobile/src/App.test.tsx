import { render, screen } from '@testing-library/react-native';
import { App } from './App';

/* The scaffold's placeholder proves the engine workspace link is real by
 * counting METRICS. Pin that behaviour so the harness demonstrably collects
 * and runs a real assertion on day one. */
it('renders the metric-registry count from the live engine', () => {
  render(<App />);
  expect(screen.getByText(/12 metrics in the registry/)).toBeOnTheScreen();
});
