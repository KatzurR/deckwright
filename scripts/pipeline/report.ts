/**
 * Markdown report of a pipeline run (data/pipeline-report.md).
 */
import type { ReportSection } from './build/common';

const TYPE_TITLES: Record<string, string> = {
  spell: 'Spells',
  condition: 'Conditions',
  action: 'Actions',
  item: 'Magic items',
  feature: 'Features',
};

function list(items: string[], max = 200): string {
  if (items.length === 0) return '_none_\n';
  const shown = items.slice(0, max).map((i) => `- ${i}`);
  if (items.length > max) shown.push(`- … ${items.length - max} more`);
  return `${shown.join('\n')}\n`;
}

export function renderReport(sections: ReportSection[], meta: { generatedAt: string; offline: boolean; durationMs: number }): string {
  let out = '# Data pipeline report\n\n';
  out += `Generated ${meta.generatedAt} (${meta.offline ? 'offline, cached sources' : 'online'}, ${(meta.durationMs / 1000).toFixed(1)} s).\n\n`;
  out += 'Sources: Open5e API v2 (`document.key = srd-2024`) for structure and keys, ';
  out += 'SRD 5.2.1 PDFs (English and German, Poppler `pdftohtml -xml`) for the rules texts.\n\n';

  out += '## Summary\n\n| Type | Catalog | Auto-matched | Manual | Ambiguous groups | Missing | Duplicates |\n|---|---|---|---|---|---|---|\n';
  for (const s of sections) {
    out += `| ${TYPE_TITLES[s.type] ?? s.type} | ${s.counts.catalog ?? 0} | ${s.autoMatches} | ${s.manualMatches} | ${s.ambiguous.length} | ${s.problems.missing.length} | ${s.problems.duplicates.length} |\n`;
  }
  out += '\n';

  for (const s of sections) {
    out += `## ${TYPE_TITLES[s.type] ?? s.type}\n\n`;
    out += '| Count | Value |\n|---|---|\n';
    for (const [k, v] of Object.entries(s.counts)) out += `| ${k} | ${v} |\n`;
    out += `| automatic matches | ${s.autoMatches} |\n| manual matches | ${s.manualMatches} |\n\n`;
    out += '### Without automatic match\n\n';
    const unmatched = [
      ...s.ambiguous.map((a) => `ambiguous \`${a.primary}\`: EN ${a.en.join(', ')} ↔ DE ${a.de.join(', ')}`),
      ...s.unmatchedEn.map((k) => `EN only: ${k}`),
      ...s.unmatchedDe.map((k) => `DE only: ${k}`),
    ];
    out += list(unmatched);
    out += '\nEntries listed here are resolved by `"manual": true` entries in the mapping file where needed.\n\n';
    if (s.problems.missing.length || s.problems.duplicates.length || s.problems.unknownDe.length) {
      out += '### Errors\n\n';
      out += list([
        ...s.problems.missing.map((k) => `no German assignment: ${k}`),
        ...s.problems.duplicates.map((d) => `German entry "${d.de}" assigned twice: ${d.keys.join(', ')}`),
        ...s.problems.unknownDe.map((u) => `mapping for ${u.key} names unknown German entry "${u.de}"`),
      ]);
      out += '\n';
    }
    out += `### Warnings (${s.warnings.length})\n\n${list(s.warnings, 400)}\n`;
  }
  return out;
}
