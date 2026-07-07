import { domToPng } from 'modern-screenshot';

// Captures a DOM node (e.g. a receipt/estimate preview) as a PNG and triggers a
// download. Uses modern-screenshot instead of html2canvas -- html2canvas
// re-implements CSS rendering itself and can't parse the oklch() colors
// Tailwind v4 compiles to by default, so it throws on this exact app's styles.
// modern-screenshot serializes the DOM into an SVG foreignObject and lets the
// browser do the actual painting, so modern color spaces just work.
export async function downloadElementAsImage(element, filename) {
  if (!element) throw new Error('No element to capture');

  const dataUrl = await domToPng(element, {
    backgroundColor: '#ffffff',
    scale: 2, // crisp output for a printable A4 document
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
