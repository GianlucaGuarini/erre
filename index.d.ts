type Callback = (...args: any[]) => any

export declare function cancel(): symbol
export declare function off(): symbol
export declare function install(name: string, fn: Callback): any

export type ErreStream<T = unknown, TReturn = any, TNext = unknown> = {
  on: {
    value: (fn: Callback) => ErreStream<T, TReturn, TNext>
    error: (fn: Callback) => ErreStream<T, TReturn, TNext>
    end: (fn: Callback) => ErreStream<T, TReturn, TNext>
  }
  off: {
    value: (fn: Callback) => ErreStream<T, TReturn, TNext>
    error: (fn: Callback) => ErreStream<T, TReturn, TNext>
    end: (fn: Callback) => ErreStream<T, TReturn, TNext>
  }
  connect: (fn: Callback) => ErreStream<T, TReturn, TNext>
  push: (value: any) => ErreStream<T, TReturn, TNext>
  end: () => ErreStream<T, TReturn, TNext>
  fork: () => ErreStream<T, TReturn, TNext>
} & Generator<T, TReturn, TNext>

declare const erre: <T = unknown, TReturn = any, TNext = unknown>(...fns: any[]) => ErreStream<T, TReturn, TNext>

export default erre
