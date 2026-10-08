"use node";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
// Static imports let Convex include the PDF engine and its worker in the deployment.
// @ts-expect-error The bundled PDF engine has no TypeScript declarations.
import PDFJS from "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js";
PDFJS.disableWorker = true;
function privateAddress(address: string): boolean {
  if (isIP(address) === 6) return true;
  const [a, b] = address.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
export async function readPublicSource(rawUrl: string): Promise<string> {
  let url = new URL(rawUrl);
  for (let redirects = 0; redirects < 4; redirects++) {
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return "";
    const addresses = await lookup(url.hostname, { all: true, family: 4 });
    if (!addresses.length || addresses.some(a => privateAddress(a.address))) return "";
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location"); await response.body?.cancel();
      if (!next) return "";
      url = new URL(next, url); continue;
    }
    if (!response.ok || !response.body) return "";
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.length;
      if (size > 8000000) { await reader.cancel(); return ""; }
      chunks.push(chunk.value);
    }
    const data = Buffer.concat(chunks);
    if (data.subarray(0, 5).toString() === "%PDF-") {
      const document = await PDFJS.getDocument(new Uint8Array(data));
      try {
        if (document.numPages > 100) return "";
        const pages: string[] = [];
        for (let i = 1; i <= document.numPages; i++) {
          const page = await document.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item: { str: string }) => item.str).join(" "));
        }
        return pages.join("\n");
      } finally { await document.destroy(); }
    }
    if (!/text\/html|text\/plain/.test(response.headers.get("content-type") ?? "")) return "";
    return data.toString("utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  }
  return "";
}
