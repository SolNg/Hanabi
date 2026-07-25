export type GameplayMode = '店长' | '客人' | '服务员';

export type GameplayModeWorldbookBindings = {
  modeEntry: string;
  variableRuleEntry: string;
  initialVariableEntry?: string;
};

export type GameplayModeStoryPlaceholder = {
  slot: '首页台词' | '正文剧情';
  shouldProvide: string[];
  promptSource: 'Do tầng world book/preset/tiếp nhận chính văn cung cấp, script không viết prompt cố định';
};

export type GameplayModeProfile = {
  mode: GameplayMode;
  frontendEntry: string;
  worldbook: GameplayModeWorldbookBindings;
  initialVariables: Record<string, unknown>;
  storyPlaceholders: GameplayModeStoryPlaceholder[];
};

export type GameplayModeState = {
  selectedMode?: GameplayMode;
  activeMode?: GameplayMode;
  activatedAt?: string;
  registeredInitialModes: GameplayMode[];
  modeProfiles: Record<GameplayMode, GameplayModeProfile>;
};

export type GameplayModeEffect =
  | {
      type: 'activate_mode_worldbook_entry';
      mode: GameplayMode;
      entryName: string;
      reason: string;
    }
  | {
      type: 'deactivate_mode_worldbook_entry';
      mode: GameplayMode;
      entryName: string;
      reason: string;
    }
  | {
      type: 'register_mode_initial_variables';
      mode: GameplayMode;
      variables: Record<string, unknown>;
      reason: string;
    }
  | {
      type: 'activate_frontend_entry';
      mode: GameplayMode;
      frontendEntry: string;
      reason: string;
    }
  | {
      type: 'note';
      message: string;
    };

export type GameplayModeResult = {
  state: GameplayModeState;
  effects: GameplayModeEffect[];
};
