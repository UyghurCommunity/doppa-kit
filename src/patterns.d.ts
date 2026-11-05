export { createPattern, type PatternOptions, type Colors } from './index.js';
export function validateColors(colors: unknown): asserts colors is import('./index.js').Colors;
