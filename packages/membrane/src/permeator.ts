import {
  PlainLiteralObject,
  IMembrane,
  PermeatorOptions,
} from './membrane.types';
import { ImmutablePermeator } from './permeators/immutable-permeator';
import { MutablePermeator } from './permeators/mutable-permeator';

/**
 * Static factory for creating permeators.
 */
export class Permeator {
  /**
   * Creates a MutablePermeator wiring input and output membranes into a pipeline.
   * `TResult` is inferred from the output membrane — when the output is
   * a `NullableMembrane`, the return type includes `| null`.
   */
  static mutable<
    TInput,
    TOutput,
    TPermeateIn = unknown,
    TPermeateOut = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
    TResult = TOutput & TPermeateOut,
  >(
    input: IMembrane<TInput, TPermeateIn, TAmbient>,
    output: IMembrane<TOutput, TPermeateOut, TAmbient, TResult>,
    options?: PermeatorOptions,
  ): MutablePermeator<
    TInput,
    TOutput,
    TPermeateIn,
    TPermeateOut,
    TAmbient,
    TResult
  > {
    return new MutablePermeator(input, output, options);
  }

  /**
   * Creates an ImmutablePermeator that runs the full pipeline
   * but always returns the original base unchanged.
   */
  static immutable<
    TInput,
    TOutput,
    TPermeateIn = unknown,
    TPermeateOut = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
    TResult = TOutput & TPermeateOut,
  >(
    input: IMembrane<TInput, TPermeateIn, TAmbient>,
    output: IMembrane<TOutput, TPermeateOut, TAmbient, TResult>,
    options?: PermeatorOptions,
  ): ImmutablePermeator<
    TInput,
    TOutput,
    TPermeateIn,
    TPermeateOut,
    TAmbient,
    TResult
  > {
    return new ImmutablePermeator(input, output, options);
  }
}
