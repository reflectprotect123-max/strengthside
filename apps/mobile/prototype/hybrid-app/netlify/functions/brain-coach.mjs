import { proxyHybrid } from './_hybrid-proxy.mjs';

/** Athlete site is proxy-only — OpenRouter key lives on hybrid1. */
export async function handler(event) {
  return proxyHybrid(event, 'brain-coach');
}
