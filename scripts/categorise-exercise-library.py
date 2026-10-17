"""Reproducible, non-destructive movement metadata for the cleaned name library.

No prescription, load, muscle activation or progression decisions are made here.
Run --check in CI to detect stale exports; new/ambiguous names stay reviewable.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
from collections import Counter
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/data/trainheroic-library'
SCHEMA_VERSION = 2

# First match wins; specific mechanics must precede broad words such as press/row.
# Secondary patterns are declared only for recognised combinations, not every word.
RULES = [
    ('handstand_push', 'vertical_push', 'overhead_press_dip', r'handstand push up|pike push up'),
    ('dip', 'vertical_push', 'dip', r'^(?!.*(?:plank|calf|tuck ups)).*\bdip\b|\bring support hold\b'),
    ('triceps_push_up', 'horizontal_push', 'press_push_up', r'triceps push up'),
    ('plyo_push_up', 'horizontal_push', 'press_push_up', r'(?:plyo|explosive).*push up'),
    ('preparation', 'preparation_recovery', 'general_preparation', r'^(?:rest|the warm up|dynamic warmup|full body warm up|quick full body warm up|aerobic warm up|conditioning (?:warm up|cooldown))$|\bbreathing\b|legs up the wall'),
    ('mobility', 'mobility', 'mobility', r'\bstretch\b|\bmobility\b|\bmobilization\b|\bmobilizations\b|\bsmr\b|foam roll(?:ing)?\b|\bpose\b|pigeon|\bcars\b|t spine|thoracic|hip airplane|hip circle|hip switch|hip flip|hip flow|cat camel|thread the needle|worlds greatest|scorpion|arm circles|book opener|shoulder opener|shoulder angels|handcuffs|shin box|bretzel|groin drift|front split|forward fold|straddle|tactical frog|pec smash|deep sq (?:mob|rot)|hip flexor flow|leg swing'),
    ('sled_row', 'horizontal_pull', 'row', r'\bsled.*(?:row|face pull)|\b(?:row|face pull).*sled'),
    ('sled_triceps', 'isolation', 'elbow_extension', r'\bsled oh extension\b'),
    ('carry', 'carry', 'loaded_carry', r'\bcarry\b|farmers? walk|\bruck(?:ing| march)\b|kettlebell.*march|overhead march|\bmile with sandbag\b'),
    ('rope_conditioning', 'locomotion_conditioning', 'skipping', r'\b(?:double|single|crossover single) under\b|\bjumping rope\b'),
    ('burpee', 'locomotion_conditioning', 'burpee', r'\bburpee'),
    ('jump', 'power', 'jump_bound', r'\bjump\b|\bjumping\b|\bhop\b|\bbounds?\b|\bbounding\b|\bpogos?\b|\bplyos\b|\bplyometric'),
    ('conditioning', 'locomotion_conditioning', 'conditioning', r'\brun(?:ning|ner)?\b|\bsprints?\b|\bbike(?:erg)?\b|\bairdyne\b|\brower\b(?! hamstring| \(seat)|\brow(?:ing| erg)\b|\bski erg\b|\baerobic\b|\bcardio\b|\bconditioning\b|\bconditioining\b|\bmetcon\b|\btabata\b|\bgpp\b|\bsled\b|\bshuttle\b|\bshuffle\b|\bstairs\b|^walk(?:ing)?$|go for a .* walk|battle rope|^skip$'),
    ('core', 'core', 'trunk_control', r'\bplank\b|\bpallof\b|\banti rotation\b|\bdead bug\b|\bdeadbug\b|\bbird dogs?\b|\bbirddog\b|\bhollow\b|\bsit ups?\b|\bsit up\b|\bcrunch\b|\bv ups?\b|\btuck ups?\b|\bl sit\b|\bl tuck\b|\btoes to bar\b|\bknees to elbows\b|\bhanging (?:straight )?(?:leg|knee)|\bleg (?:lifts|raise)\b|\bside bends?\b|\blateral flexion\b|\brussian twist\b|\bwood chop\b|\bchop\b|\bab wheel\b|\bab rollout\b|\bstir the pot\b|\bbodysaw\b|\bfallouts?\b|\bdragon (?:flag|fly)\b|\bgarhammer\b|\bmountain climbers\b|\bwindmill\b|\bwind mill\b|\bturkish\b|\babs\b|\bhip flex.*(?:raise|sit up)|\bhip flexor pull\b|\bheel taps\b|\bleg lowering\b|\bpike leg lift\b|\bserratus crunch\b'),
    ('ball_power', 'power', 'throw_slam', r'\bslam\b|medicine ball.*(?:pass|throw|toss)|\bwall balls\b|\bdynaball\b|\bball throw\b'),
    ('clean_snatch', 'power', 'olympic_lift', r'\b(?:clean|snatch)\b(?!.*(?:deadlift|romanian|row|back extension|shrug|push press|behind.*press))|\bhigh pull\b|\bsplit jerk\b|\bpush jerk\b'),
    ('triceps', 'isolation', 'elbow_extension', r'\btriceps?\b|\bskull ?crusher\b|\bpushdown\b|\bpushowns\b|\bkatana\b|\bjm press\b|\btate press\b|\bfrench press\b|\bcalifornia press\b|\brollbacks?\b|\broll back\b'),
    ('calf', 'isolation', 'ankle_plantarflexion', r'\bcalf\b'),
    ('tibialis', 'isolation', 'ankle_dorsiflexion', r'\btib raise\b'),
    ('hamstring_curl', 'isolation', 'knee_flexion', r'\b(?:hamstring|leg|nordic|slider) curl\b|hamstring slides|hamstring rollout|^bc hamstring slides$|\bghr\b|glute ham raise|hamstring walk out'),
    ('leg_extension', 'isolation', 'knee_extension', r'\bleg extension\b|\bquad extension\b|\bterminal knee extension\b|\bknee terminal extension\b'),
    ('hip_ab_adduction', 'isolation', 'hip_abduction_adduction', r'\babduct(?:ion|or)\b|\badduct(?:ion|or) machine\b|monster walks|band side step|groin squeeze'),
    ('hip_extension', 'hip_extension', 'bridge_thrust', r'hip thrust|glute bridge|glute hip thrust|frog pumps|glute drive|\bposterior bridge\b|\bglute march\b|\bhamstring bridge\b|\bglute supermans\b|\bdonkey kicks\b|monster band kick back'),
    ('hinge', 'hinge', 'hip_hinge', r'\bdeadlift\b|\bromanian\b|\bsldl\b|\brdl\b|\bgood ?mornings?\b|\bback (?:extension|raise)\b|\bhip/?back extension\b|\bhip extension\b|\breverse hyper\b|\bpull through\b|\bwall hinge\b|\brack pull\b|\btrap bar dl\b|\bsorensen\b|\bjefferson curl\b|\bdimel\b'),
    ('lunge_step', 'lunge_step', 'lunge_step', r'\blunge\b|\brfess\b|\bsplit squat\b|\bstep up\b|\bstep down\b|kneeling to standing'),
    ('squat', 'squat', 'squat', r'\bsquat\b|\bsquays\b|\bsauat\b|\bgoblet sq\b|\bleg press\b|\bwall sit\b'),
    ('hip_swing', 'hinge', 'swing', r'\bswing\b'),
    ('shoulder_isolation', 'isolation', 'shoulder_accessory', r'\braise\b|\bshrugs?\b|\bupright row\b|\bface pull\b|\bpull apart\b|\bfly(?:s|es|e)?\b|\bposterior flyes\b|\bpec deck\b|\bpec dec\b|\bexternal rotation\b|\bext rotation\b|\ber ir\b|\bytw\b|\bys ts as\b|\btyws?\b|\bscaption\b|\bscarecrow\b|\bcuban press\b|\bpowell\b|\blu raise\b|\bbatwing\b|shoulder prone isos|serratus iso'),
    ('biceps', 'isolation', 'elbow_flexion', r'\bcurl\b'),
    ('grip', 'isolation', 'grip_forearm', r'\bwrist\b|\bgrip roller\b|\bplate pinch'),
    ('neck', 'isolation', 'neck', r'(?:^|lateral |rack |bench )neck (?:rotation|flexion|extension|bridge)'),
    ('pullover', 'isolation', 'shoulder_extension', r'\bpull ?over\b|\blat prayer\b|\blat sweep\b|\blat squeeze\b|\bstraight arm.*pulldown\b'),
    ('vertical_pull', 'vertical_pull', 'pull_up_pulldown', r'\bpull up\b|\bchin up\b|\bchest to bar\b|\bpulldown\b|\brope climb\b'),
    ('horizontal_pull', 'horizontal_pull', 'row', r'\brow\b'),
    ('horizontal_push', 'horizontal_push', 'press_push_up', r'\bbench\b|\bfloor press\b|\bboard press\b|\bspoto\b|\bpin press\b(?!.*shoulder)|\bchest press\b|\bpush up\b'),
    ('vertical_push', 'vertical_push', 'overhead_press_dip', r'\b(?:shoulder|military|strict|arnold|bradford|filly|landmine|overhead|z|kettlebell|dumbbell|barbell|push|single arm) press\b|ring support hold'),
    ('crawl', 'core', 'crawl', r'\bcrawls?\b|\binch worms\b|\bwheelbarrow\b'),
]

# Name-only tags intentionally do not imply bodyweight/load mode, units or dosage.
TAG_RULES = {
    'equipment:dumbbell': r'\bdumbbells?\b|\bdbs?\b',
    'equipment:kettlebell': r'\bkettlebells?\b|\bkbs?\b',
    'equipment:barbell': r'\bbarbell\b|\bstraight bar\b',
    'equipment:trap_bar': r'\btrap bar\b',
    'equipment:safety_bar': r'\bssb\b|\bsafety (?:squat )?bar\b',
    'equipment:ez_bar': r'\bez bar\b',
    'equipment:football_bar': r'\bfootball bar\b',
    'equipment:band': r'\bbands?\b|\bbanded\b|\btheraband\b',
    'equipment:cable': r'\bcable\b',
    'equipment:machine': r'\bmachine\b|\bsmith\b|\bpec deck\b|\bpec dec\b',
    'equipment:rings': r'\brings?\b',
    'equipment:trx': r'\btrx\b',
    'equipment:landmine': r'\blandmine\b',
    'equipment:medicine_ball': r'\bmedicine ball\b|\bwall ball\b|\bdynaball\b|\bdball\b',
    'equipment:sandbag': r'\bsandbag\b',
    'equipment:sled': r'\bsled\b',
    'variation:bodyweight_explicit': r'\bbodyweight\b|\bbody weight\b|\bbw\b',
    'equipment:plate': r'\bplate\b',
    'equipment:ghd': r'\bghd\b',
    'equipment:foam_roller': r'\bfoam roll(?:er|ing)?\b',
    'variation:single_leg': r'\bsingle leg\b|\bsl\b',
    'variation:single_arm': r'\bsingle arm\b|\bunilateral\b(?=.*(?:arm|chest))',
    'variation:b_stance': r'\bb stance\b|\b1\.5 stance\b',
    'variation:split_stance': r'\bsplit stance\b|\bstaggered stance\b',
    'variation:alternating': r'\balternating\b',
    'variation:paused': r'\bpause\b|\bpaused\b',
    'variation:tempo': r'\btempo\b|\beccentric\b|\bslow\b',
    'variation:isometric': r'\bisometric\b|\biso\b|\bisos\b|\bhold\b|\bholds\b|\bstatic\b',
    'variation:incline': r'\bincline\b',
    'variation:decline': r'\bdecline\b',
    'variation:deficit': r'\bdeficit\b|\bdefict\b',
    'variation:plyometric': r'\bplyo\b|\bplyos\b|\bexplosive\b|\bjump\b|\bhop\b|\bbound\b|\bbounds\b',
    'variation:box': r'\bbox\b',
    'variation:seated': r'\bseated\b',
    'variation:kneeling': r'\bkneel(?:ing)?\b',
    'variation:chest_supported': r'\bchest supported\b',
    'variation:assisted': r'\bassisted\b',
    'variation:weighted': r'(?<!un)\bweighted\b|\bweighed\b|\bweight vest\b',
    'variation:chains': r'\bchains\b',
    'variation:heels_elevated': r'\bheels? elevated\b|\belevated heel\b',
    'variation:front_foot_elevated': r'\bfront foot elevated\b|\bffe\b',
    'variation:rear_foot_elevated': r'\brear foot elevated\b|\brfess\b|\bbulgarian\b',
    'variation:neutral_grip': r'\bneutral\b',
    'variation:pronated_grip': r'\bpronated\b',
    'variation:supinated_grip': r'\bsupinated\b|\bsupinating\b|\bunderhand\b',
    'variation:close_grip': r'\bclose grip\b|\bnarrow grip\b',
    'variation:wide_grip': r'\bwide grip\b',
    'variation:rotational': r'\brotat(?:ion|ional|ing)\b|\btwist\b',
    'context:warm_up': r'\bwarm up\b|\bwarmup\b',
    'context:cool_down': r'\bcool down\b|\bcooldown\b',
    'family:back_squat': r'\bback squat\b|\bbarbell back squat\b',
    'family:front_squat': r'\bfront squat\b',
    'family:romanian_deadlift': r'\bromanian deadlift\b|\brdl\b',
    'family:bench_press': r'\bbench press\b',
    'family:hip_thrust': r'\bhip thrust\b',
    'family:pull_up': r'\bpull up\b',
    'family:chin_up': r'\bchin up\b',
}


def normalise(title):
    text = unicodedata.normalize('NFKD', title).lower()
    return re.sub(r'[^a-z0-9.+]+', ' ', text).strip()


def classify(title, overrides=None):
    text = normalise(title)
    tags = sorted(tag for tag, pattern in TAG_RULES.items() if re.search(pattern, text))
    override = (overrides or {}).get(title)
    if override:
        return {**override, 'tags': sorted(set(tags + override.get('tags', []))), 'basis': 'reviewed_override'}
    for rule_id, category, subcategory, pattern in RULES:
        if re.search(pattern, text):
            return {'movement_category': category, 'movement_subcategory': subcategory,
                    'secondary_categories': [], 'tags': tags, 'review_status': 'classified_from_name',
                    'reason': '', 'rule_id': rule_id, 'basis': 'name_rule'}
    return {'movement_category': 'needs_review', 'movement_subcategory': 'unspecified',
            'secondary_categories': [], 'tags': tags, 'review_status': 'needs_review',
            'reason': 'Name alone does not establish a specific movement.', 'rule_id': 'unresolved', 'basis': 'unresolved'}


def load_csv(path):
    with path.open(newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def csv_bytes(rows, fields):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    for row in rows:
        writer.writerow({key: json.dumps(row[key], ensure_ascii=False) if isinstance(row[key], list) else row[key] for key in fields})
    return stream.getvalue().encode()


def json_bytes(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def is_banded(entry):
    """Include assisted/resisted/optional bands and band alternatives, not just 'banded'."""
    titles = [entry['canonical_title'], *entry['aliases']]
    return any(re.search(r'\b(?:bands?|banded|theraband)\b', normalise(title)) for title in titles)


def generate(data=DATA):
    source = load_csv(data / 'archive/canonical_exercise_library.csv')
    custom = load_csv(data / 'archive/custom_library_canonical.csv')
    aliases = load_csv(data / 'archive/exercise_alias_map.csv')
    taxonomy = json.loads((data / 'movement-taxonomy.json').read_text())
    decisions = json.loads((data / 'movement-overrides.json').read_text())['exercises']
    known = {r['canonical_exercise_id']: r for r in source}
    assert len(known) == len(source), 'Duplicate source IDs'
    overrides = {}
    for decision in decisions:
        assert known[decision['canonical_exercise_id']]['canonical_title'] == decision['canonical_title'], 'Stale override title or ID'
        assert decision['canonical_title'] not in overrides, 'Duplicate override'
        overrides[decision['canonical_title']] = {k: v for k, v in decision.items() if k not in ('canonical_exercise_id', 'canonical_title')}
    custom_ids = {r['canonical_exercise_id'] for r in custom}
    assert custom_ids <= known.keys(), 'Orphan custom entry'
    for row in custom:
        assert row == known[row['canonical_exercise_id']], 'Custom/source mismatch'
    for row in aliases:
        assert known[row['canonical_exercise_id']]['canonical_title'] == row['canonical_title'], 'Orphan alias'
    categories = {c['id'] for c in taxonomy['categories']}
    subcategories = {c['id']: set(c['subcategories']) for c in taxonomy['categories']}
    entries = []
    for row in source:
        meta = classify(row['canonical_title'], overrides)
        assert meta['movement_category'] in categories
        assert meta['movement_subcategory'] in subcategories[meta['movement_category']], row['canonical_title']
        assert set(meta['secondary_categories']) <= categories - {'needs_review', meta['movement_category']}
        assert meta['review_status'] in {'classified_from_name', 'needs_review', 'non_exercise'}
        assert meta['review_status'] != 'needs_review' or meta['reason']
        assert meta['movement_category'] != 'needs_review' or meta['review_status'] == 'needs_review'
        assert len(meta['secondary_categories']) == len(set(meta['secondary_categories']))
        entries.append({'canonical_exercise_id': row['canonical_exercise_id'], 'canonical_title': row['canonical_title'],
                        'in_custom_library': row['canonical_exercise_id'] in custom_ids,
                        'aliases': json.loads(row['aliases']), **meta})
    fields = list(entries[0])
    unresolved = [x for x in entries if x['review_status'] in {'needs_review', 'non_exercise'}]
    usable = [x for x in entries if x['review_status'] == 'classified_from_name']
    main = [x for x in usable if not is_banded(x)]
    banded = [x for x in usable if is_banded(x)]
    # Deletion takes precedence: unclear band names never enter the band catalogue.
    ids = [{x['canonical_exercise_id'] for x in group} for group in (main, banded, unresolved)]
    assert not (ids[0] & ids[1] or ids[0] & ids[2] or ids[1] & ids[2]), 'Overlapping catalogues'
    assert set.union(*ids) == known.keys(), 'Catalogue split lost an identity'
    fingerprints = {name: hashlib.sha256((data / name).read_bytes()).hexdigest() for name in (
        'archive/canonical_exercise_library.csv', 'archive/custom_library_canonical.csv', 'archive/exercise_alias_map.csv',
        'movement-taxonomy.json', 'movement-overrides.json')}
    summary = {'schema_version': SCHEMA_VERSION, 'archived_source_count': len(entries),
               'removed_count': len(unresolved),
               'removed_by_status': dict(sorted(Counter(x['review_status'] for x in unresolved).items())),
               'catalogues': {}, 'reviewed_override_count': len(decisions), 'source_sha256': fingerprints}
    active_taxonomy = {**taxonomy, 'categories': [x for x in taxonomy['categories'] if x['id'] not in {'needs_review', 'reference'}]}
    outputs = {
        'archive/removed_exercises.csv': csv_bytes(unresolved, fields),
    }
    for name, prefix, group, group_ids in [('main', '', main, ids[0]), ('banded', 'banded_', banded, ids[1])]:
        group_custom = [x for x in group if x['in_custom_library']]
        group_source = [x for x in source if x['canonical_exercise_id'] in group_ids]
        group_aliases = [x for x in aliases if x['canonical_exercise_id'] in group_ids]
        outputs[prefix + 'exercise_movement_categories.csv'] = csv_bytes(group, fields)
        outputs[prefix + 'custom_library_movement_categories.csv'] = csv_bytes(group_custom, fields)
        outputs[prefix + 'canonical_exercise_library.csv'] = csv_bytes(group_source, list(source[0]))
        outputs[prefix + 'custom_library_canonical.csv'] = csv_bytes([x for x in group_source if x['canonical_exercise_id'] in custom_ids], list(source[0]))
        outputs[prefix + 'exercise_alias_map.csv'] = csv_bytes(group_aliases, list(aliases[0]))
        outputs[prefix + 'exercise_movement_library.json'] = json_bytes({'schema_version': SCHEMA_VERSION, 'catalogue': name, 'taxonomy': active_taxonomy, 'exercises': group})
        summary['catalogues'][name] = {'exercise_count': len(group), 'custom_count': len(group_custom),
                                     'alias_count': len(group_aliases),
                                     'category_counts': dict(sorted(Counter(x['movement_category'] for x in group).items()))}
    outputs['movement_category_summary.json'] = json_bytes(summary)
    return outputs, summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail on stale or missing generated exports')
    args = parser.parse_args()
    outputs, summary = generate()
    stale = []
    for name, content in outputs.items():
        path = DATA / name
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        raise SystemExit('Stale movement exports: ' + ', '.join(stale))
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
