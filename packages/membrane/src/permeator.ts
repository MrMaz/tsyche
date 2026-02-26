import {
  PlainLiteralObject,
  IMembrane,
  IPermeator,
  MembraneErrorHandler,
} from './membrane.types';

/**
 * Three-step pipeline:
 * input.diffuse(base) → callback(permeate) → output.diffuse(result).
 * When the input membrane has strategy `'passthrough'`,
 * returns the original base instead.
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
    private readonly onError?: MembraneErrorHandler,
  ) {}

  async permeate(
    base: TInput,
    callback: (permeate: TInput & TPermeateIn) => Promise<TOutput>,
    ambient?: TAmbient,
  ): Promise<(TOutput & TPermeateOut) | TInput> {
    try {
      const permeate = await this.input.diffuse(base, ambient);
      const callbackResult = await callback(permeate);
      const final = await this.output.diffuse(callbackResult, ambient);

      if (this.input.strategy === 'passthrough') {
        return base;
      }

      return final;
    } catch (error) {
      if (this.onError) this.onError(error);
      throw error;
    }
  }
}
