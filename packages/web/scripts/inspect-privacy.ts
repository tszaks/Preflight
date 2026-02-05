import { createInterface } from 'node:readline'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { SignJWT, importPKCS8 } from 'jose'

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com/v1'

async function generateJWT(keyId: string, issuerId: string, privateKeyContent: string) {
    const now = Math.floor(Date.now() / 1000)
    const privateKey = await importPKCS8(privateKeyContent, 'ES256')

    return new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
        .setIssuer(issuerId)
        .setIssuedAt(now)
        .setExpirationTime(now + 1200)
        .setAudience('appstoreconnect-v1')
        .sign(privateKey)
}

async function ascFetch(path: string, token: string) {
    const res = await fetch(`${ASC_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`API Error ${res.status}: ${text}`)
    }
    return res.json()
}

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function main() {
    console.log('--- ASC Privacy Inspector ---')

    // Hardcoded credentials
    const keyId = 'JR8L6HTF5G'
    const issuerId = 'a1f32cb6-e502-4cdd-b77a-7dcf7c607d22'
    const p8Path = '/Users/tyler/Downloads/Archived Downloads/AuthKey_JR8L6HTF5G.p8'

    rl.close()

    const resolvedP8 = resolve(p8Path.replace(/^~/, process.env.HOME || ''))
    if (!existsSync(resolvedP8)) {
        console.error('File not found:', resolvedP8)
        process.exit(1)
    }
    const privateKey = readFileSync(resolvedP8, 'utf-8')

    console.log('Generating Token...')
    const token = await generateJWT(keyId.trim(), issuerId.trim(), privateKey)

    console.log('Fetching Apps...')
    const apps = await ascFetch('/apps?limit=5', token)

    if (apps.data.length === 0) {
        console.log('No apps found.')
        return
    }

    const appId = apps.data[0].id
    console.log(`Inspecting App: ${apps.data[0].attributes.name} (${appId})`)

    const infos = await ascFetch(`/apps/${appId}/appInfos?limit=1`, token)
    if (infos.data.length > 0) {
        const info = infos.data[0]
        console.log(`Inspecting AppInfo: ${info.id}`)
        console.log('--- AppInfo Attributes ---')
        console.log(JSON.stringify(info.attributes, null, 2))
        console.log('--- AppInfo Relationships ---')
        console.log(JSON.stringify(Object.keys(info.relationships || {}), null, 2))

        const locs = await ascFetch(`/appInfos/${info.id}/appInfoLocalizations`, token)
        if (locs.data.length > 0) {
            const loc = locs.data[0]
            console.log('AppInfo Localization Attributes:', Object.keys(loc.attributes))
            console.log('AppInfo Privacy Policy URL:', loc.attributes.privacyPolicyUrl)
            console.log('AppInfo Privacy Policy Text:', loc.attributes.privacyPolicyText)
        }
    }

    // Also check the main app object
    console.log('\n--- Main App Attributes ---')
    const app = apps.data[0]
    console.log(JSON.stringify(app.attributes, null, 2))
    console.log('--- Main App Relationships ---')
    console.log(JSON.stringify(Object.keys(app.relationships || {}), null, 2))

    // Try fetching the app with all fields to find privacy-related ones
    console.log('\n--- Checking for app privacy details ---')
    try {
        const appWithPrivacy = await ascFetch(`/apps/${appId}?fields[apps]=contentRightsDeclaration`, token)
        console.log('App with contentRightsDeclaration:', appWithPrivacy.data.attributes)
    } catch (e) {
        console.log('Error fetching app with privacy fields:', e)
    }
}

main().catch(console.error)
