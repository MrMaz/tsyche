import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';
import { NullableMembrane } from '../membranes/nullable-membrane';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ScalarMembrane } from '../membranes/scalar-membrane';
import { StreamMembrane } from '../membranes/stream-membrane';
import { MutablePermeator } from '../permeators/mutable-permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('NullableMembrane', () => {
  describe('object membrane', () => {
    it('should return null when base is null and callback does not augment', async () => {
      const inner = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toBeNull();
    });

    it('should return enriched result when base is null and callback augments', async () => {
      const inner = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, added: true })),
        'overwrite',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toEqual({ added: true });
    });

    it('should return null when base is undefined and callback does not augment', async () => {
      const inner = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(undefined);

      expect(result).toBeNull();
    });

    it('should delegate to inner when base is non-null', async () => {
      const inner = new ObjectMembrane(
        cb(async (base: any) => ({ ...base, extra: true })),
        'overwrite',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse({ name: 'Alice' });

      expect(result).toEqual({ name: 'Alice', extra: true });
    });

    it('should return enriched result with preserve strategy', async () => {
      const inner = new ObjectMembrane(cb(async () => ({ enriched: true })));
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toEqual({ enriched: true });
    });
  });

  describe('collection membrane', () => {
    it('should return null when base is null and callback produces empty array', async () => {
      const inner = new CollectionMembrane(
        cb(async () => []),
        'append',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toBeNull();
    });

    it('should return array when base is null and callback produces items', async () => {
      const inner = new CollectionMembrane(
        cb(async () => [{ id: 1 }]),
        'append',
      );
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('stream membrane', () => {
    it('should treat async iterable result as non-empty even from null base', async () => {
      const inner = new StreamMembrane(cb(async (chunk: any) => chunk));
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).not.toBeNull();
    });
  });

  describe('scalar membrane', () => {
    it('should return null when scalar nullish resolves to empty object', async () => {
      const inner = new ScalarMembrane(async (base: string) => base);
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toBeNull();
    });

    it('should treat primitive result as non-empty', async () => {
      const inner = new ScalarMembrane(async () => 42 as unknown as number);
      const nullable = new NullableMembrane(inner);

      const result = await nullable.diffuse(null);

      expect(result).toBe(42);
    });
  });

  describe('nullish()', () => {
    it('should delegate to inner membrane', () => {
      const inner = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const nullable = new NullableMembrane(inner);

      const resolved = nullable.nullish(null);

      expect(Object.keys(resolved)).toHaveLength(0);
    });
  });

  describe('as Permeator output', () => {
    it('should return null when callback returns null and output does not augment', async () => {
      const input = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const output = new NullableMembrane(
        new ObjectMembrane(
          cb(async (base: any) => base),
          'overwrite',
        ),
      );

      const permeator = new MutablePermeator(input, output);
      const result = await permeator.permeate({ id: '1' }, async () => null);

      expect(result).toBeNull();
    });

    it('should return enriched result when callback returns null but output augments', async () => {
      const input = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const output = new NullableMembrane(
        new ObjectMembrane(
          cb(async (base: any) => ({ ...base, notFound: true })),
          'overwrite',
        ),
      );

      const permeator = new MutablePermeator(input, output);
      const result = await permeator.permeate({ id: '1' }, async () => null);

      expect(result).toEqual({ notFound: true });
    });

    it('should return normal result when callback returns non-null', async () => {
      const input = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const output = new NullableMembrane(
        new ObjectMembrane(
          cb(async (base: any) => ({ ...base, post: true })),
          'overwrite',
        ),
      );

      const permeator = new MutablePermeator(input, output);
      const result = await permeator.permeate({ id: '1' }, async (scoped) => ({
        ...scoped,
        fromDb: true,
      }));

      expect(result).toEqual({ id: '1', fromDb: true, post: true });
    });

    it('should return null when callback returns undefined and output does not augment', async () => {
      const input = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const output = new NullableMembrane(
        new ObjectMembrane(
          cb(async (base: any) => base),
          'overwrite',
        ),
      );

      const permeator = new MutablePermeator(input, output);
      const result = await permeator.permeate(
        { id: '1' },
        async () => undefined,
      );

      expect(result).toBeNull();
    });

    it('should propagate errors through onError handler', async () => {
      const input = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const output = new NullableMembrane(
        new ObjectMembrane(
          cb(async (base: any) => base),
          'overwrite',
        ),
      );

      const onError = jest.fn((error: unknown): never => {
        throw error;
      });

      const permeator = new MutablePermeator(input, output, { onError });

      await expect(
        permeator.permeate({ id: '1' }, async () => {
          throw new Error('callback failed');
        }),
      ).rejects.toThrow('callback failed');

      expect(onError).toHaveBeenCalled();
    });

    it('should thread ambient through the pipeline', async () => {
      const inputCb = cb(async (base: any) => base);
      const outputCb = cb(async (base: any) => base);

      const input = new ObjectMembrane(inputCb, 'overwrite');
      const output = new NullableMembrane(
        new ObjectMembrane(outputCb, 'overwrite'),
      );

      const permeator = new MutablePermeator(input, output);
      const ambient = { tenant: 'acme' };

      await permeator.permeate(
        { name: 'input' },
        async (scoped) => scoped,
        ambient,
      );

      expect(inputCb).toHaveBeenCalledWith({ name: 'input' }, ambient);
      expect(outputCb).toHaveBeenCalledWith({ name: 'input' }, ambient);
    });
  });
});
