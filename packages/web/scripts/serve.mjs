import { createServer } from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(new URL('..', import.meta.url).pathname, 'dist')
const port = Number(process.env.PORT || 5173)

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const requested = normalize(url.pathname === '/' ? '/index.html' : url.pathname)
  const file = join(root, requested)

  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  res.writeHead(200, {
    'content-type': types[extname(file)] || 'application/octet-stream',
  })
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`Preflight site running at http://localhost:${port}`)
})
