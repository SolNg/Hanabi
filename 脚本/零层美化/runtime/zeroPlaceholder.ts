export const TANGQUAN_ZERO_PLACEHOLDER_TEXT = '<三明月>';
export const TANGQUAN_ZERO_PLACEHOLDER_NAME = '三明月';
export const TANGQUAN_ZERO_PLACEHOLDER_EXTRA_KEY = 'tangquanZeroPlaceholder';

const TANGQUAN_ZERO_PLACEHOLDER_PATTERN = /^\s*<三明月>\s*$/;

export function isTangquanZeroPlaceholderText(text: string): boolean {
  return TANGQUAN_ZERO_PLACEHOLDER_PATTERN.test(text);
}

export function isTangquanZeroPlaceholderExtra(extra: unknown): boolean {
  return Boolean(
    extra &&
      typeof extra === 'object' &&
      (extra as Record<string, unknown>)[TANGQUAN_ZERO_PLACEHOLDER_EXTRA_KEY] === true,
  );
}
