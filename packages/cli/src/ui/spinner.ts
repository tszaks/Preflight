import ora, { type Ora } from 'ora'
import chalk from 'chalk'
import { brand, brandDim } from './theme.js'

export function createSpinner(text: string): Ora {
    return ora({
        text,
        color: 'yellow',
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
    console.log(brandDim('  i') + ' ' + message)
}

export function header(text: string) {
    console.log()
    console.log(brand('  Preflight') + chalk.dim(' - App Store Review Scanner'))
    console.log()
}
