import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { scanCommand } from './commands/scan.js'
import { updateCommand } from './commands/update.js'
import { handleUnknownCommand } from './ui/errors.js'
import { applyThemePatch } from './ui/theme.js'

applyThemePatch()

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

const program = new Command()

program
    .name('preflight')
    .description('Preflight - local App Store review scanner')
    .version(pkg.version)

program
    .command('scan [path]')
    .description('Scan an iOS project locally for App Store review risks')
    .action(scanCommand)

program
    .command('update')
    .description('Update Preflight to the latest npm version')
    .action(() => updateCommand(pkg.version))

program.on('command:*', (operands) => {
    handleUnknownCommand(operands[0])
    process.exitCode = 1
})

if (process.argv.length <= 2) {
    scanCommand().catch((err) => {
        console.error(err)
        process.exit(1)
    })
} else {
    program.parse()
}
