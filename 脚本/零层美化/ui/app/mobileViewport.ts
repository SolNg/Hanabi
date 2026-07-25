export type TangquanViewportMode = 'desktop' | 'mobile-portrait' | 'mobile-landscape';

export interface TangquanViewportMetrics {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
  scale: number;
  devicePixelRatio: number;
  maxTouchPoints: number;
  coarsePointer: boolean;
}

export interface TangquanMobileViewportFixture {
  name: string;
  width: number;
  height: number;
  devicePixelRatio: number;
  browserUi: 'expanded' | 'retracted';
}

export const TANGQUAN_MOBILE_LANDSCAPE_FIXTURES: readonly TangquanMobileViewportFixture[] = [
  { name: 'small-android-expanded', width: 740, height: 320, devicePixelRatio: 3, browserUi: 'expanded' },
  { name: 'small-android-retracted', width: 740, height: 360, devicePixelRatio: 3, browserUi: 'retracted' },
  { name: 'iphone-standard-expanded', width: 844, height: 335, devicePixelRatio: 3, browserUi: 'expanded' },
  { name: 'iphone-standard-retracted', width: 844, height: 390, devicePixelRatio: 3, browserUi: 'retracted' },
  { name: 'pixel-mainstream-expanded', width: 915, height: 360, devicePixelRatio: 2.625, browserUi: 'expanded' },
  { name: 'pixel-mainstream-retracted', width: 915, height: 412, devicePixelRatio: 2.625, browserUi: 'retracted' },
  { name: 'iphone-large-expanded', width: 932, height: 375, devicePixelRatio: 3, browserUi: 'expanded' },
  { name: 'iphone-large-retracted', width: 932, height: 430, devicePixelRatio: 3, browserUi: 'retracted' },
  { name: 'foldable-ultrawide-compact', width: 960, height: 393, devicePixelRatio: 2, browserUi: 'retracted' },
  { name: 'foldable-ultrawide-short', width: 768, height: 314, devicePixelRatio: 2.5, browserUi: 'expanded' },
] as const;

const MAX_PHONE_SHORT_EDGE = 600;
const MAX_PHONE_LONG_EDGE = 1100;
const LANDSCAPE_RATIO = 1.15;

export function classifyTangquanViewport(metrics: TangquanViewportMetrics): TangquanViewportMode {
  const width = Math.max(1, metrics.width);
  const height = Math.max(1, metrics.height);
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  const hasTouchInput = metrics.coarsePointer || metrics.maxTouchPoints > 0;
  const phoneSized = shortEdge <= MAX_PHONE_SHORT_EDGE && longEdge <= MAX_PHONE_LONG_EDGE;

  if (!hasTouchInput || !phoneSized) {
    return 'desktop';
  }

  return width >= height * LANDSCAPE_RATIO ? 'mobile-landscape' : 'mobile-portrait';
}

export function readTangquanViewportMetrics(view: Window): TangquanViewportMetrics {
  const visualViewport = view.visualViewport;
  return {
    width: Math.max(1, visualViewport?.width ?? view.innerWidth),
    height: Math.max(1, visualViewport?.height ?? view.innerHeight),
    offsetLeft: visualViewport?.offsetLeft ?? 0,
    offsetTop: visualViewport?.offsetTop ?? 0,
    scale: visualViewport?.scale ?? 1,
    devicePixelRatio: view.devicePixelRatio || 1,
    maxTouchPoints: view.navigator.maxTouchPoints || 0,
    coarsePointer: view.matchMedia?.('(pointer: coarse)').matches ?? false,
  };
}

export function makeTangquanViewportCssVariables(metrics: TangquanViewportMetrics): Record<string, string> {
  return {
    '--tq-visual-width': `${Math.round(metrics.width)}px`,
    '--tq-visual-height': `${Math.round(metrics.height)}px`,
    '--tq-visual-offset-left': `${Math.round(metrics.offsetLeft)}px`,
    '--tq-visual-offset-top': `${Math.round(metrics.offsetTop)}px`,
    '--tq-device-pixel-ratio': String(metrics.devicePixelRatio),
  };
}
