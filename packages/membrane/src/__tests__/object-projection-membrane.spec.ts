import { PermeateCallback } from '../membrane.types';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ObjectProjectionMembrane } from '../membranes/object-projection-membrane';
import { ImmutablePermeator } from '../permeators/immutable-permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('ObjectProjectionMembrane', () => {
  describe('preserve strategy (default)', () => {
    it('should return only projected keys from base', async () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => ({ id: base.id, email: base.email })),
      );

      const result = await membrane.diffuse({
        id: '1',
        name: 'John',
        email: 'j@test.com',
        password: 'hash',
      });

      expect(result).toEqual({ id: '1', email: 'j@test.com' });
    });

    it('should use base values on conflict', async () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => ({
          id: base.id,
          email: 'overridden@test.com',
        })),
      );

      const result = await membrane.diffuse({
        id: '1',
        name: 'John',
        email: 'j@test.com',
      });

      expect(result).toEqual({ id: '1', email: 'j@test.com' });
    });

    it('should include permeate keys not in base', async () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => ({
          id: base.id,
          computed: 'extra',
        })),
      );

      const result = await membrane.diffuse({ id: '1', name: 'John' });

      expect(result).toEqual({ id: '1', computed: 'extra' });
    });

    it('should default to preserve', () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => base),
      );

      expect(membrane.strategy).toBe('preserve');
    });
  });

  describe('overwrite strategy', () => {
    it('should use permeate values on conflict', async () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => ({
          id: base.id,
          email: 'overridden@test.com',
        })),
        'overwrite',
      );

      const result = await membrane.diffuse({
        id: '1',
        name: 'John',
        email: 'j@test.com',
      });

      expect(result).toEqual({ id: '1', email: 'overridden@test.com' });
    });

    it('should still exclude base-only keys', async () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => ({ id: base.id })),
        'overwrite',
      );

      const result = await membrane.diffuse({
        id: '1',
        name: 'John',
        password: 'hash',
      });

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('with Permeator', () => {
    it('should return original base when permeator is passthrough', async () => {
      const before = new ObjectProjectionMembrane(
        cb(async (base: any) => ({ id: base.id })),
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );

      const composed = new ImmutablePermeator(before, after);
      const original = { id: '1', name: 'John', email: 'j@test.com' };

      const result = await composed.permeate(original, async (scoped: any) => {
        expect(scoped).toEqual({ id: '1' });
        return scoped;
      });

      expect(result).toBe(original);
    });
  });

  describe('nullish resolution', () => {
    it('should resolve null base to empty object', async () => {
      const callback = cb(async (base: any) => ({
        id: base.id ?? 'default',
      }));

      const membrane = new ObjectProjectionMembrane(callback);
      const result = await membrane.diffuse(null);

      expect(result).toEqual({ id: 'default' });
    });

    it('should resolve undefined base to empty object', async () => {
      const callback = cb(async (base: any) => ({
        id: base.id ?? 'default',
      }));

      const membrane = new ObjectProjectionMembrane(callback);
      const result = await membrane.diffuse(undefined);

      expect(result).toEqual({ id: 'default' });
    });

    it('should pass non-null base through unchanged', () => {
      const membrane = new ObjectProjectionMembrane(
        cb(async (base: any) => base),
      );

      expect(membrane.nullish({ id: '1' })).toEqual({ id: '1' });
    });
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback', async () => {
      const callback = cb(async (base: any) => ({ id: base.id }));
      const membrane = new ObjectProjectionMembrane(callback);
      const ambient = { tenant: 'acme' };

      await membrane.diffuse({ id: '1', name: 'John' }, ambient);

      expect(callback).toHaveBeenCalledWith({ id: '1', name: 'John' }, ambient);
    });
  });
});
