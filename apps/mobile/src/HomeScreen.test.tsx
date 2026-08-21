import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen, zonesForReadiness } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders sleep, conditioning rails, and nutrition macros for today', () => {
    const screen = render(<HomeScreen />);

    screen.getByText('ALL ATHLETES');
    screen.getByText(/Week 1 Day 1/);
    screen.getByText('SLEEP');
    screen.getByText('CONDITIONING');
    screen.getByText('NUTRITION');
    screen.getByText('Week banked');
    screen.getByText('84 / 180 min');
    screen.getByText('42/90m');
    screen.getByText('28/60m');
    screen.getByText('14/30m');
    screen.getByText('Moderate');
    screen.getByText('Overload');
    screen.getByText('Tap to train');
    expect(screen.getAllByText('Recovery').length).toBeGreaterThanOrEqual(1);
    screen.getByText(/2,529/);
    screen.getByText(/kcal left/);
    screen.getByText('0/164');
    screen.getByText('0/225');
    screen.getByText('0/70');
  });

  it('opens the ARC readiness overview from sleep', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText(/Sleep overview for/));

    screen.getByText('← Back');
    screen.getByText('Readiness');
    screen.getByText('High');
    screen.getByText('HRV');
  });

  it('opens the live ring from conditioning and can bank', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText(/Conditioning live ring for/));

    screen.getByText('Live ring');
    screen.getByText('Hold bands');
    screen.getByText('Demo bpm');
    fireEvent.press(screen.getByLabelText('Finish and bank minutes'));
    screen.getByText('Week banked');
  });
});

describe('zonesForReadiness', () => {
  it('raises zone ceilings when recovery is higher', () => {
    const low = zonesForReadiness(30);
    const high = zonesForReadiness(90);

    expect(high[0].hi).toBeGreaterThan(low[0].hi);
    expect(high[1].hi).toBeGreaterThan(low[1].hi);
    expect(high[2].lo).toBeGreaterThan(low[2].lo);
  });

  it('exposes three Hybrid zones', () => {
    const zones = zonesForReadiness(71);
    expect(zones.map(z => z.name)).toEqual(['Recovery', 'Moderate', 'Overload']);
  });
});
