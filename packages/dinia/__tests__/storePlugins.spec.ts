import { describe, it, expect, vi } from 'vitest'
import { createDinia, defineStore } from '../src'
import { mount } from '@docue/test-utils'
import { App, computed, ref, toRef, watch } from 'docuejs'

declare module '../src' {
  export interface DiniaCustomProperties<Id> {
    pluginN: number
    uid: App['_uid']
    hasApp: boolean
    idFromPlugin: Id
    globalA: string
    globalB: string
    shared: number
    double: number
  }

  export interface DiniaCustomStateProperties<S> {
    // pluginN: 'test' extends Id ? number : never | undefined
    pluginN: number
    shared: number
  }
}

describe('store plugins', () => {
  const useStore = defineStore('test', {
    actions: {
      incrementN() {
        return this.pluginN++
      },
    },

    getters: {
      doubleN: (state) => state.pluginN * 2,
    },
  })

  it('adds properties to stores', () => {
    const dinia = createDinia()

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    // must call use after installing the plugin
    dinia.use(({ app, store }) => {
      if (!store.$state.hasOwnProperty('pluginN')) {
        // @ts-expect-error: cannot be a ref yet
        store.$state.pluginN = ref(20)
      }
      // @ts-expect-error: TODO: allow setting refs
      store.pluginN = toRef(store.$state, 'pluginN')
      return { uid: app._uid }
    })

    const store = useStore(dinia)

    expect(store.$state.pluginN).toBe(20)
    expect(store.pluginN).toBe(20)
    expect(store.uid).toBeDefined()
    // @ts-expect-error: pluginN is a number
    store.pluginN.notExisting
    // @ts-expect-error: it should always be 'test'
    store.idFromPlugin == 'hello'
  })

  it('overrides $reset', () => {
    const dinia = createDinia()

    const useStore = defineStore('main', {
      state: () => ({ n: 0 }),
    })

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    dinia.use(({ app, store }) => {
      if (!store.$state.hasOwnProperty('pluginN')) {
        // @ts-expect-error: cannot be a ref yet
        store.$state.pluginN = ref(20)
      }
      // @ts-expect-error: TODO: allow setting refs
      store.pluginN = toRef(store.$state, 'pluginN')

      const originalReset = store.$reset.bind(store)
      return {
        uid: app._uid,
        $reset() {
          originalReset()
          store.pluginN = 20
        },
      }
    })

    const store = useStore(dinia)

    store.pluginN = 200
    store.$reset()
    expect(store.$state.pluginN).toBe(20)
    expect(store.pluginN).toBe(20)
  })

  it('can install plugins before installing dinia', () => {
    const dinia = createDinia()

    dinia.use(() => ({ pluginN: 1 }))
    dinia.use(({ app }) => ({ uid: app._uid }))

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    dinia.use((app) => ({ hasApp: !!app }))

    const store = useStore(dinia)

    expect(store.pluginN).toBe(1)
    expect(store.uid).toBeDefined()
    expect(store.hasApp).toBe(true)
  })

  it('can be used in actions', () => {
    const dinia = createDinia()

    // must call use after installing the plugin
    dinia.use(() => {
      return { pluginN: 20 }
    })

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    const store = useStore(dinia)

    expect(store.incrementN()).toBe(20)
  })

  it('can be used in getters', () => {
    const dinia = createDinia()

    // must call use after installing the plugin
    dinia.use(() => {
      return { pluginN: 20 }
    })

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    const store = useStore(dinia)
    expect(store.doubleN).toBe(40)
  })

  it('allows chaining', () => {
    const dinia = createDinia()

    // must call use after installing the plugin
    dinia.use(() => ({ globalA: 'a' })).use(() => ({ globalB: 'b' }))

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    const store = useStore(dinia)
    expect(store.globalA).toBe('a')
    expect(store.globalB).toBe('b')
  })

  it('shares the same ref among stores', () => {
    const dinia = createDinia()

    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    // must call use after installing the plugin
    dinia.use(({ app, store }) => {
      if (!store.$state.hasOwnProperty('shared')) {
        // @ts-expect-error: cannot be a ref yet
        store.$state.shared = ref(20)
      }
      // @ts-expect-error: TODO: allow setting refs
      store.shared = toRef(store.$state, 'shared')
    })

    const store = useStore(dinia)
    const store2 = useStore(dinia)

    expect(store.$state.shared).toBe(20)
    expect(store.shared).toBe(20)
    expect(store2.$state.shared).toBe(20)
    expect(store2.shared).toBe(20)

    store.$state.shared = 10
    expect(store.$state.shared).toBe(10)
    expect(store.shared).toBe(10)
    expect(store2.$state.shared).toBe(10)
    expect(store2.shared).toBe(10)

    store.shared = 1
    expect(store.$state.shared).toBe(1)
    expect(store.shared).toBe(1)
    expect(store2.$state.shared).toBe(1)
    expect(store2.shared).toBe(1)
  })

  it('passes the options of the options store', async () => {
    const options = {
      id: 'main',
      state: () => ({ n: 0 }),
      actions: {
        increment() {
          // @ts-expect-error
          this.n++
        },
      },
      getters: {
        a() {
          return 'a'
        },
      },
    }
    const useStore = defineStore(options)
    const dinia = createDinia()
    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    await new Promise<void>((done) => {
      dinia.use((context) => {
        expect(context.options).toEqual(options)
        done()
      })
      useStore(dinia)
    })
  })

  it('passes the options of a setup store', async () => {
    const useStore = defineStore('main', () => {
      const n = ref(0)

      function increment() {
        n.value++
      }
      const a = computed(() => 'a')

      return { n, increment, a }
    })
    const dinia = createDinia()
    mount({ template: 'none' }, { global: { plugins: [dinia] } })

    await new Promise<void>((done) => {
      dinia.use((context) => {
        expect(context.options).toEqual({
          actions: {
            increment: expect.any(Function),
          },
        })
        ;(context.store as any).increment()
        expect((context.store as any).n).toBe(1)
        done()
      })

      useStore()
    })
  })

  it('run inside store effect', async () => {
    const dinia = createDinia()

    // must call use after installing the plugin
    dinia.use(({ store }) => ({
      // @ts-expect-error: invalid computed
      double: computed(() => store.$state.n * 2),
    }))

    const useStore = defineStore('main', {
      state: () => ({ n: 1 }),
    })

    mount(
      {
        template: 'none',
        setup() {
          // create it inside of the component
          useStore()
        },
      },
      { global: { plugins: [dinia] } }
    ).unmount()

    const store = useStore(dinia)

    const spy = vi.fn()
    watch(() => store.double, spy, { flush: 'sync' })

    expect(spy).toHaveBeenCalledTimes(0)

    store.n++
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('only executes plugins once after multiple installs', async () => {
    const dinia = createDinia()

    const spy = vi.fn()
    dinia.use(spy)

    for (let i = 0; i < 3; i++) {
      mount({ template: 'none' }, { global: { plugins: [dinia] } }).unmount()
    }

    useStore(dinia)

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
