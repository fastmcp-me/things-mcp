import { ThingsCommand, ThingsParams } from '../types/things.js';
import { encodeValue, encodeJsonData } from './encoder.js';

export function buildThingsUrl(command: ThingsCommand, params: Record<string, any>): string {
  const baseUrl = `things:///${command}`;
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'data' && command === 'json') {
        // JSON data needs to be stringified but not URL encoded (URLSearchParams will handle it)
        queryParams.append(key, JSON.stringify(value));
      } else {
        // Let URLSearchParams handle the encoding
        const stringValue = Array.isArray(value) ? value.join(',') : String(value);
        queryParams.append(key, stringValue);
      }
    }
  }
  
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function openThingsUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      reject(new Error('Things URL scheme is only supported on macOS'));
      return;
    }
    
    const { exec } = require('child_process');
    exec(`open "${url}"`, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}