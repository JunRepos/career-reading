/* teacher.js — 교사 화면: 제출 현황 · 도서 목록(반납) · 세특 재료 · 학생 한 명 보기 · 내보내기 */

function vTLogin(){
  return `<div class="center"><div class="card login">
    <div class="kicker">진로 독서 프로젝트</div><h1>선생님</h1>
    <p class="sub">진로 수업 사이트의 선생님 비밀번호로 들어갑니다.</p>
    <label>비밀번호<input id="t-pw" type="password" autocomplete="current-password"></label>
    <div class="err" id="t-err"></div>
    <button class="btn wide" data-act="tlogin">들어가기</button>
    <button class="link" data-act="go-login">학생으로 들어가기</button>
  </div></div>`;
}

const tIds = () => Object.keys(S.t.roster).filter(k => /^\d+$/.test(k)).sort();
const retNeeded = r => !RET_NA.includes(r?.st);          // 반납할 책이 있는 학생

function clsTabs(){
  return `<nav class="tabs">${CLASSES.map(c => { const n = Object.keys(S.pw[c] || {}).length;
    return `<button class="${c === S.cls ? 'on' : ''}" data-act="cls" data-c="${c}">${CLS_LABEL(c)}${n ? `<i class="dot" title="비밀번호 초기화 요청">${n}</i>` : ''}</button>`; }).join('')}</nav>`;
}

function viewTabs(){
  return `<nav class="tabs sub">${[['status', '제출 현황'], ['books', '도서 목록 · 반납'], ['seteuk', '세특 재료']].map(([k, l]) =>
    `<button class="${S.tview === k ? 'on' : ''}" data-act="tview" data-v="${k}">${l}</button>`).join('')}</nav>`;
}

/* 비밀번호 초기화 요청 — 여섯 반 것을 한 곳에 */
function pwBanner(){
  const items = CLASSES.flatMap(c => Object.entries(S.pw[c] || {}).map(([num, r]) => ({ c, num, r })));
  if(!items.length) return '';
  return `<div class="card pwreq"><h2>비밀번호 초기화 요청 <span class="tag none">${items.length}</span></h2>
    ${items.map(({ c, num, r }) => `<div class="pwrow"><span><b>${CLS_LABEL(c)}</b> ${num} ${esc(r.name || '')} <span class="small">${kTime(r.at)}</span></span>
      <span><button class="btn sm" data-act="pw-reset" data-c="${c}" data-n="${num}" data-name="${esc(r.name || '')}">학번으로 초기화</button>
        <button class="btn ghost sm" data-act="pw-drop" data-c="${c}" data-n="${num}">요청 지우기</button></span></div>`).join('')}
    <p class="small">초기화하면 비밀번호가 학번이 되고, 학생이 처음 들어올 때 새 비밀번호를 정합니다. 진로 수업 사이트 비밀번호도 같이 바뀝니다.</p></div>`;
}

function shareBox(){
  const base = location.origin + location.pathname;
  return `<details class="card sced m-hide"><summary>🔗 학생에게 보낼 주소</summary>
    <p class="small">학생은 진로 수업 학번과 비밀번호로 들어옵니다. 들어오면 홈 화면(내 책 · 지금 할 일 · 보고서 · 일정)이 먼저 나옵니다.</p>
    <div class="pwrow"><span class="url">${esc(base)}</span><button class="btn ghost sm" data-act="copy" data-text="${esc(base)}">주소 복사</button></div></details>`;
}

function schedEditor(sc){
  const f = (k, label) => `<label>${label}<input type="date" data-sc="${k}" value="${esc(sc[k] || '')}"></label>`;
  return `<details class="card sced m-hide"${S.openSched ? ' open' : ''}><summary>📅 ${CLS_LABEL(S.cls)}반 일정 — 반납 ${kDate(sc.returnDate)} · 보고서 ${kDate(sc.essayDue)}</summary>
    <div class="scgrid">${f('rent', '책 대여일')}${f('s1', '1차시')}${f('s2', '2차시')}
      ${f('sheetDue', '활동지 제출 마감')}${WEEKS.map((w, i) => f(w, `${i + 1}주 독서 기록`)).join('')}
      ${f('returnDate', '책 반납일')}${f('essayDue', '최종 보고서 마감')}</div>
    <div class="bar"><button class="btn ghost" data-act="sched-all">여섯 반 모두 이 날짜로</button>
      <button class="btn" data-act="sched-save">이 반 저장</button></div></details>`;
}

const retBox = (num, r) => retNeeded(r)
  ? `<input type="checkbox" class="ck" data-act="ret" data-n="${num}"${r?.returned ? ' checked' : ''} aria-label="반납">`
  : '<span class="muted">—</span>';
function retCount(){
  const need = tIds().filter(n => retNeeded(S.t.rental[n]));
  return `반납 <b>${need.filter(n => S.t.rental[n]?.returned).length}</b>/${need.length}`;
}

/* 도서 목록 — 대여 상태 · 책 · 지은이 · 메모를 표에서 바로 고칩니다. 반납은 누르는 대로 저장. 인쇄하면 대여 도서 목록 출력물 모양 */
function vTBooks(){
  const { sc, roster, books, rental } = S.t;
  const ids = tIds();
  const cnt = {};
  const rows = ids.map(num => {
    const b = books[num] || {}, r = rental[num] || {};
    cnt[r.st || '빈칸'] = (cnt[r.st || '빈칸'] || 0) + 1;
    return `<tr data-row="${num}"${r.check ? ' class="check"' : ''}>
      <td class="c">${num}</td><td class="nm">${esc(roster[num].name)}${r.check ? '<div><span class="tag edit">확인 필요</span></div>' : ''}</td>
      <td><select data-f="st" aria-label="대여">${RENT_ST.map(s => `<option value="${s}"${s === (r.st || '') ? ' selected' : ''}>${s || '—'}</option>`).join('')}</select></td>
      <td class="ctr">${retBox(num, r)}</td>
      <td><input data-f="title" value="${esc(b.title || '')}" aria-label="책 제목"></td>
      <td><input data-f="author" value="${esc(b.author || '')}" aria-label="지은이"></td>
      <td><input data-f="memo" value="${esc(r.memo || '')}" aria-label="메모"></td></tr>`;
  }).join('');
  const sum = ['대여', '결석', '대여 안 함', '미정', '빈칸'].filter(k => cnt[k]).map(k => `<span>${k} <b>${cnt[k]}</b></span>`).join('');
  const prow = ids.map(num => {
    const b = books[num] || {}, st = rental[num]?.st;
    return `<tr><td>${num}</td><td>${esc(roster[num].name)}</td><td>${esc(b.title || '')}${st && st !== '대여' ? ` (${esc(st)})` : ''}</td><td>${esc(b.author || '')}</td></tr>`;
  }).join('');
  return topbar() + `<main class="wrap wide">${clsTabs()}${viewTabs()}
    <div class="head"><h1>${CLS_LABEL(S.cls)}반 도서 목록 <span class="muted">책 대여일 ${kDate(sc.rent)}</span></h1>
      <div class="sum">${sum}<span id="retcnt">${retCount()}</span><button class="btn ghost" data-act="print-list">인쇄</button><button class="btn" data-act="save-list">저장</button></div></div>
    <p class="hint">반납 칸은 누르는 대로 바로 저장됩니다. 다른 칸은 고친 뒤 저장을 누르면 고친 줄만 저장됩니다. 책 제목이나 지은이를 고치면 학생 화면의 '내 책'도 바뀝니다.</p>
    <div class="tbl"><table class="list edit"><tr><th>학번</th><th>이름</th><th>대여</th><th>반납</th><th>책 제목</th><th>지은이</th><th>메모</th></tr>${rows}</table></div>
    <div class="bar"><button class="btn" data-act="save-list">저장</button></div>
    <section class="print-only"><div class="pk">진로 독서 프로젝트 · 책 대여일</div><h1>대여 도서 목록</h1>
      <div class="pd">2학년 ${S.cls.slice(-1)}반 · ${esc((sc.rent || '').replace(/-/g, '. '))}.</div>
      <table><tr><th>학번</th><th>이름</th><th>책 제목</th><th>지은이</th></tr>${prow}</table></section>
  </main>`;
}

const T_FILTERS = [['all', '전체'], ['noreport', '보고서 안 낸 학생'], ['noreturn', '책 안 낸 학생']];

/* 보고서 칸 — 상태 + 아직 안 냈으면 「종이 받음」 (걷는 자리에서 누르기)
   「종이 받음」만 눌러 둔 칸은 채워진 단추로 보이고, 다시 누르면 취소됩니다. 내용이 있는 제출은 「제출 취소」(PC) */
function docCell(key, num, rec, due){
  const at = `data-k="${key}" data-n="${num}"`;
  if(rec?.submittedAt && rec.source === 'paper' && !docHas(key, rec.data))
    return `<button class="btn sm" data-act="paper-undo" ${at} title="누르면 취소">종이 받음 ✓</button>`
      + (key === 'inquiry' && rec.presented ? '<span class="tag done">발표</span>' : '');
  const tag = rec ? stTag(statusOf(rec, due), rec) : (key === 'report' ? `<span class="m-hide">${stTag(statusOf(null), null)}</span>` : '');
  const pres = key === 'inquiry' && rec?.presented ? '<span class="tag done">발표</span>' : '';
  const got = rec?.submittedAt ? '' : `<button class="btn ghost sm" data-act="paper-got" data-k="${key}" data-n="${num}">종이 받음</button>`;
  const undo = rec?.submittedAt ? `<button class="btn ghost sm m-hide" data-act="paper-undo" ${at}>제출 취소</button>` : '';
  return tag + pres + got + undo;
}

function vTClass(){
  if(S.tview === 'books') return vTBooks();
  if(S.tview === 'seteuk') return vTSeteuk();
  const { sc, roster, books, sheets, weeklies, reports, inquiries, rental } = S.t;
  const ids = tIds();
  const show = ids.filter(num => S.tfilter === 'noreport' ? !reports[num]?.submittedAt
    : S.tfilter === 'noreturn' ? retNeeded(rental[num]) && !rental[num]?.returned : true);
  const rows = show.map(num => {
    const b = books[num], sh = sheets[num], wk = weeklies[num] || {}, rp = reports[num], iq = inquiries[num], r = rental[num] || {};
    const wks = WEEKS.map((w, i) => { const s = statusOf(wk[w], sc[w]);
      return `<span class="wkm ${s.k}" title="${i + 1}주 ${s.t}">${i + 1}</span>`; }).join('');
    const edited = sh?.source === 'paper' && sh.ocr && sheetDiff(sh.ocr, sh.data);
    // 활동지에 적은 책이 9월에 고른 책과 다르면 알려 줍니다 (띄어쓰기·괄호는 무시)
    const norm = s => String(s || '').replace(/[\s()（）:·,.]/g, '').toLowerCase();
    const other = sh?.data?.title && b && !norm(b.title).includes(norm(sh.data.title)) && !norm(sh.data.title).includes(norm(b.title))
      ? `<div class="au">활동지에는 「${esc(sh.data.title)}」 <span class="tag edit">다른 책</span></div>` : '';
    const last = [sh, rp, iq, ...WEEKS.map(w => wk[w])].map(x => x?.updatedAt || '').sort().pop();
    return `<tr data-act="stu" data-n="${num}">
      <td class="c m-hide">${num}</td><td class="nm"><span class="m-only num">${num.slice(-2)}</span>${esc(roster[num].name)}${S.pw[S.cls]?.[num] ? '<div><span class="tag none">비번 요청</span></div>' : ''}${b?.title ? `<div class="bkm">${esc(b.title)}</div>` : ''}</td>
      <td class="bk m-hide">${b ? `${esc(b.title)}${b.fixed ? ' <span class="tag paper">고침</span>' : ''}<div class="au">${esc(b.author)}</div>${other}` : (sh?.data?.title ? `${esc(sh.data.title)}<div class="au">활동지에 적은 책</div>` : '<span class="muted">—</span>')}</td>
      <td class="m-hide">${stTag(statusOf(sh, sc.sheetDue), sh)}${edited ? `<span class="tag edit">${sh.updatedBy === 'student' ? '학생이 고침' : '고침'}</span>` : ''}</td>
      <td class="wks m-hide">${wks}</td>
      <td>${docCell('report', num, rp, sc.essayDue)}</td>
      <td>${docCell('inquiry', num, iq, sc.essayDue)}</td>
      <td class="ctr">${retBox(num, r)}</td>
      <td class="tm m-hide">${kTime(last)}</td></tr>`;
  }).join('');
  const n = k => ids.filter(num => S.t[k][num]?.submittedAt).length;
  const fl = T_FILTERS.find(f => f[0] === S.tfilter)[1];
  return topbar() + `<main class="wrap wide">${clsTabs()}${viewTabs()}${pwBanner()}${schedEditor(sc)}${shareBox()}
    <div class="head"><h1>${CLS_LABEL(S.cls)}반 <span class="muted">${ids.length}명</span></h1>
      <div class="sum"><span class="m-hide">활동지 <b>${n('sheets')}</b>/${ids.length}</span><span>보고서 <b>${n('reports')}</b>/${ids.length}</span>
      <span>탐구 <b>${n('inquiries')}</b></span><span id="retcnt">${retCount()}</span>
      <button class="btn ghost m-hide" data-act="print-list">인쇄</button><button class="btn ghost m-hide" data-act="export">엑셀로 내려받기</button></div></div>
    <nav class="tabs sub">${T_FILTERS.map(([k, l]) => `<button class="${S.tfilter === k ? 'on' : ''}" data-act="tfilter" data-v="${k}">${l}</button>`).join('')}</nav>
    <div class="tbl st"><table class="list st"><tr><th class="m-hide">학번</th><th>이름</th><th class="m-hide">책</th><th class="m-hide">활동지</th><th class="m-hide">주간 기록</th><th>최종 보고서</th><th>탐구 보고서</th><th>반납</th><th class="m-hide">마지막 저장</th></tr>
      ${rows || `<tr><td colspan="9" class="muted" style="text-align:center;padding:24px;height:auto">해당하는 학생이 없습니다.</td></tr>`}</table></div>
    <p class="small m-hide">종이 보고서를 걷으면 「종이 받음」을 누릅니다. 반납 칸은 누르는 대로 저장됩니다. 줄을 누르면 그 학생이 쓴 것을 보고 고칠 수 있습니다.<br>
      주간 기록 칸 — <span class="wkm done">1</span>제출 <span class="wkm late">1</span>늦게 제출 <span class="wkm draft">1</span>작성 중 <span class="wkm none">1</span>미제출</p>
    <section class="print-only"><div class="pk">진로 독서 프로젝트</div><h1>${fl}</h1>
      <div class="pd">2학년 ${S.cls.slice(-1)}반 · ${show.length}명 · ${esc(today().replace(/-/g, '. '))}.</div>
      <table><tr><th>학번</th><th>이름</th><th>책 제목</th><th>보고서 · 반납</th></tr>${show.map(num => `<tr><td>${num}</td><td>${esc(roster[num].name)}</td>
        <td>${esc(books[num]?.title || '')}</td><td>${reports[num]?.submittedAt ? '보고서 냄' : '보고서 안 냄'}${retNeeded(rental[num]) ? (rental[num]?.returned ? ' · 반납함' : ' · 반납 안 함') : ''}</td></tr>`).join('')}</table></section>
  </main>`;
}

/* 판독 · 제출 정보 한 줄과, 처음 판독과 달라졌을 때 견주어 보기 */
function recInfo(rec){
  return rec ? `<p class="small">${rec.source === 'paper' ? '종이 · ' : ''}${rec.submittedAt ? '제출 ' + kTime(rec.submittedAt) + ' · ' : ''}마지막 저장 ${kTime(rec.updatedAt)} (${rec.updatedBy === 'student' ? '학생' : rec.updatedBy === 'ocr' ? '판독' : '선생님'})</p>
    ${rec.memo ? `<div class="note">판독 메모 — ${esc(rec.memo)}</div>` : ''}` : '';
}
const lock = html => html.replace(/<(input|textarea|select)/g, '<$1 disabled').replace(/data-(k|wk|dk)=/g, 'data-x=');

function vTStudent(){
  const { roster, books, sc } = S.t;
  const num = S.stu, sh = S.t.sheets[num], b = books[num] || {};
  const edited = sh?.ocr && sheetDiff(sh.ocr, sh.data);
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="back-cls">← ${CLS_LABEL(S.cls)}반</button>
    <div class="head"><h1>${num} ${esc(roster[num]?.name || '')}</h1>
      <button class="btn ghost sm" data-act="pw-reset" data-c="${S.cls}" data-n="${num}" data-name="${esc(roster[num]?.name || '')}">비밀번호를 학번으로 초기화</button></div>
    <div class="card"><h2>책</h2><div class="grid2">
      <label>책 제목<input id="b-title" value="${esc(b.title || '')}"></label>
      <label>지은이<input id="b-author" value="${esc(b.author || '')}"></label></div>
      <div class="bar"><span class="small">${b.fixed ? '선생님이 고친 책' : '9월에 고른 책'}</span><button class="btn ghost" data-act="save-book">책 고치기</button></div></div>
    ${DOC_KEYS.map(key => { const rec = S.t[key === 'report' ? 'reports' : 'inquiries'][num];
      const changed = rec?.ocr && docDiff(key, rec.ocr, rec.data);
      return `<div class="card" data-tdoc="${key}"><div class="head"><h2>${DOCS[key].title}</h2><div>${rec ? stTag(statusOf(rec, sc.essayDue), rec) : ''}${changed ? `<span class="tag edit">${rec.updatedBy === 'student' ? '학생이 고침' : '고침'}</span>` : ''}</div></div>
        ${recInfo(rec)}
        ${changed ? `<details class="ref"><summary>처음 판독한 내용 보기 (지금과 다름)</summary>${lock(docForm(key, rec.ocr))}</details>` : ''}
        ${docForm(key, rec?.data)}
        <div class="bar">${key === 'inquiry' ? `<label class="chk"><input type="checkbox" class="t-pres"${rec?.presented ? ' checked' : ''}> 발표함</label>` : ''}
          <label class="chk"><input type="checkbox" class="t-paper"${rec?.source === 'paper' ? ' checked' : ''}> 종이로 받음</label>
          <label class="chk"><input type="date" class="t-date" value="${esc(dateOf(rec?.submittedAt))}"> 제출일</label>
          <button class="btn" data-act="t-save-doc">저장</button></div></div>`; }).join('')}
    <div class="card"><div class="head"><h2>${SHEET_TITLE}</h2><div>${stTag(statusOf(sh, sc.sheetDue), sh)}</div></div>
      ${recInfo(sh)}
      ${edited ? `<details class="ref"><summary>처음 판독한 내용 보기 (지금과 다름)</summary>${lock(sheetForm(sh.ocr))}</details>` : ''}
      <div id="form">${sheetForm(sh?.data)}</div>
      <div class="bar"><label class="chk"><input type="checkbox" id="t-paper"${sh?.source === 'paper' ? ' checked' : ''}> 종이로 받음</label>
        <label class="chk"><input type="date" id="t-subdate" value="${esc(dateOf(sh?.submittedAt))}"> 제출일</label>
        <button class="btn" data-act="t-save-sheet">저장</button></div></div>
    <div class="card"><h2>${WEEK_TITLE}</h2>
      ${WEEKS.map((w, i) => { const rec = (S.t.weeklies[num] || {})[w];
        const changed = rec?.ocr && weekDiff(rec.ocr, rec.data);
        return `<section class="wk" data-w="${w}"><div class="head"><h3>${i + 1}주${sc[w] ? ` <span class="muted">${kDate(sc[w])}</span>` : ''}</h3>
            <div>${stTag(statusOf(rec, sc[w]), rec)}${changed ? `<span class="tag edit">${rec.updatedBy === 'student' ? '학생이 고침' : '고침'}</span>` : ''}</div></div>
          ${rec?.memo ? `<div class="note">판독 메모 — ${esc(rec.memo)}</div>` : ''}
          ${changed ? `<details class="ref"><summary>처음 판독한 내용 보기 (지금과 다름)</summary>${lock(weekForm(rec.ocr))}</details>` : ''}
          <div class="wkf">${weekForm(rec?.data)}</div>
          <div class="bar"><label class="chk"><input type="checkbox" class="t-wpaper"${rec?.source === 'paper' ? ' checked' : ''}> 종이로 받음</label>
            <label class="chk"><input type="date" class="t-wdate" value="${esc(dateOf(rec?.submittedAt))}"> 제출일</label>
            <button class="btn" data-act="t-save-week">저장</button></div></section>`; }).join('')}</div>
  </main>`;
}

/* ── 세특 재료 ── 학생이 쓴 것을 세특 문장 순서로 모아 봅니다.
   세특 초안은 데이터베이스에 저장하지 않고 이 브라우저에만 남깁니다 (엑셀로 내려받아 옮깁니다). */
const seKey = num => `seteuk:${S.cls}:${num}`;
function matOf(num){
  const { books, reports, inquiries, sheets, weeklies } = S.t;
  const b = books[num] || {}, r = fillDoc('report', reports[num]?.data), q = inquiries[num], qd = fillDoc('inquiry', q?.data), sh = sheets[num]?.data || {};
  const pg = (p, c) => (p || c) ? ` (${[p && p + '쪽', c].filter(Boolean).join(' · ')})` : '';
  const out = [['책', b.title ? `『${b.title}』(${b.author || ''})` : ''], ['관심 분야 또는 진로', r.field || sh.field || ''],
    ['이 책을 고른 이유', r.why || sh.why || ''], ['책의 핵심 내용', r.core],
    ['기억에 남는 부분과 내 생각' + pg(r.partPage, r.partChapter), r.part], ['읽고 나서 생각한 점', r.after], ['더 알아보고 싶은 것', r.more],
    ['탐구 주제', qd.topic], ['탐구를 시작한 이유' + pg(qd.startPage, qd.startChapter), qd.start], ['탐구한 과정과 내용', qd.process],
    ['탐구를 통해 내린 생각', qd.think], ['참고한 자료', qd.refs], ['발표', q?.presented ? '발표함' : '']];
  WEEKS.forEach((w, i) => { const d = (weeklies[num] || {})[w]?.data;
    if(d?.quote) out.push([`${i + 1}주 기억에 남는 문장${d.quotePage ? ` (${d.quotePage}쪽)` : ''}`, d.quote + (d.why ? ' — ' + d.why : '')]); });
  return out.filter(x => String(x[1] || '').trim());
}

function vTSeteuk(){
  const { roster, reports, inquiries } = S.t;
  const cards = tIds().map(num => {
    const mat = matOf(num), txt = ls(seKey(num)) || '', nb = nbytes(txt);
    const thin = !docHas('report', reports[num]?.data) && !docHas('inquiry', inquiries[num]?.data);
    return `<div class="card mat" data-n="${num}">
      <div class="head"><h2>${num} ${esc(roster[num].name)}</h2><div>${reports[num]?.submittedAt ? '<span class="tag done">보고서</span>' : ''}${inquiries[num]?.submittedAt ? '<span class="tag done">탐구</span>' : ''}${inquiries[num]?.presented ? '<span class="tag done">발표</span>' : ''}
        <button class="btn ghost sm" data-act="copy-mat" data-n="${num}">재료 복사</button></div></div>
      ${mat.length ? `<dl>${mat.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${nl2br(v)}</dd>`).join('')}</dl>` : ''}
      ${thin ? '<p class="small">아직 보고서 내용이 없습니다. 종이 보고서는 판독해서 넣은 뒤에 보입니다.</p>' : ''}
      <label>세특 초안<textarea class="se" data-n="${num}" rows="4">${esc(txt)}</textarea></label>
      <div class="count"><span class="nb${nb > 1500 ? ' over' : ''}">${nb}</span> / 1500바이트</div></div>`;
  }).join('');
  return topbar() + `<main class="wrap wide">${clsTabs()}${viewTabs()}
    <div class="head"><h1>${CLS_LABEL(S.cls)}반 세특 재료</h1>
      <div class="sum"><button class="btn ghost" data-act="export-se">세특 엑셀로 내려받기</button></div></div>
    <p class="hint">학생이 쓴 것을 세특 문장 순서로 모았습니다. 세특 초안은 이 컴퓨터의 이 브라우저에만 남고 데이터베이스에는 저장되지 않습니다. 다른 컴퓨터에서 이어 쓰려면 엑셀로 내려받으세요. 바이트는 나이스 기준(한글 3 · 영문·숫자·공백 1 · 줄바꿈 2)입니다.</p>
    <div class="mats">${cards}</div></main>`;
}

function download(name, lines){
  const csv = '﻿' + lines.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const docCols = key => DOCS[key].fields.flatMap(f => f.page ? [f.label + ' 쪽', f.label + ' 장 제목', f.label] : [f.label]);

function exportSeteuk(){
  const { roster, books, reports, inquiries } = S.t;
  const lines = [['학번', '이름', '책 제목', '지은이', ...docCols('report'), ...docCols('inquiry').map(c => '[탐구] ' + c), '발표', '세특 초안', '바이트']];
  for(const num of tIds()){
    const b = books[num] || {}, r = fillDoc('report', reports[num]?.data), q = fillDoc('inquiry', inquiries[num]?.data), txt = ls(seKey(num)) || '';
    lines.push([num, roster[num].name, b.title || '', b.author || '', ...docKeys('report').map(k => r[k]), ...docKeys('inquiry').map(k => q[k]),
      inquiries[num]?.presented ? '발표함' : '', txt, nbytes(txt)]);
  }
  download(`진로독서_세특재료_${CLS_LABEL(S.cls)}반_${today()}.csv`, lines);
}

/* 엑셀(CSV) — 반의 제출 현황 + 쓴 글 전부 */
function exportCSV(){
  const { roster, books, sheets, reports, inquiries, rental, sc } = S.t;
  const head = ['학번', '이름', '책 제목', '지은이', '대여', '반납', '활동지 상태', '활동지 제출일', '종이', '관심 분야', '고른 이유', '기대하는 것',
    '목차1', '이유1', '목차2', '이유2', '1주 범위', '1주 실제', '1주 달성', '2주 범위', '3주 범위', '4주 범위',
    '읽은 부분', '장 제목', '느낀 점', '기억에 남는 문장', '쪽',
    ...WEEKS.flatMap((w, i) => ['상태', '제출일', '읽은 부분', '장 제목', '느낀 점', '기억에 남는 문장', '쪽', '이유'].map(h => `${i + 1}주 ${h}`)),
    '보고서 상태', '보고서 제출일', '보고서 종이', ...docCols('report'),
    '탐구 상태', '탐구 제출일', '탐구 종이', '발표', ...docCols('inquiry').map(c => '[탐구] ' + c)];
  const lines = [head];
  for(const num of tIds()){
    const b = books[num] || {}, sh = sheets[num], d = fillSheet(sh?.data), rt = rental[num] || {};
    const rp = reports[num], iq = inquiries[num], r = fillDoc('report', rp?.data), q = fillDoc('inquiry', iq?.data);
    lines.push([num, roster[num].name, b.title || '', b.author || '', rt.st || '', retNeeded(rt) ? (rt.returned ? '반납 ' + dateOf(rt.returnedAt) : '미반납') : '',
      statusOf(sh, sc.sheetDue).t, dateOf(sh?.submittedAt),
      sh?.source === 'paper' ? '종이' : '', d.field, d.why, d.expect, d.toc[0][0], d.toc[0][1], d.toc[1][0], d.toc[1][1],
      d.plan[0][0], d.plan[0][1], d.plan[0][2], d.plan[1][0], d.plan[2][0], d.plan[3][0],
      (d.readFrom || d.readTo) ? `${d.readFrom}~${d.readTo}쪽` : '', d.chapter, d.feel, d.quote, d.quotePage,
      ...WEEKS.flatMap(w => { const rec = (S.t.weeklies[num] || {})[w], x = fillWeek(rec?.data);
        return [statusOf(rec, sc[w]).t, dateOf(rec?.submittedAt), (x.readFrom || x.readTo) ? `${x.readFrom}~${x.readTo}쪽` : '',
                x.chapter, x.feel, x.quote, x.quotePage, x.why]; }),
      statusOf(rp, sc.essayDue).t, dateOf(rp?.submittedAt), rp?.source === 'paper' ? '종이' : '', ...docKeys('report').map(k => r[k]),
      iq ? statusOf(iq, sc.essayDue).t : '', dateOf(iq?.submittedAt), iq?.source === 'paper' ? '종이' : '', iq?.presented ? '발표함' : '', ...docKeys('inquiry').map(k => q[k])]);
  }
  download(`진로독서_${CLS_LABEL(S.cls)}반_${today()}.csv`, lines);
}
