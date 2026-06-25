import { spawn } from 'node:child_process'

const build = spawn(process.execPath, ['scripts/build.mjs'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'inherit',
})

build.on('exit', (code) => {
  if (code) process.exit(code)

  const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'inherit',
  })

  server.on('exit', (serverCode) => process.exit(serverCode ?? 0))
})
