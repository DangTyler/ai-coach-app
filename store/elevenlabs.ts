import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const ELEVENLABS_API_KEY = 'sk_484f9820ae52a9482047cc7400e1fa47d00ad388fe61194e';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
}

export const COACH_VOICE_MAP: Record<string, ElevenLabsVoice> = {
  '1': { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  '2': { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
  '3': { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  '4': { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  '5': { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  '6': { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  '7': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  '8': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
  '9': { voiceId: 'jsCqWAovK2LkecY7zXl4', name: 'Freya' },
  '10': { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  '11': { voiceId: 'LcfcDJNUP1GQjkzn1xUU', name: 'Emily' },
  '12': { voiceId: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan' },
};

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

let currentSound: Audio.Sound | null = null;
let webAudio: HTMLAudioElement | null = null;

export function getVoiceForCoach(coachId: string): ElevenLabsVoice {
  return COACH_VOICE_MAP[coachId] || { voiceId: DEFAULT_VOICE_ID, name: 'Rachel' };
}

export async function speakWithElevenLabs(
  text: string,
  coachId: string,
  onDone?: () => void,
  onError?: (error: Error) => void,
): Promise<void> {
  try {
    await stopElevenLabsSpeech();

    const voice = getVoiceForCoach(coachId);
    console.log('[ElevenLabs] Speaking with voice:', voice.name, 'for coach:', coachId);

    const response = await fetch(`${BASE_URL}/text-to-speech/${voice.voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    console.log('[ElevenLabs] Audio received, size:', audioBlob.size);

    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(audioBlob);
      webAudio = new window.Audio(url);

      webAudio.onended = () => {
        console.log('[ElevenLabs] Web playback finished');
        URL.revokeObjectURL(url);
        webAudio = null;
        onDone?.();
      };

      webAudio.onerror = () => {
        console.error('[ElevenLabs] Web playback error');
        URL.revokeObjectURL(url);
        webAudio = null;
        onError?.(new Error('Audio playback failed'));
      };

      await webAudio.play();
    } else {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${base64Audio}` },
        { shouldPlay: true },
      );

      currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('[ElevenLabs] Native playback finished');
          sound.unloadAsync();
          currentSound = null;
          onDone?.();
        }
      });
    }
  } catch (error) {
    console.error('[ElevenLabs] Error:', error);
    currentSound = null;
    webAudio = null;
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function stopElevenLabsSpeech(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (webAudio) {
        webAudio.pause();
        webAudio.currentTime = 0;
        webAudio = null;
        console.log('[ElevenLabs] Web audio stopped');
      }
    } else {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        currentSound = null;
        console.log('[ElevenLabs] Native audio stopped');
      }
    }
  } catch (error) {
    console.error('[ElevenLabs] Stop error:', error);
    currentSound = null;
    webAudio = null;
  }
}

export function isElevenLabsPlaying(): boolean {
  if (Platform.OS === 'web') {
    return webAudio !== null && !webAudio.paused;
  }
  return currentSound !== null;
}
