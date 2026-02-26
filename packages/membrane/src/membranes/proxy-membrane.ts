import {
  PlainLiteralObject,
  PermeateCallback,
  IMembrane,
} from '../membrane.types';

/**
 * Wraps permeate in a Proxy that falls back to base for
 * missing properties. Permeate shadows base on conflict.
 */
export class ProxyMembrane<
  TBase extends object,
  TPermeate extends object,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly callback: PermeateCallback<TPermeate, TAmbient>,
  ) {}

  async diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate> {
    const permeate = await this.callback(base, ambient);

    return new Proxy(permeate, {
      get(target, prop, receiver) {
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        return Reflect.get(base, prop, receiver);
      },
      has(target, prop) {
        return Reflect.has(target, prop) || Reflect.has(base, prop);
      },
    });
  }
}
