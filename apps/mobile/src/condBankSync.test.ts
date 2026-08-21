import { loadCondBankSynced, saveCondBankSynced } from './condBankSync';
import { clearCondBank, loadCondBank } from './condBankStorage';

jest.mock('./condBankRemote', () => ({
  pullCondBankRemote: jest.fn(async () => ({ status: 'skipped', reason: 'supabase-not-configured' })),
  pushCondBankRemote: jest.fn(async () => ({ status: 'skipped', reason: 'supabase-not-configured' })),
}));

const remote = jest.requireMock('./condBankRemote') as {
  pullCondBankRemote: jest.Mock;
  pushCondBankRemote: jest.Mock;
};

const week = {
  low: { banked: 50, target: 90 },
  mod: { banked: 30, target: 60 },
  high: { banked: 16, target: 30 },
};

describe('condBankSync', () => {
  beforeEach(async () => {
    await clearCondBank();
    remote.pullCondBankRemote.mockReset();
    remote.pushCondBankRemote.mockReset();
    remote.pullCondBankRemote.mockResolvedValue({ status: 'skipped', reason: 'supabase-not-configured' });
    remote.pushCondBankRemote.mockResolvedValue({ status: 'skipped', reason: 'supabase-not-configured' });
  });

  it('returns local bank when remote is skipped', async () => {
    await saveCondBankSynced('dan veldman', 'W1', week);
    const { conditioning, remote: r } = await loadCondBankSynced('dan veldman', 'W1');
    expect(conditioning).toEqual(week);
    expect(r.status).toBe('skipped');
  });

  it('prefers remote when loaded and mirrors into local storage', async () => {
    remote.pullCondBankRemote.mockResolvedValue({ status: 'loaded', conditioning: week });
    const { conditioning } = await loadCondBankSynced('dan veldman', 'W1');
    expect(conditioning).toEqual(week);
    expect(await loadCondBank('dan veldman', 'W1')).toEqual(week);
  });

  it('always writes local before pushing remote', async () => {
    remote.pushCondBankRemote.mockResolvedValue({ status: 'saved', conditioning: week });
    const result = await saveCondBankSynced('dan veldman', 'W1', week);
    expect(result.status).toBe('saved');
    expect(await loadCondBank('dan veldman', 'W1')).toEqual(week);
    expect(remote.pushCondBankRemote).toHaveBeenCalled();
  });
});
