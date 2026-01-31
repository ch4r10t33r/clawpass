# Publishing to GitHub Packages

The package is published as **@ch4r10t33r/clawpass** to [GitHub Packages](https://github.com/ch4r10t33r/clawpass/packages).

## Option A: Publish via GitHub Release (automated)

1. **Create a release** on GitHub:
   - Go to [Releases](https://github.com/ch4r10t33r/clawpass/releases)
   - Click "Create a new release"
   - Choose a tag (e.g. `v1.0.0`)
   - Publish the release

2. The **Publish to GitHub Packages** workflow runs automatically and publishes the package.

No manual publish needed. The workflow uses `GITHUB_TOKEN` (built-in secret).

## Option B: Publish manually

1. **Create a Personal Access Token** (PAT):
   - GitHub → Settings → Developer settings → Personal access tokens
   - New token with `write:packages` and `read:packages`

2. **Log in to GitHub Packages**:
   ```bash
   npm login --registry=https://npm.pkg.github.com
   ```
   - Username: your GitHub username
   - Password: your PAT (not your GitHub password)
   - Email: your email

3. **Build and publish**:
   ```bash
   npm run build
   npm publish
   ```

The project `.npmrc` already configures `@ch4r10t33r` to use the GitHub Packages registry.

## Install after publishing

Users must point npm at GitHub Packages for this scope. Add to their project `.npmrc` (or `~/.npmrc`):

```
@ch4r10t33r:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then (with `GITHUB_TOKEN` set to a PAT with `read:packages`):

```bash
npm install @ch4r10t33r/clawpass ethers
```

Or for public packages, anonymous read may work if the package is public; otherwise a PAT is required.

## OpenClaw plugin install

```bash
openclaw plugins install @ch4r10t33r/clawpass
```

Ensure the OpenClaw/npm environment has `@ch4r10t33r` scoped to GitHub Packages and a valid auth token if the package is private.

## Troubleshooting

- **403 Forbidden**: Check PAT has `write:packages` (publish) or `read:packages` (install).
- **Nothing to publish**: Run `npm run build` so `dist/` exists.
- **Package not found (install)**: Add `.npmrc` with scope and auth token; ensure the package is published and accessible.
