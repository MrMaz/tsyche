import { PermeateCallback } from '../membrane.types';
import { ObjectMembrane } from '../membranes/object-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('ObjectMembrane', () => {
  describe('overwrite strategy', () => {
    it('should replace base with callback return', async () => {
      const callback = cb(async (base: any) => ({
        ...base,
        name: 'overwritten',
      }));

      const membrane = new ObjectMembrane(callback, 'overwrite');
      const result = await membrane.diffuse({ name: 'original', age: 30 });

      expect(result).toEqual({ name: 'overwritten', age: 30 });
    });

    it('should allow callback to remove fields', async () => {
      const callback = cb(async () => ({ name: 'only-name' }));

      const membrane = new ObjectMembrane(callback, 'overwrite');
      const result = await membrane.diffuse({ name: 'original', age: 30 });

      expect(result).toEqual({ name: 'only-name' });
    });
  });

  describe('preserve strategy', () => {
    it('should preserve base data over permeate modifications', async () => {
      const callback = cb(async (base: any) => ({
        ...base,
        name: 'hook-tried-to-change',
      }));

      const membrane = new ObjectMembrane(callback, 'preserve');
      const result = await membrane.diffuse({ name: 'original', age: 30 });

      expect(result).toEqual({ name: 'original', age: 30 });
    });

    it('should allow callback to add new fields', async () => {
      const callback = cb(async (base: any) => ({
        ...base,
        addedByHook: true,
      }));

      const membrane = new ObjectMembrane(callback, 'preserve');
      const result = await membrane.diffuse({ name: 'original' });

      expect(result).toEqual({ name: 'original', addedByHook: true });
    });
  });

  describe('passthrough strategy', () => {
    it('should return callback result from diffuse', async () => {
      const callback = cb(async (base: any) => ({
        ...base,
        added: true,
      }));

      const membrane = new ObjectMembrane(callback, 'passthrough');
      const result = await membrane.diffuse({ name: 'Alice' });

      expect(result).toEqual({ name: 'Alice', added: true });
    });
  });

  describe('default strategy', () => {
    it('should default to preserve', async () => {
      const callback = cb(async (base: any) => ({
        ...base,
        name: 'should-not-win',
        extra: true,
      }));

      const membrane = new ObjectMembrane(callback);
      const result = await membrane.diffuse({ name: 'original' });

      expect(membrane.strategy).toBe('preserve');
      expect(result).toEqual({ name: 'original', extra: true });
    });
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback when provided', async () => {
      const callback = cb(async (base: any) => base);

      const membrane = new ObjectMembrane(callback, 'overwrite');
      const ambient = { tenant: 'acme' };
      await membrane.diffuse({ name: 'test' }, ambient);

      expect(callback).toHaveBeenCalledWith({ name: 'test' }, ambient);
    });

    it('should pass undefined ambient when not provided', async () => {
      const callback = cb(async (base: any) => base);

      const membrane = new ObjectMembrane(callback, 'overwrite');
      await membrane.diffuse({ name: 'test' });

      expect(callback).toHaveBeenCalledWith({ name: 'test' }, undefined);
    });
  });
});
