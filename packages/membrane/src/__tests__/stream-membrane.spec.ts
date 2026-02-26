import { PermeateCallback } from '../membrane.types';
import { StreamMembrane } from '../membranes/stream-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

async function* toAsync<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) {
    result.push(item);
  }
  return result;
}

describe('StreamMembrane', () => {
  describe('preserve strategy', () => {
    it('should transform each chunk through the callback', async () => {
      const callback = cb(async (chunk: any) => ({
        ...chunk,
        processed: true,
      }));

      const membrane = new StreamMembrane(callback, 'preserve');
      const input = toAsync([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([
        { id: 1, processed: true },
        { id: 2, processed: true },
        { id: 3, processed: true },
      ]);
    });

    it('should preserve chunk values over permeate on conflict', async () => {
      const callback = cb(async (chunk: any) => ({
        ...chunk,
        id: 999,
        extra: true,
      }));

      const membrane = new StreamMembrane(callback, 'preserve');
      const input = toAsync([{ id: 1 }, { id: 2 }]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([
        { id: 1, extra: true },
        { id: 2, extra: true },
      ]);
    });

    it('should handle empty async iterables', async () => {
      const callback = cb(async (chunk: any) => chunk);

      const membrane = new StreamMembrane(callback, 'preserve');
      const input = toAsync([]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([]);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('overwrite strategy', () => {
    it('should transform each chunk through the callback', async () => {
      const callback = cb(async (chunk: any) => ({
        ...chunk,
        processed: true,
      }));

      const membrane = new StreamMembrane(callback, 'overwrite');
      const input = toAsync([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([
        { id: 1, processed: true },
        { id: 2, processed: true },
        { id: 3, processed: true },
      ]);
    });

    it('should let permeate win over chunk on conflict', async () => {
      const callback = cb(async () => ({
        id: 999,
        extra: true,
      }));

      const membrane = new StreamMembrane(callback, 'overwrite');
      const input = toAsync([{ id: 1 }, { id: 2 }]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([
        { id: 999, extra: true },
        { id: 999, extra: true },
      ]);
    });

    it('should handle empty async iterables', async () => {
      const callback = cb(async (chunk: any) => chunk);

      const membrane = new StreamMembrane(callback, 'overwrite');
      const input = toAsync([]);
      const output = await membrane.diffuse(input);
      const result = await collect(output);

      expect(result).toEqual([]);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback for each chunk', async () => {
      const callback = cb(async (chunk: any) => chunk);

      const membrane = new StreamMembrane(callback, 'preserve');
      const ambient = { tenant: 'acme' };
      const input = toAsync([{ id: 1 }, { id: 2 }]);
      const output = await membrane.diffuse(input, ambient);
      await collect(output);

      expect(callback).toHaveBeenCalledWith({ id: 1 }, ambient);
      expect(callback).toHaveBeenCalledWith({ id: 2 }, ambient);
    });
  });
});
