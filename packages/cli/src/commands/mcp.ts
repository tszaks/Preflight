import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { resolve } from 'node:path'
import { runScan } from './scan.js'
import { EXIT } from '../lib/scan-result.js'

/**
 * Preflight as an MCP server.
 *
 * The point of the tool is that "you or your agent" can audit an app before
 * submitting it. Shelling out to the CLI works, but an agent already holding an
 * MCP connection can call this mid-build, which is when a finding is cheapest to
 * act on.
 *
 * This is deliberately a thin wrapper over `runScan`, the same function the CLI
 * calls. It contains no rules and no analysis of its own: if the MCP result ever
 * disagrees with `preflight scan --json` for the same subject, that is a bug in
 * this file, not a difference of opinion between two implementations.
 *
 * Note on streams: an stdio MCP server speaks protocol over stdout, so nothing
 * else may be written there. `runScan` is invoked with `json: true`, which puts
 * it in quiet mode and suppresses all human rendering.
 */
export async function mcpCommand(version: string): Promise<void> {
    const server = new McpServer({
        name: 'preflight',
        version,
    })

    server.registerTool(
        'preflight_scan',
        {
            title: 'Scan an iOS app for App Store review risks',
            description: [
                'Audit an iOS project directory or a built .ipa against Apple App Store',
                'review rules, locally and offline.',
                '',
                'Read the `status` on every finding before acting on it:',
                '  - checked:      the rule ran. Act on this.',
                '  - not_checked:  the input was never supplied. This is a coverage gap,',
                '                  not a violation. Do not "fix" it in the code.',
                '  - inconclusive: the input existed but could not be read.',
                '',
                'A clean result only covers what was checked. Metadata such as the',
                'description, privacy policy URL and screenshots lives in App Store',
                'Connect rather than in the project, so pass it explicitly if you want it',
                'verified. Scanning a built .ipa checks strictly more than scanning the',
                'project directory, because the binary carries the plist and privacy',
                'manifest Apple actually receives.',
            ].join('\n'),
            inputSchema: {
                path: z.string().describe('Absolute path to an iOS project directory or a built .ipa'),
                appName: z.string().optional().describe('Overrides the app name detected from the bundle'),
                description: z.string().optional().describe('App Store description text to check'),
                privacyUrl: z.string().optional().describe('Privacy policy URL to validate and reach'),
                termsUrl: z.string().optional().describe('Terms of Use (EULA) URL to validate and reach'),
                supportUrl: z.string().optional().describe('Support URL to validate and reach'),
                marketingUrl: z.string().optional().describe('Marketing URL to validate and reach'),
                category: z.string().optional().describe('App Store category, for category-specific rules'),
                screenshots: z.string().optional().describe('Directory of App Store screenshots. Never inferred.'),
                failOn: z.enum(['critical', 'warning', 'info']).optional()
                    .describe('Severity that makes the scan fail. Defaults to critical.'),
            },
        },
        async (args) => {
            try {
                const scan = await runScan(resolve(args.path), {
                    json: true, // quiet: stdout belongs to the MCP protocol
                    yes: true,
                    failOn: args.failOn ?? 'critical',
                    appName: args.appName,
                    description: args.description,
                    privacyUrl: args.privacyUrl,
                    termsUrl: args.termsUrl,
                    supportUrl: args.supportUrl,
                    marketingUrl: args.marketingUrl,
                    category: args.category,
                    screenshots: args.screenshots,
                    version,
                })

                return {
                    content: [{ type: 'text' as const, text: JSON.stringify(scan, null, 2) }],
                    // Findings are a result, not a tool failure. Only an inability to
                    // scan is an error, so an agent can tell "your app has problems"
                    // from "I could not look at your app".
                    isError: false,
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error'
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: message, exitCode: EXIT.COULD_NOT_RUN }, null, 2),
                    }],
                    isError: true,
                }
            }
        }
    )

    const transport = new StdioServerTransport()
    await server.connect(transport)
}
