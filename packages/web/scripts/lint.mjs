import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

const requiredHtml = [
  'npm install -g preflightlaunch',
  'https://github.com/tszaks/Preflight',
  'https://www.npmjs.com/package/preflightlaunch',
  'maintained rule set',
]

for (const needle of requiredHtml) {
  if (!html.includes(needle)) {
    throw new Error(`Missing required website text: ${needle}`)
  }
}

const bannedHtml = ['/dashboard', '/pricing', '/submit', '/credits', '/auth']
for (const banned of bannedHtml) {
  if (html.includes(banned)) {
    throw new Error(`Static website still links to removed route: ${banned}`)
  }
}

if (/font-size:\s*clamp\([^;]*vw/i.test(css)) {
  throw new Error('Do not scale font size with viewport width.')
}

console.log('Static website lint passed')
