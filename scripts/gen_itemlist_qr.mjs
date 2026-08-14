import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const BASE_URL = 'https://fg-kwangho-lee.github.io/apt2027/itemlist_2026_08';
const DIR = path.resolve('itemlist_2026_08');
const QR_DIR = path.join(DIR, 'qr');

fs.mkdirSync(QR_DIR, { recursive: true });

const files = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

function encodePath(filename) {
  return encodeURIComponent(filename).replace(/%20/g, '%20');
}

const items = files.map(filename => {
  const category = filename.replace(/^아이템리스트\s*/, '').replace(/\s*2026년.*\.pdf$/, '');
  const url = `${BASE_URL}/${encodePath(filename)}`;
  return { filename, category, url };
});

items.sort((a, b) => a.category.localeCompare(b.category, 'ko'));

async function main() {
  for (const item of items) {
    const safeName = item.category.replace(/[^\w가-힣]/g, '_');
    const qrPath = path.join(QR_DIR, `${safeName}.png`);
    await QRCode.toFile(qrPath, item.url, { width: 600, margin: 2 });
    console.log(`QR 생성: ${item.category} -> ${qrPath}`);
  }

  const landingUrl = `${BASE_URL}/`;
  await QRCode.toFile(path.join(QR_DIR, '_전체목록.png'), landingUrl, { width: 600, margin: 2 });
  console.log(`QR 생성: 전체목록 -> ${landingUrl}`);

  const listHtml = items.map(item => (
    `<li><a href="${encodePath(item.filename)}" target="_blank">${item.category}</a></li>`
  )).join('\n      ');

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>일룸 아이템리스트 2026년 8월</title>
<style>
  body { font-family: -apple-system, "Malgun Gothic", sans-serif; max-width: 480px; margin: 40px auto; padding: 0 20px; color: #222; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  p.sub { color: #777; margin-top: 0; font-size: 14px; }
  ul { list-style: none; padding: 0; }
  li { margin: 10px 0; }
  a { display: block; padding: 14px 16px; background: #f5f5f5; border-radius: 10px; text-decoration: none; color: #222; font-weight: 500; }
  a:active { background: #e8e8e8; }
</style>
</head>
<body>
  <h1>일룸 아이템리스트</h1>
  <p class="sub">2026년 8월 14일 기준</p>
  <ul>
      ${listHtml}
  </ul>
</body>
</html>
`;

  fs.writeFileSync(path.join(DIR, 'index.html'), html, 'utf-8');
  console.log('랜딩페이지 생성 완료: itemlist_2026_08/index.html');
}

main();
