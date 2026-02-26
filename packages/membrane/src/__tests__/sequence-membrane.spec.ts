import { PermeateCallback } from '../membrane.types';
import { ObjectMembrane } from '../membranes/object-membrane';
import { SequenceMembrane } from '../membranes/sequence-membrane';

const cb = (fn: (...args: any[]) => any) =>
  jest.fn(fn) as unknown as jest.Mock & PermeateCallback;

describe('SequenceMembrane', () => {
  it('should delegate to single membrane', async () => {
    const callback = cb(async (base: any) => ({
      ...base,
      step: 1,
    }));
    const membrane = new ObjectMembrane(callback, 'overwrite');

    const seq = new SequenceMembrane(membrane, []);
    const result = await seq.diffuse({ name: 'test' });

    expect(result).toEqual({ name: 'test', step: 1 });
  });

  it('should run membranes left-to-right, piping output', async () => {
    const first = new ObjectMembrane(
      cb(async (base: any) => ({ ...base, first: true })),
      'overwrite',
    );
    const second = new ObjectMembrane(
      cb(async (base: any) => ({ ...base, second: true })),
      'overwrite',
    );

    const seq = new SequenceMembrane(first, [second]);
    const result = await seq.diffuse({ name: 'test' });

    expect(result).toEqual({ name: 'test', first: true, second: true });
  });

  it('should thread ambient through all membranes', async () => {
    const cb1 = cb(async (base: any) => base);
    const cb2 = cb(async (base: any) => base);

    const seq = new SequenceMembrane(new ObjectMembrane(cb1, 'overwrite'), [
      new ObjectMembrane(cb2, 'overwrite'),
    ]);

    const ambient = { tenant: 'acme' };
    await seq.diffuse({ name: 'test' }, ambient);

    expect(cb1).toHaveBeenCalledWith({ name: 'test' }, ambient);
    expect(cb2).toHaveBeenCalledWith({ name: 'test' }, ambient);
  });
});
