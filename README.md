# ctx7proxy

A macOS menu-bar and Windows system-tray app that distributes Context7 REST and MCP requests across multiple API-key accounts.

## Install

Install globally from npm, then launch the tray app:

```bash
npm install --global ctx7proxy
ctx7proxy
```

Open the tray icon, add one or more `ctx7sk-…` account keys, and copy the MCP endpoint. Keys are encrypted with the operating system's secure storage and never exposed to the settings window after saving.

Configure a Context7 MCP client to use `http://127.0.0.1:3000/mcp`. REST calls keep their original paths, for example:

```bash
curl 'http://127.0.0.1:3000/api/v2/libs/search?libraryName=react&query=state'
```

If a client access token is configured in Settings, clients must send `Authorization: Bearer <proxy-key>`. The proxy replaces that credential with the selected Context7 account key. `/health` reports only account IDs and states; it never exposes keys.

## Pool behavior

Healthy accounts are selected round-robin. A `429` or upstream `5xx` puts an account into cooldown; `Retry-After` is honored when present. A `401` or `403` disables the rejected account until restart. MCP session IDs remain pinned to the account that created them. If every account is unavailable, the proxy returns `503`.

```bash
npm test
npm run lint
```

## Develop and package

Requires Node.js 20 or newer.

```bash
npm install
npm start       # Run Electron in development
npm run package # Build an unpacked app for the current platform
npm run make    # Build a distributable installer
```

Build macOS installers on macOS and Windows installers on Windows. Forge produces a DMG/ZIP on macOS and a Squirrel `Setup.exe` on Windows under `out/make/`. Production releases should be code-signed for each platform.

Local macOS builds reuse the Developer ID Application identity and `twinpane-notary` Keychain profile installed for TwinPane. Release builds require these GitHub Actions secrets:

- macOS: `APPLE_CERTIFICATE` (base64 PKCS#12), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`.
- Windows: `WINDOWS_CERTIFICATE` (base64 PFX) and `WINDOWS_CERTIFICATE_PASSWORD`.

The release workflow fails instead of distributing unsigned installers when signing certificates are missing.

The headless environment-driven proxy remains available through `npm run start:proxy`; see `.env.example` for its configuration.

## Publish

Confirm the package name and contents before publishing:

```bash
npm test
npm pack --dry-run
npm publish --access public
```

Publishing requires an authenticated npm account with two-factor authentication or a granular automation token.
