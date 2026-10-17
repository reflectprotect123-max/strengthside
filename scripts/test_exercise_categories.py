"""Independent movement expectations + identity/alias preservation and export checks."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('movement_library', Path(__file__).with_name('categorise-exercise-library.py'))
LIB = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LIB)


class MovementLibraryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.outputs, cls.summary = LIB.generate()
        cls.entries = json.loads(cls.outputs['exercise_movement_library.json'])['exercises']
        cls.by_title = {e['canonical_title']: e for e in cls.entries}

    def test_known_mechanics_and_keyword_traps(self):
        expected = {
            'squat': ['Back Squat', 'Pause Back Squat', 'Box Squat', 'Front Squat', 'Kettle Bell Squays', 'Single Leg Leg Press', 'Wall Sit'],
            'hinge': ['Romanian Deadlift', 'Clean Deadlift', 'Snatch Grip Deadlift', 'Reverse Hyperextension', 'Seated Dumbbell Good Morning', 'Kettlebell Swing', 'Trap Bar Dl'],
            'hip_extension': ['Hip Thrust', 'Glute Bridge', 'Single Leg Hamstring Bridge On Foam Roller', 'Kettlebell Hold Feet Elevated Glute Bridge Psoas March'],
            'lunge_step': ['Barbell Bulgarian Split Squat', 'Zercher Rfess (From Pins)', 'Dumbbell Box Step-Up', 'Tall Kneeling To Standing'],
            'horizontal_push': ['Bench Press', 'Triceps Push-Up', 'Plyo Push-Up', 'Flat Dumbbell Press 8Rm', 'High Incline Dumbbell Press'],
            'vertical_push': ['Barbell Z Pin Press', 'Weighted Dip', 'Triceps Bench Dip', 'Handstand Push-Up', 'Pike Push-Up', 'Snatch Grip Behind The Neck Press', 'Landmine Press'],
            'horizontal_pull': ['Barbell Row', 'Sled Row', 'Sled Face Pull', 'Snatch Grip Barbell Row', 'TRX Row'],
            'vertical_pull': ['Weighted Chin-Up', 'Weighted Pull-Up', 'Lat Pulldown', 'Rope Climb'],
            'core': ['Side Plank', 'Deficit Single Leg Side Plank Dip', 'Tuck Ups In Dip Support', 'Hanging Medicine Ball Knee Raise', 'Reverse V Ups On Rower (Seat)', 'Bear Crawl Kettlebell Lateral Pull Through', 'Kipping Swing'],
            'carry': ['Dumbbell Farmers Walk', 'Double Kettlebell Front Rack Walk', 'Rucking', 'Suitcase Carry'],
            'isolation': ['Dumbbell Upright Row', 'Dumbbell Incline Rear Delt Swing', 'Dip Belt Calf Raise', 'Forearm Supported Wrist Curl', 'Standing Bar Triceps Extension', 'Straight Arm Lat Pulldown', 'Banded Hip Flexor Pull', 'Nordic Curl', 'Seated Dumbbell Power Clean'],
            'power': ['Clean And Jerk', 'Snatch Pull', 'Sumo Deadlift High Pull', 'Box Jump', 'Box Drop Landing', 'Altitude Split Squat Landing', 'Medicine Ball Chest Pass'],
            'mobility': ['Squat To Stand', 'Pull-Up Bar Dead Hang', 'Knee Supported Foam Roller Windmill', 'Banded Lat Distraction E/Side'],
            'locomotion_conditioning': ['400 M Repeats', 'A March', 'Box Get Overs With Floor Touch', 'Rowing', 'Sled Drag', 'Double Under'],
            'preparation_recovery': ['Box Breathing', 'Rest', 'Full Body Warm Up'],
            'reference': ['Velocity Tracking App Demo', 'Lower Body Focus Full Body', 'Prvn60 1/05/24'],
            'needs_review': ['Bendh', 'Farmers Press', 'Option 1', 'Around The World', 'Rope Sledpulls', 'Seated Clean', 'Seated Power Clean'],
        }
        for category, titles in expected.items():
            for title in titles:
                with self.subTest(title=title):
                    self.assertEqual(self.by_title[title]['movement_category'], category)

    def test_combinations_keep_components_without_splitting_identity(self):
        cases = {
            'Dumbbell Thruster': ['squat', 'vertical_push'],
            'Band Row + Reverse Lunge': ['horizontal_pull', 'lunge_step'],
            'Single Leg Kettlebell Romanian Deadlift + Row': ['hinge', 'horizontal_pull'],
            'Pull-Up Or Inverted Row': ['vertical_pull', 'horizontal_pull'],
            'Glute Bridge Dumbbell Bench Press': ['hip_extension', 'horizontal_push'],
        }
        for title, secondary in cases.items():
            with self.subTest(title=title):
                self.assertEqual(self.by_title[title]['movement_category'], 'mixed')
                self.assertEqual(self.by_title[title]['secondary_categories'], secondary)
        self.assertEqual(self.by_title['Side Plank Row']['secondary_categories'], ['horizontal_pull'])
        self.assertEqual(self.by_title['Band Row + Press']['secondary_categories'], ['horizontal_pull'])
        self.assertIn('context:alternatives', self.by_title['Pull-Up Or Inverted Row']['tags'])

    def test_identity_aliases_and_custom_subset_are_preserved(self):
        source = LIB.load_csv(LIB.DATA / 'canonical_exercise_library.csv')
        original = {e['canonical_exercise_id']: e for e in source}
        current = {e['canonical_exercise_id']: e for e in self.entries}
        self.assertEqual(original.keys(), current.keys())
        self.assertEqual(len(current), len(self.entries))
        for key, row in original.items():
            self.assertEqual(current[key]['canonical_title'], row['canonical_title'])
            self.assertEqual(current[key]['aliases'], json.loads(row['aliases']))
        aliases = LIB.load_csv(LIB.DATA / 'exercise_alias_map.csv')
        self.assertEqual({(e['original_exercise_title'], e['canonical_exercise_id']) for e in aliases},
                         {(alias, e['canonical_exercise_id']) for e in self.entries for alias in e['aliases']})
        custom = LIB.load_csv(LIB.DATA / 'custom_library_canonical.csv')
        self.assertEqual({e['canonical_exercise_id'] for e in custom},
                         {e['canonical_exercise_id'] for e in self.entries if e['in_custom_library']})
        self.assertEqual(len(self.entries), 1860)
        self.assertEqual(len(custom), 382)
        self.assertEqual(len(aliases), 2078)

    def test_tags_separate_family_equipment_and_variation(self):
        self.assertIn('family:back_squat', self.by_title['Pause Back Squat']['tags'])
        self.assertIn('variation:paused', self.by_title['Pause Back Squat']['tags'])
        tags = self.by_title['B-Stance Dumbbell Romanian Deadlift']['tags']
        self.assertTrue({'family:romanian_deadlift', 'equipment:dumbbell', 'variation:b_stance'} <= set(tags))
        self.assertIn('context:warm_up', self.by_title['Back Squat Warm Up']['tags'])
        self.assertEqual(self.by_title['Back Squat Warm Up']['movement_category'], 'squat')
        self.assertIn('variation:isometric', self.by_title['Single Leg Isometric Quad Extension At 90 Degrees']['tags'])
        # A dumbbell category must not invent per-side weights, bodyweight or equipment increments.
        for entry in self.entries:
            self.assertFalse({'e1rm', 'load_increment', 'weight_kg', 'rir', 'metrics', 'muscles'} & entry.keys())
        self.assertNotIn('variation:bodyweight_explicit', self.by_title['Weighted Chin-Up']['tags'])
        self.assertIn('variation:bodyweight_explicit', self.by_title['Bodyweight Push-Up']['tags'])

    def test_unknown_names_are_not_forced_and_reviews_have_reasons(self):
        self.assertEqual(LIB.classify('Unknown Mystery Press')['review_status'], 'needs_review')
        self.assertEqual(LIB.classify('Riddle Movement 99')['movement_category'], 'needs_review')
        for row in self.entries:
            if row['review_status'] != 'classified_from_name':
                self.assertTrue(row['reason'], row['canonical_title'])
                self.assertIn(row['movement_category'], {'reference', 'needs_review'})
            self.assertEqual(row['tags'], sorted(set(row['tags'])))
        queue = self.outputs['movement_review_queue.csv'].decode()
        self.assertIn('Bendh', queue)
        self.assertIn('Velocity Tracking App Demo', queue)
        self.assertNotIn(',Back Squat,', queue)

    def test_exports_are_reproducible_and_do_not_write_inputs(self):
        before = {p.name: p.read_bytes() for p in LIB.DATA.iterdir() if p.is_file()}
        again, summary = LIB.generate()
        self.assertEqual(again, self.outputs)
        self.assertEqual(summary, self.summary)
        self.assertEqual(before, {p.name: p.read_bytes() for p in LIB.DATA.iterdir() if p.is_file()})
        for name, content in self.outputs.items():
            self.assertEqual((LIB.DATA / name).read_bytes(), content, name)

    def test_stale_overrides_and_orphan_aliases_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            data = Path(temp)
            for name in self.summary['source_sha256']:
                shutil.copy(LIB.DATA / name, data / name)
            path = data / 'movement-overrides.json'
            original = json.loads(path.read_text())
            changed = copy.deepcopy(original)
            changed['exercises'][0]['canonical_title'] += ' incorrectly changed'
            path.write_text(json.dumps(changed))
            with self.assertRaisesRegex(AssertionError, 'Stale override'):
                LIB.generate(data)
            path.write_text(json.dumps(original))
            aliases = data / 'exercise_alias_map.csv'
            aliases.write_text(aliases.read_text().replace('exercise_6ec38a5f580f95a0', 'exercise_missing'))
            with self.assertRaises(KeyError):
                LIB.generate(data)


if __name__ == '__main__':
    unittest.main()
