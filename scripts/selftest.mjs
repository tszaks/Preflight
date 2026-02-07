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

function runTsc(outDir) {
  const root = repoRoot()
  const tscPath = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')

  execFileSync(tscPath, [
    '-p',
    path.join(root, 'packages', 'shared', 'tsconfig.json'),
    '--noEmit',
    'false',
    '--outDir',
    outDir,
  ], { stdio: 'inherit' })
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-selftest-'))
  const outDir = path.join(tmp, 'shared-build')

  runTsc(outDir)

  const scoringUrl = pathToFileURL(path.join(outDir, 'engine', 'report', 'scoring.js')).href
  const conditionalUrl = pathToFileURL(path.join(outDir, 'engine', 'hard-rules', 'conditional-warnings.js')).href

  const { calculateScores } = await import(scoringUrl)
  const { checkConditionalWarnings } = await import(conditionalUrl)

  // ─── Scoring: manual review excluded from penalties ─────────────────────
  {
    const checks = [{
      category: 'ipa_binary',
      severity: 'critical',
      title: 'Manual review: dlopen imported',
      description: '',
      confidence: 100,
    }]
    const scores = calculateScores(checks)
    assert.equal(scores.score_ipa_binary, 100)
    assert.equal(scores.score_overall, 100)
  }

  // ─── Scoring: confidence-weighted penalties ─────────────────────────────
  {
    const checks = [{
      category: 'privacy_manifest',
      severity: 'critical',
      title: 'Some critical',
      description: '',
      confidence: 50,
    }]
    const scores = calculateScores(checks)
    // critical base 30 * 0.5 = 15 point penalty
    assert.equal(scores.score_privacy, 85)
  }

  // ─── SIWA gating: self-report alone should NOT produce a critical ───────
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

  // ─── SIWA: detected third-party login without SIWA should be critical ───
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

  console.log('selftest: ok')
}

main().catch((err) => {
  console.error('selftest: failed')
  console.error(err)
  process.exit(1)
})
