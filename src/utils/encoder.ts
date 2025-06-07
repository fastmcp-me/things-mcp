export function encodeValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  if (Array.isArray(value)) {
    return value.map(v => encodeURIComponent(String(v))).join(',');
  }
  
  return encodeURIComponent(String(value));
}

export function encodeJsonData(data: any): string {
  return encodeURIComponent(JSON.stringify(data));
}