import Footer from "@/components/Footer/Footer";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next"

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <Footer />
    </>
  );
}
