/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { createDinia, defineStore } from '../src'
import {
  Component,
  createSSRApp,
  inject,
  ref,
  computed,
  customRef,
} from 'docuejs'
import { renderToString, ssrInterpolate } from '@docue/server-renderer'
import { useUserStore } from './dinia/stores/user'
import { useCartStore } from './dinia/stores/cart'

describe('SSR', () => {
  const App = {
    ssrRender(ctx: any, push: any, _parent: any) {
      push(
        `<div>${ssrInterpolate(ctx.user.name)}: ${ssrInterpolate(
          ctx.cart.items
        )}</div>`
      )
    },
    setup() {
      const cart = useCartStore()
      const user = useUserStore()
      user.name = inject('name', 'default')
      cart.addItem('one')
      return { cart, user }
    },
  }

  function createMyApp(MyApp: Component = App) {
    const app = createSSRApp(MyApp)
    const dinia = createDinia()
    app.use(dinia)
    // const rootEl = document.createElement('div')
    // document.body.appendChild(rootEl)

    return { app, dinia }
  }

  it('keeps apps separated', async () => {
    const { app: a1 } = createMyApp()
    const { app: a2 } = createMyApp()

    expect(await renderToString(a1)).toMatchInlineSnapshot(`
      "<div>default: [
        {
          &quot;name&quot;: &quot;one&quot;,
          &quot;amount&quot;: 1
        }
      ]</div>"
    `)
    expect(await renderToString(a2)).toMatchInlineSnapshot(`
      "<div>default: [
        {
          &quot;name&quot;: &quot;one&quot;,
          &quot;amount&quot;: 1
        }
      ]</div>"
    `)
  })

  it('automatically hydrates', async () => {
    const { app, dinia } = createMyApp({
      ssrRender(ctx: any, push: any, _parent: any) {
        push(
          `<p>${ssrInterpolate(ctx.user.name)}: ${ssrInterpolate(
            ctx.cart.rawItems.join(', ')
          )}</p>`
        )
      },
      setup() {
        const cart = useCartStore()
        const user = useUserStore()
        return { cart, user }
      },
    })

    dinia.state.value.user = {
      name: 'Tom',
      isAdmin: false,
    }

    dinia.state.value.cart = {
      id: 10,
      rawItems: ['water', 'water', 'apples'],
    }

    expect(await renderToString(app)).toBe(`<p>Tom: water, water, apples</p>`)
  })

  it('hydrates custom refs', async () => {
    function useCustomRef() {
      let value = 3
      return customRef((track, trigger) => ({
        get() {
          track()
          return value
        },
        set(newValue: number) {
          value = newValue
          trigger()
        },
      }))
    }

    const useMainOptions = defineStore('main-options', {
      state: () => ({
        customRef: useCustomRef(),
      }),
    })

    const { app } = createMyApp({
      ssrRender(ctx: any, push: any, _parent: any) {
        push(`<p>${ssrInterpolate(ctx.store.customRef)}</p>`)
      },
      setup() {
        const store = useMainOptions()
        return { store }
      },
    })

    expect(await renderToString(app)).toBe(`<p>3</p>`)
  })

  it('can use a different store', async () => {
    const { app: a1 } = createMyApp()
    const { app: a2 } = createMyApp()
    a1.provide('name', 'a1')
    a2.provide('name', 'a2')

    expect(await renderToString(a1)).toMatchInlineSnapshot(`
      "<div>a1: [
        {
          &quot;name&quot;: &quot;one&quot;,
          &quot;amount&quot;: 1
        }
      ]</div>"
    `)
    expect(await renderToString(a2)).toMatchInlineSnapshot(`
      "<div>a2: [
        {
          &quot;name&quot;: &quot;one&quot;,
          &quot;amount&quot;: 1
        }
      ]</div>"
    `)
  })

  it('accepts a store with no state', () => {
    const dinia = createDinia()
    dinia.state.value.a = { start: 'start' }
    const store = defineStore('a', {})(dinia)
    expect(store.$state).toEqual({ start: 'start' })
  })

  describe('Setup Store', () => {
    const useStore = defineStore('main', () => {
      const count = ref(0)
      const name = ref('Eduardo')
      const double = computed(() => count.value * 2)

      function increment() {
        count.value++
      }

      return { name, count, double, increment }
    })

    const App = {
      ssrRender(ctx: any, push: any, _parent: any) {
        push(
          `<button>${ssrInterpolate(ctx.store.count)};${ssrInterpolate(
            ctx.store.double
          )};${ssrInterpolate(ctx.store.name)}</button>`
        )
      },
      setup() {
        const store = useStore()
        store.count++

        return { store }
      },
    }

    it('works', async () => {
      const { dinia, app } = createMyApp(App)

      dinia.state.value.main = {
        count: 2,
        name: 'Eduardo',
      }

      expect(await renderToString(app)).toBe('<button>3;6;Eduardo</button>')
    })

    it('store can be changed before rendering', async () => {
      const { dinia, app } = createMyApp(App)

      dinia.state.value.main = {
        count: 2,
        name: 'Eduardo',
      }

      const store = useStore(dinia)
      store.count = 10

      expect(await renderToString(app)).toBe('<button>11;22;Eduardo</button>')
    })

    it('dinia can be changed before rendering', async () => {
      const { dinia, app } = createMyApp(App)

      dinia.state.value.main = {
        count: 0,
        name: 'Eduardo',
      }

      // create the store before changing
      useStore(dinia)
      dinia.state.value.main.name = 'Ed'

      expect(await renderToString(app)).toBe('<button>1;2;Ed</button>')
    })
  })
})
