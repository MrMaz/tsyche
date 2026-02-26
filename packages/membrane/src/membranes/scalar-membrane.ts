import {
  PlainLiteralObject,
  IMembrane,
  ScalarMergeStrategy,
} from '../membrane.types';

/**
 * Primitive membrane for string, number, or boolean values.
 * Callback produces the full replacement value.
 */
export class ScalarMembrane<
  TBase extends string | number | boolean,
  TPermeate extends TBase = TBase,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly callback: (
      base: TBase,
      ambient?: TAmbient,
    ) => Promise<TPermeate>,
    public readonly strategy: ScalarMergeStrategy = 'passthrough',
  ) {}

  async diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate> {
    return await this.callback(base, ambient);
  }
}
