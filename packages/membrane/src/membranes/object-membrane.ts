import {
  PlainLiteralObject,
  PermeateCallback,
  ObjectMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Additive membrane: enriches base with permeate data.
 * `preserve` = base wins, `overwrite` = callback result used directly.
 */
export class ObjectMembrane<
  TBase extends object,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly callback: PermeateCallback<TPermeate, TAmbient>,
    public readonly strategy: ObjectMergeStrategy = 'preserve',
  ) {}

  async diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate> {
    const permeate = await this.callback(base, ambient);

    if (this.strategy === 'preserve') {
      return Object.assign(
        Object.create(Object.getPrototypeOf(base)),
        permeate,
        base,
      );
    }

    return permeate;
  }
}
