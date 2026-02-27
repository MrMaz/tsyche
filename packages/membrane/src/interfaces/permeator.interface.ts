import { PlainLiteralObject } from '../membrane.types';

/**
 * Orchestrates input → callback → output membrane pipeline.
 * Pre-built and reusable; ambient is passed per-call.
 *
 * `TResult` defaults to `TOutput & TPermeateOut`. When the output
 * membrane is a `NullableMembrane`, `TResult` includes `| null`.
 */
export interface IPermeator<
  TInput,
  TOutput,
  TPermeateIn = unknown,
  TPermeateOut = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
  TResult = TOutput & TPermeateOut,
> {
  permeate(
    base: TInput,
    callback: (
      permeate: TInput & TPermeateIn,
    ) => Promise<TOutput | null | undefined>,
    ambient?: TAmbient,
  ): Promise<TResult>;
}
