/**
 * Source acquisition: Open5e API downloads, SRD PDF downloads (checksum-verified, into srd/)
 * and PDF → XML conversion, cached in data/cache.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Lang } from '../../src/model/schema';
import { parseXml, type XmlPage } from './pdf/xml';
import { documentLines, type Line } from './pdf/layout';

export const ROOT = join(dirname(new URL(import.meta.url).pathname), '..', '..');
export const CACHE = join(ROOT, 'data', 'cache');
export const SRD_PDF: Record<Lang, string> = {
  de: join(ROOT, 'srd', 'SRD_CC_v5.2.1_DE.pdf'),
  en: join(ROOT, 'srd', 'SRD_CC_v5.2.1_EN.pdf'),
};

/**
 * Official SRD 5.2.1 PDFs. They are not part of the repository: the pipeline downloads them
 * into srd/ (gitignored) and checks them against the version the catalog was built from.
 */
export const SRD_SOURCES: Record<Lang, { url: string; sha256: string }> = {
  de: {
    url: 'https://media.dndbeyond.com/compendium-images/srd/5.2/DE_SRD_CC_v5.2.1.pdf',
    sha256: 'f06989dcdf98c8e93b52ba5ea9db52d5e1b054d6d87a148ff295138bafe8a65b',
  },
  en: {
    url: 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
    sha256: '8974902d109d6e63672d7c490bde9ccf052410503d9cfa768237154fbc5e3d87',
  },
};

export const OPEN5E_BASE = 'https://api.open5e.com/v2';
export const OPEN5E_DOCUMENT = 'srd-2024';
export const OPEN5E_ENDPOINTS = ['spells', 'weapons', 'magicitems', 'classes', 'species', 'feats'] as const;
export type Open5eEndpoint = (typeof OPEN5E_ENDPOINTS)[number];

const USER_AGENT = 'open-tabletop-cards-pipeline';

export interface SourceOptions {
  offline: boolean;
  log?: (msg: string) => void;
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

/** Download all pages of an Open5e endpoint, keeping only srd-2024 entries. */
export async function fetchOpen5e(endpoint: Open5eEndpoint): Promise<unknown[]> {
  let url: string | null = `${OPEN5E_BASE}/${endpoint}/?document__key=${OPEN5E_DOCUMENT}&limit=100`;
  const out: unknown[] = [];
  while (url) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Open5e ${endpoint}: HTTP ${res.status} for ${url}`);
    const data = (await res.json()) as { next: string | null; results: { document?: { key?: string } }[] };
    out.push(...data.results);
    url = data.next;
  }
  // Some endpoints ignore the document filter – filter client-side.
  return out.filter((r) => (r as { document?: { key?: string } }).document?.key === OPEN5E_DOCUMENT);
}

export async function loadOpen5e(endpoint: Open5eEndpoint, opts: SourceOptions): Promise<unknown[]> {
  const file = join(CACHE, 'open5e', `${endpoint}.json`);
  if (opts.offline) {
    if (!existsSync(file)) throw new Error(`Offline mode: ${file} missing – run "npm run pipeline" once online.`);
    return JSON.parse(readFileSync(file, 'utf8'));
  }
  opts.log?.(`Downloading Open5e ${endpoint} …`);
  const data = await fetchOpen5e(endpoint);
  ensureDir(dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 1));
  return data;
}

/** Throw unless `data` has the expected SHA-256 checksum. */
export function verifySha256(data: Uint8Array, expected: string, label: string): void {
  const actual = createHash('sha256').update(data).digest('hex');
  if (actual !== expected) {
    throw new Error(
      `${label}: SHA-256 ${actual} does not match ${expected}. The published file has changed – ` +
      'check the new version and update SRD_SOURCES in scripts/pipeline/sources.ts.',
    );
  }
}

/**
 * Make sure the SRD PDF of one language is available and unchanged. Not needed when its text
 * was already extracted to data/cache; otherwise downloaded once (not in offline mode).
 */
export async function ensureSrdPdf(lang: Lang, opts: SourceOptions): Promise<void> {
  if (existsSync(join(CACHE, `srd-${lang}.xml`))) return;
  const file = SRD_PDF[lang];
  const source = SRD_SOURCES[lang];
  if (existsSync(file)) {
    verifySha256(readFileSync(file), source.sha256, file);
    return;
  }
  if (opts.offline) throw new Error(`Offline mode: ${file} missing – run "npm run pipeline" once online.`);
  opts.log?.(`Downloading ${source.url} …`);
  const res = await fetch(source.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`SRD PDF ${lang}: HTTP ${res.status} for ${source.url}`);
  const data = new Uint8Array(await res.arrayBuffer());
  verifySha256(data, source.sha256, source.url);
  ensureDir(dirname(file));
  writeFileSync(file, data);
}

export function hasPoppler(): boolean {
  try {
    execFileSync('pdftohtml', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Convert an SRD PDF to Poppler XML (cached; regenerated when missing). */
export function loadPdfXml(lang: Lang, opts: SourceOptions): string {
  const file = join(CACHE, `srd-${lang}.xml`);
  if (!existsSync(file)) {
    if (!hasPoppler()) throw new Error('Poppler (pdftohtml) not found – install poppler-utils.');
    opts.log?.(`Extracting text from ${SRD_PDF[lang]} …`);
    ensureDir(CACHE);
    const xml = execFileSync('pdftohtml', ['-xml', '-i', '-q', '-stdout', '-enc', 'UTF-8', SRD_PDF[lang]], {
      maxBuffer: 256 * 1024 * 1024,
      encoding: 'utf8',
    });
    writeFileSync(file, xml);
  }
  return readFileSync(file, 'utf8');
}

export interface PdfDoc {
  lang: Lang;
  pages: XmlPage[];
  lines: Line[];
}

export function loadPdf(lang: Lang, opts: SourceOptions): PdfDoc {
  const pages = parseXml(loadPdfXml(lang, opts));
  return { lang, pages, lines: documentLines(pages) };
}
