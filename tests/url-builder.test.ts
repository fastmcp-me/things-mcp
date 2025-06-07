import { describe, it, expect } from '@jest/globals';
import { buildThingsUrl } from '../src/utils/url-builder.js';
import { encodeValue } from '../src/utils/encoder.js';

describe('URL Builder', () => {
  it('should build basic add todo URL', () => {
    const url = buildThingsUrl('add', {
      title: 'Test Todo'
    });
    
    expect(url).toBe('things:///add?title=Test+Todo');
  });

  it('should build URL with multiple parameters', () => {
    const url = buildThingsUrl('add', {
      title: 'Test Todo',
      notes: 'Some notes',
      when: 'today'
    });
    
    expect(url).toContain('things:///add');
    expect(url).toContain('title=Test+Todo');
    expect(url).toContain('notes=Some+notes');
    expect(url).toContain('when=today');
  });

  it('should skip undefined parameters', () => {
    const url = buildThingsUrl('add', {
      title: 'Test Todo',
      notes: undefined,
      when: 'today'
    });
    
    expect(url).not.toContain('notes');
    expect(url).toContain('title=Test+Todo');
    expect(url).toContain('when=today');
  });

  it('should handle JSON data for json command', () => {
    const data = [{ type: 'to-do', attributes: { title: 'Test' } }];
    const url = buildThingsUrl('json', { data });
    
    expect(url).toContain('things:///json');
    expect(url).toContain('data=');
  });
});

describe('Encoder', () => {
  it('should encode special characters', () => {
    expect(encodeValue('Hello World')).toBe('Hello%20World');
    expect(encodeValue('Test & More')).toBe('Test%20%26%20More');
  });

  it('should handle boolean values', () => {
    expect(encodeValue(true)).toBe('true');
    expect(encodeValue(false)).toBe('false');
  });

  it('should handle arrays', () => {
    expect(encodeValue(['tag1', 'tag2'])).toBe('tag1,tag2');
  });
});