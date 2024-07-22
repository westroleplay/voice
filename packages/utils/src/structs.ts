export interface Config {
  logging: {
    level: string;
  };
  ui: {
    enabled: boolean;
    interaction: {
      key: string;
      requireMousePressAswell: boolean;
    };
  };
  framework: {
    customResourceName?: null | string;
  };
  proximity: {
    keybind: string;
  };
  voiceModes: Array<VoiceMode>;
  locale: {
    language: string;
  };
}

export interface VoiceMode {
  range: number;
  name: string;
  default?: boolean;
}

export interface Translations {
  [key: string]: Translations | string;
}

export interface Talking {
  normal: boolean;
}

export type NuiCallback = (...args: Array<unknown>) => void;

export enum Framework {
  vRP,
  ESX,
  QBCore,
  Standalone
}
