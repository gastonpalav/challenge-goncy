'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const MAX_SECONDS = 10;

const never = () => () => undefined;
const canRecord = () => Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

type Props = {
  disabled: boolean;
  /** Se llama con el audio grabado cuando la persona toca "Enviar audio" o se cumple el tiempo. */
  onAudio: (audio: Blob) => void;
  /** Se llama si no se pudo usar el micrófono (sin permiso, sin micrófono, error al grabar). */
  onFail: () => void;
};

/** Botón para grabar un audio corto, como el micrófono de WhatsApp. */
export function Mic({ disabled, onAudio, onFail }: Props) {
  // En el servidor no hay micrófono que consultar: ahí el botón no se dibuja.
  const supported = useSyncExternalStore(never, canRecord, () => false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
    };
  }, []);

  const finish = (send: boolean) => {
    cancelled.current = !send;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setSeconds(null);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const start = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onFail();
      return;
    }
    try {
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelled.current) return;
        const audio = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        if (audio.size > 0) onAudio(audio);
        else onFail();
      };
      rec.onerror = () => {
        finish(false);
        onFail();
      };
      recorder.current = rec;
      cancelled.current = false;
      rec.start();
      setSeconds(0);
      timer.current = setInterval(() => {
        setSeconds((s) => {
          const next = (s ?? 0) + 1;
          if (next >= MAX_SECONDS) finish(true);
          return next;
        });
      }, 1000);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      onFail();
    }
  };

  if (!supported) return null;

  if (seconds !== null) {
    return (
      <div className="sim-grabando">
        <span className="sim-grabando-punto" aria-hidden="true" />
        <span role="status">
          Grabando… {seconds} de {MAX_SECONDS} segundos
        </span>
        <button type="button" onClick={() => finish(false)}>
          Cancelar
        </button>
        <button type="button" className="sim-grabando-enviar" onClick={() => finish(true)}>
          Enviar audio
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="sim-herramienta" onClick={start} disabled={disabled}>
      Grabar audio
    </button>
  );
}
