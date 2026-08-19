import { METRICS } from '@hybrid/strength-engine';
import { isConfigured } from './supabase';

/**
 * The placeholder screen. Phase B (Slices 12-14) replaces this with real
 * authoring: block editor, exercise picker, set/target builder.
 *
 * It reads METRICS from the engine on purpose rather than printing a static
 * string — it is the cheapest possible proof that the workspace wiring is
 * real. If the package link breaks, this screen goes blank instead of lying.
 */
export function Bench() {
  const metrics = Object.values(METRICS);
  return (
    <main style={{ padding: '48px 32px', maxWidth: 880, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--gold2)', fontSize: 28, margin: '0 0 8px' }}>Strength bench</h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 32px' }}>
        Phase B builds here — block editor, exercise picker, set/target builder.
      </p>

      <section
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dim)', margin: '0 0 14px' }}>
          Metric registry · {metrics.length} rows
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: 'var(--dim)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>key</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>dimension</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>unit</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>aggregation</th>
              <th style={{ padding: '6px 8px', fontWeight: 500 }}>load-bearing</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.key} style={{ borderTop: '1px solid var(--hair)' }}>
                <td data-metric-key={m.key} style={{ padding: '7px 8px', color: 'var(--gold)' }}>{m.key}</td>
                <td style={{ padding: '7px 8px', color: 'var(--muted)' }}>{m.dimension}</td>
                <td style={{ padding: '7px 8px', color: 'var(--muted)' }}>{m.canonicalUnit}</td>
                <td style={{ padding: '7px 8px', color: 'var(--muted)' }}>{m.aggregation}</td>
                <td style={{ padding: '7px 8px', color: m.isLoadBearing ? 'var(--done-ink)' : 'var(--dim)' }}>
                  {m.isLoadBearing ? 'yes' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 20 }}>
        Supabase: {isConfigured() ? 'configured' : 'not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'}
      </p>
    </main>
  );
}
