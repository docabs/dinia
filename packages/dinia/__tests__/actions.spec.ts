import { describe, it, expect, vi } from 'vitest'
import { createDinia, defineStore, setActiveDinia } from '../src'

describe('Actions', () => {
  const useStore = () => {
    // create a new store
    setActiveDinia(createDinia())
    return defineStore({
      id: 'main',
      state: () => ({
        a: true,
        nested: {
          foo: 'foo',
          a: { b: 'string' },
        },
      }),
      getters: {
        nonA(): boolean {
          return !this.a
        },
        otherComputed() {
          return this.nonA
        },
      },
      actions: {
        async getNonA() {
          return this.nonA
        },
        simple() {
          this.toggle()
          return 'simple'
        },

        toggle() {
          return (this.a = !this.a)
        },

        setFoo(foo: string) {
          this.$patch({ nested: { foo } })
        },

        combined() {
          this.toggle()
          this.setFoo('bar')
        },

        throws() {
          throw new Error('fail')
        },

        async rejects() {
          throw 'fail'
        },
      },
    })()
  }

  const useB = defineStore({
    id: 'B',
    state: () => ({ b: 'b' }),
  })

  const useA = defineStore({
    id: 'A',
    state: () => ({ a: 'a' }),
    actions: {
      swap() {
        const bStore = useB()
        const b = bStore.$state.b
        bStore.$state.b = this.$state.a
        this.$state.a = b
      },
    },
  })

  it('can use the store as this', () => {
    const store = useStore()
    expect(store.$state.a).toBe(true)
    store.toggle()
    expect(store.$state.a).toBe(false)
  })

  it('store is forced as the context', () => {
    const store = useStore()
    expect(store.$state.a).toBe(true)
    expect(() => {
      store.toggle.call(null)
    }).not.toThrow()
    expect(store.$state.a).toBe(false)
  })

  it('can call other actions', () => {
    const store = useStore()
    expect(store.$state.a).toBe(true)
    expect(store.$state.nested.foo).toBe('foo')
    store.combined()
    expect(store.$state.a).toBe(false)
    expect(store.$state.nested.foo).toBe('bar')
  })

  it('supports being called between two applications', () => {
    const dinia1 = createDinia()
    const dinia2 = createDinia()
    setActiveDinia(dinia1)
    const aStore = useA()

    // simulate a different application
    setActiveDinia(dinia2)
    const bStore = useB()
    bStore.$state.b = 'c'

    aStore.swap()
    expect(aStore.$state.a).toBe('b')
    // a different instance of b store was used
    expect(bStore.$state.b).toBe('c')
  })

  it('can force the dinia', () => {
    // setup other dinias to force possible override effects on the options effect
    const dinia11 = createDinia()
    // const dinia22 = createDinia()
    setActiveDinia(dinia11)
    useA()
    setActiveDinia(undefined)

    const dinia1 = createDinia()
    const dinia2 = createDinia()
    const aStore = useA(dinia1)

    let bStore = useB(dinia2)
    bStore.$state.b = 'c'

    aStore.swap()
    expect(aStore.$state.a).toBe('b')
    // a different instance of b store was used
    expect(bStore.$state.b).toBe('c')
    bStore = useB(dinia1)
    expect(bStore.$state.b).toBe('a')
  })

  it('throws errors', () => {
    const store = useStore()
    expect(() => store.throws()).toThrowError('fail')
  })

  it('throws async errors', async () => {
    const store = useStore()
    expect.assertions(1)
    await expect(store.rejects()).rejects.toBe('fail')
  })

  it('can catch async errors', async () => {
    const store = useStore()
    expect.assertions(3)
    const spy = vi.fn()
    await expect(store.rejects().catch(spy)).resolves.toBe(undefined)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('fail')
  })

  it('can destructure actions', () => {
    const store = useStore()
    const { simple } = store
    expect(simple()).toBe('simple')
    // works with the wrong this
    expect({ simple }.simple()).toBe('simple')
    // special this check
    expect({ $id: 'o', simple }.simple()).toBe('simple')
    // override the function like devtools do
    expect(
      {
        $id: store.$id,
        simple,
        // otherwise it would fail
        toggle() {},
      }.simple()
    ).toBe('simple')
  })
})
