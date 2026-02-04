import { resolve, basename, extname, join } from 'node:path'
import { statSync, readdirSync, existsSync } from 'node:fs'
import * as ui from '../../../ui/interactive.js'
import { promptForPath } from '../../../lib/file-picker.js'
import { SubmissionStep, StepResult } from '../BaseStep.js'
import { DraftState, FileToUpload } from '../types.js'

export class ScreenshotsStep implements SubmissionStep {
    name = 'Screenshots'

    constructor(private filesToUpload: FileToUpload[]) { }

    async run(state: DraftState): Promise<StepResult> {
        while (true) {
            const screenshotCount = this.filesToUpload.filter((f) => f.type === 'screenshot').length

            // If we already have screenshots (from auto-detection or previous selection), 
            // show the continue/change/back menu
            if (screenshotCount > 0) {
                const action = await ui.select<'continue' | 'change' | 'back'>({
                    message: `Screenshots (${screenshotCount} added)`,
                    options: [
                        { value: 'continue', label: 'Continue', hint: 'Proceed to app details' },
                        { value: 'change', label: 'Change screenshots', hint: 'Select different screenshots' },
                        { value: 'back', label: 'Back', hint: 'Return to previous step' },
                    ],
                })

                if (action === null) return { action: 'save_draft' }
                if (action === 'back') return { action: 'back' }
                if (action === 'continue') return { action: 'next' }
                // action === 'change', fall through to re-select
            }

            // Screenshot selection menu
            const screenshotChoice = await ui.select<'manual' | 'browse' | 'skip' | 'back'>({
                message: 'How do you want to provide screenshots?',
                options: [
                    { value: 'browse', label: 'Browse with Finder', hint: 'Select files or a folder' },
                    { value: 'manual', label: 'Enter path manually', hint: 'Type or paste file/folder path' },
                    { value: 'skip', label: 'Skip', hint: 'Continue without screenshots' },
                    { value: 'back', label: 'Back', hint: 'Return to previous step' }
                ],
            })

            if (screenshotChoice === null) return { action: 'save_draft' }

            if (screenshotChoice === 'back') {
                return { action: 'back' }
            }

            if (screenshotChoice === 'skip') {
                // No screenshots, skip to next step
                return { action: 'next' }
            }

            if (screenshotChoice === 'manual') {
                await this.handleManualEntry(state)
                // Loop continues - if screenshots were added, screenshotCount check will show continue menu
            } else if (screenshotChoice === 'browse') {
                await this.handleBrowse(state)
                // Loop continues - if screenshots were added, screenshotCount check will show continue menu
            }
        }
    }

    private async handleManualEntry(state: DraftState) {
        const manualPath = await ui.text({
            message: 'Enter screenshot path (file or folder)',
            placeholder: '/path/to/screenshots',
            validate: (val) => {
                if (!val?.trim()) return 'Path is required'
                const resolved = resolve(val.replace(/^~/, process.env.HOME || ''))
                if (!existsSync(resolved)) return 'Path does not exist'
            },
        })

        if (manualPath === null) return // Cancel handled by loop re-entry or outer undefined check

        const count = this.loadScreenshotsFromPath(manualPath, state)
        if (count > 0) {
            ui.log.success(`Found ${count} screenshot${count === 1 ? '' : 's'}`)
        } else {
            ui.log.warning('No images found. Try another path.')
        }
    }

    private async handleBrowse(state: DraftState) {
        const browseChoice = await ui.select<'files' | 'folder' | 'back'>({
            message: 'Browse for screenshots',
            options: [
                { value: 'files', label: 'Select files', hint: 'Pick specific images' },
                { value: 'folder', label: 'Select folder', hint: 'All images in a directory' },
                { value: 'back', label: 'Back', hint: 'Return to previous menu' },
            ],
        })

        if (browseChoice === null || browseChoice === 'back') {
            return
        } else if (browseChoice === 'folder') {
            const folderPath = await promptForPath({
                message: 'Select folder containing screenshots',
                type: 'folder',
                allowSkip: false,
                mode: 'browse',
            })

            if (folderPath && typeof folderPath === 'string') {
                const count = this.loadScreenshotsFromPath(folderPath, state)
                if (count > 0) {
                    ui.log.success(`Found ${count} screenshot${count === 1 ? '' : 's'}`)
                } else {
                    ui.log.warning('No images found in that folder.')
                }
            }
        } else {
            // File selection mode
            const screenshotPath = await promptForPath({
                message: 'Select screenshot files',
                type: 'files',
                fileTypes: ['public.png', 'public.jpeg'],
                allowSkip: false,
                mode: 'browse',
            })

            if (screenshotPath && Array.isArray(screenshotPath)) {
                this.updateFiles(screenshotPath, state)
                ui.log.success(`Found ${screenshotPath.length} screenshot${screenshotPath.length === 1 ? '' : 's'}`)
            }
        }
    }

    private loadScreenshotsFromPath(pathStr: string, state: DraftState): number {
        try {
            const resolved = resolve(pathStr.replace(/^\~/, process.env.HOME || ''))
            const stats = statSync(resolved)

            if (stats.isDirectory()) {
                const imageExts = ['.png', '.jpg', '.jpeg']
                const foundFiles = readdirSync(resolved)
                    .filter((f) => imageExts.includes(extname(f).toLowerCase()))
                    .map((f) => join(resolved, f))

                this.updateFiles(foundFiles, state)
                return foundFiles.length
            } else {
                if (['.png', '.jpg', '.jpeg'].includes(extname(resolved).toLowerCase())) {
                    this.updateFiles([resolved], state)
                    return 1
                }
            }
        } catch {
            return 0
        }
        return 0
    }

    private updateFiles(newPaths: string[], state?: DraftState) {
        // Remove existing screenshots
        const screenshotIndices = this.filesToUpload
            .map((f, i) => (f.type === 'screenshot' ? i : -1))
            .filter((i) => i !== -1)
            .reverse()

        for (const idx of screenshotIndices) {
            this.filesToUpload.splice(idx, 1)
        }

        // Add new ones (max 10)
        const pathsToStore: string[] = []
        for (let i = 0; i < Math.min(newPaths.length, 10); i++) {
            this.filesToUpload.push({
                type: 'screenshot',
                index: i,
                filename: basename(newPaths[i]),
                path: newPaths[i],
            })
            pathsToStore.push(newPaths[i])
        }

        // Update draft state for persistence
        if (state) {
            state._screenshotPaths = pathsToStore
        }
    }
}
