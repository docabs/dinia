import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  external: ['docuejs', 'diniajs'],
  tsconfig: './tsconfig.build.json',
  // onSuccess: 'npm run build:fix',
})
