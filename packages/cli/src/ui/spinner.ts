import ora, { type Ora } from 'ora'
import chalk from 'chalk'

export function createSpinner(text: string): Ora {
    return ora({
        text,
        color: 'cyan',
        spinner: 'dots',
    })
}

export function success(message: string) {
    console.log(chalk.green('  +') + ' ' + message)
}

export function error(message: string) {
    console.log(chalk.red('  !') + ' ' + message)
}

export function warn(message: string) {
    console.log(chalk.yellow('  !') + ' ' + message)
}

export function info(message: string) {
    console.log(chalk.blue('  i') + ' ' + message)
}

export function header(text: string) {
    console.log()
    console.log(chalk.bold.cyan('  Preflight') + chalk.dim(' - App Store Review Scanner'))
    console.log()
}
