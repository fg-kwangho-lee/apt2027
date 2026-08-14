import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const DIR = path.resolve('itemlist_2026_08');
const QR_DIR = path.join(DIR, 'qr');
const OUT_DIR = path.join(DIR, 'qr_labeled');
fs.mkdirSync(OUT_DIR, { recursive: true });

const fontCandidates = [
  'C:/Windows/Fonts/malgunbd.ttf',
  'C:/Windows/Fonts/malgun.ttf',
];
let boldFont = 'sans-serif', regFont = 'sans-serif';
for (const f of fontCandidates) {
  if (fs.existsSync(f)) {
    const family = f.includes('bd') ? 'MalgunBold' : 'MalgunReg';
    GlobalFonts.registerFromPath(f, family);
    if (f.includes('bd')) boldFont = family; else regFont = family;
  }
}

const categories = ['다이닝룸','매트리스','소파','소파테이블','스터디','옷장','침실','키즈','펫','홈라이브러리'];

const ACCENT = '#7A4A2B';
const TEXT = '#1E2420';
const MUTED = '#5B655C';
const BORDER = '#DCDFD6';

async function makeLabeledCard(title, subtitle, qrPngPath, outPath) {
  const W = 800, H = 1000;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  ctx.fillStyle = ACCENT;
  ctx.font = `600 26px "${boldFont}"`;
  ctx.textAlign = 'center';
  ctx.fillText('일룸', W / 2, 90);

  ctx.fillStyle = TEXT;
  ctx.font = `700 64px "${boldFont}"`;
  ctx.fillText(title, W / 2, 175);

  const qrImg = await loadImage(qrPngPath);
  const qrSize = 560;
  const qrX = (W - qrSize) / 2;
  const qrY = 230;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = MUTED;
  ctx.font = `400 30px "${regFont}"`;
  ctx.fillText(subtitle, W / 2, qrY + qrSize + 80);

  ctx.fillStyle = TEXT;
  ctx.font = `500 26px "${regFont}"`;
  ctx.fillText('QR코드를 스캔해 주세요', W / 2, qrY + qrSize + 130);

  ctx.fillStyle = MUTED;
  ctx.font = `400 20px "${regFont}"`;
  ctx.fillText('2026년 8월 14일 기준', W / 2, H - 40);

  const buf = await canvas.encode('png');
  fs.writeFileSync(outPath, buf);
}

async function main() {
  await makeLabeledCard(
    '전체 목록',
    '아이템리스트 전체 카테고리 보기',
    path.join(QR_DIR, '_전체목록.png'),
    path.join(OUT_DIR, '00_전체목록.png')
  );
  console.log('생성: 00_전체목록.png');

  for (const cat of categories) {
    await makeLabeledCard(
      cat,
      `${cat} 아이템리스트 PDF`,
      path.join(QR_DIR, `${cat}.png`),
      path.join(OUT_DIR, `${cat}.png`)
    );
    console.log(`생성: ${cat}.png`);
  }

  // 통합 시트 (A4 비율, 3열 그리드)
  const COLS = 3;
  const CARD_W = 480, CARD_H = 560;
  const PAD = 40, GAP = 24;
  const items = ['00_전체목록', ...categories];
  const rows = Math.ceil(items.length / COLS);
  const SHEET_W = PAD * 2 + COLS * CARD_W + (COLS - 1) * GAP;
  const SHEET_H = PAD * 2 + 140 + rows * CARD_H + (rows - 1) * GAP;

  const sheet = createCanvas(SHEET_W, SHEET_H);
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#EEF0EB';
  sctx.fillRect(0, 0, SHEET_W, SHEET_H);

  sctx.fillStyle = ACCENT;
  sctx.font = `600 24px "${boldFont}"`;
  sctx.textAlign = 'left';
  sctx.fillText('일룸', PAD, 60);

  sctx.fillStyle = TEXT;
  sctx.font = `700 44px "${boldFont}"`;
  sctx.fillText('아이템리스트 QR 배포 시트', PAD, 110);

  sctx.fillStyle = MUTED;
  sctx.font = `400 22px "${regFont}"`;
  sctx.fillText('2026년 8월 14일 기준 · 총 10종', PAD, 140);

  for (let i = 0; i < items.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = PAD + 140 + row * (CARD_H + GAP);
    const isAll = i === 0;
    const label = isAll ? '전체 목록' : items[i];
    const qrFile = isAll ? '_전체목록.png' : `${items[i]}.png`;

    sctx.fillStyle = '#FFFFFF';
    sctx.strokeStyle = isAll ? ACCENT : BORDER;
    sctx.lineWidth = isAll ? 3 : 1.5;
    sctx.beginPath();
    sctx.roundRect(x, y, CARD_W, CARD_H, 16);
    sctx.fill();
    sctx.stroke();

    sctx.fillStyle = TEXT;
    sctx.font = `700 30px "${boldFont}"`;
    sctx.textAlign = 'center';
    sctx.fillText(label, x + CARD_W / 2, y + 46);

    const qrImg = await loadImage(path.join(QR_DIR, qrFile));
    const qs = 380;
    sctx.drawImage(qrImg, x + (CARD_W - qs) / 2, y + 70, qs, qs);

    sctx.fillStyle = MUTED;
    sctx.font = `400 18px "${regFont}"`;
    sctx.fillText('QR코드를 스캔해 주세요', x + CARD_W / 2, y + CARD_H - 24);
  }

  const sheetBuf = await sheet.encode('png');
  fs.writeFileSync(path.join(OUT_DIR, '_통합시트.png'), sheetBuf);
  console.log('생성: _통합시트.png');
}

main();
