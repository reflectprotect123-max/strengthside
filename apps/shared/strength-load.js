/** Physical load boundary. Raw actuals and equipment display grids remain unchanged. */
(function(root) {
  const KG_PER_LB=0.45359237;
  const CONVENTIONS=['barbell_total','barbell_plates','per_hand','single','added_bodyweight'];
  const PROVENANCE=['explicit','known_legacy_version','ambiguous_legacy'];
  function number(value) {
    if(!['number','string'].includes(typeof value)||String(value).trim()==='')return null;
    const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;
  }
  function barbell(convention) {return convention==='barbell_total'||convention==='barbell_plates';}
  function positive(value) {const n=number(value);return n!=null&&n>0?n:null;}
  function normalize(input) {
    if(!input||typeof input!=='object')return null;
    const {value,unit,convention,provenance}=input;
    const rawValue=number(value);
    if(rawValue==null||!['kg','lb'].includes(unit)||!CONVENTIONS.includes(convention)||!PROVENANCE.includes(provenance))return null;
    const barKg=input.barKg==null?null:positive(input.barKg);
    if(input.barKg!=null&&barKg==null)return null;
    if(convention==='barbell_plates'&&barKg==null)return null;
    const valueKg=unit==='lb'?rawValue*KG_PER_LB:rawValue;
    const externalKg=valueKg+(convention==='barbell_plates'?barKg:0);
    if(!Number.isFinite(externalKg))return null;
    // Eligibility here establishes provenance only. Movement/model eligibility belongs to policy.
    return {version:3,rawValue,rawUnit:unit,convention,externalKg,barKg:barbell(convention)?barKg:null,provenance,eligible:provenance!=='ambiguous_legacy'};
  }
  function displayKg(normalized,convention,barKg) {
    if(!normalized||normalized.version!==3||typeof normalized.externalKg!=='number'||number(normalized.externalKg)==null)return null;
    if(typeof normalized.rawValue!=='number'||number(normalized.rawValue)==null||!['kg','lb'].includes(normalized.rawUnit))return null;
    if(!CONVENTIONS.includes(normalized.convention)||!CONVENTIONS.includes(convention)||!PROVENANCE.includes(normalized.provenance))return null;
    if(normalized.eligible!==(normalized.provenance!=='ambiguous_legacy'))return null;
    if(normalized.barKg!==null&&(typeof normalized.barKg!=='number'||positive(normalized.barKg)==null))return null;
    if(!barbell(normalized.convention)&&normalized.barKg!==null)return null;
    if(normalized.convention==='barbell_plates'&&positive(normalized.barKg)==null)return null;
    if(convention!==normalized.convention&&!(barbell(convention)&&barbell(normalized.convention)))return null;
    if(convention!=='barbell_plates')return normalized.externalKg;
    const mass=positive(barKg);if(mass==null)return null;
    const kg=normalized.externalKg-mass;
    return kg>=0?kg:null;
  }
  root.StrengthLoad={normalize,displayKg};
})(typeof window!=='undefined'?window:globalThis);
