import {
  PlainLiteralObject,
  IMembrane,
  IPermeator,
  PermeatorOptions,
} from './membrane.types';

/**
 * Three-step pipeline:
 * input.diffuse(base) → callback(permeate) → output.diffuse(result).
 */
export class Permeator<
  TInput,
  TOutput,
  TPermeateIn = unknown,
  TPermeateOut = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IPermeator<TInput, TOutput, TPermeateIn, TPermeateOut, TAmbient> {
  constructor(
    private readonly input: IMembrane<TInput, TPermeateIn, TAmbient>,
    private readonly output: IMembrane<TOutput, TPermeateOut, TAmbient>,
    private readonly options?: PermeatorOptions,
  ) {}

  async permeate(
    base: TInput,
    callback: (
      permeate: TInput & TPermeateIn,
    ) => Promise<TOutput | null | undefined>,
    ambient?: TAmbient,
  ): Promise<TOutput & TPermeateOut> {
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
