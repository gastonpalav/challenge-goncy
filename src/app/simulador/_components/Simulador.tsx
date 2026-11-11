'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Chip, SimResponse, SimState } from '@/sim/server';
import * as say from '@/sobrino/phrases';
import { Storefront } from '../../_components/Storefront';
import { Bubble, type ChatItem } from './Bubble';

type Tab = 'chat' | 'pagina';

let nextId = 0;
const item = (data: Omit<ChatItem, 'id'>): ChatItem => ({ ...data, id: `m${(nextId += 1)}` });
const greeting = (): ChatItem[] => [item({ from: 'goncy', text: say.hello() })];

export function Simulador({ initial }: { initial: SimState }) {
  const [state, setState] = useState<SimState>(initial);
  const [items, setItems] = useState<ChatItem[]>(greeting);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [pageChanged, setPageChanged] = useState(false);

  // El estado tarda un render en llegar; esta referencia frena el doble toque en el acto.
  const sending = useRef(false);
  const catalog = useRef(initial.catalog);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const pageScroll = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ block: 'end' });
  }, [items, busy]);

  const post = useCallback(
    async (url: string, body: unknown, mine: ChatItem[]) => {
      if (sending.current) return;
      sending.current = true;
      setBusy(true);
      setItems((prev) => [...prev, ...mine]);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body ?? {}),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SimResponse;
        if (JSON.stringify(catalog.current) !== JSON.stringify(data.catalog)) {
          setPageChanged(true);
          pageScroll.current?.scrollTo({ top: 0 });
        }
        catalog.current = data.catalog;
        setState({ catalog: data.catalog, chips: data.chips });
        return data;
      } catch {
        setItems((prev) => [...prev, item({ from: 'goncy', text: say.connectionLost() })]);
        return undefined;
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [],
  );

  const addReplies = (data: SimResponse | undefined) => {
    if (!data) return;
    setItems((prev) => [...prev, ...data.replies.map((r) => item({ from: 'goncy', ...r }))]);
  };

  const sendChip = async (chip: Chip) => {
    if (sending.current) return;
    if (chip.audio) {
      player.current?.pause();
      player.current = new Audio(chip.audio);
      void player.current.play().catch(() => undefined);
    }
    const mine: ChatItem[] = [];
    if (chip.photo) mine.push(item({ from: 'norma', image: chip.photo }));
    mine.push(item({ from: 'norma', voice: { text: chip.label, src: chip.audio } }));
    addReplies(await post('/api/sim/message', { kind: 'canned', id: chip.id }, mine));
  };

  const sendButton = async (label: string) => {
    addReplies(await post('/api/sim/message', { kind: 'button', label }, [item({ from: 'norma', text: label })]));
  };

  const reset = async () => {
    const data = await post('/api/sim/reset', {}, []);
    if (data) {
      setItems(greeting());
      setPageChanged(false);
    }
  };

  const showTab = (next: Tab) => {
    setTab(next);
    if (next === 'pagina') setPageChanged(false);
  };

  const lastId = items[items.length - 1]?.id;

  return (
    <div className="sim" data-tab={tab}>
      <header className="sim-intro">
        <div>
          <h1>Hacé de Norma</h1>
          <p>
            Norma no tiene compu ni mail. Su página la actualiza mandándole WhatsApp a su sobrino. Tocá uno de sus
            audios y mirá cómo cambia la página.
          </p>
        </div>
        <button type="button" className="sim-reset" onClick={reset} disabled={busy}>
          Empezar de nuevo
        </button>
      </header>

      <div className="sim-tabs" role="tablist" aria-label="Qué ver">
        <button type="button" role="tab" aria-selected={tab === 'chat'} onClick={() => showTab('chat')}>
          Chat
        </button>
        <button type="button" role="tab" aria-selected={tab === 'pagina'} onClick={() => showTab('pagina')}>
          Página
          {pageChanged && tab !== 'pagina' ? <span className="sim-novedad"> · cambió</span> : null}
        </button>
      </div>

      <div className="sim-cuerpo">
        <section className="sim-chat" aria-label="Chat con Goncy">
          <div className="sim-contacto">
            <span className="sim-avatar" aria-hidden="true">
              G
            </span>
            <div>
              <p className="sim-nombre">Goncy</p>
              <p className="sim-estado">el sobrino · en línea</p>
            </div>
          </div>

          <div className="sim-mensajes" aria-live="polite">
            {items.map((it) => (
              <Bubble key={it.id} item={it} active={it.id === lastId && !busy} onButton={sendButton} />
            ))}
            {busy ? <p className="sim-escribiendo">Goncy está escribiendo…</p> : null}
            <div ref={messagesEnd} />
          </div>

          <div className="sim-entrada">
            <p className="sim-entrada-titulo">Audios de Norma: tocá uno para mandarlo</p>
            <ul className="sim-chips">
              {state.chips.map((chip) => (
                <li key={chip.id}>
                  <button type="button" className="sim-chip" onClick={() => sendChip(chip)} disabled={busy}>
                    <span className="sim-play" aria-hidden="true" />
                    <span>{chip.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sim-pagina" aria-label="Tu copia de prueba de la página">
          <p className="sim-aviso">
            <strong>Tu copia de prueba.</strong> La página real no cambia con lo que hagas acá.
          </p>
          <div className="sim-pagina-scroll" ref={pageScroll}>
            <Storefront pieces={state.catalog} />
          </div>
        </section>
      </div>
    </div>
  );
}
