# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-31

### Added

- Initial release of Clawpass ERC-8004 interface module
- `ClawpassClient` - Unified client for all three registries
- `IdentityRegistryClient` - Complete interface to Identity Registry
  - Agent registration with URI and metadata
  - Agent URI management (IPFS, HTTPS, data URIs)
  - Metadata operations (get/set)
  - Agent wallet management with EIP-712 signatures
  - Owner queries
- `ReputationRegistryClient` - Complete interface to Reputation Registry
  - Feedback submission with fixed-point values
  - Feedback revocation
  - Response appending
  - Summary aggregation with Sybil protection
  - Feedback queries with filtering
  - Client management
- `ValidationRegistryClient` - Complete interface to Validation Registry
  - Validation request submission
  - Validation response handling
  - Status queries
  - Summary aggregation
  - Request tracking
- Comprehensive type definitions
  - All ERC-8004 data structures
  - Helper types for common operations
  - Type conversion utilities
- Zod schemas for runtime validation
  - Agent registration file validation
  - Feedback file validation
  - Service and registration validation
- Utility functions
  - Data URI encoding/decoding
  - Fixed-point number conversion
  - Hash calculation and verification
  - IPFS URI handling
  - Metadata encoding/decoding
  - Agent registry string formatting
- Contract ABIs
  - Identity Registry ABI
  - Reputation Registry ABI
  - Validation Registry ABI
- Integration examples
  - Basic usage examples
  - Moltbook integration example
  - Moltx.io integration example
- Comprehensive documentation
  - README with quick start and API reference
  - ARCHITECTURE document
  - CONTRIBUTING guidelines
  - TypeScript support with full type definitions
- Test suite
  - Unit tests for utilities
  - Schema validation tests
  - Test configuration with Jest

### Features

- **Modular Design**: Use individual registry clients or unified client
- **Type Safety**: Full TypeScript support with runtime validation
- **Framework Agnostic**: Works with any JavaScript/TypeScript project
- **Dual Module Support**: CommonJS and ESM builds
- **IPFS Support**: Built-in IPFS URI handling
- **Data URI Support**: On-chain storage for small registration files
- **EIP-712 Signatures**: Secure agent wallet management
- **Sybil Protection**: Required client filtering for reputation queries
- **Flexible Validation**: Support for multiple validation models
- **Comprehensive Examples**: Real-world integration patterns

### Dependencies

- ethers ^6.11.1 (peer dependency)
- zod ^3.22.4

### Development Dependencies

- TypeScript 5.3.3
- Jest 29.7.0
- ESLint 8.56.0
- Prettier 3.2.5
- tsup 8.0.2

## [Unreleased]

### Planned

- Event listening and subscription
- Batch operations support
- Caching layer for frequently accessed data
- Subgraph integration for historical queries
- Multi-chain helper utilities
- Additional validation model examples
- Performance optimizations
- Extended test coverage
- Wallet connection library integrations
