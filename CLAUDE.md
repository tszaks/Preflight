# Preflight Project Instructions

---

## 🚀 Publishing to npm

**IMPORTANT:** After any code changes to the CLI, **always publish to npm** so users get the update.

### Quick Version Bump & Publish

When CLI code changes are committed and pushed:

1. **Update three files with new version:**
   - `packages/cli/package.json` — `"version"` field
   - `packages/cli/src/index.ts` — `.version()` string (line ~27)
   - `packages/cli/src/ui/theme.ts` — `APP_VERSION` constant (line ~81)

2. **Commit and push:**
   ```bash
   cd ~/Projects/Preflight
   git add packages/cli/package.json packages/cli/src/index.ts packages/cli/src/ui/theme.ts
   git commit -m "chore: bump CLI version to X.Y.Z"
   git push origin main
   ```

3. **Publish to npm (from terminal — requires biometric auth):**
   ```bash
   cd ~/Projects/Preflight/packages/cli
   npm publish --access public
   ```
   Browser will prompt for fingerprint/Face ID. You must run this from your terminal, not Claude Code.

### Version Bump Strategy

- **Patch (0.x.Y):** Bug fixes, small enhancements, dependency updates
- **Minor (0.X.0):** New features (like file picker integration)
- **Major (X.0.0):** Breaking changes

### Verify Publication

```bash
npm view preflightlaunch version
```

Should return the new version.

---

## 🛠️ Development

### Build & Test

```bash
npm run build          # Compile TypeScript
npm run dev submit     # Test submit command interactively
```

### File Picker Integration

The CLI now has native macOS Finder file/folder pickers for path inputs:
- **Screenshots folder** — `promptForPath()` with Browse | Manual | Skip
- **Project selection** — `browseForFolder()` with fallback to text
- **All path prompts** — Consistent UX via `promptForPath()` utility

Uses `packages/cli/src/lib/file-picker.ts` for core utilities.

---

## 📋 Architecture Notes

### Key Files

| File | Purpose |
|------|---------|
| `packages/cli/src/lib/file-picker.ts` | Reusable Finder picker utilities |
| `packages/cli/src/commands/submit.ts` | Submission flow (uses file picker for screenshots) |
| `packages/cli/src/lib/project-finder.ts` | Project discovery & selection |
| `packages/cli/src/ui/interactive.ts` | UI prompt wrappers |

### Platform Support

- **macOS:** Native Finder picker (best UX)
- **Linux/Windows:** Text input fallback (no Finder available)

---
