'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/sobrino/money';
import type { Piece } from '@/sobrino/types';
import { NOMBRE_MAX, PREGUNTAS, primerMensaje, SALUDO, type Pregunta, type Respuesta } from '../../guion';

type Mensaje = {
  id: number;
  from: 'yo' | 'norma';
  text: string;
  image?: string;
  /** Audio de Norma con ese mismo texto. */
  audio?: string;
};

/** Lo que tarda Norma en "grabar" su audio. */
const DEMORA = 1400;

export function Consulta({ piece }: { piece: Piece }) {
  const [nombre, setNombre] = useState('');
  const [falta, setFalta] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [hechas, setHechas] = useState<string[]>([]);

  const nextId = useRef(0);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, grabando]);

  const nuevo = (data: Omit<Mensaje, 'id'>): Mensaje => ({ ...data, id: (nextId.current += 1) });

  const contestar = (respuesta: Respuesta) => {
    setGrabando(true);
    espera.current = setTimeout(() => {
      setGrabando(false);
      setMensajes((prev) => [...(prev ?? []), nuevo({ from: 'norma', text: respuesta.text, audio: respuesta.audio })]);
    }, DEMORA);
  };

  const empezar = (event: React.FormEvent) => {
    event.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) {
      setFalta(true);
      return;
    }
    setMensajes([nuevo({ from: 'yo', text: primerMensaje(limpio, piece), image: piece.image })]);
    contestar(SALUDO);
  };

  const preguntar = (pregunta: Pregunta) => {
    if (grabando) return;
    setHechas((prev) => [...prev, pregunta.id]);
    setMensajes((prev) => [...(prev ?? []), nuevo({ from: 'yo', text: pregunta.label })]);
    contestar(pregunta.respuesta);
  };

  if (!mensajes) {
    return (
      <main className="con-entrada">
        <Link className="con-volver" href="/">
          ‹ Volver a las piezas
        </Link>
        <div className="con-pieza">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={piece.image} alt="" width={160} height={200} />
          <div>
            <h1>{piece.title}</h1>
            <p className="con-precio">{formatPrice(piece.price)}</p>
          </div>
        </div>
        <form className="con-form" onSubmit={empezar} noValidate>
          <label htmlFor="con-nombre">¿Te gusta? Decile a Norma cómo te llamás.</label>
          <input
            id="con-nombre"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setFalta(false);
            }}
            maxLength={NOMBRE_MAX}
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="go"
            placeholder="Tu nombre"
            aria-invalid={falta}
            aria-describedby={falta ? 'con-falta' : undefined}
          />
          {falta ? (
            <p id="con-falta" className="con-falta" role="alert">
              Escribí tu nombre para seguir.
            </p>
          ) : null}
          <button type="submit">Escribirle a Norma</button>
        </form>
      </main>
    );
  }

  const pendientes = PREGUNTAS.filter((p) => !hechas.includes(p.id));
  const ultimo = mensajes[mensajes.length - 1]?.id;

  return (
    <main className="con-chat">
      <header className="con-contacto">
        <Link className="con-atras" href="/" aria-label="Volver a las piezas">
          ‹
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="con-avatar" src="/porcelana/normita-cara.svg" alt="" width={44} height={44} />
        <div>
          <p className="con-nombre">Norma</p>
          <p className="con-estado">la ceramista · en línea</p>
        </div>
      </header>
      <p className="con-aviso">
        <strong>Esto es una muestra.</strong> En la vida real, Norma te contesta por WhatsApp.
      </p>

      <div className="con-mensajes" aria-live="polite">
        {mensajes.map((m) => (
          <div key={m.id} className={`con-burbuja con-burbuja-${m.from}`}>
            {m.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="con-foto" src={m.image} alt="Foto de la pieza" width={160} height={200} />
            ) : null}
            {m.audio ? <Voz src={m.audio} text={m.text} sonar={m.id === ultimo} /> : <p>{m.text}</p>}
          </div>
        ))}
        {grabando ? <p className="con-grabando">Norma está grabando un audio…</p> : null}
        <div ref={fin} />
      </div>

      <div className="con-preguntas">
        {pendientes.length > 0 ? (
          <>
            <p className="con-preguntas-titulo">Tocá lo que le quieras preguntar:</p>
            <ul>
              {pendientes.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => preguntar(p)} disabled={grabando}>
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="con-preguntas-titulo">Así de fácil se arregla con Norma.</p>
        )}
        <Link className="con-volver" href="/">
          ‹ Volver a las piezas
        </Link>
      </div>
    </main>
  );
}

/** Un audio de Norma con lo que dice escrito abajo. Si el audio no carga, queda solo el texto. */
function Voz({ src, text, sonar }: { src: string; text: string; sonar: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [roto, setRoto] = useState(false);

  // Suena solo al llegar. Si el teléfono no deja (iPhone), queda el botón "Escuchar".
  useEffect(() => {
    if (sonar) void audio.current?.play().catch(() => undefined);
    // Solo al aparecer: que después llegue otro mensaje no tiene que volver a tocarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const callarOtros = () => {
    document.querySelectorAll('audio').forEach((otro) => {
      if (otro !== audio.current) otro.pause();
    });
    setPlaying(true);
  };

  return (
    <div className="con-voz">
      {roto ? null : (
        <div className="con-voz-fila">
          <button type="button" className="con-voz-boton" onClick={toggle}>
            {playing ? 'Pausar' : 'Escuchar'}
          </button>
          <span className="con-onda" aria-hidden="true" />
          <audio
            ref={audio}
            src={src}
            preload="auto"
            onPlay={callarOtros}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setRoto(true)}
          />
        </div>
      )}
      <p className={roto ? undefined : 'con-voz-texto'}>{roto ? text : `“${text}”`}</p>
    </div>
  );
}
