import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    splitting: false,
    dts: false,
    shims: true,
    banner: {
        js: '#!/usr/bin/env node\nimport { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);',
    },
    // Bundle all npm dependencies so the CLI is self-contained
    noExternal: [/.*/],
    platform: 'node',
})
