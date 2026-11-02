import { createSignal } from "solid-js";

// work in progress
// idk

declare const StateSymbol: unique symbol;

export interface $State<T> {
  get $(): T;
  set $(newValue: T);
  [StateSymbol]: true;
}

export interface $Derived<T> {
  get $(): T;
  [StateSymbol]: true;
}

export function $state<T>(initialValue: T): $State<T> {
  const [getValue, setValue] = createSignal<T>(() => initialValue);

  return {
    set $(newValue: T) {
      setValue(() => newValue);
    },

    get $() {
      return getValue();
    },
  } as $State<T>;
}

export function $derived<T>(cb: () => T): $Derived<T> {
  return {
    get $() {
      return cb();
    },
  } as $Derived<T>;
}
