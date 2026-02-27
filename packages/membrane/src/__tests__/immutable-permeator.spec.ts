import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ObjectProjectionMembrane } from '../membranes/object-projection-membrane';
import { ScalarMembrane } from '../membranes/scalar-membrane';
import { ImmutablePermeator } from '../permeators/immutable-permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('ImmutablePermeator', () => {
  it('should return original base for object permeator', async () => {
    const before = new ObjectMembrane(
      cb(async (base: any) => ({ ...base, added: true })),
      'overwrite',
    );
    const after = new ObjectMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const composed = new ImmutablePermeator(before, after);
    const original = { name: 'Alice' };

    const result = await composed.permeate(original, async (scoped: any) => {
      expect(scoped).toEqual({ name: 'Alice', added: true });
      return scoped;
    });

    expect(result).toBe(original);
  });

  it('should return original base for collection permeator', async () => {
    const before = new CollectionMembrane(
      cb(async () => [{ id: 99 }]),
      'overwrite',
    );
    const after = new CollectionMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const composed = new ImmutablePermeator(before, after);
    const original = [{ id: 1 }, { id: 2 }];

    const result = await composed.permeate(original, async (scoped: any) => {
      expect(scoped).toEqual([{ id: 99 }, { id: 2 }]);
      return scoped;
    });

    expect(result).toBe(original);
  });

  it('should return original for string scalar', async () => {
    const before = new ScalarMembrane(async (base: string) =>
      base.toUpperCase(),
    );
    const after = new ScalarMembrane(async (base: string) => base);

    const composed = new ImmutablePermeator(before, after);

    const result = await composed.permeate('hello', async (scoped: any) => {
      expect(scoped).toBe('HELLO');
      return scoped;
    });

    expect(result).toBe('hello');
  });

  it('should return original for number scalar', async () => {
    const before = new ScalarMembrane(async (base: number) => base * 2);
    const after = new ScalarMembrane(async (base: number) => base);

    const composed = new ImmutablePermeator(before, after);

    const result = await composed.permeate(42, async (scoped: any) => {
      expect(scoped).toBe(84);
      return scoped;
    });

    expect(result).toBe(42);
  });

  describe('domain aggregate protection', () => {
    it('should hide sensitive fields from callback via projection', async () => {
      const before = new ObjectProjectionMembrane(
        cb(async (base: any) => ({
          id: base.id,
          name: base.name,
          email: base.email,
        })),
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const composed = new ImmutablePermeator(before, after);
      const aggregate = {
        id: '1',
        name: 'Alice',
        email: 'alice@test.com',
        passwordHash: '$2b$10$abc',
        ssn: '123-45-6789',
        internalFlags: { suspended: false },
      };

      const result = await composed.permeate(aggregate, async (scoped: any) => {
        expect(scoped).toEqual({
          id: '1',
          name: 'Alice',
          email: 'alice@test.com',
        });
        expect(scoped).not.toHaveProperty('passwordHash');
        expect(scoped).not.toHaveProperty('ssn');
        expect(scoped).not.toHaveProperty('internalFlags');
        return scoped;
      });

      expect(result).toBe(aggregate);
    });
  });

  describe('error handling', () => {
    it('should delegate onError to inner permeator', async () => {
      const before = new ObjectMembrane(
        cb(async () => {
          throw new Error('before failed');
        }),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const onError = jest.fn((error: unknown): never => {
        throw error;
      });

      const composed = new ImmutablePermeator(before, after, { onError });

      await expect(
        composed.permeate({ name: 'input' }, async (scoped) => scoped),
      ).rejects.toThrow('before failed');

      expect(onError).toHaveBeenCalled();
    });
  });
});
