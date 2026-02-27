import {
  PlainLiteralObject,
  IMembrane,
  PermeateCallback,
  CollectionMergeStrategy,
  ObjectMergeStrategy,
  StreamMergeStrategy,
} from './membrane.types';
import { CollectionMembrane } from './membranes/collection-membrane';
import { NullableMembrane } from './membranes/nullable-membrane';
import { ObjectMembrane } from './membranes/object-membrane';
import { ObjectProjectionMembrane } from './membranes/object-projection-membrane';
import { ProxyMembrane } from './membranes/proxy-membrane';
import { ScalarMembrane } from './membranes/scalar-membrane';
import { SequenceMembrane } from './membranes/sequence-membrane';
import { StreamMembrane } from './membranes/stream-membrane';

/**
 * Static factory for creating membranes.
 */
export class Membrane {
  /**
   * Creates an ObjectMembrane that enriches base with callback-produced permeate data.
   */
  static object<
    TBase extends object,
    TPermeate = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: PermeateCallback<TPermeate, TAmbient>,
    strategy?: ObjectMergeStrategy,
  ): ObjectMembrane<TBase, TPermeate, TAmbient> {
    return new ObjectMembrane(callback, strategy);
  }

  /**
   * Creates a CollectionMembrane for array data with overwrite, preserve, or append strategy.
   */
  static collection<
    TItem,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: PermeateCallback<unknown, TAmbient>,
    strategy?: CollectionMergeStrategy,
  ): CollectionMembrane<TItem, TAmbient> {
    return new CollectionMembrane(callback, strategy);
  }

  /**
   * Creates a SequenceMembrane that chains membranes, piping each output as base to the next.
   */
  static sequence<
    TBase,
    TPermeate = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    first: IMembrane<TBase, TPermeate, TAmbient>,
    ...rest: IMembrane<TBase, TPermeate, TAmbient>[]
  ): SequenceMembrane<TBase, TPermeate, TAmbient> {
    return new SequenceMembrane(first, rest);
  }

  /**
   * Creates an ObjectProjectionMembrane that merges base and permeate,
   * then returns only keys present in permeate (subtractive).
   */
  static objectProjection<
    TBase extends object,
    TPermeate = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: PermeateCallback<TPermeate, TAmbient>,
    strategy?: ObjectMergeStrategy,
  ): ObjectProjectionMembrane<TBase, TPermeate, TAmbient> {
    return new ObjectProjectionMembrane(callback, strategy);
  }

  /**
   * Creates a ProxyMembrane that wraps permeate in a Proxy falling back to base.
   */
  static proxy<
    TBase extends object,
    TPermeate extends object,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: PermeateCallback<TPermeate, TAmbient>,
  ): ProxyMembrane<TBase, TPermeate, TAmbient> {
    return new ProxyMembrane(callback);
  }

  /**
   * Creates a ScalarMembrane for primitive values (string, number, boolean).
   */
  static scalar<
    TBase extends string | number | boolean,
    TPermeate extends TBase = TBase,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: (base: TBase, ambient?: TAmbient) => Promise<TPermeate>,
  ): ScalarMembrane<TBase, TPermeate, TAmbient> {
    return new ScalarMembrane(callback);
  }

  /**
   * Creates a StreamMembrane that processes each AsyncIterable chunk through the callback.
   */
  static stream<
    TItem,
    TPermeate = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    callback: PermeateCallback<TPermeate, TAmbient>,
    strategy?: StreamMergeStrategy,
  ): StreamMembrane<TItem, TPermeate, TAmbient> {
    return new StreamMembrane(callback, strategy);
  }

  /**
   * Wraps a membrane so that `diffuse(null | undefined)` returns `null`
   * when the callback does not augment the resolved empty value.
   */
  static nullable<
    TBase,
    TPermeate = unknown,
    TAmbient extends PlainLiteralObject = PlainLiteralObject,
  >(
    membrane: IMembrane<TBase, TPermeate, TAmbient>,
  ): NullableMembrane<TBase, TPermeate, TAmbient> {
    return new NullableMembrane(membrane);
  }
}
