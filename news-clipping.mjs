// news-clipping.mjs
// 요일별 주제 × 부산·경남·울산 지역별 뉴스클리핑 → 슬랙 발송
import https from 'https';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxmGhs3jjZ3XSgEHrk5RB2sdWpJ0NBPk2Z9mW8MjSAntHHt1a4Jd_78yoKnFBytGjR/exec';
const NEWS_PER_REGION = 1;

// sections가 1개면 일반 구조, 여러 개면 꼭지별로 분리 출력
const TOPICS = {
  1: {
    label: '🛋️ 인테리어 / 가구 트렌드',
    sections: [{ query: '인테리어 가구 트렌드' }],
  },
  2: {
    label: '🏠 부동산 / 신규 분양 동향',
    sections: [{ query: '부동산 분양 청약' }],
  },
  3: {
    label: '🏪 유통업계 / 경쟁사 동향',
    sections: [{ query: '가구 유통 한샘 이케아 현대리바트' }],
  },
  4: {
    label: '🌿 소비자 라이프스타일',
    sections: [{ query: '소비자 라이프스타일 트렌드' }],
  },
  5: {
    label: '📊 인구이동 이슈',
    sections: [
      { label: '🏠 이사·입주 동향',  query: '아파트 입주 이사' },
      { label: '📈 인구 유출입 현황', query: '인구 전입 전출 감소' },
      { label: '🌱 지역 정착·개발',  query: '이주 정착 신도시' },
    ],
  },
};

// 슬랙 발송 대상
const SLACK_REGIONS = [
  { label: '🏙️ 부산', keyword: '부산' },
  { label: '🌊 경남', keyword: '경남' },
  { label: '🏭 울산', keyword: '울산' },
];

// 시트 누적 전용 (슬랙 미발송)
const SHEET_REGIONS = [
  { label: '서울', keyword: '서울' },
  { label: '경기', keyword: '경기' },
  { label: '대전', keyword: '대전' },
  { label: '광주', keyword: '광주' },
  { label: '대구', keyword: '대구' },
  { label: '제주', keyword: '제주' },
  { label: '강원', keyword: '강원' },
];

const ALL_REGIONS = [...SLACK_REGIONS, ...SHEET_REGIONS];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseRssItems(xml, count) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < count) {
    const item = match[1];
    const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                || item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim();
    const link = (item.match(/<link>(.*?)<\/link>/)?.[1]
               || item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || '').trim();
    if (title && link) {
      items.push({
        title: title
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        link,
      });
    }
  }
  return items;
}

async function fetchNews(query, count) {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;
    const xml = await fetchUrl(url);
    return parseRssItems(xml, count);
  } catch (e) {
    console.error(`fetch 실패 (${query.substring(0, 20)}): ${e.message}`);
    return [];
  }
}

async function postJson(url, body, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const bodyStr = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return postJson(res.headers.location, body, redirectCount + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function saveToSheet(rows) {
  try {
    const result = await postJson(APPS_SCRIPT_URL, rows);
    console.log('시트 저장 완료:', result);
  } catch (e) {
    console.error('시트 저장 실패 (슬랙은 정상):', e.message);
  }
}

async function postToSlack(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const urlObj = new URL(SLACK_WEBHOOK_URL);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const topic = TOPICS[dayOfWeek];
  if (!topic) {
    console.log('주말입니다. 클리핑 없음.');
    return;
  }

  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${DAY_NAMES[dayOfWeek]})`;
  console.log(`[${dateStr}] ${topic.label}`);

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📰 일룸 뉴스클리핑 | ${dateStr}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*오늘의 주제: ${topic.label}*` },
    },
  ];

  const newsPerSection = topic.sections.length === 1 ? 3 : 1;
  const sheetRows = [];
  const collectedAt = new Date().toISOString();
  const isoDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const topicLabel = topic.label.replace(/\p{Emoji}/gu, '').trim();

  // 슬랙 + 시트
  for (const region of SLACK_REGIONS) {
    console.log(`  → ${region.label} 수집 중...`);
    const items = [];
    for (const section of topic.sections) {
      const news = await fetchNews(`${region.keyword} ${section.query}`, newsPerSection);
      items.push(...news);
      news.forEach(n => sheetRows.push({ date: isoDate, day: DAY_NAMES[dayOfWeek], topic: topicLabel, region: region.keyword, title: n.title, url: n.link, collected_at: collectedAt }));
    }
    blocks.push({ type: 'divider' });
    const newsText = items.length > 0
      ? items.map((item, i) => `${i + 1}. <${item.link}|${item.title}>`).join('\n')
      : '수집된 뉴스가 없습니다.';
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${region.label}*\n${newsText}` } });
  }

  // 시트 전용 (슬랙 미발송)
  for (const region of SHEET_REGIONS) {
    console.log(`  → ${region.label} 시트 수집 중...`);
    for (const section of topic.sections) {
      const news = await fetchNews(`${region.keyword} ${section.query}`, newsPerSection);
      news.forEach(n => sheetRows.push({ date: isoDate, day: DAY_NAMES[dayOfWeek], topic: topicLabel, region: region.keyword, title: n.title, url: n.link, collected_at: collectedAt }));
    }
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: '출처: Google News · 자동 수집' }],
  });

  // 슬랙 먼저 전송 (시트 저장 전에)
  const slackResult = await postToSlack({ blocks });
  console.log('슬랙 전송 완료:', slackResult);

  // 시트 저장 (슬랙 이후)
  await saveToSheet(sheetRows);
}

main().catch(console.error);
