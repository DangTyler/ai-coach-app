import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_SETTINGS_KEY = '@voice_settings';

export interface VoiceSettings {
  autoSend: boolean;
  voiceConversationMode: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  autoSend: false,
  voiceConversationMode: false,
};

export const voiceSettingsStorage = {
  async get(): Promise<VoiceSettings> {
    try {
      const value = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
      return value ? { ...DEFAULT_SETTINGS, ...JSON.parse(value) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings: Partial<VoiceSettings>): Promise<VoiceSettings> {
    const current = await this.get();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },
};
