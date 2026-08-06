import { domToPng, domToJpeg } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Renders the on-screen receipt node to a file the employee can keep or send.
// modern-screenshot (not html2canvas) because it serialises the DOM into an SVG
// foreignObject and lets the browser paint — so modern CSS colour spaces work.

const A4 = { w: 210, h: 297 }; // mm

async function nodeToDataUrl(node, format) {
  const opts = { backgroundColor: '#ffffff', scale: 2 };
  return format === 'jpeg' ? domToJpeg(node, { ...opts, quality: 0.95 }) : domToPng(node, opts);
}

// Builds the file and returns { base64, mimeType, ext } ready for writing.
async function buildFile(node, format) {
  if (format === 'pdf') {
    const png = await nodeToDataUrl(node, 'png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(png, 'PNG', 0, 0, A4.w, A4.h);
    const base64 = pdf.output('datauristring').split(',')[1];
    return { base64, mimeType: 'application/pdf', ext: 'pdf' };
  }

  const dataUrl = await nodeToDataUrl(node, format);
  return {
    base64: dataUrl.split(',')[1],
    mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    ext: format === 'jpeg' ? 'jpg' : 'png',
  };
}

// Writes into the app's Documents folder and returns the on-device URI.
async function writeFile(node, format, receiptNo) {
  const { base64, mimeType, ext } = await buildFile(node, format);
  const fileName = `Receipt_${(receiptNo || 'draft').replace(/\//g, '-')}.${ext}`;

  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
  return { uri, fileName, mimeType };
}

export async function saveReceipt(node, format, receiptNo) {
  const { fileName } = await writeFile(node, format, receiptNo);
  return fileName;
}

export async function shareReceipt(node, format, receiptNo) {
  const { uri, fileName } = await writeFile(node, format, receiptNo);
  await Share.share({
    title: fileName,
    text: `Receipt ${receiptNo || ''}`.trim(),
    files: [uri],
  });
  return fileName;
}
