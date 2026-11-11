import { getStore, loadOrSeed, REAL } from '@/store';
import { Storefront } from './_components/Storefront';

// Red de seguridad: además de actualizarse cuando Norma cambia algo, la página se rehace cada 5 minutos.
export const revalidate = 300;

export default async function Page() {
  const session = await loadOrSeed(getStore(), REAL);
  return <Storefront pieces={session.catalog} />;
}
