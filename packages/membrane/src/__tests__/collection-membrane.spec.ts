import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('CollectionMembrane', () => {
  describe('overwrite strategy', () => {
    it('should replace array entirely with callback return', async () => {
      const callback = cb(async () => [{ id: 3 }]);

      const membrane = new CollectionMembrane(callback, 'overwrite');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

      expect(result).toEqual([{ id: 3 }]);
    });
  });

  describe('append strategy', () => {
    it('should append callback-returned items onto original array', async () => {
      const callback = cb(async () => [{ id: 3 }]);

      const membrane = new CollectionMembrane(callback, 'append');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should fall back to overwrite for non-array base', async () => {
      const callback = cb(async () => 'replaced');

      const membrane = new CollectionMembrane(callback, 'append');
      const result = await membrane.diffuse('not-an-array' as any);

      expect(result).toBe('replaced');
    });
  });

  describe('passthrough strategy', () => {
    it('should return callback result from diffuse', async () => {
      const callback = cb(async () => [{ id: 99 }]);

      const membrane = new CollectionMembrane(callback, 'passthrough');
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

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
