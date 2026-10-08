export type Evidence = {
  name: string; status: "found" | "no_data"; kgCO2e: number | null;
  basis: string; sourceName: string; sourceUrl: string; sourceFigure: string;
  excerpt: string; boundary: string; comparisonKey: string; comparable: boolean;
};
export function noData(name: string): Evidence {
  return { name, status: "no_data", kgCO2e: null, basis: "", sourceName: "", sourceUrl: "", sourceFigure: "", excerpt: "", boundary: "", comparisonKey: "", comparable: false };
}
export function normalizeText(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]+/gi, " ").toLowerCase().trim().replace(/\s+/g, " ").replace(/\bco\s*2\s*e\b/g, "co2e");
}
export function validateEvidence(item: Evidence, citedUrls: Set<string>, sourceText: string): Evidence {
  if (item.status !== "found") return noData(item.name);
  if (!citedUrls.has(item.sourceUrl) || !item.sourceName || !item.basis || !item.boundary || !item.comparisonKey || item.kgCO2e === null || !Number.isFinite(item.kgCO2e) || item.kgCO2e <= 0) return noData(item.name);
  const text = normalizeText(sourceText), figure = normalizeText(item.sourceFigure), excerpt = normalizeText(item.excerpt);
  if (!/\bkg\s*co2\s*e\b/.test(figure) || !figure.split(" ").includes(String(item.kgCO2e)) || !text.includes(figure) || !text.includes(excerpt) || excerpt.split(" ").length < 3 || excerpt.split(" ").length > 25) return noData(item.name);
  return item;
}
export function recommendation(products: Evidence[]): string {
  const [a, b] = products;
  if (products.some(p => p.status === "no_data")) return "I cannot recommend either product on carbon footprint because reliable data is missing for at least one.";
  if (!a.comparable || !b.comparable || a.comparisonKey !== b.comparisonKey) return "I cannot recommend either product on carbon footprint because the published figures cover different amounts, life stages or methods.";
  if (a.kgCO2e === b.kgCO2e) return "Choose either on carbon footprint because both have the same published estimate on a comparable basis.";
  const winner = a.kgCO2e! < b.kgCO2e! ? a : b;
  const difference = Number(Math.abs(a.kgCO2e! - b.kgCO2e!).toFixed(3));
  return `Pick ${winner.name.replace(/[.!?]/g, "")} for a lower estimated carbon footprint because its comparable published figure is ${difference} kg CO2e lower.`;
}
