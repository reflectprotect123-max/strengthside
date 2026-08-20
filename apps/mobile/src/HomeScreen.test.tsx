import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders the supplied athlete sessions', () => {
    const screen = render(<HomeScreen />);

    screen.getByText('ALL ATHLETES');
    screen.getByText('Monday, August 10, 2026');
    screen.getByText('Week 1 Day 1');
    screen.getByText('Wednesday, July 29, 2026');
    screen.getByText('Full Body Strength');
    screen.getByText('6550');
    screen.getByText('4020');
  });

  it('expands all session cards from the header switch', () => {
    const screen = render(<HomeScreen />);

    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(screen.getAllByText('See Less')).toHaveLength(2);
  });
});
