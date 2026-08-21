import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeScreen, zonesForReadiness } from './HomeScreen';
import { clearCondBank, loadCondBank, saveCondBank } from './condBankStorage';

describe('HomeScreen', () => {
  beforeEach(async () => {
    await clearCondBank();
  });

  it('renders sleep, conditioning rails, and nutrition macros for today', async () => {
    const screen = render(<HomeScreen />);

    await waitFor(() => screen.getByTestId('home-bank-ready'));

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

  it('opens the ARC readiness overview from sleep', async () => {
    const screen = render(<HomeScreen />);
    await waitFor(() => screen.getByTestId('home-bank-ready'));

    fireEvent.press(screen.getByLabelText(/Sleep overview for/));

    screen.getByText('← Back');
    screen.getByText('Readiness');
    screen.getByText('High');
    screen.getByText('HRV');
  });

  it('opens the live ring from conditioning and can bank', async () => {
    const screen = render(<HomeScreen />);
    await waitFor(() => screen.getByTestId('home-bank-ready'));

    fireEvent.press(screen.getByLabelText(/Conditioning live ring for/));

    screen.getByText('Live ring');
    screen.getByText('Hold bands');
    screen.getByText('Demo bpm');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Finish and bank minutes'));
    });
    screen.getByText('Week banked');

    await waitFor(async () => {
      const stored = await loadCondBank('dan veldman', 'W1');
      expect(stored).not.toBeNull();
    });
  });

  it('restores banked minutes from local storage on launch', async () => {
    await saveCondBank('dan veldman', 'W1', {
      low: { banked: 50, target: 90 },
      mod: { banked: 30, target: 60 },
      high: { banked: 16, target: 30 },
    });

    const screen = render(<HomeScreen />);
    await waitFor(() => screen.getByTestId('home-bank-ready'));
    screen.getByText('96 / 180 min');
    screen.getByText('50/90m');
    screen.getByText('30/60m');
    screen.getByText('16/30m');
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
