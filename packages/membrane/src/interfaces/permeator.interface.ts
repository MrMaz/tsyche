import { PlainLiteralObject } from '../membrane.types';

/**
 * Orchestrates input → callback → output membrane pipeline.
 * Pre-built and reusable; ambient is passed per-call.
 */
export interface IPermeator<
  TInput,
  TOutput,
  TPermeateIn = unknown,
  TPermeateOut = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> {
  permeate(
    base: TInput,
    callback: (
      permeate: TInput & TPermeateIn,
    ) => Promise<TOutput | null | undefined>,
    ambient?: TAmbient,
  ): Promise<(TOutput & TPermeateOut) | TInput>;
}
