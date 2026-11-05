export type Palette = 'badam' | 'atlas' | 'golden';
export interface Colors { cloth?: string; thread?: string; detail?: string; trim?: string }
export interface DoppaState { palette: Palette; yaw: number; elevation: number; paused: boolean; reducedMotion: boolean; destroyed: boolean }
export interface DoppaOptions { palette?: Palette; colors?: Colors; paused?: boolean; autoRotate?: boolean; onChange?: (state: DoppaState) => void }
export interface DoppaInstance {
  setPalette(name: Palette): void; setColors(colors: Colors): void;
  rotate(horizontal?: number, vertical?: number): void;
  pause(): void; resume(): void; reset(): void; resize(): void;
  getState(): DoppaState; toSVG(): string; destroy(): void;
}
export function createDoppa(canvas: HTMLCanvasElement, options?: DoppaOptions): DoppaInstance;
export interface PatternOptions { type?: 'almond' | 'atlas' | 'rosette'; width?: number; height?: number; tileSize?: number; seed?: number; colors?: Colors }
export function createPattern(options?: PatternOptions): string;
