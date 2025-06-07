import { ThingsCommand, ThingsParams } from '../types/things.js';
import { encodeValue, encodeJsonData } from './encoder.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function buildThingsUrl(command: ThingsCommand, params: Record<string, any>): string {
  const baseUrl = `things:///${command}`;
  const queryParts: string[] = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      let encodedValue: string;
      
      if (key === 'data' && command === 'json') {
        // JSON data needs to be stringified and encoded
        encodedValue = encodeURIComponent(JSON.stringify(value));
      } else {
        // Encode all values using proper percent encoding
        const stringValue = Array.isArray(value) ? value.join(',') : String(value);
        encodedValue = encodeURIComponent(stringValue);
      }
      
      queryParts.push(`${encodeURIComponent(key)}=${encodedValue}`);
    }
  }
  
  const queryString = queryParts.join('&');
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export async function openThingsUrl(url: string): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new Error('Things URL scheme is only supported on macOS');
  }
  
  try {
    await execAsync(`open "${url}"`);
  } catch (error) {
    throw error;
  }
}