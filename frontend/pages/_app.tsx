import "../styles/globals.css";
import type { AppProps } from "next/app";

function Laputin({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}

export default Laputin;
