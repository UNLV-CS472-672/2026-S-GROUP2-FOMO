import { describe, expect, it } from 'vitest';

describe('convex test runner (smoke)', () => {
  it('succeeds', () => {
    expect(1 + 1).toBe(2);
  });

  it('fails on purpose (remove or fix when adding real tests)', () => {
    expect(true).toBe(false);
  });
});
