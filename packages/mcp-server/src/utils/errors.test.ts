import { describe, it, expect } from 'vitest';
import {
  AutologyError,
  NodeNotFoundError,
  InvalidNodeError,
  StorageError,
  ValidationError,
} from './errors.js';

describe('AutologyError', () => {
  it('should create error with message and code', () => {
    const error = new AutologyError('test message', 'TEST_CODE');
    expect(error.message).toBe('test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AutologyError');
  });

  it('should be instanceof Error', () => {
    const error = new AutologyError('test', 'TEST');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be instanceof AutologyError', () => {
    const error = new AutologyError('test', 'TEST');
    expect(error).toBeInstanceOf(AutologyError);
  });
});

describe('NodeNotFoundError', () => {
  it('should create error with node ID in message', () => {
    const error = new NodeNotFoundError('node-123');
    expect(error.message).toBe('Node not found: node-123');
    expect(error.code).toBe('NODE_NOT_FOUND');
    expect(error.name).toBe('NodeNotFoundError');
  });

  it('should be instanceof AutologyError', () => {
    const error = new NodeNotFoundError('node-123');
    expect(error).toBeInstanceOf(AutologyError);
  });

  it('should be instanceof NodeNotFoundError', () => {
    const error = new NodeNotFoundError('node-123');
    expect(error).toBeInstanceOf(NodeNotFoundError);
  });
});

describe('InvalidNodeError', () => {
  it('should create error with custom message', () => {
    const error = new InvalidNodeError('Invalid node data');
    expect(error.message).toBe('Invalid node data');
    expect(error.code).toBe('INVALID_NODE');
    expect(error.name).toBe('InvalidNodeError');
  });

  it('should be instanceof AutologyError', () => {
    const error = new InvalidNodeError('test');
    expect(error).toBeInstanceOf(AutologyError);
  });

  it('should be instanceof InvalidNodeError', () => {
    const error = new InvalidNodeError('test');
    expect(error).toBeInstanceOf(InvalidNodeError);
  });
});

describe('StorageError', () => {
  it('should create error with message only', () => {
    const error = new StorageError('Storage failed');
    expect(error.message).toBe('Storage failed');
    expect(error.code).toBe('STORAGE_ERROR');
    expect(error.name).toBe('StorageError');
    expect(error.cause).toBeUndefined();
  });

  it('should create error with cause', () => {
    const cause = new Error('ENOENT: file not found');
    const error = new StorageError('Failed to read file', cause);
    expect(error.message).toBe('Failed to read file');
    expect(error.code).toBe('STORAGE_ERROR');
    expect(error.name).toBe('StorageError');
    expect(error.cause).toBe(cause);
  });

  it('should be instanceof AutologyError', () => {
    const error = new StorageError('test');
    expect(error).toBeInstanceOf(AutologyError);
  });

  it('should be instanceof StorageError', () => {
    const error = new StorageError('test');
    expect(error).toBeInstanceOf(StorageError);
  });
});

describe('ValidationError', () => {
  it('should create error with custom message', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });

  it('should be instanceof AutologyError', () => {
    const error = new ValidationError('test');
    expect(error).toBeInstanceOf(AutologyError);
  });

  it('should be instanceof ValidationError', () => {
    const error = new ValidationError('test');
    expect(error).toBeInstanceOf(ValidationError);
  });
});
