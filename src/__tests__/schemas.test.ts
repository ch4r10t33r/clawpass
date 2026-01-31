/**
 * Tests for Zod schemas
 */

import {
  AgentRegistrationFileSchema,
  AgentServiceSchema,
  AgentRegistrationSchema,
  FeedbackFileSchema,
} from '../schemas';

describe('AgentServiceSchema', () => {
  test('validates valid service', () => {
    const validService = {
      name: 'A2A',
      endpoint: 'https://agent.example.com',
      version: '0.3.0',
    };
    expect(() => AgentServiceSchema.parse(validService)).not.toThrow();
  });

  test('validates service without optional fields', () => {
    const minimalService = {
      name: 'MCP',
      endpoint: 'https://mcp.example.com',
    };
    expect(() => AgentServiceSchema.parse(minimalService)).not.toThrow();
  });
});

describe('AgentRegistrationSchema', () => {
  test('validates valid registration', () => {
    const validRegistration = {
      agentId: 1,
      agentRegistry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    };
    expect(() => AgentRegistrationSchema.parse(validRegistration)).not.toThrow();
  });

  test('rejects invalid registry format', () => {
    const invalidRegistration = {
      agentId: 1,
      agentRegistry: 'invalid-format',
    };
    expect(() => AgentRegistrationSchema.parse(invalidRegistration)).toThrow();
  });
});

describe('AgentRegistrationFileSchema', () => {
  test('validates complete registration file', () => {
    const validFile = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'TestAgent',
      description: 'A test agent',
      image: 'https://example.com/image.png',
      services: [
        {
          name: 'A2A',
          endpoint: 'https://agent.example.com',
          version: '0.3.0',
        },
      ],
      x402Support: true,
      active: true,
      registrations: [
        {
          agentId: 1,
          agentRegistry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        },
      ],
      supportedTrust: ['reputation', 'crypto-economic'],
    };
    expect(() => AgentRegistrationFileSchema.parse(validFile)).not.toThrow();
  });

  test('validates minimal registration file', () => {
    const minimalFile = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'TestAgent',
      description: 'A test agent',
      services: [],
      x402Support: false,
      active: true,
      registrations: [],
    };
    expect(() => AgentRegistrationFileSchema.parse(minimalFile)).not.toThrow();
  });

  test('rejects invalid type', () => {
    const invalidFile = {
      type: 'wrong-type',
      name: 'TestAgent',
      description: 'A test agent',
      services: [],
      x402Support: false,
      active: true,
      registrations: [],
    };
    expect(() => AgentRegistrationFileSchema.parse(invalidFile)).toThrow();
  });
});

describe('FeedbackFileSchema', () => {
  test('validates complete feedback file', () => {
    const validFeedback = {
      agentRegistry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      agentId: 1,
      clientAddress: '0x1234567890123456789012345678901234567890',
      createdAt: '2025-01-31T12:00:00Z',
      value: 45,
      valueDecimals: 1,
      tag1: 'quality',
      tag2: 'performance',
      endpoint: 'https://agent.example.com/api',
      mcp: {
        tool: 'GetPrice',
      },
      a2a: {
        skills: ['skill1', 'skill2'],
        contextId: 'ctx-123',
        taskId: 'task-456',
      },
      proofOfPayment: {
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0x0987654321098765432109876543210987654321',
        chainId: '1',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
    };
    expect(() => FeedbackFileSchema.parse(validFeedback)).not.toThrow();
  });

  test('validates minimal feedback file', () => {
    const minimalFeedback = {
      agentRegistry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      agentId: 1,
      clientAddress: '0x1234567890123456789012345678901234567890',
      createdAt: '2025-01-31T12:00:00Z',
      value: 100,
      valueDecimals: 0,
    };
    expect(() => FeedbackFileSchema.parse(minimalFeedback)).not.toThrow();
  });

  test('rejects invalid valueDecimals', () => {
    const invalidFeedback = {
      agentRegistry: 'eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      agentId: 1,
      clientAddress: '0x1234567890123456789012345678901234567890',
      createdAt: '2025-01-31T12:00:00Z',
      value: 100,
      valueDecimals: 19, // Too high
    };
    expect(() => FeedbackFileSchema.parse(invalidFeedback)).toThrow();
  });
});
