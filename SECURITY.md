# Security policy

## Supported versions

Only the latest release of Preflight gets security fixes.

| Version | Supported |
|---|---|
| 1.1.x (latest) | Yes |
| Older | No |

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub private vulnerability reporting: open the **Security** tab of this repository and choose **Report a vulnerability**. If that is not available to you, email tyler@szakacsmedia.com.

Please include:

- What you found and what an attacker could do with it.
- Steps to reproduce, or a sample project or `.ipa` that triggers it.
- Your OS, Node version and Preflight version (`preflight --version`).

You can expect a first reply within a few days. Preflight is maintained by a small team, so a fix may take longer, but you will get updates. Once a fix is released we will credit you in the changelog unless you prefer to stay anonymous.

## What counts

Preflight reads iOS projects, archives and built apps on your machine, and can call App Store Connect with a key you give it. These areas matter most:

- **App Store Connect credentials.** The CLI takes a key ID, an issuer ID and a `.p8` private key (flags, environment variables or a key file). Anything that logs, stores or sends the key, or uses it to write to your account, is a vulnerability. Preflight is meant to be read-only. Keep the key out of shell history and CI logs.
- **Parsing untrusted input.** Scanning a project, `.xcarchive` or `.ipa` from someone else means parsing their files (plists, privacy manifests, Mach-O binaries, zip archives). Anything that lets such a file run code, write outside its folder, or exhaust memory is a vulnerability.
- **Network requests.** The scan fetches the privacy policy, support, terms and marketing URLs your project or flags supply. A project can name any URL, so treat scans of untrusted projects like opening an untrusted link. Anything that sends project contents off the machine is a vulnerability.
- **`preflight update`.** It asks the npm registry for the latest version and can install it. Anything that installs something other than the official package is a vulnerability.
- **The MCP server.** `preflight mcp` lets an agent scan paths on your machine. It reads files and returns scan results. It should never write files or run other programs.
- **The rule set.** A rule that makes the scanner misreport is a correctness bug. It is a security problem only if it can be used to hide a finding on purpose.

The CLI has no analytics and no crash reporting. See the [FAQ in the README](README.md#faq).
