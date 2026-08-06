import { domToPng, domToJpeg } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Renders the on-screen receipt node to a file the employee can keep or send.
// modern-screenshot (not html2canvas) because it serialises the DOM into an SVG
// foreignObject and lets the browser paint — so modern CSS colour spaces work.
// The receipt's images are inlined as data URIs (see lib/receiptAssets.js) so
// nothing has to be fetched during capture: CapacitorHttp patches window.fetch
// in the app, and that patched fetch breaks modern-screenshot's image loading.

const A4 = { w: 210, h: 297 }; // mm

async function nodeToDataUrl(node, format) {
  const opts = { backgroundColor: '#ffffff', scale: 2, fetch: { bypassingCache: true } };
  return format === 'jpeg' ? domToJpeg(node, { ...opts, quality: 0.95 }) : domToPng(node, opts);
}

async function buildFile(node, format) {
  if (!node) throw new Error('Receipt not ready to export');

  if (format === 'pdf') {
    const png = await nodeToDataUrl(node, 'png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(png, 'PNG', 0, 0, A4.w, A4.h);
    return { base64: pdf.output('datauristring').split(',')[1], ext: 'pdf' };
  }

  const dataUrl = await nodeToDataUrl(node, format);
  return { base64: dataUrl.split(',')[1], ext: format === 'jpeg' ? 'jpg' : 'png' };
}

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

export async function saveReceipt(node, format, receiptNo) {
  const { base64, ext } = await buildFile(node, format);
  const fileName = `Receipt_${(receiptNo || 'draft').replace(/\//g, '-')}.${ext}`;
  const { label } = await writeToFirstWritable(fileName, base64, SAVE_TARGETS);
  return { fileName, label };
}

export async function shareReceipt(node, format, receiptNo) {
  const { base64, ext } = await buildFile(node, format);
  const fileName = `Receipt_${(receiptNo || 'draft').replace(/\//g, '-')}.${ext}`;

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
