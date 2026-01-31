# Contributing to Clawpass

Thank you for your interest in contributing to Clawpass! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/clawpass.git
   cd clawpass
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Strategy

- `main` - Stable releases
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Write or update tests
4. Run linter and formatter:
   ```bash
   npm run lint
   npm run format
   ```

5. Run tests:
   ```bash
   npm test
   ```

6. Commit your changes:
   ```bash
   git commit -m "feat: add new feature"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test updates
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

Examples:
```
feat: add support for custom IPFS gateways
fix: handle null values in feedback queries
docs: update integration examples
test: add tests for validation client
```

## Code Style

### TypeScript Guidelines

1. **Type Safety**
   - Always use explicit types
   - Avoid `any` unless absolutely necessary
   - Use type guards for runtime checks

2. **Naming Conventions**
   - Classes: PascalCase (`ClawpassClient`)
   - Functions/methods: camelCase (`getAgentInfo`)
   - Constants: UPPER_SNAKE_CASE (`MAX_DECIMALS`)
   - Interfaces: PascalCase with descriptive names

3. **File Organization**
   - One class per file
   - Group related functionality
   - Export from index files

4. **Comments**
   - JSDoc for public APIs
   - Inline comments for complex logic
   - Avoid obvious comments

Example:
```typescript
/**
 * Register a new agent on the blockchain
 * @param agentURI - URI pointing to agent registration file
 * @param metadata - Optional metadata entries
 * @returns The assigned agent ID
 */
async register(agentURI?: string, metadata?: MetadataEntry[]): Promise<bigint> {
  // Implementation
}
```

### Code Formatting

We use Prettier for code formatting:

```bash
npm run format
```

Configuration in `.prettierrc`:
- 2 spaces for indentation
- Single quotes
- Semicolons
- 100 character line length
- Trailing commas (ES5)

### Linting

We use ESLint for code quality:

```bash
npm run lint
```

Fix automatically:
```bash
npm run lint -- --fix
```

## Testing

### Test Structure

- Unit tests: `src/**/__tests__/*.test.ts`
- Integration tests: `tests/integration/*.test.ts`
- Example tests: `examples/**/*.test.ts`

### Writing Tests

1. **Unit Tests**
   - Test individual functions/methods
   - Mock external dependencies
   - Cover edge cases

2. **Integration Tests**
   - Test multiple components together
   - Use test networks or mocks
   - Verify end-to-end flows

3. **Test Coverage**
   - Aim for >80% coverage
   - Critical paths should have 100% coverage
   - Run coverage report:
     ```bash
     npm test -- --coverage
     ```

Example test:
```typescript
describe('IdentityRegistryClient', () => {
  test('register creates new agent', async () => {
    const client = new IdentityRegistryClient(address, signer);
    const agentId = await client.register('ipfs://test');
    expect(agentId).toBeGreaterThan(0n);
  });
});
```

## Documentation

### Code Documentation

- All public APIs must have JSDoc comments
- Include parameter descriptions
- Document return values
- Add usage examples for complex APIs

### README Updates

Update README.md when:
- Adding new features
- Changing public APIs
- Adding examples
- Updating dependencies

### Example Code

- Keep examples up-to-date
- Test examples to ensure they work
- Add comments explaining key concepts

## Pull Request Process

### Before Submitting

1. ✅ Tests pass (`npm test`)
2. ✅ Linter passes (`npm run lint`)
3. ✅ Code formatted (`npm run format`)
4. ✅ Type checking passes (`npm run typecheck`)
5. ✅ Documentation updated
6. ✅ Examples updated if needed

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Any breaking changes
- Related issues

Template:
```markdown
## Description
Brief description of changes

## Motivation
Why these changes are needed

## Changes
- Change 1
- Change 2

## Testing
How to test these changes

## Breaking Changes
List any breaking changes

## Related Issues
Closes #123
```

### Review Process

1. Submit PR to `develop` branch
2. Automated checks run (CI/CD)
3. Code review by maintainers
4. Address feedback
5. Approval and merge

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Build and verify distribution
6. Create GitHub release
7. Publish to npm

## Getting Help

### Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Communication

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Discord: Real-time chat (link in README)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Unprofessional conduct

### Enforcement

Violations can be reported to the maintainers. All reports will be reviewed and investigated.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing to Clawpass! 🎉
