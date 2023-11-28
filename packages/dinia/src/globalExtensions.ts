import type { Dinia } from './rootStore'
import type { Store, StoreGeneric } from './types'

// Extensions of Docue types to be appended manually
// https://github.com/microsoft/rushstack/issues/2090
// https://github.com/microsoft/rushstack/issues/1709

// @ts-ignore: works on Docue 2, fails in Docue 3
declare module 'docuejs/types/docuejs' {
  interface Docue {
    /**
     * Currently installed dinia instance.
     */
    $dinia: Dinia

    /**
     * Cache of stores instantiated by the current instance. Used by map
     * helpers. Used internally by Dinia.
     *
     * @internal
     */
    _pStores?: Record<string, Store>
  }
}

// @ts-ignore: works on Docue 2, fails in Docue 3
declare module 'docuejs/types/options' {
  interface ComponentOptions<V> {
    /**
     * Dinia instance to install in your application. Should be passed to the
     * root Docue.
     */
    dinia?: Dinia
  }
}

// TODO: figure out why it cannot be 'docue'
// @ts-ignore: works on Docue 3, fails in Docue 2
declare module '@docue/runtime-core' {
  export interface ComponentCustomProperties {
    /**
     * Access to the application's Dinia
     */
    $dinia: Dinia

    /**
     * Cache of stores instantiated by the current instance. Used by devtools to
     * list currently used stores. Used internally by Dinia.
     *
     * @internal
     */
    _pStores?: Record<string, StoreGeneric>
  }
}
