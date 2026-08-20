import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders sessions with sleep rings instead of the old metric row', () => {
    const screen = render(<HomeScreen />);

    screen.getByText('ALL ATHLETES');
    screen.getByText('Thursday, August 20, 2026');
    screen.getByText('Week 1 Day 1');
    expect(screen.queryByText('Wednesday, July 29, 2026')).toBeNull();
    expect(screen.getAllByText('SLEEP')).toHaveLength(1);
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
