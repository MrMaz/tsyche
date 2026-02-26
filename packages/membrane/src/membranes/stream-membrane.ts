import {
  PlainLiteralObject,
  PermeateCallback,
  StreamMergeStrategy,
  IMembrane,
} from '../membrane.types';

/**
 * Processes each chunk of an AsyncIterable through the
 * callback individually. Merge strategy controls conflict
 * resolution per chunk.
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
    public readonly strategy: StreamMergeStrategy = 'preserve',
  ) {}

  async diffuse(
    base: AsyncIterable<TItem>,
    ambient?: TAmbient,
  ): Promise<AsyncIterable<TItem & TPermeate>> {
    const callback = this.callback;
    const preserve = this.strategy === 'preserve';

    return (async function* () {
      for await (const chunk of base) {
        const permeate = await callback(chunk, ambient);
        yield preserve
          ? Object.assign(Object.create(null), permeate, chunk)
          : Object.assign(Object.create(null), chunk, permeate);
      }
    })();
  }
}
