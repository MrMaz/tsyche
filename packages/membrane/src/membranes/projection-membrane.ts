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

  async diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate> {
    return await this.callback(base, ambient);
  }
}
