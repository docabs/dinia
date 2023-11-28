import { describe, it, expect, vi } from 'vitest'
import {
  createDinia,
  defineStore,
  disposeDinia,
  getActiveDinia,
  setActiveDinia,
} from '../src'
import { mount } from '@docue/test-utils'
import {
  watch,
  nextTick,
  defineComponent,
  ref,
  Ref,
  onMounted,
  getCurrentInstance,
} from 'docuejs'

describe('Store Lifespan', () => {
  function defineMyStore() {
    return defineStore({
      id: 'main',
      state: () => ({
        a: true,
        n: 0,
        aRef: ref(0),
        nested: {
          foo: 'foo',
          a: { b: 'string' },
        },
      }),
      getters: {
        double(state) {
          return state.n * 2
        },
        notA(state) {
          return !state.a
        },
      },
    })
  }

  const dinia = createDinia()

  it('gets the active dinia outside of setup', () => {
    setActiveDinia(dinia)
    expect(getCurrentInstance()).toBeFalsy()
    expect(getActiveDinia()).toBe(dinia)
  })

  it('gets the active dinia inside of setup', () => {
    expect.assertions(3)
    const dinia = createDinia()
    setActiveDinia(undefined)
    expect(getActiveDinia()).toBe(undefined)

    mount(
      {
        template: 'no',
        setup() {
          expect(getActiveDinia()).toBe(dinia)
        },
      },
      { global: { plugins: [dinia] } }
    )
    // and outside too
    expect(getActiveDinia()).toBe(dinia)
  })

  it('state reactivity outlives component life', () => {
    const useStore = defineMyStore()

    const inComponentWatch = vi.fn()

    const Component = defineComponent({
      render: () => null,
      setup() {
        const store = useStore()
        watch(() => store.n, inComponentWatch, {
          flush: 'sync',
        })
        onMounted(() => {
          store.n++
        })
      },
    })

    const options = {
      global: {
        plugins: [dinia],
      },
    }

    let wrapper = mount(Component, options)
    wrapper.unmount()

    expect(inComponentWatch).toHaveBeenCalledTimes(1)

    let store = useStore()
    store.n++
    expect(inComponentWatch).toHaveBeenCalledTimes(1)

    wrapper = mount(Component, options)
    wrapper.unmount()

    expect(inComponentWatch).toHaveBeenCalledTimes(2)

    store = useStore()
    store.n++
    expect(inComponentWatch).toHaveBeenCalledTimes(2)
  })

  it('ref in state reactivity outlives component life', async () => {
    let n: Ref<number>
    const dinia = createDinia()
    setActiveDinia(dinia)
    const globalWatch = vi.fn()
    const destroy = watch(() => dinia.state.value.a?.n, globalWatch)

    const useStore = defineStore({
      id: 'a',
      state: () => {
        n = n || ref(0)
        return { n }
      },
    })

    const Component = defineComponent({
      render: () => null,
      setup() {
        const store = useStore()
        store.n++
      },
    })

    const options = {
      global: {
        plugins: [dinia],
      },
    }

    let wrapper = mount(Component, options)
    wrapper.unmount()
    await nextTick()

    expect(globalWatch).toHaveBeenCalledTimes(1)

    let store = useStore()
    store.n++
    await nextTick()
    expect(globalWatch).toHaveBeenCalledTimes(2)

    wrapper = mount(Component, options)
    wrapper.unmount()
    await nextTick()

    expect(globalWatch).toHaveBeenCalledTimes(3)

    store = useStore()
    store.n++
    await nextTick()
    expect(globalWatch).toHaveBeenCalledTimes(4)

    destroy()
  })

  it('dispose stops store reactivity', () => {
    const dinia = createDinia()
    setActiveDinia(dinia)
    const inStoreWatch = vi.fn()

    const useStore = defineStore('a', () => {
      const n = ref(0)
      watch(n, inStoreWatch, {
        flush: 'sync',
      })
      return { n }
    })

    const store = useStore()
    store.n++
    expect(inStoreWatch).toHaveBeenCalledTimes(1)

    disposeDinia(dinia)
    store.n++
    expect(inStoreWatch).toHaveBeenCalledTimes(1)
  })
})
