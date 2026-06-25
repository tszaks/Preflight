import { cp, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

await cp(join(root, 'index.html'), join(dist, 'index.html'))
await cp(join(root, 'styles.css'), join(dist, 'styles.css'))

const publicDir = join(root, 'public')
if (existsSync(publicDir)) {
  await cp(publicDir, dist, { recursive: true })
}

console.log('Built static Preflight site to packages/web/dist')
