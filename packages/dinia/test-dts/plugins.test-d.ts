import { App } from 'docuejs'
import {
  expectType,
  createDinia,
  StoreGeneric,
  Dinia,
  StateTree,
  DefineStoreOptionsInPlugin,
} from './'

const dinia = createDinia()

dinia.use(({ store, app, options, dinia }) => {
  expectType<StoreGeneric>(store)
  expectType<Dinia>(dinia)
  expectType<App>(app)
  expectType<
    DefineStoreOptionsInPlugin<
      string,
      StateTree,
      Record<string, any>,
      Record<string, any>
    >
  >(options)
})
