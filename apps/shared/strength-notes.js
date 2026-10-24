/** Parse coach notes for rest, seconds, RPE, supersets and 1RM. */
(function(root) {
  function textOf(notes) {
    if(Array.isArray(notes))return notes.flat().filter(Boolean).map(String).join('\n');
    return String(notes||'');
  }
  function decode(value) {
    return String(value??'')
      .replace(/â€”/g,'—').replace(/â€“/g,'–')
      .replace(/â€™/g,'\u2019').replace(/â€˜/g,'\u2018')
      .replace(/â€œ/g,'\u201C').replace(/â€\u009D/g,'\u201D').replace(/â€/g,'\u201D');
  }
  function rpeToEffort(n) {
    if(!Number.isFinite(n))return null;
    if(n<=5)return 'very_easy';
    if(n<=6)return 'easy';
    if(n<=7)return 'average';
    if(n<=8.5)return 'hard';
    return 'max_effort';
  }
  function parseRpeToken(token) {
    const m=String(token).match(/(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/);
    if(!m)return null;
    const a=Number(m[1]),b=m[2]!=null?Number(m[2]):a;
    return rpeToEffort((a+b)/2);
  }
  function parse(notes) {
    const text=decode(textOf(notes));
    const rest=text.match(/rest\s*[:=]?\s*(\d+)\s*(s|sec|secs|seconds|m|min|mins)?/i)
      ||text.match(/(\d+)\s*(s|sec|secs|seconds|m|min|mins)\s+rest/i);
    let restSec=null;
    if(rest) {
      const n=Number(rest[1]);
      restSec=/m/i.test(rest[2]||'s')&&!/^s/i.test(rest[2]||'s')?n*60:n;
    }
    const timed=text.match(/(\d+)\s*x\s*(\d+)\s*(s|sec|secs|seconds)\b/i);
    const oneSeconds=[...text.matchAll(/\b(\d+)\s*(s|sec|secs|seconds)\b/gi)].find(m=>!/rest\s*$/i.test(text.slice(Math.max(0,m.index-5),m.index)));
    const rpeHits=[...text.matchAll(/rpe\s*([0-9]+(?:\s*[-–]\s*[0-9]+)?)/gi)];
    const slash=text.match(/rpe\s*([0-9]+(?:\s*[-–\/]\s*[0-9]+)(?:\s*\/\s*[0-9]+(?:\s*[-–]\s*[0-9]+)?)*)/i);
    let efforts=[];
    if(slash)efforts=slash[1].split(/\s*\/\s*/).map(parseRpeToken).filter(Boolean);
    else efforts=rpeHits.map(m=>parseRpeToken(m[1])).filter(Boolean);
    const pair=text.match(/superset with\s+(.+)/i);
    const oneRm=text.match(/(?:1\s*rm|e?1rm)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*kg/i)
      ||text.match(/(\d+(?:\.\d+)?)\s*kg\s*(?:1\s*rm|e?1rm)/i);
    const pct=text.match(/(\d+(?:\.\d+)?)\s*%/);
    const range=text.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*%/);
    const startAt=text.match(/start(?:ing)?\s+at\s+(\d+(?:\.\d+)?)\s*%/i);
    const setHits=[...text.matchAll(/set\s*(\d+)\s*(?:heavy\s*)?(\d+)\s*@\s*(\d+(?:\.\d+)?)(?:\s*[-–—]\s*(\d+(?:\.\d+)?))?\s*%/gi)];
    const atBlocks=[];
    for(const chunk of text.split(/\s*\+\s*|\bplus\b/i)) {
      const m=chunk.match(/(\d+)\s*[x×]\s*(\d+)\s*(?:@|at)\s*(\d+(?:\.\d+)?)(?:\s*[-–—]\s*(\d+(?:\.\d+)?))?\s*%(?:[^0-9%]*rpe\s*([0-9.]+(?:\s*[-–]\s*[0-9.]+)?))?/i);
      if(m)atBlocks.push({setCount:Number(m[1]),reps:Number(m[2]),pctLow:Number(m[3]),pctHigh:m[4]!=null?Number(m[4]):Number(m[3]),rpe:m[5]||null});
    }
    const ofReps=text.match(/of\s+(?:your\s+)?(\d+)\s*-?\s*rep(?:s)?\s+(?:max\s+)?weight/i);
    const ofLift=text.match(/%\s*of\s+(?:your\s+)?(.+?)\s+1\s*rm/i);
    const ofTop=/of\s+(?:the\s+)?top\s+set/i.test(text);
    const drop=/\bdrop\s+sets?\b/i.test(text);
    const build=/\bbuild(?:ing| to)?\b/i.test(text)||(setHits.length>=2&&Number(setHits.at(-1)[3])>Number(setHits[0][3]));
    let pctLow=null,pctHigh=null,percentSets=[],percentBasis='1rm',basisLift=null,basisReps=null;
    if(setHits.length) {
      percentSets=setHits.map(m=>({reps:Number(m[2]),pctLow:Number(m[3]),pctHigh:m[4]!=null?Number(m[4]):Number(m[3]),rpe:null,setRole:null,percentBasis:'1rm'}));
      pctLow=Math.min(...percentSets.map(s=>s.pctLow));pctHigh=Math.max(...percentSets.map(s=>s.pctHigh));
    } else if(atBlocks.length) {
      pctLow=atBlocks[0].pctLow;pctHigh=atBlocks[0].pctHigh;
      percentSets=atBlocks.flatMap((b,bi)=>Array.from({length:b.setCount},()=>({
        reps:b.reps,pctLow:b.pctLow,pctHigh:b.pctHigh,rpe:b.rpe,setRole:bi>0?(drop||ofTop?'drop':'backoff'):null,
        percentBasis:bi>0&&(ofTop||drop)?'top_set':'1rm',
      })));
    } else if(range) {
      pctLow=Number(range[1]);pctHigh=Number(range[2]);
    } else if(startAt) {
      pctLow=pctHigh=Number(startAt[1]);
    }
    if(ofTop||drop)percentBasis=ofTop?'top_set':percentBasis;
    if(ofReps){percentBasis='rep_weight';basisReps=Number(ofReps[1]);}
    else if(ofLift){percentBasis='other_lift';basisLift=ofLift[1].trim();}
    if(percentSets.length&&(ofTop||drop)) {
      for(const s of percentSets)if(s.setRole){s.percentBasis='top_set';}
    }
    return {
      restSec,
      setCount:timed?Number(timed[1]):null,
      seconds:timed?Number(timed[2]):(oneSeconds&&!timed?Number(oneSeconds[1]):null),
      efforts,
      supersetWith:pair?decode(pair[1]).replace(/[.,;].*$/,'').trim():null,
      oneRm:oneRm?Number(oneRm[1]):null,
      percent:pctLow??(pct?Number(pct[1]):null),
      pctLow,pctHigh,startPct:startAt?Number(startAt[1]):null,
      percentMode:build?'build':'straight',
      percentBasis,basisLift,basisReps,percentSets,
      rpe:atBlocks[0]?.rpe?Number(String(atBlocks[0].rpe).split(/[-–]/)[0]):null,
    };
  }
  root.StrengthNotes={parse,decode,rpeToEffort};
})(typeof window!=='undefined'?window:globalThis);
