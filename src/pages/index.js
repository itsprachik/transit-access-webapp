/* eslint-disable @next/next/no-sync-scripts */
// pages/index.js
import Head from 'next/head';
import Map from '@/components/map';
import 'mapbox-gl/dist/mapbox-gl.css';


export default function Home() {
  return (
    <div>
      <Head>
        <title>My Mapbox App</title>
        <meta name="description" content="A Next.js app with Mapbox" />
        <link rel="icon" href="/favicon.ico" />

      </Head>

      <main>
        <Map />
      </main>
    </div>
  );
}
