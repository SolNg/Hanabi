import { defaultGameplayModeProfiles } from './modeConfig';
import type {
  GameplayMode,
  GameplayModeEffect,
  GameplayModeProfile,
  GameplayModeResult,
  GameplayModeState,
} from './types';

function cloneState(state: GameplayModeState): GameplayModeState {
  return structuredClone(state);
}

function uniquePush<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function buildActivationEffects(profile: GameplayModeProfile): GameplayModeEffect[] {
  return [
    {
      type: 'activate_mode_worldbook_entry',
      mode: profile.mode,
      entryName: profile.worldbook.modeEntry,
      reason: 'Kích hoạt entry cổng vào gameplay tương ứng sau khi chọn gameplay lúc khởi đầu',
    },
    {
      type: 'activate_mode_worldbook_entry',
      mode: profile.mode,
      entryName: profile.worldbook.variableRuleEntry,
      reason: 'Kích hoạt entry quy tắc biến tương ứng sau khi chọn gameplay lúc khởi đầu',
    },
    {
      type: 'activate_frontend_entry',
      mode: profile.mode,
      frontendEntry: profile.frontendEntry,
      reason: 'Bật cổng vào frontend tương ứng sau khi chọn gameplay lúc khởi đầu',
    },
  ];
}

export function createGameplayModeState(
  profiles: Record<GameplayMode, GameplayModeProfile> = defaultGameplayModeProfiles,
): GameplayModeState {
  return {
    registeredInitialModes: [],
    modeProfiles: profiles,
  };
}

export function activateGameplayMode(
  state: GameplayModeState,
  mode: GameplayMode,
  now = new Date(),
): GameplayModeResult {
  const next = cloneState(state);
  const profile = next.modeProfiles[mode];
  if (!profile) {
    throw new Error(`Unknown gameplay mode: ${mode}`);
  }

  if (next.activeMode && next.activeMode !== mode) {
    throw new Error(`Gameplay mode already active: ${next.activeMode}`);
  }

  const effects: GameplayModeEffect[] = [];
  next.selectedMode = mode;

  if (next.activeMode === mode) {
    effects.push({
      type: 'note',
      message: `Gameplay đã được kích hoạt: ${mode}`,
    });
    return { state: next, effects };
  }

  next.activeMode = mode;
  next.activatedAt = now.toISOString();
  effects.push(...buildActivationEffects(profile));

  if (!next.registeredInitialModes.includes(mode)) {
    next.registeredInitialModes = uniquePush(next.registeredInitialModes, mode);
    effects.push({
      type: 'register_mode_initial_variables',
      mode,
      variables: profile.initialVariables,
      reason: 'Đăng ký biến ban đầu tương ứng sau khi chọn gameplay lúc khởi đầu',
    });
  }

  return { state: next, effects };
}

export function getActiveGameplayModeProfile(state: GameplayModeState): GameplayModeProfile | undefined {
  return state.activeMode ? state.modeProfiles[state.activeMode] : undefined;
}
