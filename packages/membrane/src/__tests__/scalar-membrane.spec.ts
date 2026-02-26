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

  it('should default strategy to passthrough', () => {
    const callback = jest.fn(async (base: string) => base);
    const membrane = new ScalarMembrane(callback);

    expect(membrane.strategy).toBe('passthrough');
  });

  it('should accept explicit strategy', () => {
    const callback = jest.fn(async (base: string) => base);
    const membrane = new ScalarMembrane(callback, 'append');

    expect(membrane.strategy).toBe('append');
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
