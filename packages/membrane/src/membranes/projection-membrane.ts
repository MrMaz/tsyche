import {
  PlainLiteralObject,
  PermeateCallback,
  IMembrane,
} from '../membrane.types';

/**
 * Subtractive membrane: callback selects a subset from base.
 * Fixed strategy `'passthrough'` signals Permeator to return
 * original base.
 */
export class ProjectionMembrane<
  TBase extends object,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  public readonly strategy = 'passthrough';

  constructor(
    private readonly callback: PermeateCallback<TPermeate, TAmbient>,
  ) {}

  nullish(value: TBase | null | undefined): TBase {
    if (value !== null && value !== undefined) return value;
    return Object.create(null);
  }

  async diffuse(
    base: TBase | null | undefined,
    ambient?: TAmbient,
  ): Promise<TBase & TPermeate> {
    const resolved = this.nullish(base);
    return await this.callback(resolved, ambient);
  }
}
