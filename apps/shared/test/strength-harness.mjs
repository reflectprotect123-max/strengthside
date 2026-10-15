import vm from 'node:vm';
import {readFileSync} from 'node:fs';

export function loadStrength(extra=[]) {
  const root={};
  const names=['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay',...extra,'strength-brain-core'];
  for(const name of [...new Set(names)]) {
    vm.runInNewContext(readFileSync(new URL(`../${name}.js`,import.meta.url),'utf8'),{window:root});
  }
  return root;
}
