/* teacher.js — 교사 화면: 반별 현황 · 일정 설정 · 학생 한 명 보기 · 내보내기 */

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

function clsTabs(){
  return `<nav class="tabs">${CLASSES.map(c =>
    `<button class="${c === S.cls ? 'on' : ''}" data-act="cls" data-c="${c}">${CLS_LABEL(c)}</button>`).join('')}</nav>`;
}

function schedEditor(sc){
  const f = (k, label) => `<label>${label}<input type="date" data-sc="${k}" value="${esc(sc[k] || '')}"></label>`;
  return `<details class="card sced"${S.openSched ? ' open' : ''}><summary>📅 ${CLS_LABEL(S.cls)}반 일정 — 반납 ${kDate(sc.returnDate)} · 소감문 ${kDate(sc.essayDue)}</summary>
    <div class="scgrid">${f('rent', '책 대여일')}${f('s1', '1차시')}${f('s2', '2차시')}
      ${f('sheetDue', '활동지 제출 마감')}${f('returnDate', '책 반납일')}${f('essayDue', '최종 소감문 완성일')}</div>
    <label class="chk"><input type="checkbox" data-sc="essayOpen"${sc.essayOpen ? ' checked' : ''}> 최종 소감문을 학생에게 열기</label>
    <div class="bar"><button class="btn ghost" data-act="sched-all">여섯 반 모두 이 날짜로</button>
      <button class="btn" data-act="sched-save">이 반 저장</button></div></details>`;
}

function vTClass(){
  const { sc, roster, books, sheets, essays } = S.t;
  const ids = Object.keys(roster).filter(k => /^\d+$/.test(k)).sort();
  let n = { sheet: 0, essay: 0 };
  const rows = ids.map(num => {
    const b = books[num], sh = sheets[num], es = essays[num];
    const s1 = statusOf(sh, sc.sheetDue), s2 = statusOf(es, sc.essayDue);
    if(sh?.submittedAt) n.sheet++; if(es?.submittedAt) n.essay++;
    const edited = sh?.source === 'paper' && sh.ocr && sheetDiff(sh.ocr, sh.data);
    // 활동지에 적은 책이 9월에 고른 책과 다르면 알려 줍니다 (띄어쓰기·괄호는 무시)
    const norm = s => String(s || '').replace(/[\s()（）:·,.]/g, '').toLowerCase();
    const other = sh?.data?.title && b && !norm(b.title).includes(norm(sh.data.title)) && !norm(sh.data.title).includes(norm(b.title))
      ? `<div class="au">활동지에는 「${esc(sh.data.title)}」 <span class="tag edit">다른 책</span></div>` : '';
    return `<tr data-act="stu" data-n="${num}">
      <td class="c">${num}</td><td class="nm">${esc(roster[num].name)}</td>
      <td class="bk">${b ? `${esc(b.title)}${b.fixed ? ' <span class="tag paper">고침</span>' : ''}<div class="au">${esc(b.author)}</div>${other}` : (sh?.data?.title ? `${esc(sh.data.title)}<div class="au">활동지에 적은 책</div>` : '<span class="muted">—</span>')}</td>
      <td>${stTag(s1, sh)}${edited ? `<span class="tag edit">${sh.updatedBy === 'student' ? '학생이 고침' : '고침'}</span>` : ''}</td>
      <td>${sc.essayOpen || es ? stTag(s2, es) : '<span class="muted">—</span>'}</td>
      <td class="tm">${kTime(sh?.updatedAt || es?.updatedAt || '')}</td></tr>`;
  }).join('');
  return topbar() + `<main class="wrap wide">${clsTabs()}${schedEditor(sc)}
    <div class="head"><h1>${CLS_LABEL(S.cls)}반 <span class="muted">${ids.length}명</span></h1>
      <div class="sum"><span>활동지 <b>${n.sheet}</b>/${ids.length}</span><span>소감문 <b>${n.essay}</b>/${ids.length}</span>
      <button class="btn ghost" data-act="export">엑셀로 내려받기</button></div></div>
    <div class="tbl"><table class="list"><tr><th>학번</th><th>이름</th><th>책</th><th>활동지 (1~2차시)</th><th>최종 소감문</th><th>마지막 저장</th></tr>${rows}</table></div>
  </main>`;
}

function vTStudent(){
  const { roster, books, sc } = S.t;
  const num = S.stu, sh = S.t.sheets[num], es = S.t.essays[num], b = books[num] || {};
  const edited = sh?.ocr && sheetDiff(sh.ocr, sh.data);
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="back-cls">← ${CLS_LABEL(S.cls)}반</button>
    <div class="head"><h1>${num} ${esc(roster[num]?.name || '')}</h1></div>
    <div class="card"><h2>책</h2><div class="grid2">
      <label>책 제목<input id="b-title" value="${esc(b.title || '')}"></label>
      <label>지은이<input id="b-author" value="${esc(b.author || '')}"></label></div>
      <div class="bar"><span class="small">${b.fixed ? '선생님이 고친 책' : '9월에 고른 책'}</span><button class="btn ghost" data-act="save-book">책 고치기</button></div></div>
    <div class="card"><div class="head"><h2>${SHEET_TITLE}</h2><div>${stTag(statusOf(sh, sc.sheetDue), sh)}</div></div>
      ${sh ? `<p class="small">${sh.source === 'paper' ? '종이 판독 · ' : ''}${sh.submittedAt ? '제출 ' + kTime(sh.submittedAt) + ' · ' : ''}마지막 저장 ${kTime(sh.updatedAt)} (${sh.updatedBy === 'student' ? '학생' : sh.updatedBy === 'ocr' ? '판독' : '선생님'})</p>` : ''}
      ${sh?.memo ? `<div class="note">판독 메모 — ${esc(sh.memo)}</div>` : ''}
      ${edited ? `<details class="ref"><summary>처음 판독한 내용 보기 (지금과 다름)</summary>${sheetForm(sh.ocr).replace(/<(input|textarea|select)/g, '<$1 disabled')}</details>` : ''}
      <div id="form">${sheetForm(sh?.data)}</div>
      <div class="bar"><label class="chk"><input type="checkbox" id="t-paper"${sh?.source === 'paper' ? ' checked' : ''}> 종이로 받음</label>
        <label class="chk"><input type="date" id="t-subdate" value="${esc(dateOf(sh?.submittedAt))}"> 제출일</label>
        <button class="btn" data-act="t-save-sheet">저장</button></div></div>
    <div class="card"><div class="head"><h2>최종 소감문</h2><div>${es ? stTag(statusOf(es, sc.essayDue), es) : ''}</div></div>
      <textarea id="essay" rows="10">${esc(es?.text || '')}</textarea>
      <div class="bar"><span class="small"><span id="cnt">${(es?.text || '').length}</span>자</span>
        <label class="chk"><input type="date" id="t-esdate" value="${esc(dateOf(es?.submittedAt))}"> 제출일</label>
        <button class="btn" data-act="t-save-essay">저장</button></div></div>
  </main>`;
}

/* 엑셀(CSV) — 반의 제출 현황 + 쓴 글 전부 */
function exportCSV(){
  const { roster, books, sheets, essays, sc } = S.t;
  const head = ['학번', '이름', '책 제목', '지은이', '활동지 상태', '활동지 제출일', '종이', '관심 분야', '고른 이유', '기대하는 것',
    '목차1', '이유1', '목차2', '이유2', '1주 범위', '1주 실제', '1주 달성', '2주 범위', '3주 범위', '4주 범위',
    '읽은 부분', '장 제목', '느낀 점', '기억에 남는 문장', '쪽', '소감문 상태', '소감문 제출일', '소감문'];
  const lines = [head];
  for(const num of Object.keys(roster).filter(k => /^\d+$/.test(k)).sort()){
    const b = books[num] || {}, sh = sheets[num], es = essays[num], d = fillSheet(sh?.data);
    lines.push([num, roster[num].name, b.title || '', b.author || '', statusOf(sh, sc.sheetDue).t, dateOf(sh?.submittedAt),
      sh?.source === 'paper' ? '종이' : '', d.field, d.why, d.expect, d.toc[0][0], d.toc[0][1], d.toc[1][0], d.toc[1][1],
      d.plan[0][0], d.plan[0][1], d.plan[0][2], d.plan[1][0], d.plan[2][0], d.plan[3][0],
      (d.readFrom || d.readTo) ? `${d.readFrom}~${d.readTo}쪽` : '', d.chapter, d.feel, d.quote, d.quotePage,
      statusOf(es, sc.essayDue).t, dateOf(es?.submittedAt), es?.text || '']);
  }
  const csv = '﻿' + lines.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `진로독서_${CLS_LABEL(S.cls)}반_${today()}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
