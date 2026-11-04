/** ZIP packaging and browser downloads. */
import { zipSync } from 'fflate';

export interface NamedFile {
  name: string;
  bytes: Uint8Array;
}

/** ZIP without recompression (PNG data is already compressed). Duplicate names get a suffix. */
export function zipFiles(files: NamedFile[]): Uint8Array {
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const f of files) {
    let name = f.name;
    for (let n = 2; entries[name]; n++) name = f.name.replace(/(\.[^.]+)?$/, `-${n}$1`);
    entries[name] = [f.bytes, { level: 0 }];
  }
  return zipSync(entries);
}

export function downloadBlob(data: Uint8Array | string, fileName: string, mime: string): void {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
