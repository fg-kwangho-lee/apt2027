/**
 * scrape_asil.js
 * asil.kr에서 2027+2028년 전국 아파트 입주물량 데이터를 가져와
 * asil_2027_raw.csv + apt_list.txt / apt_list_2028.txt 갱신
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// 전국 시/도 코드 (area=0 이 전체가 아닐 경우 개별 코드로 수집)
const SIDO_CODES = [
  { code: '11', name: '서울'  },
  { code: '41', name: '경기'  },
  { code: '28', name: '인천'  },
  { code: '42', name: '강원'  },
  { code: '43', name: '충북'  },
  { code: '44', name: '충남'  },
  { code: '30', name: '대전'  },
  { code: '47', name: '경북'  },
  { code: '48', name: '경남'  },
  { code: '27', name: '대구'  },
  { code: '26', name: '부산'  },
  { code: '31', name: '울산'  },
  { code: '45', name: '전북'  },
  { code: '46', name: '전남'  },
  { code: '29', name: '광주'  },
  { code: '50', name: '제주'  },
  { code: '36', name: '세종'  },
];

function get(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'asil.kr',
      path: url,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://asil.kr/app/household.jsp',
        'Accept': 'application/json, text/plain, */*',
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchSidoYear(code, name, year) {
  const qs = new URLSearchParams({
    area: code,
    order: 'movein_yyyymm',
    orderby: 'asc',
    sY: String(year), sM: '1',
    eY: String(year), eM: '12',
  });
  const res = await get(`/app/data/data_movein.jsp?${qs}`);
  if (res.status !== 200) throw new Error(`${name} HTTP ${res.status}`);

  let json;
  try { json = JSON.parse(res.data); } catch { return []; }
  const list = Array.isArray(json) ? json : (json.list || json.data || []);

  return list.map(item => ({
    region: name,
    addr:      (item.addr  || '').trim(),
    name:      (item.name  || '').trim(),
    movein:    (item.movein || '').trim(),
    household: String(item.household || '0').replace(/[^0-9]/g, ''),
  })).filter(r => r.name && r.movein);
}

async function fetchAllForYear(year) {
  const all = [];
  for (const sido of SIDO_CODES) {
    try {
      const rows = await fetchSidoYear(sido.code, sido.name, year);
      console.log(`  [${year}] ${sido.name}: ${rows.length}개`);
      all.push(...rows);
    } catch (e) {
      console.warn(`  [${year}] ${sido.name} 실패: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  // 중복 제거
  const seen = new Set();
  return all.filter(r => {
    const key = `${r.name}|${r.movein}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.movein.localeCompare(b.movein, 'ko'));
}

async function main() {
  console.log('asil.kr 2027+2028년 전국 입주물량 수집 중...');

  // 2027 수집 → apt_list.txt
  const data2027 = await fetchAllForYear(2027);
  const csv2027 = ['"region","addr","name","movein","movein_ym","household"'];
  for (const r of data2027) {
    const ym = r.movein.replace(/[^0-9]/g, '').padEnd(6, '0');
    csv2027.push(`"${r.region}","${r.addr}","${r.name}","${r.movein}","${ym}","${r.household}"`);
  }
  fs.writeFileSync(path.join(__dirname, 'asil_2027_raw.csv'), csv2027.join('\n'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'apt_list.txt'),
    data2027.map(r => `${r.name}|${r.addr}|${r.movein}|${r.household}`).join('\n') + '\n', 'utf8');
  console.log(`✅ 2027: ${data2027.length}개 저장`);

  // 2028 수집 → apt_list_2028.txt
  const data2028 = await fetchAllForYear(2028);
  const csv2028 = ['"region","addr","name","movein","movein_ym","household"'];
  for (const r of data2028) {
    const ym = r.movein.replace(/[^0-9]/g, '').padEnd(6, '0');
    csv2028.push(`"${r.region}","${r.addr}","${r.name}","${r.movein}","${ym}","${r.household}"`);
  }
  fs.writeFileSync(path.join(__dirname, 'asil_2028_raw.csv'), csv2028.join('\n'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'apt_list_2028.txt'),
    data2028.map(r => `${r.name}|${r.addr}|${r.movein}|${r.household}`).join('\n') + '\n', 'utf8');
  console.log(`✅ 2028: ${data2028.length}개 저장`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
