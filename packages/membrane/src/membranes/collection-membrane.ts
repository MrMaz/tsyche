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
    public readonly strategy: CollectionMergeStrategy = 'append',
  ) {}

  nullish(value: TItem[] | null | undefined): TItem[] {
    if (value !== null && value !== undefined) return value;
    return [];
  }

  async diffuse(
    base: TItem[] | null | undefined,
    ambient?: TAmbient,
  ): Promise<TItem[]> {
    const resolved = this.nullish(base);
    const permeate = await this.callback(resolved, ambient);

    if (this.strategy === 'append' && Array.isArray(resolved)) {
      return [...resolved, ...permeate];
    }

    return permeate;
  }
}
