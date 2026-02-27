// Factory
export { Membrane } from './membrane';

// Classes
export { ImmutablePermeator } from './immutable-permeator';
export { Permeator } from './permeator';
export { CollectionMembrane } from './membranes/collection-membrane';
export { ObjectMembrane } from './membranes/object-membrane';
export { ObjectProjectionMembrane } from './membranes/object-projection-membrane';
export { ProxyMembrane } from './membranes/proxy-membrane';
export { ScalarMembrane } from './membranes/scalar-membrane';
export { SequenceMembrane } from './membranes/sequence-membrane';
export { StreamMembrane } from './membranes/stream-membrane';

// Types
export type {
  PlainLiteralObject,
  PermeateCallback,
  MembraneErrorHandler,
  PermeatorOptions,
  CollectionMergeStrategy,
  ObjectMergeStrategy,
  StreamMergeStrategy,
} from './membrane.types';
export type { IMembrane } from './interfaces/membrane.interface';
export type { IPermeator } from './interfaces/permeator.interface';
