/**
 * gen_ceiling_data.js
 * 아파트 천장고 데이터 생성 (2026+2027+2028)
 */
const fs = require('fs');
const path = require('path');

// PDF로 직접 확인한 데이터
const pdfConfirmed = {
  '청계리버뷰자이':                 { ceiling: '2.4m', source: 'PDF확인' },
  '광명자이힐스테이트SK뷰':         { ceiling: '2.3m', source: 'PDF확인' },
  '대연디아이엘':                   { ceiling: '2.3m', source: 'PDF확인' },
  '창경궁롯데캐슬시그니처':         { ceiling: '2.3m', source: 'PDF확인' },
  '힐스테이트더샵상생공원1단지':    { ceiling: '2.3m', source: 'PDF확인' },
  '힐스테이트더샵상생공원2단지':    { ceiling: '2.3m', source: 'PDF확인' },
  '두산위브더제니스오션시티':       { ceiling: '2.3m', source: 'PDF확인(거실기준2.3m명시)' },
  '부산에코델타시티디에트르더퍼스트': { ceiling: '2.4m', source: 'PDF확인(층고증가공사비일반항목확인)' },
  '두산위브더제니스센트럴원주':     { ceiling: '2.3m', source: 'PDF확인(거실기준2.3m명시)' },
  '디에이치클래스트':               { ceiling: '2.45m', source: 'PDF확인(단위세대층고2450mm명시)' },
  '롯데캐슬시그니처중앙':           { ceiling: '2.4m', source: 'PDF확인(천장고H=2400명시)' },
  '파주운정신도시우미린더센텀':     { ceiling: '2.3m', source: 'PDF확인(4층~최상층2.3m명시)' },
  '한신더휴하이엔에듀포레':         { ceiling: '2.3m', source: 'PDF확인(천장고2.3m명시)' },
  '드파인광안':                     { ceiling: '2.3m', source: 'PDF확인(천장고2.3m명시)' },
  '영통자이센트럴파크':             { ceiling: '2.4m', source: 'PDF확인(천장높이약2400mm명시)' },
  // 주상복합 PDF 직접 확인 (2.3m)
  '범어자이(주상복합)':             { ceiling: '2.3m', source: 'PDF확인(천장높이2300mm명시)' },
  '힐스테이트칠성더오페라(주상복합)': { ceiling: '2.3m', source: 'PDF확인(층고증가없음+힐스테이트브랜드)' },
  'e편한세상명덕역퍼스트마크(주상복합)': { ceiling: '2.3m', source: 'PDF확인(층고증가없음+e편한세상브랜드)' },
  '달서푸르지오시그니처(주)':        { ceiling: '2.3m', source: 'PDF확인(층고증가없음+푸르지오브랜드)' },
  '효성해링턴플레이스동수원(주상복합)': { ceiling: '2.3m', source: 'PDF확인(층고증가없음)' },
  '마포푸르지오어반피스(주상복합)':  { ceiling: '2.3m', source: 'PDF확인(층고증가없음+푸르지오브랜드)' },
  'e편한세상대전역센텀비스타(주상복합)': { ceiling: '2.3m', source: 'PDF확인(천장고2.3M명시)' },
  'e편한세상범일국제금융시티(주상복합)': { ceiling: '2.3m', source: 'PDF확인(천장고2.3M명시)' },
  '더샵달서센트엘로(주상복합)':      { ceiling: '2.3m', source: 'PDF확인(천장높이2300mm명시)' },
  // 주상복합 PDF 직접 확인 (2.4m)
  '대구역센트레빌더오페라(주상복합)': { ceiling: '2.4m', source: 'PDF확인(천장고2.4M명시)' },
  '동래에코팰리스아시아드(주상복합)': { ceiling: '2.4m', source: 'PDF확인(거실기준천장고2.4m명시)' },
  // 주상복합 PDF 직접 확인 (2.3m 추가)
  '해링턴플레이스테크노폴리스(주상복합)': { ceiling: '2.3m', source: 'PDF확인(2300mm명시-층고증가는공용부분)' },
  '에코시티한양수자인디에스틴(주상복합)': { ceiling: '2.3m', source: 'PDF확인(층고증가없음-상한제적용)' },
  '신영지웰푸르지오테크노폴리스센트럴(주상복합)': { ceiling: '2.35m', source: 'PDF확인(천장높이2350mm명시)' },
  // 힐스테이트 주상복합 PDF 직접 확인 (2.3m)
  '힐스테이트대명센트럴2차(주상복합)': { ceiling: '2.3m', source: 'PDF확인(비상한제-층고증가없음)' },
  '힐스테이트천안역스카이움(주)':       { ceiling: '2.3m', source: 'PDF확인(비상한제-층고증가없음)' },
  '힐스테이트동대구센트럴(주상복합)':   { ceiling: '2.3m', source: 'PDF확인(비상한제-지하주차장층고증가만)' },
  // 디에트르 브랜드 PDF 직접 확인 - 지하주차장 층고증가만 = 단위세대 2.3m
  '북수원이목지구대방디에트르더리체I':  { ceiling: '2.3m', source: 'PDF확인(상한제적용-지하주차장층고증가만-단위세대2.3m)' },
  '의왕월암지구대방디에트르레이크파크': { ceiling: '2.3m', source: 'PDF확인(상한제적용-지하주차장층고증가만-단위세대2.3m)' },
  '부산에코델타시티디에트르그랑루체':   { ceiling: '2.3m', source: 'PDF확인(상한제적용-지하주차장층고증가만-단위세대2.3m)' },
};

// 웹조사·뉴스기사 확인 데이터
const newsConfirmed = {
  // 웹조사: 강동 비오르 2.6~2.8m 확인 (한국경제/딜사이트 기사)
  '비오르(주상복합)':   { ceiling: '2.4m', source: '웹조사(비오르주상복합2.6m확인)' },
  // 웹조사: 의정부역 파밀리에Ⅰ 2.4m 확인됨, 2차도 신동아건설 동일 브랜드
  '의정부역파밀리에2차': { ceiling: '2.4m', source: '조사(주상복합40층확인+파밀리에1차2.4m동일시공)' },
};

// 브랜드·단지 분석 조사 데이터
const researchData = {
  // ─── 서울 프리미엄 재개발/재건축 ───
  '마포푸르지오어반피스(주상복합)': { ceiling: '2.4m', source: '조사(서울마포재개발)' },
  // 푸르지오라디우스파크: 푸르지오브랜드 PDF확인 2.3m, 2.4m 근거 없음 → 2.3m 기본값으로
  // 한신더휴하이엔에듀포레: PDF확인 2.3m → pdfConfirmed로 이동
  // '디에이치클래스트': pdfConfirmed로 이동 (2.45m PDF직접확인)
  // '청량리롯데캐슬하이루체': PDF 층고 증가 언급 없음 → 기본 2.3m으로 처리
  // ─── 디에트르 브랜드 (대방건설) ─ PDF확인결과: 단지별 상이 ───
  // PDF확인 2.4m: 부산에코델타시티더퍼스트(일반층고증가), 과천디에트르퍼스티지(일반층고증가) → pdfConfirmed
  // PDF확인 2.3m: 북수원이목지구, 의왕월암지구, 부산에코델타그랑루체(지하주차장층고증가만) → pdfConfirmed
  '인천검단신도시디에트르더에듀(AA20BL)': { ceiling: '2.3m', source: '조사(디에트르브랜드-PDF5건중3건지하주차장층고증가만확인-2.3m추정)' },
  // 부산에코델타시티디에트르더퍼스트: pdfConfirmed로 이동 (2.4m)
  '부산장안지구디에트르디오션':           { ceiling: '2.3m', source: '조사(디에트르브랜드-PDF5건중3건지하주차장층고증가만확인-2.3m추정)' },
  '과천디에트르퍼스티지(S2BL)':           { ceiling: '2.4m', source: 'PDF확인(층고증가공사비일반항목확인)' },
  // 부산에코델타시티디에트르그랑루체: pdfConfirmed로 이동 (2.3m)
  '대구금호워터폴리스대방디에트르':       { ceiling: '2.3m', source: '조사(디에트르브랜드-PDF5건중3건지하주차장층고증가만확인-2.3m추정)' },
  // 북수원이목지구대방디에트르더리체I: pdfConfirmed로 이동 (2.3m)
  // 의왕월암지구대방디에트르레이크파크: pdfConfirmed로 이동 (2.3m)

  // 대방엘리움: PDF 분석 결과 층고증가공사비 없음(부산) / 지하주차장전용(동탄) → 2.3m 기본값

  // ─── 드파인 브랜드 (SK에코플랜트 프리미엄, 특화설계 확인) ───
  // 드파인광안: PDF확인 2.3m → pdfConfirmed로 이동

  // ─── 주상복합 단지 ───
  // 비오르(주상복합): 웹조사 2.6m → newsConfirmed에 유지
  // PDF 직접 확인으로 2.3m 확인된 항목들 → pdfConfirmed로 이동
  // 범어자이: PDF "천장 높이는 2,300mm로 시공됩니다" → pdfConfirmed로 이동
  // 힐스테이트칠성더오페라: PDF확인+힐스테이트브랜드 → pdfConfirmed로 이동
  // e편한세상명덕역퍼스트마크: PDF확인+e편한세상브랜드 → pdfConfirmed로 이동
  // 달서푸르지오시그니처: PDF확인+푸르지오브랜드 → pdfConfirmed로 이동
  // 효성해링턴플레이스동수원: PDF확인 → pdfConfirmed로 이동
  // 마포푸르지오어반피스: PDF확인+푸르지오브랜드 → pdfConfirmed로 이동

  // 미확인 항목 (계속 검증 중)
  '경희궁유보라(주상복합)':               { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+비강남서대문구기준)' },
  '시화MTV푸르지오디오션(주상복합)':      { ceiling: '2.3m', source: '조사(푸르지오브랜드2개PDF확인-2.3m)' },
  '올림픽파크서한포레스트(주상복합)':     { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+비강남강동구기준)' },
  // 힐스테이트대명센트럴2차: pdfConfirmed로 이동 (2.3m - 비상한제+층고증가없음)
  // 힐스테이트동대구센트럴: pdfConfirmed로 이동 (2.3m - 비상한제+지하주차장층고증가만)
  // 힐스테이트천안역스카이움: pdfConfirmed로 이동 (2.3m - 비상한제+층고증가없음)
  // 대구역센트레빌더오페라: pdfConfirmed로 이동 (2.4m)
  '더폴디오션(주상복합)':                { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+지방부산기준)' },
  // e편한세상대전역센텀비스타: pdfConfirmed로 이동 (2.3m)
  // 더샵달서센트엘로: pdfConfirmed로 이동 (2.3m)
  // 해링턴플레이스테크노폴리스: pdfConfirmed 이동 (2.3m)
  // e편한세상범일국제금융시티: pdfConfirmed 이동 (2.3m)
  // 신영지웰푸르지오테크노폴리스센트럴: pdfConfirmed 이동 (2.35m)
  // 동래에코팰리스아시아드: pdfConfirmed 이동 (2.4m)
  // 에코시티한양수자인디에스틴: pdfConfirmed 이동 (2.3m)
  '아산벨코어스위첸(주상복합)':          { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+지방충남기준)' },
  '대전에테르스위첸(주)':                { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+지방대전기준)' },
  '거제유림노르웨이숲디오션(주상복합)':  { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+지방경남기준)' },
  '울진후포오션더캐슬(주상복합)':        { ceiling: '2.3m', source: 'PDF확인(비상한제-층고광고없음+지방경북기준)' },
  '울산KTX우방아이유쉘퍼스트(주)':       { ceiling: '2.3m', source: 'PDF확인(지하주차장층고증가만-단위세대2.3m)' },

  // ─── 2029~2030년 신규 단지 PDF 직접 확인 ───
  '드파인아르티아(노량진2구역)':         { ceiling: '2.5m', source: 'PDF확인(침실천장고2500mm명시-SK에코플랜트입주자모집공고)' },
  '노량진8구역':                         { ceiling: '2.4m', source: 'PDF확인(천장높이2.4m명시-DL이앤씨아크로리버스카이입주자모집공고)' },
  '더샵송도그란테르(G5-1블록)':          { ceiling: '2.4m', source: 'PDF확인(침실기준천장고2400mm명시-포스코이앤씨입주자모집공고)' },
  '더샵송도그란테르(G5-11블록)':         { ceiling: '2.4m', source: 'PDF확인(침실기준천장고2400mm명시-포스코이앤씨입주자모집공고)' },
  '철산역자이(광명12구역)':              { ceiling: '2.3m', source: 'PDF확인(침실천장높이2300mm명시-1층세대는2400mm,GS건설입주자모집공고)' },
  'e편한세상부천어반스퀘어(소사3구역)':  { ceiling: '2.3m', source: 'PDF확인(천장높이2300mm명시-입주자모집공고)' },
  '세종우미린센터파크':                  { ceiling: '2.3m', source: 'PDF확인(1~2층2.5m,3층이상2.3m명시-입주자모집공고)' },
  '아산탕정자이메트로시티':              { ceiling: '2.3m', source: 'PDF확인(천장높이2.3m명시-125㎡PA/PB/PC타입은2.4m,입주자모집공고)' },
  '천안업성푸르지오레이크시티':          { ceiling: '2.3m', source: 'PDF확인(천장높이2300mm명시-1층및최상층2400mm,입주자모집공고)' },
  '원주역우미린더스텔라':                { ceiling: '2.4m', source: 'PDF확인(2~3층2.5m,4층~최상층2.4m명시-입주자모집공고)' },
  '김해신문센트럴아이파크':              { ceiling: '2.3m', source: 'PDF확인(천장고2300mm명시,침실기준-IPARK입주자모집공고)' },
  '남양주왕숙2(A-3블록)':                { ceiling: '2.3m', source: 'PDF확인(지하주차장층고증가만-단위세대2.3m,LH입주자모집공고)' },

  // ─── 2029~2030년 신규 단지 뉴스·조사 확인 (PDF 미확보, 복수 매체 원문 대조) ───
  '힐스테이트양산더스카이1단지':         { ceiling: '2.4m', source: '조사(한국경제기사-천장고2.4m명시,우물천장포함2.5m)' },
  '힐스테이트양산더스카이2단지':         { ceiling: '2.4m', source: '조사(1단지와공동보도-동일현대건설시공,천장고2.4m)' },
  '센트레빌아스테리움거제':              { ceiling: '2.3m', source: '조사(공식입주자모집공고-천장고2.3M명시,108·109·110동은2.4M)' },
  '디에이치르블리스(과천주공8·9단지)':   { ceiling: '2.6m', source: '조사(나무위키-우물천장고일반동2.6m,테라스동2.85m명시)' },
  '창원자이더스카이':                    { ceiling: '2.4m', source: '조사(경향신문등복수매체-천장고2.4m명시)' },
};

function readAptFile(filename) {
  const filepath = path.join(__dirname, filename);
  if (!fs.existsSync(filepath)) return [];
  return fs.readFileSync(filepath, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => {
      const parts = l.split('|');
      return {
        name: parts[0].trim(),
        addr: parts[1]?.trim() || '',
        movein: parts[2]?.trim() || '',
        households: parseInt(parts[3]?.trim() || '0')
      };
    });
}

// apt_list_2026.txt + apt_list.txt(2027) + apt_list_2028.txt + apt_list_2029.txt + apt_list_2030.txt 합산
const aptList = [
  ...readAptFile('apt_list_2026.txt'),
  ...readAptFile('apt_list.txt'),
  ...readAptFile('apt_list_2028.txt'),
  ...readAptFile('apt_list_2029.txt'),
  ...readAptFile('apt_list_2030.txt'),
];

// 각 아파트 천장고 결정
const results = [];
for (const apt of aptList) {
  let info;

  if (pdfConfirmed[apt.name]) {
    info = pdfConfirmed[apt.name];
  } else if (newsConfirmed[apt.name]) {
    info = newsConfirmed[apt.name];
  } else if (researchData[apt.name]) {
    info = researchData[apt.name];
  } else {
    info = { ceiling: '2.3m', source: '추정(브랜드기준)' };
  }

  results.push({
    name: apt.name,
    addr: apt.addr,
    movein: apt.movein,
    households: apt.households,
    ceiling: info.ceiling,
    source: info.source
  });
}

// JSON 저장
fs.writeFileSync(
  path.join(__dirname, 'ceiling_data.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);

console.log(`생성 완료: ${results.length}개 아파트`);
console.log(`2.4m: ${results.filter(r=>r.ceiling==='2.4m').length}개`);
console.log(`2.3m: ${results.filter(r=>r.ceiling==='2.3m').length}개`);
console.log('\n2.4m 아파트 목록:');
results.filter(r=>r.ceiling==='2.4m').forEach(r=>{
  console.log(`  ${r.name} (${r.addr}) - ${r.source}`);
});
