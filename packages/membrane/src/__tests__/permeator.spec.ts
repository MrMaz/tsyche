import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ObjectProjectionMembrane } from '../membranes/object-projection-membrane';
import { ScalarMembrane } from '../membranes/scalar-membrane';
import { SequenceMembrane } from '../membranes/sequence-membrane';
import { Permeator } from '../permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('Permeator', () => {
  it('should run before → callback → after pipeline', async () => {
    const order: string[] = [];

    const before = new ObjectMembrane(
      cb(async (base: any) => {
        order.push('before');
        return { ...base, enhanced: true };
      }),
      'overwrite',
    );

    const after = new ObjectMembrane(
      cb(async (base: any) => {
        order.push('after');
        return { ...base, postProcessed: true };
      }),
      'overwrite',
    );

    const composed = new Permeator(before, after);

    const result = await composed.permeate(
      { name: 'input' },
      async (scoped) => {
        order.push('callback');
        return { ...scoped, fromDb: true };
      },
    );

    expect(order).toEqual(['before', 'callback', 'after']);
    expect(result).toEqual({
      name: 'input',
      enhanced: true,
      fromDb: true,
      postProcessed: true,
    });
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

      const composed = new Permeator(before, after, {
        strategy: 'passthrough',
      });
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

  it('should support mixed membrane types (Object before, Collection after)', async () => {
    const before = new ObjectMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const after = new CollectionMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const composed = new Permeator(before, after);

    const result = await composed.permeate({ take: 10 }, async () => [
      { id: 1 },
      { id: 2 },
    ]);

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should support sequenced membranes as before/after inputs', async () => {
    const beforeSeq = new SequenceMembrane(
      new ObjectMembrane(
        cb(async (base: any) => ({ ...base, step1: true })),
        'overwrite',
      ),
      [
        new ObjectMembrane(
          cb(async (base: any) => ({ ...base, step2: true })),
          'overwrite',
        ),
      ],
    );

    const afterSeq = new SequenceMembrane(
      new ObjectMembrane(
        cb(async (base: any) => ({ ...base, post1: true })),
        'overwrite',
      ),
      [],
    );

    const composed = new Permeator(beforeSeq, afterSeq);

    const result = await composed.permeate(
      { name: 'input' },
      async (scoped: any) => ({
        ...scoped,
        fromDb: true,
      }),
    );

    expect(result).toEqual({
      name: 'input',
      step1: true,
      step2: true,
      fromDb: true,
      post1: true,
    });
  });

  describe('error handling', () => {
    it('should call onError handler on before-phase error', async () => {
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

      class CustomError extends Error {
        constructor(public readonly originalError: unknown) {
          super('normalized');
        }
      }

      const onError = (error: unknown): never => {
        throw new CustomError(error);
      };

      const composed = new Permeator(before, after, { onError });

      await expect(
        composed.permeate({ name: 'input' }, async (scoped) => scoped),
      ).rejects.toThrow(CustomError);
    });

    it('should call onError handler on callback error', async () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const onError = jest.fn((error: unknown): never => {
        throw error;
      });

      const composed = new Permeator(before, after, { onError });

      await expect(
        composed.permeate({ name: 'input' }, async () => {
          throw new Error('callback failed');
        }),
      ).rejects.toThrow('callback failed');

      expect(onError).toHaveBeenCalled();
    });

    it('should rethrow error as-is when no onError provided', async () => {
      const before = new ObjectMembrane(
        cb(async () => {
          throw new Error('raw error');
        }),
        'overwrite',
      );

      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const composed = new Permeator(before, after);

      await expect(
        composed.permeate({ name: 'input' }, async (scoped) => scoped),
      ).rejects.toThrow('raw error');
    });
  });

  describe('passthrough strategy', () => {
    it('should return original base for object permeator', async () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, added: true })),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const composed = new Permeator(before, after, {
        strategy: 'passthrough',
      });
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

      const composed = new Permeator(before, after, {
        strategy: 'passthrough',
      });
      const original = [{ id: 1 }, { id: 2 }];

      const result = await composed.permeate(original, async (scoped: any) => {
        expect(scoped).toEqual([{ id: 99 }, { id: 2 }]);
        return scoped;
      });

      expect(result).toBe(original);
    });
  });

  describe('scalar permeation', () => {
    it('should return original for string passthrough', async () => {
      const before = new ScalarMembrane(async (base: string) =>
        base.toUpperCase(),
      );
      const after = new ScalarMembrane(async (base: string) => base);

      const composed = new Permeator(before, after, {
        strategy: 'passthrough',
      });

      const result = await composed.permeate('hello', async (scoped: any) => {
        expect(scoped).toBe('HELLO');
        return scoped;
      });

      expect(result).toBe('hello');
    });

    it('should return original for number passthrough', async () => {
      const before = new ScalarMembrane(async (base: number) => base * 2);
      const after = new ScalarMembrane(async (base: number) => base);

      const composed = new Permeator(before, after, {
        strategy: 'passthrough',
      });

      const result = await composed.permeate(42, async (scoped: any) => {
        expect(scoped).toBe(84);
        return scoped;
      });

      expect(result).toBe(42);
    });

    it('should return pipeline result without passthrough', async () => {
      const before = new ScalarMembrane(
        async (base: string) => `${base}-suffix`,
      );
      const after = new ScalarMembrane(async (base: string) => base);

      const composed = new Permeator(before, after);

      const result = await composed.permeate(
        'hello',
        async (scoped: any) => scoped,
      );

      expect(result).toBe('hello-suffix');
    });

    it('should not apply scalar logic to object base', async () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, added: true })),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const composed = new Permeator(before, after);

      const result = await composed.permeate(
        { name: 'test' },
        async (scoped) => scoped,
      );

      expect(result).toEqual({ name: 'test', added: true });
    });
  });

  describe('nullish callback result', () => {
    it('should handle null callback result via output membrane nullish resolution', async () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, postProcessed: true })),
        'overwrite',
      );

      const composed = new Permeator(before, after);
      const result = await composed.permeate({ id: '1' }, async () => null);

      expect(result).toEqual({ postProcessed: true });
    });

    it('should handle undefined callback result via output membrane nullish resolution', async () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, postProcessed: true })),
        'overwrite',
      );

      const composed = new Permeator(before, after);
      const result = await composed.permeate(
        { id: '1' },
        async () => undefined,
      );

      expect(result).toEqual({ postProcessed: true });
    });
  });

  describe('ambient threading', () => {
    it('should thread ambient through before and after', async () => {
      const beforeCb = cb(async (base: any) => base);
      const afterCb = cb(async (base: any) => base);

      const composed = new Permeator(
        new ObjectMembrane(beforeCb, 'overwrite'),
        new ObjectMembrane(afterCb, 'overwrite'),
      );

      const ambient = { tenant: 'acme' };

      await composed.permeate(
        { name: 'input' },
        async (scoped) => scoped,
        ambient,
      );

      expect(beforeCb).toHaveBeenCalledWith({ name: 'input' }, ambient);
      expect(afterCb).toHaveBeenCalledWith({ name: 'input' }, ambient);
    });
  });
});
