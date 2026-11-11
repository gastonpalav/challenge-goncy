'use client';

import { useRef, useState } from 'react';

export type ChatItem = {
  id: string;
  from: 'norma' | 'goncy';
  text?: string;
  image?: string;
  /** Un audio: lo que dice y, si ya está grabado, el archivo. */
  voice?: { text: string; src?: string };
  buttons?: string[];
};

type Props = {
  item: ChatItem;
  /** Los botones solo responden en el último mensaje. */
  active: boolean;
  onButton: (label: string) => void;
};

export function Bubble({ item, active, onButton }: Props) {
  return (
    <div className={`sim-burbuja sim-burbuja-${item.from}`}>
      {item.image ? (
        // Miniatura dentro del chat: no hace falta optimizarla como las de la grilla.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="sim-foto" src={item.image} alt="Foto de la pieza" width={160} height={200} />
      ) : null}
      {item.voice ? <Voice voice={item.voice} /> : null}
      {item.text ? <p>{item.text}</p> : null}
      {item.buttons ? (
        <div className="sim-botones">
          {item.buttons.map((label) => (
            <button key={label} type="button" onClick={() => onButton(label)} disabled={!active}>
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Voice({ voice }: { voice: NonNullable<ChatItem['voice']> }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  return (
    <div className="sim-voz">
      <div className="sim-voz-fila">
        {voice.src ? (
          <>
            <button type="button" className="sim-voz-boton" onClick={toggle}>
              {playing ? 'Pausar' : 'Escuchar'}
            </button>
            <audio
              ref={audio}
              src={voice.src}
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          </>
        ) : (
          <span className="sim-play" aria-hidden="true" />
        )}
        <span className="sim-onda" aria-hidden="true" />
      </div>
      <p className="sim-voz-texto">“{voice.text}”</p>
    </div>
  );
}
