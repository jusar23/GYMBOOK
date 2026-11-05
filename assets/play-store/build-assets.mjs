import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../../frontend/node_modules/sharp/dist/index.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const outDir = path.resolve(root, 'assets/play-store');
const screenshotsDir = path.resolve(root, 'assets/screenshots');

const graphics = {
  es: {
    label: 'GYMBOOK TRAINING',
    line1: 'ENTRENA CON',
    line2: 'INTENCIÓN.',
    sub1: 'Planifica rutinas. Registra cada serie.',
    sub2: 'Sigue tu progreso con constancia.',
  },
  en: {
    label: 'GYMBOOK TRAINING',
    line1: 'TRAIN WITH',
    line2: 'INTENTION.',
    sub1: 'Plan workouts. Log every set.',
    sub2: 'Track your progress over time.',
  },
};

function featureSvg(copy) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#20291a"/><stop offset=".54" stop-color="#182018"/><stop offset="1" stop-color="#111614"/>
    </linearGradient>
    <radialGradient id="glow" cx="76%" cy="49%" r="52%">
      <stop offset="0" stop-color="#b8f36b" stop-opacity=".25"/><stop offset="1" stop-color="#b8f36b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#b8f36b" stop-opacity=".16"/><stop offset="1" stop-color="#b8f36b" stop-opacity=".9"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <g fill="none" stroke="#b8f36b" stroke-opacity=".09">
    <circle cx="816" cy="250" r="196" stroke-width="1"/><circle cx="816" cy="250" r="156" stroke-width="1"/>
    <path d="M570 0v500M640 0v500M710 0v500M780 0v500M850 0v500M920 0v500M990 0v500"/>
    <path d="M570 70h454M570 140h454M570 210h454M570 280h454M570 350h454M570 420h454"/>
  </g>
  <path d="M588 365 C642 349 666 332 706 338 S764 299 803 308 S866 250 900 258 S952 207 1004 193" fill="none" stroke="url(#line)" stroke-width="5" stroke-linecap="round"/>
  <g fill="#b8f36b" stroke="#162016" stroke-width="5">
    <circle cx="706" cy="338" r="8"/><circle cx="803" cy="308" r="8"/><circle cx="900" cy="258" r="8"/><circle cx="1004" cy="193" r="8"/>
  </g>
  <path d="M588 365 C642 349 666 332 706 338 S764 299 803 308 S866 250 900 258 S952 207 1004 193 L1004 434 L588 434 Z" fill="#b8f36b" fill-opacity=".08"/>
  <g transform="translate(675 104)" fill="#b8f36b" opacity=".98">
    <rect x="55" y="64" width="204" height="18" rx="9"/>
    <rect x="34" y="25" width="34" height="96" rx="12"/>
    <rect x="69" y="42" width="25" height="62" rx="9"/>
    <rect x="220" y="42" width="25" height="62" rx="9"/>
    <rect x="246" y="25" width="34" height="96" rx="12"/>
  </g>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="72" y="82" fill="#b8f36b" font-size="17" font-weight="700" letter-spacing="4">${copy.label}</text>
    <text x="68" y="224" fill="#f7f8f3" font-size="47" font-weight="700" letter-spacing="-.8">${copy.line1}</text>
    <text x="68" y="284" fill="#b8f36b" font-size="55" font-weight="800" letter-spacing="-1.4">${copy.line2}</text>
    <text x="72" y="350" fill="#e4e8dd" font-size="21">${copy.sub1}</text>
    <text x="72" y="383" fill="#e4e8dd" font-size="21">${copy.sub2}</text>
  </g>
  <rect x="72" y="423" width="60" height="5" rx="2.5" fill="#b8f36b"/>
</svg>`;
}

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0c0e12"/>
  <g fill="#b8f36b">
    <rect x="118" y="238" width="276" height="36" rx="18"/>
    <rect x="88" y="168" width="56" height="176" rx="18"/>
    <rect x="144" y="198" width="44" height="116" rx="16"/>
    <rect x="324" y="198" width="44" height="116" rx="16"/>
    <rect x="368" y="168" width="56" height="176" rx="18"/>
  </g>
</svg>`;

await fs.mkdir(path.join(outDir, 'screenshots-en'), { recursive: true });

for (const [locale, copy] of Object.entries(graphics)) {
  const svg = featureSvg(copy);
  await fs.writeFile(path.join(outDir, `feature-graphic-${locale}-play.svg`), svg);
  await sharp(Buffer.from(svg)).jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(path.join(outDir, `feature-graphic-${locale}-play.jpg`));
}

await fs.writeFile(path.join(outDir, 'app-icon-play-512.svg'), iconSvg);
await sharp(Buffer.from(iconSvg)).png().toFile(path.join(outDir, 'app-icon-play-512.png'));

const screenshotFiles = [
  ['home', '01-home'],
  ['workout', '02-workout'],
  ['plan', '03-plan'],
  ['library', '04-exercise-library'],
  ['stats', '05-progress'],
];

for (const [sourceName, outputName] of screenshotFiles) {
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="68%"><stop offset="0" stop-color="#172018"/><stop offset="1" stop-color="#0c0e12"/></radialGradient></defs>
    <rect width="1080" height="1920" fill="url(#g)"/>
    <path d="M0 315h1080M0 1605h1080" stroke="#b8f36b" stroke-opacity=".1" stroke-width="2"/>
    <circle cx="85" cy="440" r="6" fill="#b8f36b" fill-opacity=".25"/><circle cx="995" cy="1515" r="8" fill="#b8f36b" fill-opacity=".18"/>
  </svg>`;
  const frame = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  const appCapture = await sharp(path.join(screenshotsDir, `${sourceName}.png`))
    .rotate().resize(1080, 1920, { fit: 'contain', background: '#0c0e12' }).png().toBuffer();
  await sharp(frame).composite([{ input: appCapture, left: 0, top: 0 }])
    .png().toFile(path.join(outDir, 'screenshots-en', `${outputName}-1080x1920.png`));
}

const readme = `# Gymbook — Google Play visual assets

Prepared for the Google Play store listing. Original source captures under ` + '`assets/screenshots/`' + ` were left unchanged.

## Files

- ` + '`app-icon-play-512.png`' + ` — square Play Store icon, 512 × 512 PNG.
- ` + '`feature-graphic-es-play.jpg`' + ` — Spanish feature graphic, 1024 × 500 JPEG.
- ` + '`feature-graphic-en-play.jpg`' + ` — English feature graphic, 1024 × 500 JPEG.
- ` + '`screenshots-en/`' + ` — five 1080 × 1920 PNG listing images using the existing in-app captures. Their UI language is English.

For the Spanish localized listing, capture the same five app screens with Gymbook set to Spanish and use those captures in place of the English screenshots. The screenshots in this pack retain the full app screen without stretching or cropping it.

Google Play currently requires a 1024 × 500 feature graphic and app icon; it recommends four or more 1080 × 1920 screenshots for app discovery. Review the current requirements in [Google Play Help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
`;
await fs.writeFile(path.join(outDir, 'README-play-assets.md'), readme, 'utf8');

console.log('Generated Play assets in', outDir);
