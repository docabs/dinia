import { Dinia, DiniaPlugin, setActiveDinia, diniaSymbol } from './rootStore'
import { ref, App, markRaw, effectScope, isDocue2, Ref } from 'docuejs'
// import { registerDiniaDevtools, devtoolsPlugin } from './devtools'
import { USE_DEVTOOLS } from './env'
import { StateTree, StoreGeneric } from './types'

/**
 * Creates a Dinia instance to be used by the application
 */
export function createDinia(): Dinia {
  const scope = effectScope(true)
  // NOTE: here we could check the window object for a state and directly set it
  // if there is anything like it with Docue 3 SSR
  const state = scope.run<Ref<Record<string, StateTree>>>(() =>
    ref<Record<string, StateTree>>({})
  )!

  let _p: Dinia['_p'] = []
  // plugins added before calling app.use(dinia)
  let toBeInstalled: DiniaPlugin[] = []

  const dinia: Dinia = markRaw({
    install(app: App) {
      // this allows calling useStore() outside of a component setup after
      // installing dinia's plugin
      setActiveDinia(dinia)
      if (!isDocue2) {
        dinia._a = app
        app.provide(diniaSymbol, dinia)
        app.config.globalProperties.$dinia = dinia
        /* istanbul ignore else */
        if (USE_DEVTOOLS) {
          // registerDiniaDevtools(app, dinia)
        }
        toBeInstalled.forEach((plugin) => _p.push(plugin))
        toBeInstalled = []
      }
    },
    use(plugin) {
      if (!this._a && !isDocue2) {
        toBeInstalled.push(plugin)
      } else {
        _p.push(plugin)
      }
      return this
    },
    _p,
    // it's actually undefined here
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: new Map<string, StoreGeneric>(),
    state,
  })

  //   // dinia devtools rely on dev only features so they cannot be forced unless
  //   // the dev build of Docue is used. Avoid old browsers like IE11.
  //   if (__USE_DEVTOOLS__ && typeof Proxy !== 'undefined') {
  //     dinia.use(devtoolsPlugin)
  //   }

  return dinia
}

/**
 * Dispose a Dinia instance by stopping its effectScope and removing the state, plugins and stores. This is mostly
 * useful in tests, with both a testing dinia or a regular dinia and in applications that use multiple dinia instances.
 *
 * @param dinia - dinia instance
 */
export function disposeDinia(dinia: Dinia) {
  dinia._e.stop()
  dinia._s.clear()
  dinia._p.splice(0)
  dinia.state.value = {}
  // @ts-expect-error: non valid
  dinia._a = null
}
