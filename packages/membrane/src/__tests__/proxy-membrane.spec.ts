import { PermeateCallback } from '../membrane.types';
import { ProxyMembrane } from '../membranes/proxy-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('ProxyMembrane', () => {
  it('should overlay permeate properties via Proxy', async () => {
    const callback = cb(async (base: any) => ({
      ...base,
      extra: true,
    }));

    const membrane = new ProxyMembrane(callback);
    const result = await membrane.diffuse({ name: 'test' });

    expect((result as any).name).toBe('test');
    expect((result as any).extra).toBe(true);
  });

  it('should let permeate win over base for shared keys', async () => {
    const callback = cb(async (base: any) => ({
      ...base,
      name: 'from-permeate',
      added: true,
    }));

    const membrane = new ProxyMembrane(callback);
    const result = await membrane.diffuse({ name: 'original' });

    expect((result as any).name).toBe('from-permeate');
    expect((result as any).added).toBe(true);
  });

  it('should fall back to base for properties not in permeate', async () => {
    const callback = cb(async () => ({ extra: true }));

    const membrane = new ProxyMembrane(callback);
    const result = await membrane.diffuse({ name: 'test', age: 30 });

    expect((result as any).name).toBe('test');
    expect((result as any).age).toBe(30);
    expect((result as any).extra).toBe(true);
  });

  it('should support has trap for both permeate and base keys', async () => {
    const callback = cb(async () => ({ extra: true }));

    const membrane = new ProxyMembrane(callback);
    const result = await membrane.diffuse({ name: 'test' });

    expect('extra' in result).toBe(true);
    expect('name' in result).toBe(true);
    expect('missing' in result).toBe(false);
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback', async () => {
      const callback = cb(async (base: any) => base);

      const membrane = new ProxyMembrane(callback);
      const ambient = { tenant: 'acme' };
      await membrane.diffuse({ name: 'test' }, ambient);

      expect(callback).toHaveBeenCalledWith({ name: 'test' }, ambient);
    });
  });
});
