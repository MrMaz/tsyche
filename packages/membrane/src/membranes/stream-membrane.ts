import {
  PlainLiteralObject,
  PermeateCallback,
  IMembrane,
} from '../membrane.types';

/**
 * Processes each chunk of an AsyncIterable through the
 * callback individually. Chunk properties win over permeate
 * on conflict.
 */
export class StreamMembrane<
  TItem,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<
  AsyncIterable<TItem>,
  AsyncIterable<TItem & TPermeate>,
  TAmbient
> {
  constructor(
    private readonly callback: PermeateCallback<TPermeate, TAmbient>,
  ) {}

  async diffuse(
    base: AsyncIterable<TItem>,
    ambient?: TAmbient,
  ): Promise<AsyncIterable<TItem & TPermeate>> {
    const callback = this.callback;

    return (async function* () {
      for await (const chunk of base) {
        const permeate = await callback(chunk, ambient);
        yield Object.assign(Object.create(null), permeate, chunk);
      }
    })();
  }
}
