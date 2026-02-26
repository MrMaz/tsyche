import {
  PlainLiteralObject,
  PermeateCallback,
  CollectionMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Array membrane.
 * `overwrite`: permeate wins at each index, base fills remaining;
 * `preserve`: base wins at each index, permeate fills remaining;
 * `append`: concatenates [...base, ...permeate].
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

    if (this.strategy === 'append') {
      return [...resolved, ...permeate];
    }

    const maxLen = Math.max(resolved.length, permeate.length);
    const result: TItem[] = new Array(maxLen);

    for (let i = 0; i < maxLen; i++) {
      if (this.strategy === 'overwrite') {
        if (i in permeate) {
          result[i] = permeate[i];
        } else if (i in resolved) {
          result[i] = resolved[i];
        }
      } else {
        if (i in resolved) {
          result[i] = resolved[i];
        } else if (i in permeate) {
          result[i] = permeate[i];
        }
      }
    }

    return result;
  }
}
