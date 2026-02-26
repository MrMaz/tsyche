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
 * `preserve`: base fields take precedence;
 * `passthrough`: original base passes through unchanged.
 */
export type ObjectMergeStrategy = 'overwrite' | 'preserve' | 'passthrough';

/**
 * `overwrite`: replaces array;
 * `append`: concatenates [...base, ...permeate];
 * `passthrough`: original base passes through unchanged.
 */
export type CollectionMergeStrategy = 'overwrite' | 'append' | 'passthrough';

/**
 * `passthrough`: original base passes through unchanged (default);
 * `append`: reserved for future use.
 */
export type ScalarMergeStrategy = 'append' | 'passthrough';

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
