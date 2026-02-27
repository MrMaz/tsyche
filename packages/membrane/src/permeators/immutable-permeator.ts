import {
  PlainLiteralObject,
  IMembrane,
  PermeatorOptions,
} from '../membrane.types';

import { MutablePermeator } from './mutable-permeator';

/**
 * Runs the full input → callback → output pipeline but always
 * returns the original base unchanged. Use when the pipeline
 * exists for side-effects (validation, enrichment) and the
 * caller needs the original input back.
 */
export class ImmutablePermeator<
  TInput,
  TOutput,
  TPermeateIn = unknown,
  TPermeateOut = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
  TResult = TOutput & TPermeateOut,
> {
  private readonly inner: MutablePermeator<
    TInput,
    TOutput,
    TPermeateIn,
    TPermeateOut,
    TAmbient,
    TResult
  >;

  constructor(
    input: IMembrane<TInput, TPermeateIn, TAmbient>,
    output: IMembrane<TOutput, TPermeateOut, TAmbient, TResult>,
    options?: PermeatorOptions,
  ) {
    this.inner = new MutablePermeator(input, output, options);
  }

  async permeate(
    base: TInput,
    callback: (
      permeate: TInput & TPermeateIn,
    ) => Promise<TOutput | null | undefined>,
    ambient?: TAmbient,
  ): Promise<TInput> {
    await this.inner.permeate(base, callback, ambient);
    return base;
  }
}
