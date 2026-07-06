import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'

function repoRoot() {
  // scripts/ lives at repo root
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
}

function runTsc() {
  const root = repoRoot()
  const tscPath = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')

  execFileSync(tscPath, [
    '-p',
    path.join(root, 'packages', 'shared', 'tsconfig.json'),
  ], { stdio: 'inherit' })
}

function bundleSelftestModules(tmp) {
  const root = repoRoot()
  const esbuildPath = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild')
  const entryPath = path.join(tmp, 'selftest-entry.ts')
  const bundlePath = path.join(tmp, 'selftest-bundle.mjs')
  const conditionalPath = path.join(root, 'packages', 'shared', 'src', 'engine', 'hard-rules', 'conditional-warnings.ts')
  const patternsPath = path.join(root, 'packages', 'shared', 'src', 'engine', 'historical-patterns', 'index.ts')
  const entitlementsAuditPath = path.join(root, 'packages', 'shared', 'src', 'engine', 'ipa-scanner', 'entitlements-audit.ts')

  fs.writeFileSync(entryPath, `
export { checkConditionalWarnings } from ${JSON.stringify(conditionalPath)};
export { matchRejectionPatterns } from ${JSON.stringify(patternsPath)};
export { auditEntitlements } from ${JSON.stringify(entitlementsAuditPath)};
`)

  execFileSync(esbuildPath, [
    entryPath,
    '--bundle',
    '--platform=node',
    '--format=esm',
    '--target=node18',
    `--outfile=${bundlePath}`,
  ], { stdio: 'inherit' })

  return bundlePath
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-selftest-'))

  runTsc()

  const bundleUrl = pathToFileURL(bundleSelftestModules(tmp)).href

  const { checkConditionalWarnings, matchRejectionPatterns, auditEntitlements } = await import(bundleUrl)

  // Historical patterns: blank category must not match category-only patterns.
  {
    const res = await matchRejectionPatterns({
      app_name: 'SmokeApp',
      screenshot_paths: [],
    })
    const noisyCategoryMatch = res.find((x) =>
      /finance|cryptocurrency|medical|health data|fitness/i.test(String(x.title || ''))
    )
    assert.equal(noisyCategoryMatch, undefined)
  }

  // SIWA gating: self-report alone should not produce a critical.
  {
    const res = checkConditionalWarnings({
      has_third_party_login: true,
      detected_third_party_login: false,
      detected_sign_in_with_apple: false,
    })
    const siwa = res.find((x) => x.guideline_ref === '4.8')
    assert.ok(siwa, 'expected a 4.8 item')
    assert.equal(siwa.severity, 'warning')
    assert.match(String(siwa.title || ''), /confirm whether/i)
  }

  // SIWA: detected third-party login without SIWA should be critical.
  {
    const res = checkConditionalWarnings({
      detected_third_party_login: true,
      detected_third_party_login_confidence: 90,
      detected_sign_in_with_apple: false,
    })
    const siwa = res.find((x) => x.guideline_ref === '4.8')
    assert.ok(siwa, 'expected a 4.8 item')
    assert.equal(siwa.severity, 'critical')
    assert.match(String(siwa.title || ''), /likely missing/i)
  }

  // GameKit requires the Game Center entitlement for App Store submissions.
  {
    const res = auditEntitlements('<plist><dict></dict></plist>', ['GameKit'], undefined)
    const gameCenter = res.find((x) => String(x.title || '').includes('Game Center'))
    assert.ok(gameCenter, 'expected a Game Center entitlement warning')
    assert.equal(gameCenter.severity, 'warning')
    assert.match(String(gameCenter.fix_suggestion || ''), /Game Center capability/i)
  }

  console.log('selftest: ok')
}

main().catch((err) => {
  console.error('selftest: failed')
  console.error(err)
  process.exit(1)
})
