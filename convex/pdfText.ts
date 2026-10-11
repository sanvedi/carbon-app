type TextItem = { str: string; width: number; transform: number[] };
export function pdfPageText(items: TextItem[]): string {
  const rows: { y: number; items: TextItem[] }[] = [];
  for (const item of [...items].filter(i => i.str.trim()).sort((a, b) => b.transform[5] - a.transform[5])) {
    const y = item.transform[5];
    let row = rows.find(r => Math.abs(r.y - y) <= 2);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push(item);
  }
  return rows.map(row => {
    const columns = row.items.sort((a, b) => a.transform[4] - b.transform[4]);
    let text = "";
    for (let i = 0; i < columns.length; i++) {
      const item = columns[i], previous = columns[i - 1];
      if (previous) {
        const gap = item.transform[4] - previous.transform[4] - previous.width;
        text += gap > 20 ? " | " : gap > 1 ? " " : "";
      }
      // PDF text stores a printed subscript 2 as a smaller, lowered glyph.
      const subscript = previous && /CO$/.test(previous.str) && item.str === "2" && item.transform[3] < previous.transform[3] && item.transform[5] < previous.transform[5];
      text += subscript ? "₂" : item.str;
    }
    return text.replace(/\s+/g, " ").trim();
  }).join("\n");
}
