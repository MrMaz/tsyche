import { PlainLiteralObject, IMembrane } from '../membrane.types';

/**
 * Chains multiple membranes: pipes each diffuse() output
 * as base to the next membrane in order.
 */
export class SequenceMembrane<
  TBase,
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> implements IMembrane<TBase, TPermeate, TAmbient> {
  constructor(
    private readonly first: IMembrane<TBase, TPermeate, TAmbient>,
    private readonly rest: IMembrane<TBase, TPermeate, TAmbient>[],
  ) {}

  async diffuse(base: TBase, ambient?: TAmbient): Promise<TBase & TPermeate> {
    let result = await this.first.diffuse(base, ambient);
    for (const membrane of this.rest) {
      result = await membrane.diffuse(result, ambient);
    }
    return result;
  }
}
