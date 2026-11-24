/* app.js — 화면 전환과 버튼 처리 */

const S = { view: 'login', me: null, d: null, t: null, cls: CLASSES[0], stu: null, openSched: false, tview: 'status', tfilter: 'all',
            doc: 'report', pw: {}, pwFree: false, forgotDone: false,
            after: null };   // 들어오면 언제나 홈부터 (예전 주소 끝의 #report · #inquiry 도 홈으로)

function render(){
  const v = { login: vLogin, changepw: vChangePw, forgot: vForgot, tlogin: vTLogin, home: vHome, sheet: vSheet, week: vWeek, doc: vDoc,
              tclass: vTClass, tstudent: vTStudent }[S.view] || vLogin;
  document.getElementById('root').innerHTML = v();
  window.scrollTo(0, 0);
  growAll();
}
function renderKeep(){ const y = window.scrollY; render(); window.scrollTo(0, y); }   // 표에서 누를 때 — 보던 자리 그대로
function go(view){ S.view = view; render(); }

// 글 칸은 쓴 만큼 늘어납니다 (휴대폰에서 칸 안을 따로 밀어 올리지 않아도 되게)
function grow(ta){ ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
function growAll(){ document.querySelectorAll('.doc textarea, .sheet textarea, .wkf textarea, textarea.se').forEach(grow); }

// 학생이 들어온 뒤 갈 곳 — 주소에 #report · #inquiry 가 있으면 그 보고서로
function enter(){
  if(S.after){ S.doc = S.after; S.after = null; go('doc'); } else go('home');
}

async function loadMe(){
  const { cid, num } = S.me;
  const [sc, books, sheet, weekly, report, inquiry] = await Promise.all([Store.schedule(cid), Store.books(cid), Store.sheet(cid, num),
    Store.weekly(cid, num), Store.doc(cid, num, 'report'), Store.doc(cid, num, 'inquiry')]);
  S.d = { sc, book: books[num] || null, sheet, weekly, report, inquiry };
}
async function loadClass(){
  const c = S.cls;
  const [sc, roster, books, sheets, rental, weeklies, reports, inquiries, pw] = await Promise.all([Store.schedule(c), Store.roster(c), Store.books(c),
    Store.sheets(c), Store.rental(c), Store.weeklies(c), Store.docs(c, 'report'), Store.docs(c, 'inquiry'), Store.pwReqs()]);
  S.t = { sc, roster, books, sheets, rental, weeklies, reports, inquiries };
  S.pw = pw;
}

async function busy(btn, fn){
  const t = btn?.textContent; if(btn){ btn.disabled = true; btn.textContent = '…'; }
  try{ await fn(); }
  catch(e){ console.error(e); toast('저장하지 못했습니다 — ' + e.message); }
  finally{ if(btn && document.body.contains(btn)){ btn.disabled = false; btn.textContent = t; } }
}

const ACT = {
  'go-tlogin': () => go('tlogin'),
  'go-login':  () => go('login'),
  'go-forgot': () => { S.forgotDone = false; go('forgot'); },
  'go-changepw': () => { S.pwFree = true; go('changepw'); },
  logout(){ ss('me', null); S.me = null; go('login'); },
  home(){ S.me?.role === 'teacher' ? go('tclass') : go('home'); },

  async login(btn){
    const num = document.getElementById('l-num').value.trim(), pw = document.getElementById('l-pw').value;
    const err = document.getElementById('l-err');
    const cid = CLS_OF(num);
    if(!cid || !pw){ err.textContent = '학번 다섯 자리와 비밀번호를 넣어 주세요.'; return; }
    await busy(btn, async () => {
      const st = await Store.student(cid, num);
      if(!st){ err.textContent = '진로 수업 명단에 없는 학번입니다.'; return; }
      if(!await checkPw(pw, st.passwordHash, st.salt)){ err.textContent = '비밀번호가 다릅니다.'; return; }
      S.me = { role: 'student', cid, num, name: st.name };
      if(st.isFirstLogin){ S.pwFree = false; go('changepw'); return; }
      ss('me', S.me); await loadMe(); enter();
    });
  },
  async forgot(btn){
    const num = document.getElementById('f-num').value.trim(), err = document.getElementById('f-err');
    const cid = CLS_OF(num);
    if(!cid){ err.textContent = '학번 다섯 자리를 넣어 주세요.'; return; }
    await busy(btn, async () => {
      const st = await Store.student(cid, num);
      if(!st){ err.textContent = '진로 수업 명단에 없는 학번입니다.'; return; }
      await Store.askPwReset(cid, num, st.name);
      S.forgotDone = true; render();
    });
  },
  async changepw(btn){
    const a = document.getElementById('c-new').value, b = document.getElementById('c-con').value;
    const err = document.getElementById('c-err');
    if(a.length < 4){ err.textContent = '4자 이상으로 정해 주세요.'; return; }
    if(a !== b){ err.textContent = '두 번 넣은 비밀번호가 다릅니다.'; return; }
    await busy(btn, async () => {
      if(S.pwFree){                                             // 홈에서 바꿀 때는 지금 비밀번호를 먼저 확인
        const st = await Store.student(S.me.cid, S.me.num);
        if(!st || !await checkPw(document.getElementById('c-old').value, st.passwordHash, st.salt)){ err.textContent = '지금 비밀번호가 다릅니다.'; return; }
      }
      const salt = newSalt();
      await db.ref(`students/${S.me.cid}/${S.me.num}`).update({ passwordHash: await sha256(salt + a), salt, isFirstLogin: false });
      const free = S.pwFree; S.pwFree = false;
      ss('me', S.me); await loadMe();
      if(free){ go('home'); toast('비밀번호를 바꿨습니다'); } else enter();
    });
  },
  async tlogin(btn){
    const pw = document.getElementById('t-pw').value, err = document.getElementById('t-err');
    await busy(btn, async () => {
      const t = await Store.teacher();
      if(!t || !await checkPw(pw, t.h, t.salt)){ err.textContent = '비밀번호가 다릅니다.'; return; }
      S.me = { role: 'teacher' }; ss('me', S.me);
      await loadClass(); go('tclass');
    });
  },

  /* ── 학생 ── */
  'open-sheet': () => go('sheet'),
  'open-week':  () => go('week'),
  'open-doc'(btn){ S.doc = btn.dataset.k; go('doc'); },
  async 'save-doc'(btn){ await saveMyDoc(btn, false); },
  async 'submit-doc'(btn){ await saveMyDoc(btn, true); },
  async 'save-week'(btn){ await saveMyWeek(btn, false); },
  async 'submit-week'(btn){ await saveMyWeek(btn, true); },
  async 'save-sheet'(btn){ await saveMySheet(btn, false); },
  async 'submit-sheet'(btn){ await saveMySheet(btn, true); },

  /* ── 교사 ── */
  async cls(btn){ S.cls = btn.dataset.c; await busy(btn, loadClass); go('tclass'); },
  async stu(row){ S.stu = row.dataset.n; go('tstudent'); },
  async 'back-cls'(){ await loadClass(); go('tclass'); },
  async 'sched-save'(btn){
    const sc = readSched();
    await busy(btn, async () => { await Store.saveSchedule(S.cls, sc); S.t.sc = sc; S.openSched = true; toast(`${CLS_LABEL(S.cls)}반 일정을 저장했습니다`); render(); });
  },
  async 'sched-all'(btn){
    if(!confirm('지금 보이는 날짜를 여섯 반 모두에 넣을까요? 다른 반에 따로 넣어 둔 날짜는 바뀝니다.')) return;
    const sc = readSched();
    await busy(btn, async () => { await Promise.all(CLASSES.map(c => Store.saveSchedule(c, sc))); S.t.sc = sc; S.openSched = true; toast('여섯 반 모두 저장했습니다'); render(); });
  },
  export: () => exportCSV(),
  async 'save-book'(btn){
    const title = document.getElementById('b-title').value.trim(), author = document.getElementById('b-author').value.trim();
    if(!title){ toast('책 제목을 넣어 주세요'); return; }
    const b = fixedBook(S.t.books[S.stu], title, author);
    await busy(btn, async () => { await Store.saveBook(S.cls, S.stu, b); S.t.books[S.stu] = Object.assign({}, S.t.books[S.stu], b, { fixed: true }); toast('책을 고쳤습니다'); });
  },
  tview(btn){ S.tview = btn.dataset.v; render(); },
  tfilter(btn){ S.tfilter = btn.dataset.v; renderKeep(); },
  'export-se': () => exportSeteuk(),
  async copy(btn){ try{ await navigator.clipboard.writeText(btn.dataset.text); toast('복사했습니다'); }catch(e){ toast('복사하지 못했습니다'); } },
  async 'copy-mat'(btn){
    const num = btn.dataset.n, text = `${num} ${S.t.roster[num].name}\n` + matOf(num).map(([k, v]) => `[${k}] ${v}`).join('\n');
    try{ await navigator.clipboard.writeText(text); toast('재료를 복사했습니다'); }catch(e){ toast('복사하지 못했습니다'); }
  },

  /* 반납 — 누르는 대로 저장 */
  async ret(box){
    const num = box.dataset.n, on = box.checked, old = S.t.rental[num] || {};
    const nr = Object.assign({}, old, { returned: on, returnedAt: on ? new Date().toISOString() : '' });
    box.disabled = true;
    try{ await Store.saveRental(S.cls, num, nr); S.t.rental[num] = nr; }
    catch(e){ console.error(e); box.checked = !on; toast('저장하지 못했습니다 — ' + e.message); }
    box.disabled = false;
    const c = document.getElementById('retcnt'); if(c) c.innerHTML = retCount();
  },
  /* 종이 보고서를 걷은 자리에서 — 받았다는 것만 먼저 남깁니다. 내용은 판독해서 나중에 넣습니다 */
  async 'paper-got'(btn){
    const key = btn.dataset.k, num = btn.dataset.n, bag = key === 'report' ? 'reports' : 'inquiries';
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/${key}/${num}`);
      const old = (await ref.get()).val() || {}, now = new Date().toISOString();
      const rec = Object.assign({ data: fillDoc(key), updatedAt: now, updatedBy: 'teacher' }, old, { source: 'paper', submittedAt: now });
      await ref.set(rec); S.t[bag][num] = rec; renderKeep();
    });
  },
  /* 취소 — 「종이 받음」만 눌러 둔 것은 기록을 지우고, 쓴 내용이 있으면 내용은 두고 제출만 되돌립니다 */
  async 'paper-undo'(btn){
    const key = btn.dataset.k, num = btn.dataset.n, bag = key === 'report' ? 'reports' : 'inquiries';
    const cur = S.t[bag][num], empty = !docHas(key, cur?.data);
    if(!confirm(`${S.t.roster[num].name} — ${DOCS[key].title}\n${empty ? '「종이 받음」을 취소할까요?' : '제출을 취소할까요? 쓴 내용은 그대로 남고 「작성 중」으로 돌아갑니다.'}`)) return;
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/${key}/${num}`);
      const old = (await ref.get()).val();
      if(!old || !docHas(key, old.data)){ await ref.remove(); delete S.t[bag][num]; }
      else { const rec = Object.assign({}, old); delete rec.submittedAt; await ref.set(rec); S.t[bag][num] = rec; }
      renderKeep();
    });
  },
  async 'pw-reset'(btn){
    const { c, n, name } = btn.dataset;
    if(!confirm(`${name}(${n}) 학생의 비밀번호를 학번으로 초기화할까요?\n진로 수업 사이트 비밀번호도 같이 바뀝니다.`)) return;
    await busy(btn, async () => { await Store.resetPw(c, n); if(S.pw[c]) delete S.pw[c][n]; toast(`${name} 학생 비밀번호를 학번으로 되돌렸습니다`); renderKeep(); });
  },
  async 'pw-drop'(btn){
    const { c, n } = btn.dataset;
    await busy(btn, async () => { await Store.dropPwReq(c, n); if(S.pw[c]) delete S.pw[c][n]; renderKeep(); });
  },
  'print-list': () => window.print(),
  /* 도서 목록 — 바뀐 줄만 저장합니다. 책이 바뀌면 학생 화면의 '내 책'도 바뀝니다 */
  async 'save-list'(btn){
    const todo = [];
    document.querySelectorAll('tr[data-row]').forEach(tr => {
      const num = tr.dataset.row, v = {};
      tr.querySelectorAll('[data-f]').forEach(el => { v[el.dataset.f] = el.value.trim(); });
      const b = S.t.books[num] || {}, r = S.t.rental[num] || {};
      const book = !!v.title && (v.title !== (b.title || '') || v.author !== (b.author || ''));
      if(book || v.st !== (r.st || '') || v.memo !== (r.memo || '')) todo.push({ num, v, book });
    });
    if(!todo.length){ toast('바뀐 줄이 없습니다'); return; }
    await busy(btn, async () => {
      for(const { num, v, book } of todo){
        if(book){
          const nb = fixedBook(S.t.books[num], v.title, v.author);
          await Store.saveBook(S.cls, num, nb); S.t.books[num] = Object.assign({}, S.t.books[num], nb, { fixed: true });
        }
        const nr = Object.assign({ rentDate: '' }, S.t.rental[num], { st: v.st, memo: v.memo, updatedAt: new Date().toISOString(), updatedBy: 'teacher' });
        delete nr.check;                                        // 선생님이 확인하고 저장한 줄
        await Store.saveRental(S.cls, num, nr); S.t.rental[num] = nr;
      }
      toast(`${todo.length}명 저장했습니다`); render();
    });
  },
  async 't-save-sheet'(btn){
    const data = readSheet(document.getElementById('form'));
    const paper = document.getElementById('t-paper').checked, day = document.getElementById('t-subdate').value;
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/sheet/${S.stu}`);
      const old = (await ref.get()).val() || {};
      const rec = Object.assign({}, old, { data, source: paper ? 'paper' : (old.source || 'web'),
        updatedAt: new Date().toISOString(), updatedBy: 'teacher' });
      if(day) rec.submittedAt = new Date(day + 'T12:00:00+09:00').toISOString(); else delete rec.submittedAt;
      await ref.set(rec); S.t.sheets[S.stu] = rec; toast('저장했습니다'); render();
    });
  },
  async 't-save-week'(btn){
    const box = btn.closest('[data-w]'), w = box.dataset.w;
    const data = readWeek(box.querySelector('.wkf'));
    const paper = box.querySelector('.t-wpaper').checked, day = box.querySelector('.t-wdate').value;
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/weekly/${S.stu}/${w}`);
      const old = (await ref.get()).val() || {};
      const rec = Object.assign({}, old, { data, source: paper ? 'paper' : (old.source || 'web'),
        updatedAt: new Date().toISOString(), updatedBy: 'teacher' });
      if(day) rec.submittedAt = new Date(day + 'T12:00:00+09:00').toISOString(); else delete rec.submittedAt;
      await ref.set(rec); (S.t.weeklies[S.stu] = S.t.weeklies[S.stu] || {})[w] = rec;
      toast(`${w[1]}주 기록을 저장했습니다`); render(); document.querySelector(`[data-w=${w}]`)?.scrollIntoView();
    });
  },
  async 't-save-doc'(btn){
    const box = btn.closest('[data-tdoc]'), key = box.dataset.tdoc, bag = key === 'report' ? 'reports' : 'inquiries';
    const data = readDoc(box, key);
    const paper = box.querySelector('.t-paper').checked, day = box.querySelector('.t-date').value, pres = box.querySelector('.t-pres');
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/${key}/${S.stu}`);
      const old = (await ref.get()).val() || {};
      const rec = Object.assign({}, old, { data, source: paper ? 'paper' : (old.source || 'web'),
        updatedAt: new Date().toISOString(), updatedBy: 'teacher' });
      if(pres) rec.presented = pres.checked;
      if(day) rec.submittedAt = new Date(day + 'T12:00:00+09:00').toISOString(); else delete rec.submittedAt;
      await ref.set(rec); S.t[bag][S.stu] = rec;
      toast('저장했습니다'); render(); document.querySelector(`[data-tdoc=${key}]`)?.scrollIntoView();
    });
  },
};

function readSched(){
  const sc = Object.assign({}, S.t.sc);
  document.querySelectorAll('[data-sc]').forEach(el => { sc[el.dataset.sc] = el.type === 'checkbox' ? el.checked : el.value; });
  return sc;
}
async function saveMySheet(btn, submit){
  if(submit && !confirm('제출할까요? 제출한 뒤에도 고칠 수 있습니다.')) return;
  const data = readSheet(document.getElementById('form'));
  await busy(btn, async () => { S.d.sheet = await Store.saveSheet(S.me.cid, S.me.num, data, 'student', submit); toast(submit ? '제출했습니다' : '저장했습니다'); render(); });
}
async function saveMyWeek(btn, submit){
  const box = btn.closest('[data-w]'), w = box.dataset.w;
  if(submit && !confirm(`${w[1]}주 기록을 제출할까요? 제출한 뒤에도 고칠 수 있습니다.`)) return;
  const data = readWeek(box.querySelector('.wkf'));
  await busy(btn, async () => {
    S.d.weekly[w] = await Store.saveWeek(S.me.cid, S.me.num, w, data, 'student', submit);
    toast(submit ? '제출했습니다' : '저장했습니다'); render(); document.querySelector(`[data-w=${w}]`)?.scrollIntoView();
  });
}
async function saveMyDoc(btn, submit){
  const key = S.doc, data = readDoc(document.querySelector('[data-doc]'), key);
  if(submit && !docHas(key, data)){ toast('쓴 내용이 없습니다'); return; }
  if(submit && !confirm('제출할까요? 제출한 뒤에도 고칠 수 있습니다.')) return;
  await busy(btn, async () => {
    S.d[key] = await Store.saveDoc(S.me.cid, S.me.num, key, data, 'student', submit);
    ls(draftKey(key), null);
    toast(submit ? '제출했습니다' : '저장했습니다'); renderKeep();
  });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
});
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = { 'l-num': 'login', 'l-pw': 'login', 't-pw': 'tlogin', 'c-con': 'changepw', 'f-num': 'forgot' }[e.target.id];
  if(btn) ACT[btn](document.querySelector(`[data-act=${btn}]`));
});
let draftT = null;
document.addEventListener('input', e => {
  const el = e.target;
  if(el.tagName === 'TEXTAREA' && el.closest('.doc, .sheet, .wkf, .mat')) grow(el);
  if(el.tagName === 'TEXTAREA' && el.dataset.dk){ const c = el.nextElementSibling?.querySelector('.cnt'); if(c) c.textContent = el.value.length; }   // 보고서 칸 글자 수
  // 세특 초안 — 이 브라우저에만 남깁니다
  if(el.classList.contains('se')){
    ls(seKey(el.dataset.n), el.value || null);
    const nb = nbytes(el.value), c = el.closest('.mat').querySelector('.nb');
    c.textContent = nb; c.classList.toggle('over', nb > 1500);
    return;
  }
  // 학생이 보고서를 쓰는 동안 — 저장을 누르기 전에 나가도 글이 남게 이 기기에 적어 둡니다
  const doc = el.closest('[data-doc]');
  if(doc && S.me?.role === 'student' && S.view === 'doc'){
    clearTimeout(draftT);
    draftT = setTimeout(() => ls(draftKey(S.doc), { at: new Date().toISOString(), data: readDoc(doc, S.doc) }), 500);
  }
});

/* 시작 — 새로고침해도 들어와 있게 */
(async () => {
  const me = ss('me');
  try{
    if(me?.role === 'student'){ S.me = me; await loadMe(); S.view = 'home'; if(S.after){ S.doc = S.after; S.after = null; S.view = 'doc'; } }
    else if(me?.role === 'teacher'){ S.me = me; await loadClass(); S.view = 'tclass'; }
  }catch(e){ console.error(e); S.me = null; S.view = 'login'; }
  render();
})();
