/**
 * build_html.js
 * apt_list.txt + ceiling_data.json → index.html 전체 재생성
 * gen_ceiling_data.js 실행 후 이 스크립트를 실행하면 됩니다.
 */
const fs = require('fs');
const path = require('path');

// ceiling_data.json에서 맵 구성 (기존 확인 데이터 우선)
const ceilingData = JSON.parse(fs.readFileSync(path.join(__dirname, 'ceiling_data.json'), 'utf8'));
const ceilingMap = {};
for (const apt of ceilingData) {
  ceilingMap[apt.name.replace(/\s+/g, '')] = apt;
}

function lookupCeiling(rawName) {
  return ceilingMap[rawName.replace(/\s+/g, '')] || { ceiling: '미확인', source: '' };
}

function ceilingBadge(ceiling, source) {
  const val   = parseFloat(ceiling);
  const is24  = val >= 2.4;
  const isPDF = source.includes('PDF확인');
  const color = is24 ? '#1a6b9e' : '#4a7c3f';
  const bg    = is24 ? '#dbeeff' : '#e8f5e2';
  const star  = isPDF ? ' ★' : '';
  const title = isPDF ? 'PDF 직접 확인' : source;
  return `<span class="ceiling-badge" style="background:${bg};color:${color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;cursor:default;" title="${title}">${ceiling}${star}</span>`;
}

function readAptList(filename) {
  const filepath = path.join(__dirname, filename);
  if (!fs.existsSync(filepath)) return [];
  return fs.readFileSync(filepath, 'utf8')
    .split('\n').filter(l => l.trim())
    .map(l => {
      const [name, addr, movein, hh] = l.split('|');
      return { name: name.trim(), addr: addr?.trim() || '', movein: movein?.trim() || '', hh: hh?.trim() || '0' };
    });
}

// 2026 + 2027 + 2028 합산 후 입주월 오름차순 정렬
const aptList = [
  ...readAptList('apt_list_2026.txt'),
  ...readAptList('apt_list.txt'),
  ...readAptList('apt_list_2028.txt'),
].sort((a, b) => a.movein.localeCompare(b.movein, 'ko'));

// 총 세대수
const totalHH = aptList.reduce((s, a) => s + (parseInt(a.hh) || 0), 0);

// 업데이트 일자
const now = new Date();
const updatedAt = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`;

// tbody rows
const rows = aptList.map(apt => {
  const info  = lookupCeiling(apt.name);
  const badge = ceilingBadge(info.ceiling, info.source);
  return `      <tr><td>${apt.addr}</td><td>${apt.name}</td><td>${apt.movein}</td><td>${parseInt(apt.hh).toLocaleString()}세대</td><td>${badge}</td></tr>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>APT 입주물량 - 전국 2026~2028년</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 13px; background: #f5f5f5; color: #333; padding: 24px; }
    .wrap { max-width: 1050px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 28px 32px 36px; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
    .notice { font-size: 11px; color: #888; margin-bottom: 4px; line-height: 1.6; }
    .source { font-size: 11px; color: #888; text-align: right; margin-bottom: 6px; }
    .search-bar { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .search-bar input { flex: 1; min-width: 150px; padding: 7px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: inherit; }
    .search-bar select { padding: 7px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: inherit; background: #fff; }
    .count { font-size: 12px; color: #555; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #2c3e6b; color: #fff; }
    thead th { padding: 11px 14px; text-align: center; font-weight: 600; font-size: 13px; cursor: pointer; user-select: none; white-space: nowrap; }
    thead th:hover { background: #3a5080; }
    thead th.sort-asc::after { content: ' ▲'; font-size: 10px; }
    thead th.sort-desc::after { content: ' ▼'; font-size: 10px; }
    tbody tr { border-bottom: 1px solid #eee; transition: background 0.15s; }
    tbody tr:hover { background: #eef3ff; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    tbody tr:nth-child(even):hover { background: #eef3ff; }
    td { padding: 9px 14px; }
    td:nth-child(1) { color: #555; }
    td:nth-child(3) { text-align: center; }
    td:nth-child(4) { text-align: right; font-weight: 600; }
    td:nth-child(5) { text-align: center; white-space: nowrap; }
    .ceiling-badge { display: inline-block; }
    tfoot tr { background: #dce6f1; font-weight: 700; }
    tfoot td { padding: 10px 14px; }
    tfoot td:nth-child(3) { text-align: right; }
    tfoot td:nth-child(4) { text-align: right; }
  </style>
</head>
<body>
<div class="wrap">
  <h1>APT 입주물량</h1>
  <p class="notice">해당 입주물량은 월 단위 업데이트 데이터로 실시간 모든 입주예정단지를 반영하지 않을 수 있습니다. 자료 이용에 참고 바랍니다.</p>
  <p class="source">출처 : 분양물량조사 &nbsp;|&nbsp; 전국 기준 2026~2028년 &nbsp;|&nbsp; 데이터 업데이트 : ${updatedAt}</p>
  <p class="notice" style="margin-bottom:16px;">
    천장고 기준 :
    <span style="background:#dbeeff;color:#1a6b9e;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;">2.4m</span>
    <span style="background:#e8f5e2;color:#4a7c3f;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;">2.3m</span>
    &nbsp;|&nbsp;
    <strong>★</strong> 표시 : 분양 안내 PDF에서 직접 확인한 수치 &nbsp;/&nbsp; 미표시 : 브랜드·시공사 기준 및 유사 단지 조사 기반 추정치이므로 실제와 다를 수 있습니다.
  </p>

  <div class="search-bar">
    <select id="filterRegion" onchange="filterTable()">
      <option value="">입주 지역</option>
      <option value="서울">서울</option>
      <option value="경기">경기</option>
      <option value="인천">인천</option>
      <option value="강원">강원</option>
      <option value="충북">충북</option>
      <option value="충남">충남</option>
      <option value="대전">대전</option>
      <option value="경북">경북</option>
      <option value="경남">경남</option>
      <option value="대구">대구</option>
      <option value="부산">부산</option>
      <option value="울산">울산</option>
      <option value="전북">전북</option>
      <option value="전남">전남</option>
      <option value="광주">광주</option>
      <option value="제주">제주</option>
    </select>
    <select id="filterYear" onchange="filterTable()">
      <option value="">입주 연도</option>
      <option value="2026년">2026년</option>
      <option value="2027년">2027년</option>
      <option value="2028년">2028년</option>
    </select>
    <select id="filterMonth" onchange="filterTable()">
      <option value="">입주 월</option>
      <option value=" 1월"> 1월</option>
      <option value=" 2월"> 2월</option>
      <option value=" 3월"> 3월</option>
      <option value=" 4월"> 4월</option>
      <option value=" 5월"> 5월</option>
      <option value=" 6월"> 6월</option>
      <option value=" 7월"> 7월</option>
      <option value=" 8월"> 8월</option>
      <option value=" 9월"> 9월</option>
      <option value=" 10월"> 10월</option>
      <option value=" 11월"> 11월</option>
      <option value=" 12월"> 12월</option>
    </select>
    <select id="filterCeil" onchange="filterTable()">
      <option value="">전체 천장고</option>
      <option value="2.4m">천장고 2.4m</option>
      <option value="2.3m">천장고 2.3m</option>
    </select>
    <input type="text" id="searchInput" placeholder="단지명 또는 위치 검색..." oninput="filterTable()">
  </div>
  <p class="count" id="countTxt">총 ${aptList.length}개 단지</p>

  <table id="aptTable">
    <thead>
      <tr>
        <th onclick="sortTable(0)">위치</th>
        <th onclick="sortTable(1)">단지명</th>
        <th onclick="sortTable(2)">입주년월</th>
        <th onclick="sortTable(3)">총세대수</th>
        <th onclick="sortTable(4)">천장고</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
    <tfoot>
      <tr><td colspan="2"></td><td>총 세대수</td><td id="totalHH">${totalHH.toLocaleString()}세대</td><td></td></tr>
    </tfoot>
  </table>
</div>
<script>
  let sortCol = 2, sortDir = 1;

  function sortTable(col) {
    const ths = document.querySelectorAll('thead th');
    ths.forEach(th => th.className = '');
    if (sortCol === col) { sortDir *= -1; } else { sortCol = col; sortDir = 1; }
    ths[col].className = sortDir === 1 ? 'sort-asc' : 'sort-desc';
    const tbody = document.querySelector('#aptTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
      let av = a.cells[col] ? a.cells[col].textContent.trim() : '';
      let bv = b.cells[col] ? b.cells[col].textContent.trim() : '';
      if (col === 3) {
        av = parseInt(av.replace(/[^0-9]/g,'')) || 0;
        bv = parseInt(bv.replace(/[^0-9]/g,'')) || 0;
        return (av - bv) * sortDir;
      }
      return av.localeCompare(bv, 'ko') * sortDir;
    });
    rows.forEach(r => tbody.appendChild(r));
    updateCount();
  }

  function updateTotals(visibleRows) {
    const totalHH = visibleRows.reduce((sum, r) => {
      return sum + (parseInt(r.cells[3].textContent.replace(/[^0-9]/g, '')) || 0);
    }, 0);
    document.getElementById('countTxt').textContent = '총 ' + visibleRows.length + '개 단지';
    document.getElementById('totalHH').textContent = totalHH.toLocaleString() + '세대';
  }

  function filterTable() {
    const kw     = document.getElementById('searchInput').value.toLowerCase();
    const year   = document.getElementById('filterYear').value;
    const mon    = document.getElementById('filterMonth').value;
    const region = document.getElementById('filterRegion').value;
    const ceil   = document.getElementById('filterCeil').value;
    const rows   = document.querySelectorAll('#aptTable tbody tr');
    const visible = [];
    rows.forEach(r => {
      const loc  = r.cells[0].textContent;
      const nm   = r.cells[1].textContent;
      const mv   = r.cells[2].textContent;
      const ch   = r.cells[4] ? r.cells[4].textContent.trim() : '';
      const chVal = parseFloat(ch);
      const ceilMatch = !ceil || (ceil === '2.4m' ? chVal >= 2.4 : ch.includes(ceil));
      const show = (!kw     || loc.toLowerCase().includes(kw) || nm.toLowerCase().includes(kw))
                && (!year   || mv.startsWith(year))
                && (!mon    || mv.endsWith(mon))
                && ceilMatch
                && (!region || loc.startsWith(region));
      r.style.display = show ? '' : 'none';
      if (show) visible.push(r);
    });
    updateTotals(visible);
  }

  function updateCount() {
    const visible = Array.from(document.querySelectorAll('#aptTable tbody tr')).filter(r => r.style.display !== 'none');
    updateTotals(visible);
  }

  document.querySelectorAll('thead th')[2].className = 'sort-asc';
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(__dirname, '전국_아파트_입주물량_2026-2028.html'), html, 'utf8');
console.log(`✅ HTML 생성 완료 (${aptList.length}개 단지, ${totalHH.toLocaleString()}세대)`);
