import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ScalarMembrane } from '../membranes/scalar-membrane';
import { SequenceMembrane } from '../membranes/sequence-membrane';
import { MutablePermeator } from '../permeators/mutable-permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('MutablePermeator', () => {
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

    const composed = new MutablePermeator(before, after);

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

  it('should support mixed membrane types (Object before, Collection after)', async () => {
    const before = new ObjectMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const after = new CollectionMembrane(
      cb(async (base: any) => base),
      'overwrite',
    );

    const composed = new MutablePermeator(before, after);

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

    const composed = new MutablePermeator(beforeSeq, afterSeq);

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

      const composed = new MutablePermeator(before, after, { onError });

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

      const composed = new MutablePermeator(before, after, { onError });

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

      const composed = new MutablePermeator(before, after);

      await expect(
        composed.permeate({ name: 'input' }, async (scoped) => scoped),
      ).rejects.toThrow('raw error');
    });
  });

  describe('scalar permeation', () => {
    it('should return pipeline result', async () => {
      const before = new ScalarMembrane(
        async (base: string) => `${base}-suffix`,
      );
      const after = new ScalarMembrane(async (base: string) => base);

      const composed = new MutablePermeator(before, after);

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

      const composed = new MutablePermeator(before, after);

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

      const composed = new MutablePermeator(before, after);
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

      const composed = new MutablePermeator(before, after);
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

      const composed = new MutablePermeator(
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
