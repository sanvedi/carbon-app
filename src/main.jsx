import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import "@fontsource/nunito-sans/latin-400.css";
import "@fontsource/nunito-sans/latin-600.css";
import "@fontsource/nunito-sans/latin-700.css";
import "./style.css";

function ProductResult({ product }) {
  return <article className="product-result">
    <h3>{product.name}</h3>
    {product.status === "no_data" ? <p className="missing">no reliable data for this one</p> : <>
      <p className="footprint">{product.kgCO2e} <span>kg CO2e</span></p>
      <p className="basis">{product.basis}</p>
      <dl>
        <dt>Public source</dt><dd><a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">{product.sourceName}</a></dd>
        <dt>Source’s figure</dt><dd>{product.sourceFigure}</dd>
        <dt>Exact excerpt</dt><dd>“{product.excerpt}”</dd>
        <dt>What it covers</dt><dd>{product.boundary}</dd>
      </dl>
    </>}
  </article>;
}
function App() {
  const compare = useAction(api.compare.products);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const reply = await compare({ first: first.trim(), second: second.trim() });
      if (reply.error) setError(reply.error); else setResult(reply);
    } catch { setError("The comparison could not finish. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
    <header><a className="brand" href="/" aria-label="Carbon home"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M22 7H12a7 7 0 0 0 0 14h10M22 14H12" /></svg>carbon</a><span>Evidence before a choice.</span></header>
    <main>
      <section className="intro"><h1>Two products.<br />A lighter choice.</h1><p>Compare their estimated carbon footprints, with the public figures behind every number.</p></section>
      <form onSubmit={submit} aria-label="Compare products">
        <div className="inputs"><label htmlFor="first">First product<input id="first" value={first} onChange={e => setFirst(e.target.value)} placeholder="e.g. Apple iPhone 16 128GB" required maxLength={120} disabled={busy} /></label><span className="versus" aria-hidden="true">vs</span><label htmlFor="second">Second product<input id="second" value={second} onChange={e => setSecond(e.target.value)} placeholder="e.g. Apple iPhone 16 Plus 128GB" required maxLength={120} disabled={busy} /></label></div>
        <div className="form-bottom"><p>Include the brand, model and size for a precise match.</p><button type="submit" disabled={busy || !first.trim() || !second.trim()}>{busy ? "Checking public sources…" : "Compare footprints"}</button></div>
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {busy && <p className="loading" role="status">Looking for product-specific reports and checking their figures. This can take about a minute.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {result && <section className="results" aria-label="Comparison result"><h2>Your comparison</h2><div className="product-columns">{result.products.map((p, i) => <ProductResult key={i} product={p} />)}</div><div className="recommendation"><h3>The choice</h3><p>{result.recommendation}</p></div><p className="result-note">Published estimates, not measurements of your individual purchase. Sources may use different assumptions; a winner is shown only for comparable figures.</p></section>}
      </div>
      {!result && !busy && <aside className="method"><h2>A number needs a source.</h2><p>We look for a report about the exact product, show its original figure, and check that the two estimates cover the same amount and life stages. If we cannot verify a figure, you’ll see “no reliable data for this one”.</p></aside>}
    </main>
    <footer>kg CO2e means kilograms of carbon dioxide equivalent, a common measure of greenhouse gas emissions.</footer>
  </>;
}
const client = new ConvexReactClient(__CONVEX_URL__);
createRoot(document.getElementById("root")).render(<ConvexProvider client={client}><App /></ConvexProvider>);
