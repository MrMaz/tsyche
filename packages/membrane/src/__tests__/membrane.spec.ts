import { ImmutablePermeator } from '../immutable-permeator';
import { Membrane } from '../membrane';
import { PermeateCallback } from '../membrane.types';
import { CollectionMembrane } from '../membranes/collection-membrane';
import { ObjectMembrane } from '../membranes/object-membrane';
import { ObjectProjectionMembrane } from '../membranes/object-projection-membrane';
import { ProxyMembrane } from '../membranes/proxy-membrane';
import { ScalarMembrane } from '../membranes/scalar-membrane';
import { SequenceMembrane } from '../membranes/sequence-membrane';
import { StreamMembrane } from '../membranes/stream-membrane';
import { Permeator } from '../permeator';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('Membrane factory', () => {
  describe('.object()', () => {
    it('should return an ObjectMembrane instance', () => {
      const membrane = Membrane.object(
        cb(async (base: any) => base),
        'overwrite',
      );

      expect(membrane).toBeInstanceOf(ObjectMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.object(
        cb(async (base: any) => ({ ...base, extra: true })),
        'overwrite',
      );
      const result = await membrane.diffuse({ name: 'test' });

      expect(result).toEqual({ name: 'test', extra: true });
    });
  });

  describe('.collection()', () => {
    it('should return a CollectionMembrane instance', () => {
      const membrane = Membrane.collection(
        cb(async (base: any) => base),
        'overwrite',
      );

      expect(membrane).toBeInstanceOf(CollectionMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.collection(
        cb(async () => [{ id: 3 }]),
        'append',
      );
      const result = await membrane.diffuse([{ id: 1 }, { id: 2 }]);

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });

  describe('.sequence()', () => {
    it('should return a SequenceMembrane instance', () => {
      const first = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const membrane = Membrane.sequence(first);

      expect(membrane).toBeInstanceOf(SequenceMembrane);
    });

    it('should sequence multiple membranes', async () => {
      const first = Membrane.object(
        cb(async (base: any) => ({ ...base, first: true })),
        'overwrite',
      );
      const second = Membrane.object(
        cb(async (base: any) => ({ ...base, second: true })),
        'overwrite',
      );

      const seq = Membrane.sequence(first, second);
      const result = await seq.diffuse({ name: 'test' });

      expect(result).toEqual({ name: 'test', first: true, second: true });
    });
  });

  describe('.objectProjection()', () => {
    it('should return an ObjectProjectionMembrane instance', () => {
      const membrane = Membrane.objectProjection(
        cb(async (base: any) => ({ id: base.id })),
      );

      expect(membrane).toBeInstanceOf(ObjectProjectionMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.objectProjection(
        cb(async (base: any) => ({ id: base.id })),
      );
      const result = await membrane.diffuse({
        id: '1',
        name: 'John',
        password: 'hash',
      });

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('.proxy()', () => {
    it('should return a ProxyMembrane instance', () => {
      const membrane = Membrane.proxy(cb(async (base: any) => base));

      expect(membrane).toBeInstanceOf(ProxyMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.proxy(
        cb(async (base: any) => ({ ...base, extra: true })),
      );
      const result = await membrane.diffuse({ name: 'test' });

      expect((result as any).name).toBe('test');
      expect((result as any).extra).toBe(true);
    });
  });

  describe('.scalar()', () => {
    it('should return a ScalarMembrane instance', () => {
      const membrane = Membrane.scalar(async (base: string) => base);

      expect(membrane).toBeInstanceOf(ScalarMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.scalar(async (base: string) =>
        base.toUpperCase(),
      );
      const result = await membrane.diffuse('hello');

      expect(result).toBe('HELLO');
    });
  });

  describe('.stream()', () => {
    it('should return a StreamMembrane instance', () => {
      const membrane = Membrane.stream(cb(async (base: any) => base));

      expect(membrane).toBeInstanceOf(StreamMembrane);
    });

    it('should diffuse correctly', async () => {
      const membrane = Membrane.stream(
        cb(async (base: any) => ({ ...base, extra: true })),
      );

      async function* source() {
        yield { id: 1 };
        yield { id: 2 };
      }

      const result = await membrane.diffuse(source());
      const items = [];
      for await (const item of result) {
        items.push(item);
      }

      expect(items).toEqual([
        { id: 1, extra: true },
        { id: 2, extra: true },
      ]);
    });
  });

  describe('.permeate()', () => {
    it('should return a Permeator instance', () => {
      const before = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const after = new ObjectMembrane(
        cb(async (base: any) => base),
        'overwrite',
      );
      const membrane = Membrane.mutable(before, after);

      expect(membrane).toBeInstanceOf(Permeator);
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

      const composed = Membrane.mutable(before, after);
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
      const membrane = Membrane.immutable(before, after);

      expect(membrane).toBeInstanceOf(ImmutablePermeator);
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

      const composed = Membrane.immutable(before, after);
      const original = { name: 'input' };
      const result = await composed.permeate(original, async (scoped) => ({
        ...scoped,
        fromDb: true,
      }));

      expect(result).toBe(original);
    });
  });
});
