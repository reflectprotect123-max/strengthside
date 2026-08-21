import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen, zonesForReadiness } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders sleep and conditioning modules for today', () => {
    const screen = render(<HomeScreen />);

    screen.getByText('ALL ATHLETES');
    screen.getByText('Thursday, August 20, 2026');
    screen.getByText('Week 1 Day 1');
    screen.getByText('SLEEP');
    screen.getByText('CONDITIONING');
    screen.getByText('NUTRITION');
    screen.getByText('Zones move with today’s readiness');
    screen.getByText(/2,529/);
    screen.getByText(/kcal left/);
    screen.getByText(/0 \/ 164g/);
    screen.getByText(/0 \/ 225g/);
    screen.getByText(/0 \/ 70g/);
  });

  it('opens the readiness overview from a sleep row', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText(/Sleep overview for/));

    screen.getByText('← Back');
    screen.getByText('Readiness');
    screen.getByText('High');
    screen.getByText('HRV');
  });

  it('opens conditioning zones from the conditioning row', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText(/Conditioning zones for/));

    screen.getByText('Conditioning zones');
    screen.getByText(/Ceilings shift with readiness/);
    screen.getByText(/High readiness/);
  });
});

describe('zonesForReadiness', () => {
  it('raises zone ceilings when recovery is higher', () => {
    const low = zonesForReadiness(30);
    const high = zonesForReadiness(90);

    expect(high[0].hi).toBeGreaterThan(low[0].hi);
    expect(high[2].hi).toBeGreaterThan(low[2].hi);
  });
});
