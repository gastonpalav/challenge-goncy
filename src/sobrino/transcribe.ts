/**
 * Audio a texto. Usa Whisper servido por Groq (API compatible con la de OpenAI).
 * Solo transcribe: qué quiso decir Norma lo resuelve interpret().
 */

const URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

type Options = { fetch?: typeof fetch; apiKey?: string };

export async function transcribe(audio: Blob, opts: Options = {}): Promise<string> {
  const apiKey = opts.apiKey ?? process.env.GROQ_API_KEY ?? '';
  if (!apiKey) throw new Error('transcribe: falta GROQ_API_KEY');

  const form = new FormData();
  form.set('file', audio, `audio.${extension(audio.type)}`);
  form.set('model', MODEL);
  form.set('language', 'es');
  form.set('response_format', 'json');

  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`transcribe: el servicio respondió ${res.status}`);
  const data = (await res.json()) as { text?: unknown };
  if (typeof data.text !== 'string') throw new Error('transcribe: respuesta sin texto');
  return data.text.trim();
}

/** Los navegadores graban en formatos distintos; el servicio se guía por la extensión. */
function extension(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
