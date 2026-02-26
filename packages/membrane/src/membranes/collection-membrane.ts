import {
  PlainLiteralObject,
  PermeateCallback,
  CollectionMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Array membrane.
 * `append` concatenates [...base, ...permeate];
 * `overwrite` replaces the array.
 */
export class CollectionMembrane<
  TItem,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TItem[], unknown, TAmbient> {
  constructor(
    private readonly callback: PermeateCallback<unknown, TAmbient>,
    public readonly strategy: CollectionMergeStrategy,
  ) {}

  async diffuse(base: TItem[], ambient?: TAmbient): Promise<TItem[]> {
    const permeate = await this.callback(base, ambient);

    if (this.strategy === 'append' && Array.isArray(base)) {
      return [...base, ...permeate];
    }

    return permeate;
  }
}
