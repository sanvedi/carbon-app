// A search answer is a lead, not evidence. Only complete public HTTPS links
// can proceed to the independent report download and text check.
export function completeSourceUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const path = decodeURIComponent(url.pathname);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || /\.\.\.|…/.test(path)) return null;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")) return null;
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^_bhlid$/.test(key)) url.searchParams.delete(key);
    url.hash = "";
    return url.href;
  } catch { return null; }
}

// Whitelist public search metadata; never serialize a provider response,
// request headers, environment variables or error bodies into the logs.
export function logSearchResult(result: { sources: readonly unknown[]; steps: readonly { toolResults: readonly unknown[] }[] }) {
  for (const step of result.steps) for (const raw of step.toolResults) {
    const tool = raw as { toolName?: string; output?: { action?: { type?: string; query?: string; queries?: string[]; url?: string }; sources?: { type?: string; url?: string }[] } };
    if (tool.toolName !== "web_search") continue;
    const action = tool.output?.action;
    console.info("Carbon search returned", JSON.stringify({
      action: action?.type,
      queries: (action?.queries ?? (action?.query ? [action.query] : [])).slice(0, 6).map(q => q.replace(/sk-[A-Za-z0-9_-]+/g, "[hidden]").slice(0, 300)),
      openedUrl: action?.url ? completeSourceUrl(action.url) : undefined,
      sources: (tool.output?.sources ?? []).flatMap(s => s.url ? [completeSourceUrl(s.url)] : []).filter(Boolean).slice(0, 12),
    }));
  }
  console.info("Carbon search citations", JSON.stringify(result.sources.flatMap(raw => {
    const source = raw as { sourceType?: string; url?: string };
    return source.sourceType === "url" && source.url ? [completeSourceUrl(source.url)] : [];
  }).filter(Boolean).slice(0, 12)));
}
