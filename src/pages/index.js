/* eslint-disable @next/next/no-sync-scripts */
import Head from 'next/head';
import 'mapbox-gl/dist/mapbox-gl.css';
import MtaMap from '@/components/MtaMap/MtaMap';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Transit Access</title>
        <meta name="description" content="A Next.js app with Mapbox" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <MtaMap />
      </main>
    </div>
  );
}
