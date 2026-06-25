import Conf from 'conf'

interface PreflightConfig {
    lastScannedPath?: string
}

const config = new Conf<PreflightConfig>({
    projectName: 'preflight',
    schema: {
        lastScannedPath: { type: 'string' },
    },
})

export function setLastScannedPath(path: string) {
    config.set('lastScannedPath', path)
}

export function getLastScannedPath(): string | undefined {
    return config.get('lastScannedPath')
}

export { config }
