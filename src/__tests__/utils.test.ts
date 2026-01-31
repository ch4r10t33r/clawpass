/**
 * Tests for utility functions
 */

import {
  toFixedPoint,
  fromFixedPoint,
  calculateHash,
  verifyHash,
  createIPFSUri,
  extractCIDFromIPFS,
  ipfsToHTTP,
  encodeMetadata,
  decodeMetadata,
  formatAgentRegistryString,
  parseAgentRegistryString,
} from '../utils';

describe('Fixed Point Conversion', () => {
  test('toFixedPoint converts correctly', () => {
    expect(toFixedPoint(4.5, 1)).toBe(45n);
    expect(toFixedPoint(100, 0)).toBe(100n);
    expect(toFixedPoint(0.123, 3)).toBe(123n);
    expect(toFixedPoint(99.99, 2)).toBe(9999n);
  });

  test('fromFixedPoint converts correctly', () => {
    expect(fromFixedPoint(45n, 1)).toBe(4.5);
    expect(fromFixedPoint(100n, 0)).toBe(100);
    expect(fromFixedPoint(123n, 3)).toBe(0.123);
    expect(fromFixedPoint(9999n, 2)).toBe(99.99);
  });

  test('toFixedPoint throws on invalid decimals', () => {
    expect(() => toFixedPoint(1, -1)).toThrow();
    expect(() => toFixedPoint(1, 19)).toThrow();
  });

  test('fromFixedPoint throws on invalid decimals', () => {
    expect(() => fromFixedPoint(1n, -1)).toThrow();
    expect(() => fromFixedPoint(1n, 19)).toThrow();
  });
});

describe('Hash Functions', () => {
  test('calculateHash produces consistent hashes', () => {
    const content = 'test content';
    const hash1 = calculateHash(content);
    const hash2 = calculateHash(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('verifyHash validates correctly', () => {
    const content = 'test content';
    const hash = calculateHash(content);
    expect(verifyHash(content, hash)).toBe(true);
    expect(verifyHash('different content', hash)).toBe(false);
  });
});

describe('IPFS Utilities', () => {
  test('createIPFSUri formats correctly', () => {
    expect(createIPFSUri('QmTest123')).toBe('ipfs://QmTest123');
  });

  test('extractCIDFromIPFS extracts CID', () => {
    expect(extractCIDFromIPFS('ipfs://QmTest123')).toBe('QmTest123');
  });

  test('extractCIDFromIPFS throws on invalid URI', () => {
    expect(() => extractCIDFromIPFS('https://example.com')).toThrow();
  });

  test('ipfsToHTTP converts to gateway URL', () => {
    expect(ipfsToHTTP('ipfs://QmTest123')).toBe('https://ipfs.io/ipfs/QmTest123');
    expect(ipfsToHTTP('ipfs://QmTest123', 'https://gateway.pinata.cloud')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmTest123'
    );
  });
});

describe('Metadata Encoding', () => {
  test('encodeMetadata encodes string to hex', () => {
    const encoded = encodeMetadata('test');
    expect(encoded).toMatch(/^0x[a-f0-9]+$/);
  });

  test('decodeMetadata decodes hex to string', () => {
    const original = 'test metadata';
    const encoded = encodeMetadata(original);
    const decoded = decodeMetadata(encoded);
    expect(decoded).toBe(original);
  });
});

describe('Agent Registry String', () => {
  test('formatAgentRegistryString formats correctly', () => {
    expect(formatAgentRegistryString('eip155', '1', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(
      'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    );
  });

  test('parseAgentRegistryString parses correctly', () => {
    const parsed = parseAgentRegistryString('eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(parsed.namespace).toBe('eip155');
    expect(parsed.chainId).toBe('1');
    expect(parsed.identityRegistry).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  test('parseAgentRegistryString throws on invalid format', () => {
    expect(() => parseAgentRegistryString('invalid')).toThrow();
    expect(() => parseAgentRegistryString('eip155:1')).toThrow();
  });
});
