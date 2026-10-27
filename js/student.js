/* student.js — 학생 화면: 로그인 · 홈 · 활동지 · 최종 소감문 */

function vLogin(){
  return `<div class="center"><div class="card login">
    <div class="kicker">진로 독서 프로젝트</div>
    <h1>책 한 권, <span>끝까지</span></h1>
    <p class="sub">진로 수업 학번과 비밀번호로 들어갑니다.</p>
    <label>학번<input id="l-num" inputmode="numeric" maxlength="5" placeholder="예) 20101" autocomplete="username"></label>
    <label>비밀번호<input id="l-pw" type="password" autocomplete="current-password"></label>
    <div class="err" id="l-err"></div>
    <button class="btn wide" data-act="login">들어가기</button>
    <p class="small">비밀번호는 진로 수업 사이트와 같습니다. 잊었으면 선생님께 말해 주세요.</p>
    <button class="link" data-act="go-tlogin">선생님</button>
  </div></div>`;
}

function vChangePw(){
  return `<div class="center"><div class="card login">
    <h1>비밀번호 바꾸기</h1>
    <p class="sub">처음 들어왔습니다. 새 비밀번호를 정해 주세요. 진로 수업 사이트 비밀번호도 같이 바뀝니다.</p>
    <label>새 비밀번호<input id="c-new" type="password" autocomplete="new-password"></label>
    <label>한 번 더<input id="c-con" type="password" autocomplete="new-password"></label>
    <div class="err" id="c-err"></div>
    <button class="btn wide" data-act="changepw">바꾸기</button>
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
    ['활동지 제출', sc.sheetDue], ['책 반납일 — 이날까지 다 읽기', sc.returnDate], ['최종 소감문 완성', sc.essayDue],
  ].filter(r => r[1]);
  const t = today();
  return `<ul class="sched">${rows.map(([k, d]) => `<li class="${d < t ? 'past' : ''}">
    <span class="sk">${k}</span><span class="sd">${kDate(d)}</span><span class="dd">${d < t ? '' : dday(d)}</span></li>`).join('')}</ul>`;
}

function stTag(st, rec){
  return `<span class="tag ${st.k}">${st.t}</span>${rec?.source === 'paper' ? '<span class="tag paper">종이</span>' : ''}`;
}

function vHome(){
  const { sc, book, sheet, essay } = S.d;
  const ss_ = statusOf(sheet, sc.sheetDue), es = statusOf(essay, sc.essayDue);
  const next = !sheet?.submittedAt ? ['활동지 제출', sc.sheetDue]
             : !sc.essayOpen ? ['책 끝까지 읽기 (반납일)', sc.returnDate]
             : !essay?.submittedAt ? ['최종 소감문', sc.essayDue] : null;
  return topbar() + `<main class="wrap">
    ${bookCard(book)}
    ${next ? `<div class="card next"><div class="kicker">지금 할 일</div><div class="nt">${next[0]}</div>
      <div class="nd">${next[1] ? `${kDate(next[1])}까지 · <b>${dday(next[1])}</b>` : '마감 미정'}</div></div>` : ''}
    <div class="tasks">
      <button class="card task" data-act="open-sheet"><div class="tt">① ${SHEET_TITLE}</div>
        <div>${stTag(ss_, sheet)}</div><div class="tm">${sheet?.updatedAt ? '마지막 저장 ' + kTime(sheet.updatedAt) : '아직 없음'}</div></button>
      <button class="card task" data-act="open-essay"><div class="tt">② 최종 소감문</div>
        <div>${sc.essayOpen ? stTag(es, essay) : '<span class="tag wait">준비 중</span>'}</div>
        <div class="tm">${kDate(sc.essayDue)}까지</div></button>
    </div>
    <div class="card"><h2>우리 반 일정</h2>${scheduleList(sc)}
      <p class="small">마감이 지나도 낼 수 있습니다. 늦게 낸 것으로 표시됩니다.</p></div>
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
    <div class="bar">${rec?.submittedAt
      ? `<span class="small">제출 ${kTime(rec.submittedAt)}${rec.updatedAt !== rec.submittedAt ? ' · 고침 ' + kTime(rec.updatedAt) : ''}</span>
         <button class="btn" data-act="save-sheet">고친 내용 저장</button>`
      : `<button class="btn ghost" data-act="save-sheet">임시 저장</button><button class="btn" data-act="submit-sheet">제출</button>`}</div>
  </main>`;
}

function vEssay(){
  const { sc, essay } = S.d;
  if(!sc.essayOpen) return topbar() + `<main class="wrap"><button class="link back" data-act="home">← 홈</button>
    <div class="card"><h1>최종 소감문</h1><p>아직 열리지 않았습니다. 선생님이 양식을 열면 여기에서 씁니다.</p>
    <p class="small">완성일 ${kDate(sc.essayDue)}</p></div></main>`;
  const st = statusOf(essay, sc.essayDue);
  const s = S.d.sheet?.data || {};
  return topbar() + `<main class="wrap">
    <button class="link back" data-act="home">← 홈</button>
    <div class="head"><h1>최종 소감문</h1><div>${stTag(st, essay)}</div></div>
    <p class="small">${kDate(sc.essayDue)}까지 · ${dday(sc.essayDue)}</p>
    ${(s.feel || s.quote) ? `<details class="card ref"><summary>내 활동지 다시 보기</summary>
      ${s.feel ? `<p><b>읽으면서 느낀 점</b><br>${nl2br(s.feel)}</p>` : ''}
      ${s.quote ? `<p><b>기억에 남는 문장</b> (${esc(s.quotePage)}쪽)<br>${nl2br(s.quote)}</p>` : ''}</details>` : ''}
    <textarea id="essay" rows="16" placeholder="책을 다 읽고 난 뒤의 생각을 씁니다.">${esc(essay?.text || '')}</textarea>
    <div class="count"><span id="cnt">${(essay?.text || '').length}</span>자</div>
    <div class="bar">${essay?.submittedAt
      ? `<span class="small">제출 ${kTime(essay.submittedAt)}</span><button class="btn" data-act="save-essay">고친 내용 저장</button>`
      : `<button class="btn ghost" data-act="save-essay">임시 저장</button><button class="btn" data-act="submit-essay">제출</button>`}</div>
  </main>`;
}
