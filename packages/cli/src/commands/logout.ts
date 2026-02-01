import { logout } from '../lib/auth.js'
import { success } from '../ui/spinner.js'

export async function logoutCommand() {
    logout()
    success('Logged out successfully.')
}
