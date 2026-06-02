import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Hook sobre la Web Speech API para dictado en español.
 * Devuelve el transcript final y estado de escucha.
 */
export function useVoiceInput() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setSupported(true);
    const rec = new SpeechRecognition();
    rec.lang = 'es-DO';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    return () => rec.abort();
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setTranscript('');
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  }, [listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, transcript, start, stop, setTranscript };
}
