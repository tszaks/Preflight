import { apiRequest } from '../lib/api-client.js'
import { createSpinner, success, error } from '../ui/spinner.js'
import * as ui from '../ui/interactive.js'
import chalk from 'chalk'

export async function reportRejection(submissionId: string): Promise<void> {
    try {
        // Confirm they want to report a rejection
        console.log()
        const confirmed = await ui.confirm('Did Apple reject this submission?', true)

        if (confirmed === null || !confirmed) {
            console.log()
            return
        }

        // Get rejection date
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        const rejectionDateStr = await ui.text({
            message: 'When did Apple reject it? (YYYY-MM-DD)',
            defaultValue: todayStr,
            validate: (value) => {
                if (!value) return 'Date is required'
                const date = new Date(value)
                if (isNaN(date.getTime())) return 'Invalid date format'
                if (date > today) return 'Rejection date cannot be in the future'
                return undefined
            },
        })

        if (rejectionDateStr === null) {
            console.log()
            return
        }

        // Get rejection reason
        const rejectionReason = await ui.text({
            message: 'What did Apple say? (e.g., "Guideline 4.3 - Design: Spam...") ',
            placeholder: 'Paste the rejection reason here...',
            validate: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Rejection reason is required'
                }
                return undefined
            },
        })

        if (rejectionReason === null) {
            console.log()
            return
        }

        // Get guideline (optional)
        const guidelineViolated = await ui.text({
            message: 'Guideline number (optional, e.g., "4.3")',
            placeholder: '4.3',
        })

        // Prepare request
        const spinner = ui.spinner()
        spinner.start('Reporting rejection...')

        const res = await apiRequest(`/api/submissions/${submissionId}/report-rejection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rejectionDate: rejectionDateStr,
                rejectionReason: rejectionReason.trim(),
                guidelineViolated: guidelineViolated && guidelineViolated.trim() ? guidelineViolated.trim() : undefined,
            }),
        })

        const data = await res.json()
        spinner.stop()

        if (!res.ok) {
            console.log()
            if (res.status === 429) {
                error(`Rate limit: ${data.message}`)
            } else if (res.status === 409) {
                error(`Already reported: ${data.message}`)
            } else {
                error(data.message || 'Failed to report rejection')
            }
            console.log()
            return
        }

        // Show success
        console.log()
        success('Rejection reported!')
        console.log()
        console.log(chalk.green(`  [OK] ${data.refundedCredits} credits refunded`))
        console.log(chalk.cyan(`  New balance: ${data.newCreditBalance} credits`))
        console.log()
        console.log(chalk.dim('  This data helps us improve our predictions for the future.'))
        console.log()
    } catch (err) {
        error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.log()
    }
}
