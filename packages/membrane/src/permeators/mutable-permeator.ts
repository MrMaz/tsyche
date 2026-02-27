import {
  PlainLiteralObject,
  IMembrane,
  IPermeator,
  PermeatorOptions,
} from '../membrane.types';

/**
 * Three-step pipeline:
 * input.diffuse(base) → callback(permeate) → output.diffuse(result).
 *
 * `TResult` is inferred from the output membrane. When the output is
 * a `NullableMembrane`, `TResult` includes `| null`.
 */
export class MutablePermeator<
  TInput,
  TOutput,
  TPermeateIn = unknown,
  TPermeateOut = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
  TResult = TOutput & TPermeateOut,
> implements IPermeator<
  TInput,
  TOutput,
  TPermeateIn,
  TPermeateOut,
  TAmbient,
  TResult
> {
  constructor(
    private readonly input: IMembrane<TInput, TPermeateIn, TAmbient>,
    private readonly output: IMembrane<
      TOutput,
      TPermeateOut,
      TAmbient,
      TResult
    >,
    private readonly options?: PermeatorOptions,
  ) {}

  async permeate(
    base: TInput,
    callback: (
      permeate: TInput & TPermeateIn,
    ) => Promise<TOutput | null | undefined>,
    ambient?: TAmbient,
  ): Promise<TResult> {
    try {
      const permeate = await this.input.diffuse(base, ambient);
      const callbackResult = await callback(permeate);
      return await this.output.diffuse(callbackResult, ambient);
    } catch (error) {
      if (this.options?.onError) this.options.onError(error);
      throw error;
    }
  }
}
