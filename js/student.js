/* student.js — 학생 화면: 로그인 · 비밀번호 · 홈 · 활동지 · 주간 기록 · 보고서 */

function vLogin(){
  return `<div class="center"><div class="card login">
    <h1>진로 독서 프로젝트</h1>
    <p class="sub">진로 수업 학번과 비밀번호로 들어갑니다.</p>
    <label>학번<input id="l-num" inputmode="numeric" maxlength="5" placeholder="예) 20101" autocomplete="username"></label>
    <label>비밀번호<input id="l-pw" type="password" autocomplete="current-password"></label>
    <div class="err" id="l-err"></div>
    <button class="btn wide" data-act="login">들어가기</button>
    <p class="small">비밀번호는 진로 수업 사이트와 같습니다. 처음이면 학번입니다.</p>
    <div class="links"><button class="link" data-act="go-forgot">비밀번호를 잊었어요</button>
      <button class="link" data-act="go-tlogin">선생님</button></div>
  </div></div>`;
}

/* 비밀번호 바꾸기 — 처음 들어왔을 때는 꼭, 그 뒤에는 홈에서 원할 때 (이때는 지금 비밀번호를 먼저 확인) */
function vChangePw(){
  const free = S.pwFree;
  return `<div class="center"><div class="card login">
    <h1>비밀번호 바꾸기</h1>
    <p class="sub">${free ? '' : '처음 들어왔습니다. 새 비밀번호를 정해 주세요. '}진로 수업 사이트 비밀번호도 같이 바뀝니다.</p>
    ${free ? '<label>지금 비밀번호<input id="c-old" type="password" autocomplete="current-password"></label>' : ''}
    <label>새 비밀번호<input id="c-new" type="password" autocomplete="new-password"></label>
    <label>한 번 더<input id="c-con" type="password" autocomplete="new-password"></label>
    <div class="err" id="c-err"></div>
    <button class="btn wide" data-act="changepw">바꾸기</button>
    ${free ? '<button class="link" data-act="home">돌아가기</button>' : ''}
  </div></div>`;
}

function vForgot(){
  return `<div class="center"><div class="card login">
    <h1>비밀번호를 잊었어요</h1>
    ${S.forgotDone ? `<div class="note">선생님께 요청을 보냈습니다.<br>선생님이 초기화하면 비밀번호는 <b>학번</b>이 됩니다. 들어온 뒤 새 비밀번호를 정합니다.</div>`
      : `<p class="sub">학번을 넣고 요청을 보내면 선생님이 비밀번호를 학번으로 되돌려 줍니다.</p>
    <label>학번<input id="f-num" inputmode="numeric" maxlength="5" placeholder="예) 20101"></label>
    <div class="err" id="f-err"></div>
    <button class="btn wide" data-act="forgot">초기화 요청 보내기</button>`}
    <button class="link" data-act="go-login">로그인으로 돌아가기</button>
  </div></div>`;
}

function topbar(right = ''){
  const me = S.me;
  return `<header class="top"><div class="brand" data-act="home">📚 진로 독서</div>
    <div class="who">${me.role === 'teacher' ? '선생님' : `${esc(CLS_LABEL(me.cid))} · ${esc(me.name)}`}
      ${right}<button class="link" data-act="logout">나가기</button></div></header>`;
}

function bookCard(b){
  if(!b) return `<div class="card book none"><div><div class="kicker">내 책</div>
    <div class="bt">아직 고른 책이 없습니다</div><div class="ba">선생님께 말해 주세요</div></div></div>`;
  return `<div class="card book">${b.cover ? `<img src="${esc(b.cover)}" alt="">` : '<div class="nocover">📖</div>'}
    <div><div class="kicker">내 책</div><div class="bt">${esc(b.title)}</div><div class="ba">${esc(b.author)}</div></div></div>`;
}

function scheduleList(sc){
  const rows = [
    ['책 대여일', sc.rent], ['1차시', sc.s1], ['2차시', sc.s2],
    ['활동지 제출', sc.sheetDue], ['주간 독서 기록', sc[WK]],
    ['책 반납일 — 이날까지 다 읽기', sc.returnDate], ['최종 독서 보고서 마감', sc.essayDue],
  ].filter(r => r[1]);
  const t = today();
  return `<ul class="sched">${rows.map(([k, d]) => `<li class="${d < t ? 'past' : ''}">
    <span class="sk">${k}</span><span class="sd">${kDate(d)}</span><span class="dd">${d < t ? '' : dday(d)}</span></li>`).join('')}</ul>`;
}

function stTag(st, rec){
  return `<span class="tag ${st.k}">${st.t}</span>${rec?.source === 'paper' ? '<span class="tag paper">종이</span>' : ''}`;
}

function vHome(){
  const { sc, book, sheet, weekly, report, inquiry } = S.d;
  const wk = weekly[WK];
  // 반납일부터는 보고서가 먼저입니다
  const next = (today() >= sc.returnDate) ? (report?.submittedAt ? null : ['최종 독서 보고서', sc.essayDue])
             : !sheet?.submittedAt ? ['활동지 제출', sc.sheetDue]
             : (sc[WK] && !wk?.submittedAt) ? ['주간 독서 기록', sc[WK]]
             : ['책 반납', sc.returnDate];
  const last = rec => rec?.updatedAt ? '마지막 저장 ' + kTime(rec.updatedAt) : '아직 없음';
  return topbar() + `<main class="wrap">
    ${bookCard(book)}
    ${next ? `<div class="card next"><div class="kicker">지금 할 일</div><div class="nt">${next[0]}</div>
      <div class="nd">${next[1] ? `${kDate(next[1])}까지 · <b>${dday(next[1])}</b>` : '마감 미정'}</div></div>` : ''}
    <div class="tasks">
      <button class="card task" data-act="open-sheet"><div class="tt">${SHEET_TITLE}</div>
        <div>${stTag(statusOf(sheet, sc.sheetDue), sheet)}</div><div class="tm">${last(sheet)}</div></button>
      <button class="card task" data-act="open-week"><div class="tt">${WEEK_TITLE}</div>
        <div>${stTag(statusOf(wk, sc[WK]), wk)}</div><div class="tm">${last(wk)}</div></button>
      <button class="card task" data-act="open-doc" data-k="report"><div class="tt">${DOCS.report.title}</div>
        <div>${stTag(statusOf(report, sc.essayDue), report)}</div><div class="tm">${kDate(sc.essayDue)}까지</div></button>
      <button class="card task" data-act="open-doc" data-k="inquiry"><div class="tt">${DOCS.inquiry.title}</div>
        <div>${inquiry ? stTag(statusOf(inquiry, sc.essayDue), inquiry) : '<span class="tag wait">원하는 사람만</span>'}</div>
        <div class="tm">발표 5분 이내</div></button>
    </div>
    <div class="card"><h2>우리 반 일정</h2>${scheduleList(sc)}
      <p class="small">마감이 지나도 낼 수 있습니다. 늦게 낸 것으로 표시됩니다.</p></div>
    <div class="links"><button class="link" data-act="go-changepw">비밀번호 바꾸기</button></div>
  </main>`;
}

function vSheet(){
  const rec = S.d.sheet;
  const st = statusOf(rec, S.d.sc.sheetDue);
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="home">← 홈</button>
    <div class="head"><h1>${SHEET_TITLE}</h1><div>${stTag(st, rec)}</div></div>
    ${rec?.source === 'paper' ? `<div class="note">종이로 낸 활동지를 선생님이 옮겨 적었습니다. 틀리게 옮긴 곳이 있으면 고친 뒤 저장하세요.
      ${rec.data && JSON.stringify(rec.data).includes('[?]') ? '<br><b>[?]</b> 는 글씨를 알아보기 어려웠던 곳입니다.' : ''}</div>` : ''}
    <div id="form">${sheetForm(rec?.data)}</div>
    <div class="bar stick">${rec?.submittedAt
      ? `<span class="small">제출 ${kTime(rec.submittedAt)}${rec.updatedAt !== rec.submittedAt ? ' · 고침 ' + kTime(rec.updatedAt) : ''}</span>
         <button class="btn" data-act="save-sheet">고친 내용 저장</button>`
      : `<button class="btn ghost" data-act="save-sheet">임시 저장</button><button class="btn" data-act="submit-sheet">제출</button>`}</div>
  </main>`;
}

function vWeek(){
  const { sc, weekly } = S.d, rec = weekly[WK];
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="home">← 홈</button>
    <div class="head"><h1>${WEEK_TITLE}</h1><div>${stTag(statusOf(rec, sc[WK]), rec)}</div></div>
    <section class="card wk" data-w="${WK}">
      ${rec?.source === 'paper' ? '<div class="note">종이로 낸 기록을 선생님이 옮겨 적었습니다. 틀리게 옮긴 곳이 있으면 고친 뒤 저장하세요.</div>' : ''}
      <div class="wkf">${weekForm(rec?.data)}</div>
      <div class="bar">${rec?.submittedAt
        ? `<span class="small">제출 ${kTime(rec.submittedAt)}</span><button class="btn" data-act="save-week">고친 내용 저장</button>`
        : `<button class="btn ghost" data-act="save-week">임시 저장</button><button class="btn" data-act="submit-week">제출</button>`}</div>
    </section>
  </main>`;
}

/* 최종 독서 보고서 · 독서 연계 탐구 보고서 — 같은 화면을 칸만 바꿔 씁니다 */
function vDoc(){
  const key = S.doc, spec = DOCS[key], { sc, book } = S.d, rec = S.d[key];
  const draft = loadDraft(key, rec);
  const has = docHas(key, rec?.data);
  const s = S.d.sheet?.data || {};
  const wq = WEEKS.map((w, i) => [i + 1, S.d.weekly[w]?.data]).filter(([, d]) => d?.quote);
  const more = S.d.report?.data?.more;
  const ref = key === 'report'
    ? ((s.feel || s.quote || wq.length) ? `<details class="card ref"><summary>내 활동지 · 주간 독서 기록 다시 보기</summary>
        ${s.feel ? `<p><b>읽으면서 느낀 점</b><br>${nl2br(s.feel)}</p>` : ''}
        ${s.quote ? `<p><b>기억에 남는 문장</b> (${esc(s.quotePage)}쪽)<br>${nl2br(s.quote)}</p>` : ''}
        ${wq.map(([n, d]) => `<p><b>주간 독서 기록 — 기억에 남는 문장</b> (${esc(d.quotePage)}쪽)<br>${nl2br(d.quote)}${d.why ? `<br><span class="small">${nl2br(d.why)}</span>` : ''}</p>`).join('')}</details>` : '')
    : (more ? `<details class="card ref" open><summary>최종 독서 보고서에 쓴 「더 알아보고 싶은 것」</summary><p>${nl2br(more)}</p></details>` : '');
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="home">← 홈</button>
    <div class="head"><h1>${spec.title}</h1><div>${stTag(statusOf(rec, sc.essayDue), rec)}</div></div>
    <p class="small">${spec.sub ? spec.sub + ' · ' : ''}${kDate(sc.essayDue)}까지 · ${dday(sc.essayDue)}</p>
    <div class="bookline">${book ? `<b>${esc(book.title)}</b> <span>${esc(book.author)}</span>` : '고른 책이 없습니다. 선생님께 말해 주세요.'}</div>
    ${rec?.source === 'paper' ? `<div class="note">${has ? '종이로 낸 보고서를 선생님이 옮겨 적었습니다. 틀리게 옮긴 곳이 있으면 고친 뒤 저장하세요.'
      : '종이로 낸 것을 선생님이 받았습니다. 여기에 다시 쓰지 않아도 됩니다.'}</div>` : ''}
    ${draft ? '<div class="note">저장하지 않고 나간 글을 다시 불러왔습니다. 아래에서 저장을 눌러야 선생님께 보입니다.</div>' : ''}
    ${ref}
    ${docForm(key, draft || rec?.data)}
    <div class="bar stick">${rec?.submittedAt
      ? `<span class="small">제출 ${kTime(rec.submittedAt)}</span><button class="btn" data-act="save-doc">고친 내용 저장</button>`
      : `<button class="btn ghost" data-act="save-doc">임시 저장</button><button class="btn" data-act="submit-doc">제출</button>`}</div>
  </main>`;
}
