/**
 * Tests for the built-in preset data (presetData.ts).
 *
 * Goal: ensure every preset is structurally valid so future contributors
 * cannot accidentally break the offline preset library.
 */
import { BUILTIN_PRESETS, CATEGORY_LABELS } from '../presetData';
import { PRESET_CATEGORIES } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_KINDS = new Set(['arrow', 'run', 'zone']);
const VALID_CATEGORIES = new Set(PRESET_CATEGORIES);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BUILTIN_PRESETS – count & uniqueness', () => {
  it('exports at least 5 built-in presets', () => {
    expect(BUILTIN_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('every preset has a unique id', () => {
    const ids = BUILTIN_PRESETS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every preset has a unique title', () => {
    const titles = BUILTIN_PRESETS.map(p => p.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });
});

describe('BUILTIN_PRESETS – required fields', () => {
  BUILTIN_PRESETS.forEach(preset => {
    describe(`preset "${preset.title}"`, () => {
      it('has a non-empty title', () => {
        expect(typeof preset.title).toBe('string');
        expect(preset.title.length).toBeGreaterThan(0);
      });

      it('has a valid category', () => {
        expect(VALID_CATEGORIES.has(preset.category)).toBe(true);
      });

      it('has a non-empty description', () => {
        expect(typeof preset.description).toBe('string');
        expect(preset.description.length).toBeGreaterThan(0);
      });

      it('isSystem is true', () => {
        expect(preset.isSystem).toBe(true);
      });

      it('canDelete is false', () => {
        expect(preset.canDelete).toBe(false);
      });

      it('data.name matches preset title', () => {
        expect(preset.data.name).toBe(preset.title);
      });

      it('data.elements is an array', () => {
        expect(Array.isArray(preset.data.elements)).toBe(true);
      });

      it('data.opponents is an array', () => {
        expect(Array.isArray(preset.data.opponents)).toBe(true);
      });
    });
  });
});

describe('BUILTIN_PRESETS – DrawElement shapes', () => {
  BUILTIN_PRESETS.forEach(preset => {
    preset.data.elements.forEach(el => {
      it(`[${preset.title}] element "${el.id}" has a valid kind`, () => {
        expect(VALID_KINDS.has(el.kind)).toBe(true);
      });

      it(`[${preset.title}] element "${el.id}" has a non-empty id`, () => {
        expect(typeof el.id).toBe('string');
        expect(el.id.length).toBeGreaterThan(0);
      });

      it(`[${preset.title}] element "${el.id}" has a color string`, () => {
        expect(typeof el.color).toBe('string');
        expect(el.color.startsWith('#')).toBe(true);
      });

      if (el.kind === 'arrow' || el.kind === 'run') {
        it(`[${preset.title}] ${el.kind} "${el.id}" has numeric coordinates x1/y1/x2/y2`, () => {
          expect(typeof (el as any).x1).toBe('number');
          expect(typeof (el as any).y1).toBe('number');
          expect(typeof (el as any).x2).toBe('number');
          expect(typeof (el as any).y2).toBe('number');
        });
      }

      if (el.kind === 'zone') {
        it(`[${preset.title}] zone "${el.id}" has cx/cy/r`, () => {
          expect(typeof (el as any).cx).toBe('number');
          expect(typeof (el as any).cy).toBe('number');
          expect(typeof (el as any).r).toBe('number');
          expect((el as any).r).toBeGreaterThan(0);
        });
      }
    });
  });
});

describe('BUILTIN_PRESETS – opponent shapes', () => {
  BUILTIN_PRESETS.forEach(preset => {
    preset.data.opponents.forEach(opp => {
      it(`[${preset.title}] opponent "${opp.id}" has numeric x and y in range [0, 100]`, () => {
        expect(opp.x).toBeGreaterThanOrEqual(0);
        expect(opp.x).toBeLessThanOrEqual(100);
        expect(opp.y).toBeGreaterThanOrEqual(0);
        expect(opp.y).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('BUILTIN_PRESETS – coverage per category', () => {
  it('covers at least 3 different categories', () => {
    const cats = new Set(BUILTIN_PRESETS.map(p => p.category));
    expect(cats.size).toBeGreaterThanOrEqual(3);
  });
});

describe('CATEGORY_LABELS', () => {
  it('has a label for every PRESET_CATEGORY', () => {
    PRESET_CATEGORIES.forEach(cat => {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    });
  });
});
