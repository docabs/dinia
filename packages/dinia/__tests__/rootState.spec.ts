import { describe, it, expect } from 'vitest'
import { createDinia, defineStore } from '../src'
import { mockWarn } from './vitest-mock-warn'

describe('Root State', () => {
  mockWarn()
  const useA = defineStore('a', {
    state: () => ({ a: 'a' }),
  })

  const useB = defineStore('b', {
    state: () => ({ b: 'b' }),
  })

  it('warns if creating a store without a dinia', () => {
    expect(() => useA()).toThrowError(/there was no active Dinia/)
  })

  it('works with no stores', () => {
    expect(createDinia().state.value).toEqual({})
  })

  it('retrieves the root state of one store', () => {
    const dinia = createDinia()
    useA(dinia)
    expect(dinia.state.value).toEqual({
      a: { a: 'a' },
    })
  })

  it('does not mix up different applications', () => {
    const dinia1 = createDinia()
    const dinia2 = createDinia()
    useA(dinia1)
    useB(dinia2)
    expect(dinia1.state.value).toEqual({
      a: { a: 'a' },
    })
    expect(dinia2.state.value).toEqual({
      b: { b: 'b' },
    })
  })

  it('can hold multiple stores', () => {
    const dinia1 = createDinia()
    useA(dinia1)
    useB(dinia1)
    expect(dinia1.state.value).toEqual({
      a: { a: 'a' },
      b: { b: 'b' },
    })
  })
})
