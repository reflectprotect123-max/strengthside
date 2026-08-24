import { describe, expect, it } from 'vitest';
import type { CachedFood } from './types';
import {
  enrichFoodServings,
  parseServingSizeText,
  pickDefaultLogQuantity,
} from './serving-parse';
import { resolveFoodMacros } from './recipe';

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

describe('parseServingSizeText', () => {
  it('reads a plain gram amount', () => {
    expect(parseServingSizeText('25 g')).toEqual({ amount: 25, unit: 'g' });
    expect(parseServingSizeText('25g')).toEqual({ amount: 25, unit: 'g' });
  });

  it('prefers a parenthesised mass over biscuit counts', () => {
    expect(parseServingSizeText('2 biscuits (25 g)')).toEqual({ amount: 25, unit: 'g' });
  });

  it('reads millilitres and normalises litres', () => {
    expect(parseServingSizeText('250 ml')).toEqual({ amount: 250, unit: 'ml' });
    expect(parseServingSizeText('0.25 l')).toEqual({ amount: 250, unit: 'ml' });
  });

  it('returns null when no mass or volume is stated', () => {
    expect(parseServingSizeText('2 biscuits')).toBeNull();
    expect(parseServingSizeText('1 serving')).toBeNull();
    expect(parseServingSizeText(null)).toBeNull();
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

  it('logs one serving as 25 g of macros without guessing density', () => {
    const { food, quantity, unit } = pickDefaultLogQuantity(kTime());
    expect(unit).toBe('serving');
    expect(quantity).toBe(1);
    const macros = resolveFoodMacros(food, food.servings, quantity, unit);
    expect(macros.calories).toBeCloseTo(115, 5); // 25/100 * 460
    expect(macros.proteinG).toBeCloseTo(1.75, 5);
  });

  it('falls back to grams when serving text has no measurable amount', () => {
    const food = { ...kTime(), servingSizeText: '2 biscuits', servings: [] };
    const picked = pickDefaultLogQuantity(food);
    expect(picked.unit).toBe('g');
    expect(picked.quantity).toBe(100);
    expect(() => resolveFoodMacros(picked.food, picked.food.servings, picked.quantity, picked.unit)).not.toThrow();
  });

  it('does not invent a serving→ml bridge on a gram-based food', () => {
    const food = { ...kTime(), servingSizeText: '250 ml', servings: [] };
    const enriched = enrichFoodServings(food);
    expect(enriched.servings).toEqual([]);
    const picked = pickDefaultLogQuantity(food);
    expect(picked.unit).toBe('g');
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
