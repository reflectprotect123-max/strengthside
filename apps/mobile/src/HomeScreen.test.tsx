import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders sessions with sleep rings instead of the old metric row', () => {
    const screen = render(<HomeScreen />);

    screen.getByText('ALL ATHLETES');
    screen.getByText('Monday, August 10, 2026');
    screen.getByText('Week 1 Day 1');
    screen.getByText('Wednesday, July 29, 2026');
    screen.getByText('Full Body Strength');
    expect(screen.getAllByText('SLEEP')).toHaveLength(2);
    expect(screen.queryByText('Session Comment')).toBeNull();
    expect(screen.queryByText('See More')).toBeNull();
    expect(screen.queryByText('Blocks')).toBeNull();
  });

  it('opens the readiness overview from a sleep row', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getAllByLabelText(/Sleep overview for/)[0]);

    screen.getByText('← Back');
    screen.getByText('Readiness');
    screen.getByText('High');
    screen.getByText('HRV');
    screen.getByText('Sleep performance');
  });
});
