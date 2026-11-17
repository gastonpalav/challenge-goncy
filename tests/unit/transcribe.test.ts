import { describe, expect, test } from 'vitest';
import { transcribe } from '@/sobrino/transcribe';

const audio = new Blob([new Uint8Array(100)], { type: 'audio/webm' });

describe('transcribe', () => {
  test('manda el audio en español y devuelve el texto', async () => {
    let seen: { url: string; model: unknown; language: unknown; auth: string | null } | undefined;
    const fakeFetch: typeof fetch = async (url, init) => {
      const form = init!.body as FormData;
      seen = {
        url: String(url),
        model: form.get('model'),
        language: form.get('language'),
        auth: new Headers(init!.headers).get('authorization'),
      };
      return Response.json({ text: '  vendí el cuenco ' });
    };
    expect(await transcribe(audio, { fetch: fakeFetch, apiKey: 'clave' })).toBe('vendí el cuenco');
    expect(seen!.url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect(seen!.model).toBe('whisper-large-v3-turbo');
    expect(seen!.language).toBe('es');
    expect(seen!.auth).toBe('Bearer clave');
  });

  test('si el servicio falla, lanza un error', async () => {
    const fakeFetch: typeof fetch = async () => new Response('nope', { status: 500 });
    await expect(transcribe(audio, { fetch: fakeFetch, apiKey: 'clave' })).rejects.toThrow();
  });

  test('sin clave, lanza un error sin llamar a nadie', async () => {
    let calls = 0;
    const fakeFetch: typeof fetch = async () => {
      calls += 1;
      return Response.json({ text: 'x' });
    };
    await expect(transcribe(audio, { fetch: fakeFetch, apiKey: '' })).rejects.toThrow();
    expect(calls).toBe(0);
  });
});
