// Re-export interfaces from their dedicated files
export type { IMembrane } from './interfaces/membrane.interface';
export type { IPermeator } from './interfaces/permeator.interface';

/**
 * Plain object type
 */
export type PlainLiteralObject = Record<string, unknown>;

/**
 * Callback that receives base and returns the merged base+permeate result.
 * Ambient is passed at diffuse()/permeate() time, not construction time.
 */
export type PermeateCallback<
  TPermeate = unknown,
  TAmbient extends PlainLiteralObject = PlainLiteralObject,
> = <TBase>(base: TBase, ambient?: TAmbient) => Promise<TBase & TPermeate>;

/**
 * `overwrite`: callback result replaces base;
 * `preserve`: base fields take precedence.
 */
export type ObjectMergeStrategy = 'overwrite' | 'preserve';

/**
 * `overwrite`: replaces array;
 * `append`: concatenates [...base, ...permeate].
 */
export type CollectionMergeStrategy = 'overwrite' | 'append';

/**
 * `passthrough`: Permeator returns original base instead of pipeline output.
 */
export type PermeatorStrategy = 'passthrough';

/**
 * Options for configuring a Permeator.
 */
export interface PermeatorOptions {
  strategy?: PermeatorStrategy;
  onError?: MembraneErrorHandler;
}

/**
 * `overwrite`: permeate wins on conflict per chunk;
 * `preserve`: chunk wins on conflict (base preserved).
 */
export type StreamMergeStrategy = 'overwrite' | 'preserve';

/**
 * Error handler for permeated membranes. Must throw (return type `never`).
 * Receives the original error; can normalize it to a domain-specific exception.
 */
export type MembraneErrorHandler = (error: unknown) => never;
