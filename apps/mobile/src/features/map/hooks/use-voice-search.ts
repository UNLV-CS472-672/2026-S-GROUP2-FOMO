import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useState } from 'react';

type UseVoiceSearchOptions = {
  onTranscript: (value: string) => void;
  onExpand: () => void;
};

export function useVoiceSearch({ onTranscript, onExpand }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();

    if (transcript) {
      onTranscript(transcript);
    }
  });

  const toggleVoiceSearch = useCallback(async () => {
    onExpand();

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permissions.granted) {
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      iosTaskHint: 'search',
      androidIntentOptions: {
        EXTRA_LANGUAGE_MODEL: 'web_search',
      },
    });
  }, [isListening, onExpand]);

  const stopVoiceSearch = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
  }, []);

  return {
    isListening,
    stopVoiceSearch,
    toggleVoiceSearch,
  };
}
