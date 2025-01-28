/* eslint-disable @next/next/no-sync-scripts */
import Head from 'next/head';
import 'mapbox-gl/dist/mapbox-gl.css';
// import Map2 from '@/components/Map2';
import Map from '@/components/map';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Transit Access</title>
        <meta name="description" content="A Next.js app with Mapbox" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Map />
        {/* <Map2 /> */}
      </main>
    </div>
  );
}
