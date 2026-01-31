# Publishing to npm

The package is published as **@ch4r10teer41/clawpass** at [npmjs.com/package/@ch4r10teer41/clawpass](https://www.npmjs.com/package/@ch4r10teer41/clawpass).

## Option A: Publish via GitHub Release (automated)

1. **Add NPM_TOKEN to GitHub secrets** (one-time):
   - Go to [npmjs.com](https://www.npmjs.com/) → Account → Access Tokens → Generate New Token
   - Choose "Automation" or "Publish" token
   - In your repo: Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`, Value: your npm token

2. **Create a release** on GitHub:
   - Go to [Releases](https://github.com/ch4r10t33r/clawpass/releases)
   - Click "Create a new release"
   - Choose a tag (e.g. `v1.0.2`)
   - Publish the release

3. The **Publish to npm** workflow runs and publishes to registry.npmjs.org.

## Option B: Publish manually

npm requires **2FA or an Automation token** for publishing.

### Using an Automation token (recommended)

1. **Create a token** at [npmjs.com](https://www.npmjs.com/) → Account → Access Tokens → Generate New Token
2. Choose **"Automation"** (bypasses 2FA for scripts)
3. **Publish**:
   ```bash
   npm run build
   npm publish --access public
   ```
   With token in env:
   ```bash
   export NPM_TOKEN=your_automation_token
   echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
   npm publish
   ```
   Or add to `~/.npmrc`:
   ```
   //registry.npmjs.org/:_authToken=YOUR_TOKEN
   ```

### Using npm login + 2FA

1. **Enable 2FA** on npm if not already (Account → Security)
2. **Log in**:
   ```bash
   npm login
   ```
   Username: ch4r10teer41, password, email
3. **Publish** (you'll be prompted for OTP):
   ```bash
   npm run build
   npm publish --access public
   ```

## Install after publishing

Users install with:

```bash
npm install @ch4r10teer41/clawpass ethers
```

No special registry config needed; the package is on the public npm registry.

## OpenClaw plugin install

```bash
openclaw plugins install @ch4r10teer41/clawpass
```

## Troubleshooting

- **403 Forbidden**: Log in with `npm login`; ensure you own the @ch4r10teer41 scope on npm.
- **Nothing to publish**: Run `npm run build` so `dist/` exists.
