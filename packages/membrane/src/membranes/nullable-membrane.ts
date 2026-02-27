import { PlainLiteralObject, IMembrane } from '../membrane.types';

/**
 * Checks whether a diffuse() result is effectively empty — the
 * product of nullish resolution with no augmentation from the callback.
 * Only called with the return value of inner.diffuse(), which always
 * resolves nullish to a concrete value.
 */
function isEffectivelyEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === 'object' && value !== null) {
    if (Symbol.asyncIterator in value) {
      return false;
    } else {
      return Object.keys(value).length === 0;
    }
  }

  return false;
}

/**
 * Wraps any membrane and returns `null` when a nullish base
 * produces no augmentation. When base is non-null, delegates
 * directly to the inner membrane.
 *
 * Use `Membrane.nullable(membrane)` to create.
 */
export class NullableMembrane<
  TBase,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient, (TBase & TPermeate) | null> {
  constructor(private readonly inner: IMembrane<TBase, TPermeate, TAmbient>) {}

  nullish(value: TBase | null | undefined): TBase {
    return this.inner.nullish(value);
  }

  async diffuse(
    base: TBase | null | undefined,
    ambient?: TAmbient,
  ): Promise<(TBase & TPermeate) | null> {
    if (base !== null && base !== undefined) {
      return this.inner.diffuse(base, ambient);
    }
    const result = await this.inner.diffuse(base, ambient);
    return isEffectivelyEmpty(result) ? null : result;
  }
}
