/**
 * Custom error types for autology
 */

export class AutologyError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AutologyError';
  }
}

export class NodeNotFoundError extends AutologyError {
  constructor(id: string) {
    super(`Node not found: ${id}`, 'NODE_NOT_FOUND');
    this.name = 'NodeNotFoundError';
  }
}

export class InvalidNodeError extends AutologyError {
  constructor(message: string) {
    super(message, 'INVALID_NODE');
    this.name = 'InvalidNodeError';
  }
}

export class StorageError extends AutologyError {
  public override readonly cause?: Error | undefined;

  constructor(message: string, cause?: Error | undefined) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export class ValidationError extends AutologyError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
