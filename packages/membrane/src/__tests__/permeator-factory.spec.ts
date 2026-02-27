import { Membrane } from '../membrane';
import { PermeateCallback } from '../membrane.types';
import { ObjectMembrane } from '../membranes/object-membrane';
import { Permeator } from '../permeator';
import { ImmutablePermeator } from '../permeators/immutable-permeator';
import { MutablePermeator } from '../permeators/mutable-permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('Permeator factory', () => {
  describe('.mutable()', () => {
    it('should return a MutablePermeator instance', () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const permeator = Permeator.mutable(before, after);

      expect(permeator).toBeInstanceOf(MutablePermeator);
    });

    it('should run the before → callback → after pipeline', async () => {
      const before = Membrane.object(
        cb(async (base: any) => ({ ...base, enhanced: true })),
        'overwrite',
      );
      const after = Membrane.object(
        cb(async (base: any) => ({ ...base, post: true })),
        'overwrite',
      );

      const composed = Permeator.mutable(before, after);
      const result = await composed.permeate(
        { name: 'input' },
        async (scoped) => ({
          ...scoped,
          fromDb: true,
        }),
      );

      expect(result).toEqual({
        name: 'input',
        enhanced: true,
        fromDb: true,
        post: true,
      });
    });
  });

  describe('.immutable()', () => {
    it('should return an ImmutablePermeator instance', () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const permeator = Permeator.immutable(before, after);

      expect(permeator).toBeInstanceOf(ImmutablePermeator);
    });

    it('should return original base unchanged', async () => {
      const before = Membrane.object(
        cb(async (base: any) => ({ ...base, enhanced: true })),
        'overwrite',
      );
      const after = Membrane.object(
        cb(async (base: any) => ({ ...base, post: true })),
        'overwrite',
      );

      const composed = Permeator.immutable(before, after);
      const original = { name: 'input' };
      const result = await composed.permeate(original, async (scoped) => ({
        ...scoped,
        fromDb: true,
      }));

      expect(result).toBe(original);
    });
  });
});
