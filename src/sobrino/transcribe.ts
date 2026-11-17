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
  form.set('response_format', 'verbose_json');

  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`transcribe: el servicio respondió ${res.status}`);
  const data = (await res.json()) as { text?: unknown; segments?: { avg_logprob?: unknown }[] };
  if (typeof data.text !== 'string') throw new Error('transcribe: respuesta sin texto');
  const text = data.text.trim();
  return isPhantom(text, data.segments) ? '' : text;
}

/** Lo que el modelo suele inventar cuando en el audio no habla nadie. */
const PHANTOMS = /^(gracias|gracias por ver( el video)?|suscribete( al canal)?|subtitulos .*)$/;
/** Por debajo de esto el modelo está adivinando. Una frase dicha con claridad ronda -0,1 a -0,4. */
const MIN_CONFIDENCE = -1;

/**
 * Con silencio o ruido el servicio no devuelve vacío: inventa una frase, casi siempre "Gracias.".
 * El precio es que un "gracias" suelto de verdad también se toma como no escuchado.
 */
function isPhantom(text: string, segments: { avg_logprob?: unknown }[] = []): boolean {
  const plain = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain || PHANTOMS.test(plain)) return true;
  const scores = segments.map((s) => s.avg_logprob).filter((n): n is number => typeof n === 'number');
  return scores.length > 0 && scores.every((score) => score < MIN_CONFIDENCE);
}

/** Los navegadores graban en formatos distintos; el servicio se guía por la extensión. */
function extension(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
