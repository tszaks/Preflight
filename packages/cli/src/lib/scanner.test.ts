import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { scanProject } from './scanner.js'

/**
 * Builds a project tree shaped like a real XcodeGen iOS app: an app target, a
 * widget extension with its own privacy manifest, a test target with a stub
 * Info.plist, and a screenshots directory full of QA captures.
 *
 * Every one of those produced a wrong answer before:
 *  - `Payday.xcodeproj/project.xcworkspace` was chosen as the project, so the
 *    app name rendered as the literal string "project".
 *  - `PaydayTests/Info.plist` was chosen over the app's, producing a run of
 *    false CRITICAL "missing required key" findings.
 *  - the widget's `PrivacyInfo.xcprivacy` could be chosen over the app's.
 *  - all 66 QA captures counted as App Store screenshots.
 */
let root: string

beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'preflight-scanner-'))

    // .xcodeproj is a directory, and it contains an inner workspace.
    mkdirSync(join(root, 'Payday.xcodeproj', 'project.xcworkspace'), { recursive: true })
    writeFileSync(join(root, 'Payday.xcodeproj', 'project.pbxproj'), '// pbxproj')

    // App target.
    mkdirSync(join(root, 'Payday'), { recursive: true })
    writeFileSync(join(root, 'Payday', 'Info.plist'), '<plist><dict/></plist>')
    writeFileSync(join(root, 'Payday', 'PrivacyInfo.xcprivacy'), '<plist><dict/></plist>')

    // Widget extension with its own manifest.
    mkdirSync(join(root, 'PaydayWidget'), { recursive: true })
    writeFileSync(join(root, 'PaydayWidget', 'Info.plist'), '<plist><dict/></plist>')
    writeFileSync(join(root, 'PaydayWidget', 'PrivacyInfo.xcprivacy'), '<plist><dict/></plist>')

    // Test target stub.
    mkdirSync(join(root, 'PaydayTests'), { recursive: true })
    writeFileSync(join(root, 'PaydayTests', 'Info.plist'), '<plist><dict/></plist>')

    // QA captures, not store assets.
    mkdirSync(join(root, 'screenshots'), { recursive: true })
    for (let i = 0; i < 5; i++) {
        writeFileSync(join(root, 'screenshots', `qa-${i}.png`), 'not-a-real-png')
    }

    // Real store assets, in their own directory.
    mkdirSync(join(root, 'marketing', 'store'), { recursive: true })
    for (let i = 0; i < 2; i++) {
        writeFileSync(join(root, 'marketing', 'store', `shot-${i}.png`), 'not-a-real-png')
    }
})

afterAll(() => {
    rmSync(root, { recursive: true, force: true })
})

describe('project discovery', () => {
    it('does not pick the workspace nested inside .xcodeproj', () => {
        const detected = scanProject(root)
        expect(detected.xcodeProject).not.toContain('.xcodeproj/project.xcworkspace')
    })

    it('reports the real app name instead of "project"', () => {
        const detected = scanProject(root)
        expect(detected.projectName).toBe('Payday')
    })

    it('selects the .xcodeproj itself', () => {
        const detected = scanProject(root)
        expect(basename(detected.xcodeProject!)).toBe('Payday.xcodeproj')
    })
})

describe('target selection', () => {
    it('prefers the app target Info.plist over the test target stub', () => {
        const detected = scanProject(root)
        expect(detected.infoPlist).toBe(join(root, 'Payday', 'Info.plist'))
    })

    it('never selects a test target Info.plist', () => {
        const detected = scanProject(root)
        expect(detected.infoPlist).not.toMatch(/Tests/)
    })

    it('prefers the app privacy manifest over the widget extension one', () => {
        const detected = scanProject(root)
        expect(detected.privacyManifest).toBe(join(root, 'Payday', 'PrivacyInfo.xcprivacy'))
    })
})

describe('screenshots', () => {
    it('finds none when no directory is supplied, rather than guessing', () => {
        const detected = scanProject(root)
        expect(detected.screenshots).toEqual([])
        expect(detected.screenshotsSupplied).toBe(false)
    })

    it('does not treat a screenshots/ directory of QA captures as store assets', () => {
        const detected = scanProject(root)
        // Five QA captures live at screenshots/. Inferring them was worth four
        // false criticals on a real project, including "262 screenshots, maximum
        // is 10" and invalid-dimension findings for images never submitted.
        expect(detected.screenshots).toHaveLength(0)
    })

    it('uses exactly the directory it is given', () => {
        const detected = scanProject(root, { screenshotsDir: join(root, 'marketing', 'store') })
        expect(detected.screenshotsSupplied).toBe(true)
        expect(detected.screenshots).toHaveLength(2)
        expect(detected.screenshots.every((p) => p.includes('marketing'))).toBe(true)
    })

    it('reports not supplied when the given directory does not exist', () => {
        const detected = scanProject(root, { screenshotsDir: join(root, 'nope') })
        expect(detected.screenshots).toEqual([])
    })
})

describe('ipa input', () => {
    it('marks the subject as an ipa and names it after the file', () => {
        const ipaPath = join(root, 'Payday.ipa')
        writeFileSync(ipaPath, 'PK')
        const detected = scanProject(ipaPath)
        expect(detected.subjectKind).toBe('ipa')
        expect(detected.projectName).toBe('Payday')
        expect(detected.ipa).toBe(ipaPath)
    })
})
