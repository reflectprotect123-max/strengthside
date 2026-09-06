import { describe, expect, it } from 'vitest';
import type { CachedFood } from './types';
import {
  enrichFoodServings,
  normaliseAmount,
  parseHouseholdServing,
  parseServingSizeText,
  pickDefaultLogQuantity,
  resolveServingAmount,
} from './serving-parse';
import { loggableUnits, resolveFoodMacros } from './recipe';

const kTime = (): CachedFood => ({
  id: 'off-9310072770123',
  name: 'K-Time Baked Twists',
  brand: 'Arnotts',
  barcode: '9310072770123',
  servingQty: 100,
  servingUnit: 'g',
  calories: 460,
  proteinG: 7,
  carbsG: 70,
  fatG: 16,
  nutritionBasisQty: 100,
  nutritionBasisUnit: 'g',
  servingSizeText: '25 g',
  source: 'openfoodfacts',
  externalId: '9310072770123',
  nutrients: {},
  servings: [],
  cachedAt: '2026-08-24T00:00:00.000Z',
});

describe('normaliseAmount', () => {
  it('normalises mass and volume units without guessing density', () => {
    expect(normaliseAmount(25, 'g')).toEqual({ amount: 25, unit: 'g' });
    expect(normaliseAmount(1, 'oz')?.unit).toBe('g');
    expect(normaliseAmount(1, 'oz')!.amount).toBeCloseTo(28.35, 1);
    expect(normaliseAmount(250, 'ml')).toEqual({ amount: 250, unit: 'ml' });
    expect(normaliseAmount(1, 'fl oz')?.unit).toBe('ml');
    expect(normaliseAmount(2, 'cl')).toEqual({ amount: 20, unit: 'ml' });
  });

  it('refuses household units with no mass stated', () => {
    expect(normaliseAmount(1, 'cup')).toBeNull();
    expect(normaliseAmount(1, 'tbsp')).toBeNull();
    expect(normaliseAmount(2, 'slice')).toBeNull();
  });
});

describe('parseServingSizeText', () => {
  it('reads plain and tight gram amounts', () => {
    expect(parseServingSizeText('25 g')).toEqual({ amount: 25, unit: 'g' });
    expect(parseServingSizeText('25g')).toEqual({ amount: 25, unit: 'g' });
    expect(parseServingSizeText('37.5g')).toEqual({ amount: 37.5, unit: 'g' });
  });

  it('prefers a parenthesised mass over biscuit counts', () => {
    expect(parseServingSizeText('2 biscuits (25 g)')).toEqual({ amount: 25, unit: 'g' });
    expect(parseServingSizeText('1 tbsp (20g)')).toEqual({ amount: 20, unit: 'g' });
    expect(parseServingSizeText('1 can (250 ml)')).toEqual({ amount: 250, unit: 'ml' });
  });

  it('reads millilitres and normalises litres', () => {
    expect(parseServingSizeText('250 ml')).toEqual({ amount: 250, unit: 'ml' });
    expect(parseServingSizeText('0.25 l')).toEqual({ amount: 250, unit: 'ml' });
  });

  it('returns null when no mass or volume is stated', () => {
    expect(parseServingSizeText('2 biscuits')).toBeNull();
    expect(parseServingSizeText('1 serving')).toBeNull();
    expect(parseServingSizeText('0,46')).toBeNull();
    expect(parseServingSizeText(null)).toBeNull();
  });
});

describe('parseHouseholdServing', () => {
  it('splits count + household word from a stated mass', () => {
    expect(parseHouseholdServing('3 slices (18 g)')).toEqual({
      unit: 'slice',
      count: 3,
      total: { amount: 18, unit: 'g' },
    });
    expect(parseHouseholdServing('1 tblsp (25 g)')).toMatchObject({
      unit: 'tbsp',
      count: 1,
      total: { amount: 25, unit: 'g' },
    });
    expect(parseHouseholdServing('1 can (250 ml)')).toMatchObject({
      unit: 'can',
      count: 1,
      total: { amount: 250, unit: 'ml' },
    });
  });

  it('returns null without a measurable conversion', () => {
    expect(parseHouseholdServing('2 biscuits')).toBeNull();
    expect(parseHouseholdServing('50 g')).toBeNull();
  });
});

describe('resolveServingAmount', () => {
  it('prefers OFF structured serving_quantity over text', () => {
    expect(
      resolveServingAmount({
        servingSizeText: '1 serving',
        servingQuantity: 27.5,
        servingQuantityUnit: 'g',
      }),
    ).toEqual({ amount: 27.5, unit: 'g' });
  });

  it('falls back to text when structured fields are missing', () => {
    expect(
      resolveServingAmount({
        servingSizeText: '1 portion (25 ml)',
        servingQuantity: null,
        servingQuantityUnit: null,
      }),
    ).toEqual({ amount: 25, unit: 'ml' });
  });
});

describe('enrichFoodServings + pickDefaultLogQuantity', () => {
  it('turns serving-size text into an explicit serving→grams row', () => {
    const enriched = enrichFoodServings(kTime());
    expect(enriched.servings).toHaveLength(1);
    expect(enriched.servings[0]).toMatchObject({
      unit: 'serving',
      quantity: 1,
      grams: 25,
      millilitres: null,
    });
  });

  it('adds a household unit chip when count + grams are both stated', () => {
    const food = { ...kTime(), servingSizeText: '3 slices (18 g)', servings: [] };
    const enriched = enrichFoodServings(food);
    const units = loggableUnits(enriched, enriched.servings);
    expect(units.serving).toBe(1);
    expect(units.slice).toBe(1);
    expect(units.g).toBe(100);
    // 3 slices × 6 g = 18 g → 18/100 of macros
    const macros = resolveFoodMacros(enriched, enriched.servings, 3, 'slice');
    expect(macros.calories).toBeCloseTo(460 * 0.18, 5);
  });

  it('uses structured OFF quantity when text is vague', () => {
    const food = { ...kTime(), servingSizeText: '1 serving', servings: [] };
    const picked = pickDefaultLogQuantity(food, {
      servingSizeText: '1 serving',
      servingQuantity: 85,
      servingQuantityUnit: 'g',
    });
    expect(picked).toMatchObject({ quantity: 85, unit: 'g' });
  });

  it('logs one pack serving as grams (not unit serving)', () => {
    const { food, quantity, unit } = pickDefaultLogQuantity(kTime());
    expect(unit).toBe('g');
    expect(quantity).toBe(25);
    expect(food.servings[0]?.grams).toBe(25);
    const macros = resolveFoodMacros(food, food.servings, quantity, unit);
    expect(macros.calories).toBeCloseTo(115, 5);
    expect(macros.proteinG).toBeCloseTo(1.75, 5);
  });

  it('still allows unit serving via loggableUnits when conversion exists', () => {
    const { food } = pickDefaultLogQuantity(kTime());
    const units = loggableUnits(food, food.servings);
    expect(units.serving).toBe(1);
    expect(units.g).toBe(100);
    const macros = resolveFoodMacros(food, food.servings, 1, 'serving');
    expect(macros.calories).toBeCloseTo(115, 5);
  });

  it('falls back to grams when serving text has no measurable amount', () => {
    const food = { ...kTime(), servingSizeText: '2 biscuits', servings: [] };
    const picked = pickDefaultLogQuantity(food);
    expect(picked.unit).toBe('g');
    expect(picked.quantity).toBe(100);
  });

  it('does not invent a serving→ml bridge on a gram-based food', () => {
    const food = { ...kTime(), servingSizeText: '250 ml', servings: [] };
    const enriched = enrichFoodServings(food);
    expect(enriched.servings).toEqual([]);
  });

  it('leaves an existing explicit serving conversion alone', () => {
    const food: CachedFood = {
      ...kTime(),
      servings: [
        {
          id: 's1',
          foodId: kTime().id,
          label: 'pack serving',
          quantity: 1,
          unit: 'serving',
          grams: 30,
          millilitres: null,
          isDefault: true,
          sortOrder: 0,
        },
      ],
    };
    const enriched = enrichFoodServings(food);
    expect(enriched.servings).toHaveLength(1);
    expect(enriched.servings[0].grams).toBe(30);
  });
});
