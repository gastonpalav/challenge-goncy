// Deja el catálogo real igual al de muestra. Uso: npm run restaurar
// La página pública lo refleja en menos de 5 minutos (o al próximo cambio de Norma).
import { seedSession } from '../src/sobrino/seed';
import { REAL } from '../src/store';
import { redisEnv, RedisStore } from '../src/store/redis';

async function main() {
  const env = redisEnv();
  if (!env) {
    console.error('Faltan las variables de Upstash. Corré antes: vercel env pull .env.local');
    process.exit(1);
  }
  await new RedisStore(env).setSession(REAL, seedSession());
  console.log('Listo: el catálogo real volvió a ser el de muestra.');
}

void main();
