import { arrowPath, halfToFull, makeMarkerId } from '../utils';

describe('arrowPath', () => {
  it('returns a straight line for very short distances (len < 0.5)', () => {
    const result = arrowPath(10, 10, 10.1, 10.1);
    expect(result).toBe('M 10 10 L 10.1 10.1');
  });

  it('returns a quadratic bezier path for normal lengths', () => {
    const result = arrowPath(0, 0, 100, 0);
    expect(result).toMatch(/^M 0 0 Q .+ 100 0$/);
  });

  it('starts with M x1 y1 and ends with x2 y2', () => {
    const result = arrowPath(20, 30, 70, 80);
    expect(result).toMatch(/^M 20 30 Q /);
    expect(result).toMatch(/ 70 80$/);
  });

  it('handles diagonal lines without throwing', () => {
    expect(() => arrowPath(5, 5, 95, 95)).not.toThrow();
  });
});

describe('halfToFull', () => {
  it('maps 0 (attack) to 50% on full pitch', () => {
    expect(halfToFull(0)).toBe(50);
  });

  it('maps 100 (own goal) to 100% on full pitch', () => {
    expect(halfToFull(100)).toBe(100);
  });

  it('maps 50 (midpoint) to 75% on full pitch', () => {
    expect(halfToFull(50)).toBe(75);
  });
});

describe('makeMarkerId', () => {
  it('combines uid, kind and hex without the # sign', () => {
    expect(makeMarkerId(':r1:', '#ff0000', 'solid')).toBe(':r1:-ah-solid-ff0000');
  });

  it('works for dashed kind', () => {
    expect(makeMarkerId('uid', '#00ff00', 'dashed')).toBe('uid-ah-dashed-00ff00');
  });

  it('strips the # character from the hex value', () => {
    const id = makeMarkerId('x', '#abc123', 'solid');
    expect(id).not.toContain('#');
    expect(id).toContain('abc123');
  });
});
