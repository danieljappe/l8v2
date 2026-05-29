import { slugify } from '@/utils/slugUtils';

// ─── Falsy input — EQ: null / undefined / empty-string → '' ──────────────────

describe('slugify — falsy inputs', () => {
  it('returns empty string for null', () => {
    expect(slugify(null as unknown as string)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(slugify(undefined as unknown as string)).toBe('');
  });

  it('returns empty string for an empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('returns empty string for a whitespace-only string (BVA: only spaces)', () => {
    expect(slugify('   ')).toBe('');
  });

  it('returns empty string for an all-hyphens string (BVA: only hyphens)', () => {
    expect(slugify('---')).toBe('');
  });
});

// ─── Basic word handling — EQ ─────────────────────────────────────────────────

describe('slugify — basic word handling', () => {
  it('returns a single lowercase word unchanged', () => {
    expect(slugify('hello')).toBe('hello');
  });

  it('lowercases mixed-case input', () => {
    expect(slugify('HelloWorld')).toBe('helloworld');
  });

  it('preserves digits', () => {
    expect(slugify('event2024')).toBe('event2024');
  });

  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('converts underscores to hyphens', () => {
    expect(slugify('hello_world')).toBe('hello-world');
  });

  it('strips non-word characters that are not hyphens', () => {
    expect(slugify('test!123')).toBe('test123');
  });
});

// ─── Danish character replacement — EQ ───────────────────────────────────────

describe('slugify — Danish character replacement', () => {
  it('replaces æ with ae', () => {
    expect(slugify('ærlig')).toBe('aerlig');
  });

  it('replaces ø with oe', () => {
    expect(slugify('øl')).toBe('oel');
  });

  it('replaces å with aa', () => {
    expect(slugify('åben')).toBe('aaben');
  });

  it('handles all three Danish characters in a single string', () => {
    expect(slugify('Ære øl å')).toBe('aere-oel-aa');
  });

  it('replaces a single uppercase Æ (BVA: single-char Danish boundary)', () => {
    expect(slugify('Æ')).toBe('ae');
  });
});

// ─── Diacritic removal — EQ ───────────────────────────────────────────────────

describe('slugify — diacritic removal', () => {
  it('strips diacritics via NFD normalisation', () => {
    expect(slugify('café naïve')).toBe('cafe-naive');
  });
});

// ─── Hyphen normalisation — BVA ───────────────────────────────────────────────

describe('slugify — hyphen normalisation (BVA)', () => {
  it('strips leading hyphens', () => {
    expect(slugify('--hello')).toBe('hello');
  });

  it('strips trailing hyphens', () => {
    expect(slugify('hello--')).toBe('hello');
  });

  it('collapses multiple consecutive hyphens into one', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('collapses consecutive spaces into a single hyphen', () => {
    expect(slugify('hello  world')).toBe('hello-world');
  });
});

// ─── Single-character boundary — BVA lower bound ─────────────────────────────

describe('slugify — single character (BVA lower boundary)', () => {
  it('returns a single lowercase letter unchanged', () => {
    expect(slugify('a')).toBe('a');
  });

  it('lowercases a single uppercase letter', () => {
    expect(slugify('A')).toBe('a');
  });
});
