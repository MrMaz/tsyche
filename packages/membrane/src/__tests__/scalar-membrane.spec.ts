import { ScalarMembrane } from '../membranes/scalar-membrane';

describe('ScalarMembrane', () => {
  it('should return permeate for string base', async () => {
    const callback = jest.fn(async (base: string) => `${base}-permeated`);
    const membrane = new ScalarMembrane(callback);
    const result = await membrane.diffuse('hello');

    expect(result).toBe('hello-permeated');
  });

  it('should return permeate for number base', async () => {
    const callback = jest.fn(async (base: number) => base * 2);
    const membrane = new ScalarMembrane(callback);
    const result = await membrane.diffuse(5);

    expect(result).toBe(10);
  });

  it('should return permeate for boolean base', async () => {
    const callback = jest.fn(async (base: boolean) => !base);
    const membrane = new ScalarMembrane(callback);
    const result = await membrane.diffuse(true);

    expect(result).toBe(false);
  });

  it('should accept a callback', () => {
    const callback = jest.fn(async (base: string) => base);
    const membrane = new ScalarMembrane(callback);

    expect(membrane).toBeInstanceOf(ScalarMembrane);
  });

  describe('nullish resolution', () => {
    it('should resolve null base and let callback handle it', async () => {
      const callback = jest.fn(async () => 'fallback');
      const membrane = new ScalarMembrane(callback);
      const result = await membrane.diffuse(null);

      expect(result).toBe('fallback');
    });

    it('should resolve undefined base and let callback handle it', async () => {
      const callback = jest.fn(async () => 42);
      const membrane = new ScalarMembrane(callback);
      const result = await membrane.diffuse(undefined);

      expect(result).toBe(42);
    });

    it('should pass non-null base through unchanged', () => {
      const callback = jest.fn(async (base: string) => base);
      const membrane = new ScalarMembrane(callback);

      expect(membrane.nullish('hello')).toBe('hello');
    });
  });

  describe('ambient threading', () => {
    it('should pass ambient to callback', async () => {
      const callback = jest.fn(async (base: string) => base);
      const membrane = new ScalarMembrane(callback);
      const ambient = { tenant: 'acme' };
      await membrane.diffuse('test', ambient);

      expect(callback).toHaveBeenCalledWith('test', ambient);
    });
  });
});
