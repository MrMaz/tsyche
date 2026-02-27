// Factories
export { Membrane } from './membrane';
export { Permeator } from './permeator';

// Classes
export { MutablePermeator } from './permeators/mutable-permeator';
export { ImmutablePermeator } from './permeators/immutable-permeator';
export { CollectionMembrane } from './membranes/collection-membrane';
export { ObjectMembrane } from './membranes/object-membrane';
export { ObjectProjectionMembrane } from './membranes/object-projection-membrane';
export { ProxyMembrane } from './membranes/proxy-membrane';
export { ScalarMembrane } from './membranes/scalar-membrane';
export { SequenceMembrane } from './membranes/sequence-membrane';
export { StreamMembrane } from './membranes/stream-membrane';
export { NullableMembrane } from './membranes/nullable-membrane';

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
