// Company-wide client lists rendered on the "Our Clients" page of every
// quotation. Edit any list here — the changes apply to all future quotations
// immediately (and to previews of existing ones on reload).
//
// LOGO images: to use a real logo instead of the styled text pill, drop the
// image into `public/clients/<name>.png` and set `logo: '/clients/<name>.png'`
// on that entry, OR set `logo` to any public HTTPS URL.

export const CLIENT_CATEGORIES = [
  {
    title: 'Corporate',
    entries: [
      'Aditya Birla Pantaloons',
      'Cachet Pharmaceuticals Pvt. Ltd.',
      'Aristo Pharmaceuticals Pvt. Ltd.',
      'KIA',
      'Sugar Cosmetics',
      'Cranex Limited',
    ],
  },
  {
    title: 'Government',
    entries: [
      'Municipal Corporation of Greater Mumbai (MCGM)',
      'Mumbai Metropolitan Region Development Authority (MMRDA)',
      'Mumbai Metro Rail Corporation Ltd (MMRCL)',
      'Reserve Bank of India (RBI)',
    ],
  },
  {
    title: 'Residential',
    entries: [
      'Lakeview Seven, Powai',
      'Vikas Tower, Andheri (E)',
      'Sonal Classic, Andheri (W)',
      'Malkans, Vile Parle (E)',
      "Queen's Lawn, Irla",
      'Meenakshi, Irla',
      'Manisha NX',
      'Chitrakoot, Juhu',
    ],
  },
];

// Logos row rendered below the category lists. Each entry becomes a uniform-
// sized tile so the row looks even regardless of individual aspect ratio.
// `logo` is optional — leave it '' to render a styled brand pill instead.
export const CLIENT_LOGOS = [
  { name: 'MCGM',                   logo: '/client-logo/images%20(1).jpg' },
  { name: 'MMRCL',                  logo: '/client-logo/621f7128c5c15_maharashtra_metro_rail_corporation_ltd_logo_.webp' },
  { name: 'MMRDA',                  logo: '/client-logo/images.png' },
  { name: 'RBI',                    logo: '/client-logo/RBI.webp' },
  { name: 'Aditya Birla Pantaloons',logo: '/client-logo/Exx-AdityaBirlasa-1.jpg' },
  { name: 'Cachet Pharmaceuticals', logo: '/client-logo/images.jpg' },
  { name: 'Aristo Pharmaceuticals', logo: '/client-logo/185303-aristo-logo.webp' },
  { name: 'KIA',                    logo: '/client-logo/Kia-Emblem.png' },
  { name: 'SUGAR Cosmetics',        logo: '/client-logo/SUGAR-Cosmetics-logo.png' },
  { name: 'Cranex Limited',         logo: '/client-logo/Cranex%20Limited%205.jpg' },
  { name: 'DEL Fab',                logo: '/client-logo/delfab.jpg' },
  { name: 'CAP',                    logo: '/client-logo/images%20(1).png' },
];
