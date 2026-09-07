import { domToPng, domToJpeg } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Renders the on-screen receipt node to a file the employee can keep or send.
// modern-screenshot (not html2canvas) because it serialises the DOM into an SVG
// foreignObject and lets the browser paint — so modern CSS colour spaces work.
// The receipt's images are inlined as data URIs (see lib/receiptAssets.js) so
// nothing has to be fetched during capture: CapacitorHttp patches window.fetch
// in the native app, and that patched fetch breaks modern-screenshot's image
// loading. (On the PWA fetch isn't patched, but data URIs are still simplest.)

const A4 = { w: 210, h: 297 }; // mm
const isNative = Capacitor.isNativePlatform();

async function nodeToDataUrl(node, format) {
  const opts = { backgroundColor: '#ffffff', scale: 2, fetch: { bypassingCache: true } };
  return format === 'jpeg' ? domToJpeg(node, { ...opts, quality: 0.95 }) : domToPng(node, opts);
}

const MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg' };

// Builds the file bytes. Returns both a base64 string (native Filesystem/Share
// want that) and the full data URL (web download/share want that).
async function buildFile(node, format) {
  if (!node) throw new Error('Receipt not ready to export');

  if (format === 'pdf') {
    const png = await nodeToDataUrl(node, 'png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(png, 'PNG', 0, 0, A4.w, A4.h);
    const dataUrl = pdf.output('datauristring');
    return { base64: dataUrl.split(',')[1], dataUrl, ext: 'pdf' };
  }

  const dataUrl = await nodeToDataUrl(node, format);
  return { base64: dataUrl.split(',')[1], dataUrl, ext: format === 'jpeg' ? 'jpg' : 'png' };
}

function fileNameFor(ext, receiptNo) {
  return `Receipt_${(receiptNo || 'draft').replace(/\//g, '-')}.${ext}`;
}

// ---- Web helpers (PWA on iPhone / any browser) ------------------------------

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function browserDownload(dataUrl, fileName) {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function webShare(dataUrl, fileName, ext, receiptNo) {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName, { type: MIME[ext] || blob.type });
  // Web Share API level 2 (files) — supported by iOS Safari 15+.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: fileName,
      text: `Receipt ${receiptNo || ''}`.trim(),
      files: [file],
    });
    return;
  }
  // No file-sharing support (rare) → fall back to a download so nothing is lost.
  browserDownload(dataUrl, fileName);
}

// ---- Native helpers (Android APK) -------------------------------------------

// Android 11+ blocks writing new files into the *public* Documents folder, so a
// single hard-coded directory isn't reliable across devices. Try the most
// user-visible location first and fall back to ones that always work.
const SAVE_TARGETS = [
  { dir: Directory.Documents, label: 'Documents' },
  { dir: Directory.External, label: 'app storage' },
  { dir: Directory.Cache, label: 'app storage' },
];

async function writeToFirstWritable(fileName, base64, targets) {
  let lastError;
  for (const target of targets) {
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: target.dir,
        recursive: true,
      });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: target.dir });
      return { uri, label: target.label };
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(lastError?.message || 'Could not write the file to this device');
}

// ---- Public API -------------------------------------------------------------

export async function saveReceipt(node, format, receiptNo) {
  const { base64, dataUrl, ext } = await buildFile(node, format);
  const fileName = fileNameFor(ext, receiptNo);

  if (!isNative) {
    // Browser: hand the file to the OS download flow. On iPhone this saves to
    // Files / Downloads (or the user picks a location).
    browserDownload(dataUrl, fileName);
    return { fileName, label: 'Downloads' };
  }

  const { label } = await writeToFirstWritable(fileName, base64, SAVE_TARGETS);
  return { fileName, label };
}

export async function shareReceipt(node, format, receiptNo) {
  const { base64, dataUrl, ext } = await buildFile(node, format);
  const fileName = fileNameFor(ext, receiptNo);

  if (!isNative) {
    await webShare(dataUrl, fileName, ext, receiptNo);
    return { fileName };
  }

  // Cache first for sharing: it's always writable and Capacitor's Share plugin
  // exposes it through a FileProvider, which is what other apps can read.
  const { uri } = await writeToFirstWritable(fileName, base64, [
    { dir: Directory.Cache, label: 'cache' },
    { dir: Directory.External, label: 'app storage' },
  ]);

  await Share.share({
    title: fileName,
    text: `Receipt ${receiptNo || ''}`.trim(),
    files: [uri],
  });
  return { fileName };
}
