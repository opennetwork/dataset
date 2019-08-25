import { DatasetCore, ResultType, ResultValue, SyncableDatasetIterableTypeLike } from "./dataset-core";
import {
  FilterIterateeLike,
  RunIterateeLike,
  MapIterateeLike,
  ReduceIterateeLike
} from "../../iterator";

export interface Dataset<R extends ResultType, T, TLike, TFind> extends DatasetCore<R, T, TLike, TFind> {

  addAll(quads: SyncableDatasetIterableTypeLike<R, T | TLike>): ResultValue<R, void>;
  contains(other: SyncableDatasetIterableTypeLike<R, T | TLike>): ResultValue<R, boolean>;
  difference(other: SyncableDatasetIterableTypeLike<R, T | TLike>): Dataset<R, T, TLike, TFind>;
  equals(other: SyncableDatasetIterableTypeLike<R, T | TLike>): ResultValue<R, boolean>;
  every(iteratee: FilterIterateeLike<R, T, TLike, TFind, this>): ResultValue<R, boolean>;
  forEach(iteratee: RunIterateeLike<R, T, TLike, TFind, this>): ResultValue<R, void>;
  import(stream: SyncableDatasetIterableTypeLike<R, T | TLike>): Promise<Dataset<R, T, TLike, TFind>>;
  intersection(other: SyncableDatasetIterableTypeLike<R, T | TLike>): Dataset<R, T, TLike, TFind>;
  map(iteratee: MapIterateeLike<R, T, TLike, TFind, this>): Dataset<R, T, TLike, TFind>;
  reduce<Accumulator = T>(iteratee: ReduceIterateeLike<R, T, TLike, TFind, this, Accumulator>, initialValue?: Accumulator): ResultValue<R, Accumulator>;
  toArray(): ResultValue<R, T[]>;
  union(quads: SyncableDatasetIterableTypeLike<R, T | TLike>): Dataset<R, T, TLike, TFind>;

}