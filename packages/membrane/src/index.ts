// Factory
export { Membrane } from './membrane';

// Classes
export { Permeator } from './permeator';
export { CollectionMembrane } from './membranes/collection-membrane';
export { ObjectMembrane } from './membranes/object-membrane';
export { ProjectionMembrane } from './membranes/projection-membrane';
export { ProxyMembrane } from './membranes/proxy-membrane';
export { ScalarMembrane } from './membranes/scalar-membrane';
export { SequenceMembrane } from './membranes/sequence-membrane';
export { StreamMembrane } from './membranes/stream-membrane';

// Types
export type {
  PlainLiteralObject,
  PermeateCallback,
  MembraneErrorHandler,
  CollectionMergeStrategy,
  ObjectMergeStrategy,
  ScalarMergeStrategy,
  StreamMergeStrategy,
} from './membrane.types';
export type { IMembrane } from './interfaces/membrane.interface';
export type { IPermeator } from './interfaces/permeator.interface';
