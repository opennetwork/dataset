import {
  FilterIterateeLike,
  RunIterateeLike,
  MapIterateeLike,
  ReduceIterateeLike
} from "../../iterator";
import {
  AsyncDataset,
  AsyncDatasetContext,
  AsyncIterableLike,
  DatasetCoreFactory
} from "../../dataset/index";
import { AsyncDatasetCoreImplementation } from "./async-dataset-core-implementation";

export class AsyncDatasetImplementation<T, TCreate extends T = T, TFind extends (TCreate | T) = (TCreate | T)> extends AsyncDatasetCoreImplementation<T, TCreate, TFind> implements AsyncDataset<T, TCreate, TFind> {

  constructor(datasetFactory: DatasetCoreFactory<T, TCreate, TFind>, datasetContext: AsyncDatasetContext<T, TCreate, TFind>, values?: AsyncIterableLike<T | TCreate>) {
    super(datasetFactory, datasetContext, values);
  }

  addAll(other: AsyncIterableLike<TCreate>) {
    return this.datasetFactory.asyncDataset(other).forEach(
      value => this.add(value)
    );
  }

  contains(other: AsyncIterableLike<TCreate>) {
    return this.datasetFactory.asyncDataset(other).every(
      value => this.has(value)
    );
  }

  difference(other: AsyncIterableLike<TCreate>) {
    return this.datasetFactory.asyncDataset(other).except(
      value => this.has(value)
    );
  }

  async equals(other: AsyncIterableLike<TCreate>) {
    const that = this;
    return this.datasetFactory.asyncDataset(other).every(value => that.has(value));
  }

  async every(iteratee: FilterIterateeLike<true, T, this>) {
    return !await this.except(iteratee).hasAny();
  }

  async forEach(iteratee: RunIterateeLike<true, T, this>) {
    const fn = iteratee instanceof Function ? iteratee.bind(this) : iteratee.run.bind(iteratee);
    for await (const value of this) {
      fn(value, this);
    }
  }

  async import(iterable: AsyncIterableLike<TCreate>) {
    // Import as async, then grab
    const datastream = this.datasetFactory.asyncDataset(iterable);
    await this.datasetContext.drain(datastream);
    return datastream;
  }

  intersection(other: AsyncIterableLike<TCreate>) {
    const that = this;
    return this.datasetFactory.asyncDataset(other).filter({
      test: value => that.has(value)
    });
  }

  map(iteratee: MapIterateeLike<true, T, this>) {
    const fn = iteratee instanceof Function ? iteratee.bind(this) : iteratee.map.bind(iteratee);
    const generator = async function *() {
      for await (const value of this) {
        yield fn(value, this);
      }
    };
    return this.datasetFactory.asyncDataset(generator());
  }

  async reduce<Accumulator = T>(iteratee: ReduceIterateeLike<true, T, this, Accumulator>, initialValue?: Accumulator) {
    const fn = iteratee instanceof Function ? iteratee.bind(this) : iteratee.run.bind(iteratee);
    let accumulator: Accumulator = initialValue;
    for await (const value of this) {
      if (!accumulator) {
        accumulator = (value as unknown) as Accumulator;
        continue;
      }
      accumulator = fn(accumulator, value, this);
    }
    return accumulator;
  }

  union(other: AsyncIterableLike<TCreate>) {
    const otherDataset = this.datasetFactory.asyncDataset(other);
    const generator = async function *(): AsyncIterable<T | TCreate> {
      for (const value of this) {
        yield value;
      }
      for await (const value of otherDataset) {
        if (!this.has(value)) {
          yield value;
        }
      }
    };
    return this.datasetFactory.asyncDataset(generator());
  }

  some(iteratee: FilterIterateeLike<true, T, this>) {
    return this.filter(iteratee).hasAny();
  }

  match(find: T | TCreate | TFind) {
    return this.filter(value => this.datasetContext.isMatch(value, find));
  }

  filter(iteratee: FilterIterateeLike<true, T, this>) {
    return this.filterNegatable(iteratee, false);
  }

  except(iteratee: FilterIterateeLike<true, T, this>) {
    return this.filterNegatable(iteratee, true);
  }

  private filterNegatable(iteratee: FilterIterateeLike<true, T, this>, negate: boolean = false) {
    const fn = iteratee instanceof Function ? iteratee.bind(this) : iteratee.test.bind(iteratee);
    function negateIfNeeded(value: boolean) {
      return negate ? !value : value;
    }
    const generator = async function *(): AsyncIterable<T> {
      for await (const value of this) {
        if (negateIfNeeded(fn(value, this))) {
          yield value;
        }
      }
    };
    return this.datasetFactory.asyncDataset(generator());
  }

}