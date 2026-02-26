import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('CollectionMembrane', () => {
  describe('overwrite strategy', () => {
    it('should replace base at each index with permeate', async () => {
      const callback = cb(async () => [{ id: 10 }, { id: 20 }]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }, { id: 3 }]);

      expect(result).toEqual([{ id: 10 }, { id: 20 }, { id: 3 }]);
    });

    it('should extend result when permeate is longer than base', async () => {
      const callback = cb(async () => [{ id: 10 }, { id: 20 }, { id: 30 }]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse([{ id: 1 }]);

      expect(result).toEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);
    });

    it('should fill remaining from base when permeate is shorter', async () => {
      const callback = cb(async () => [{ id: 10 }]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }, { id: 3 }]);

      expect(result).toEqual([{ id: 10 }, { id: 2 }, { id: 3 }]);
    });

    it('should handle sparse permeate array', async () => {
      // eslint-disable-next-line no-sparse-arrays
      const callback = cb(async () => [, 'b', ,]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse(['a', 'x', 'c']);

      expect(result[0]).toBe('a');
      expect(result[1]).toBe('b');
      expect(result[2]).toBe('c');
    });

    it('should handle sparse base array', async () => {
      const callback = cb(async () => ['x', 'y', 'z']);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      // eslint-disable-next-line no-sparse-arrays
      const result = await membrane.diffuse(['a', , 'c']);

      expect(result).toEqual(['x', 'y', 'z']);
    });
  });

  describe('preserve strategy', () => {
    it('should keep base at each index over permeate', async () => {
      const callback = cb(async () => [{ id: 10 }, { id: 20 }]);

      const membrane = new CollectionMembrane(callback, 'preserve');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }, { id: 3 }]);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should fill remaining from permeate when base is shorter', async () => {
      const callback = cb(async () => [{ id: 10 }, { id: 20 }, { id: 30 }]);

      const membrane = new CollectionMembrane(callback, 'preserve');
      const result = await membrane.diffuse([{ id: 1 }]);

      expect(result).toEqual([{ id: 1 }, { id: 20 }, { id: 30 }]);
    });

    it('should handle sparse base array by filling from permeate', async () => {
      const callback = cb(async () => ['x', 'y', 'z']);

      const membrane = new CollectionMembrane(callback, 'preserve');
      // eslint-disable-next-line no-sparse-arrays
      const result = await membrane.diffuse(['a', , 'c']);

      expect(result[0]).toBe('a');
      expect(result[1]).toBe('y');
      expect(result[2]).toBe('c');
    });
  });

  describe('append strategy', () => {
    it('should concatenate permeate onto base', async () => {
      const callback = cb(async () => [{ id: 3 }]);

      const membrane = new CollectionMembrane(callback, 'append');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });

  describe('default strategy', () => {
    it('should default to append', async () => {
      const callback = cb(async () => [{ id: 3 }]);

      const membrane = new CollectionMembrane(callback);
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

      expect(membrane.strategy).toBe('append');
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });

  describe('nullish resolution', () => {
    it('should resolve null base to empty array', async () => {
      const callback = cb(async () => [{ id: 1 }]);

      const membrane = new CollectionMembrane(callback, 'append');
      const result = await membrane.diffuse(null);

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should resolve undefined base to empty array', async () => {
      const callback = cb(async () => [{ id: 1 }]);

      const membrane = new CollectionMembrane(callback, 'append');
      const result = await membrane.diffuse(undefined);

      expect(result).toEqual([{ id: 1 }]);
    });

    it('should pass non-null base through unchanged', () => {
      const membrane = new CollectionMembrane(cb(async (base: any) => base));

      expect(membrane.nullish([1, 2])).toEqual([1, 2]);
    });

    it('should overwrite null base with callback result', async () => {
      const callback = cb(async () => [{ id: 99 }]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse(null);

      expect(result).toEqual([{ id: 99 }]);
    });
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback when provided', async () => {
      const callback = cb(async (base: any) => base);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const ambient = { tenant: 'acme' };
      await membrane.diffuse([1, 2], ambient);

      expect(callback).toHaveBeenCalledWith([1, 2], ambient);
    });

    it('should pass undefined ambient when not provided', async () => {
      const callback = cb(async (base: any) => base);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      await membrane.diffuse([1, 2]);

      expect(callback).toHaveBeenCalledWith([1, 2], undefined);
    });
  });
});
