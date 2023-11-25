import {
  App,
  EffectScope,
  inject,
  hasInjectionContext,
  InjectionKey,
  Ref,
} from 'docuejs'
import {
  StateTree,
  DiniaCustomProperties,
  _Method,
  Store,
  _GettersTree,
  _ActionsTree,
  DiniaCustomStateProperties,
  //   DefineStoreOptionsInPlugin,
  StoreGeneric,
} from './types'

/**
 * setActiveDinia must be called to handle SSR at the top of functions like
 * `fetch`, `setup`, `serverPrefetch` and others
 */
export let activeDinia: Dinia | undefined

/**
 * Sets or unsets the active dinia. Used in SSR and internally when calling
 * actions and getters
 *
 * @param dinia - Dinia instance
 */
// @ts-expect-error: cannot constrain the type of the return
export const setActiveDinia: _SetActiveDinia = (dinia) => (activeDinia = dinia)

interface _SetActiveDinia {
  (dinia: Dinia): Dinia
  (dinia: undefined): undefined
  (dinia: Dinia | undefined): Dinia | undefined
}

/**
 * Get the currently active dinia if there is any.
 */
export const getActiveDinia = () =>
  (hasInjectionContext() && inject(diniaSymbol)) || activeDinia

/**
 * Every application must own its own dinia to be able to create stores
 */
export interface Dinia {
  install: (app: App) => void
  /**
   * root state
   */
  state: Ref<Record<string, StateTree>>
  /**
   * Adds a store plugin to extend every store
   *
   * @param plugin - store plugin to add
   */
  use(plugin: DiniaPlugin): Dinia
  /**
   * Installed store plugins
   *
   * @internal
   */
  _p: DiniaPlugin[]
  /**
   * App linked to this Dinia instance
   *
   * @internal
   */
  _a: App
  /**
   * Effect scope the dinia is attached to
   *
   * @internal
   */
  _e: EffectScope
  /**
   * Registry of stores used by this dinia.
   *
   * @internal
   */
  _s: Map<string, StoreGeneric>
  /**
   * Added by `createTestingDinia()` to bypass `useStore(dinia)`.
   *
   * @internal
   */
  _testing?: boolean
}

export const diniaSymbol = (
  __DEV__ ? Symbol('dinia') : /* istanbul ignore next */ Symbol()
) as InjectionKey<Dinia>

/**
 * Context argument passed to Dinia plugins.
 */
export interface DiniaPluginContext<
  Id extends string = string,
  S extends StateTree = StateTree,
  G /* extends _GettersTree<S> */ = _GettersTree<S>,
  A /* extends _ActionsTree */ = _ActionsTree
> {
  //   /**
  //    * dinia instance.
  //    */
  //   dinia: Dinia
  //   /**
  //    * Current app created with `Docue.createApp()`.
  //    */
  //   app: App
  //   /**
  //    * Current store being extended.
  //    */
  //   store: Store<Id, S, G, A>
  //   /**
  //    * Initial options defining the store when calling `defineStore()`.
  //    */
  //   options: DefineStoreOptionsInPlugin<Id, S, G, A>
}

/**
 * Plugin to extend every store.
 */
export interface DiniaPlugin {
  /**
   * Plugin to extend every store. Returns an object to extend the store or
   * nothing.
   *
   * @param context - Context
   */
  (context: DiniaPluginContext): Partial<
    DiniaCustomProperties & DiniaCustomStateProperties
  > | void
}

// /**
//  * Plugin to extend every store.
//  * @deprecated use DiniaPlugin instead
//  */
// export type DiniaStorePlugin = DiniaPlugin
