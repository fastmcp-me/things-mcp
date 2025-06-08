import { buildThingsUrl, openThingsUrl } from './url-builder.js';
import { logger } from './logger.js';

export interface JsonOperation {
  type: 'to-do' | 'project';
  operation: 'update';
  id: string;
  attributes: Record<string, any>;
}

/**
 * Execute a JSON-based Things operation
 * @param operation The JSON operation to execute
 * @param authToken The authentication token
 * @returns Promise that resolves when the operation is complete
 */
export async function executeJsonOperation(operation: JsonOperation, authToken: string): Promise<void> {
  const jsonArray = [operation];
  logger.debug('Executing JSON operation', { operation });
  
  const url = buildThingsUrl('json', {
    data: jsonArray, // Pass the array directly, not stringified
    'auth-token': authToken
  });
  
  await openThingsUrl(url);
}

/**
 * Wait for a short period to allow Things to process the operation
 * @param ms Milliseconds to wait (default: 100)
 */
export async function waitForOperation(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}