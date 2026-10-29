/* app.js — 화면 전환과 버튼 처리 */

const S = { view: 'login', me: null, d: null, t: null, cls: CLASSES[0], stu: null, openSched: false, tview: 'status' };

function render(){
  const v = { login: vLogin, changepw: vChangePw, tlogin: vTLogin, home: vHome, sheet: vSheet, essay: vEssay,
              tclass: vTClass, tstudent: vTStudent }[S.view] || vLogin;
  document.getElementById('root').innerHTML = v();
  window.scrollTo(0, 0);
}
function go(view){ S.view = view; render(); }

async function loadMe(){
  const { cid, num } = S.me;
  const [sc, books, sheet, essay] = await Promise.all([Store.schedule(cid), Store.books(cid), Store.sheet(cid, num), Store.essay(cid, num)]);
  S.d = { sc, book: books[num] || null, sheet, essay };
}
async function loadClass(){
  const c = S.cls;
  const [sc, roster, books, sheets, essays, rental] = await Promise.all([Store.schedule(c), Store.roster(c), Store.books(c), Store.sheets(c), Store.essays(c), Store.rental(c)]);
  S.t = { sc, roster, books, sheets, essays, rental };
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
      if(st.isFirstLogin){ go('changepw'); return; }
      ss('me', S.me); await loadMe(); go('home');
    });
  },
  async changepw(btn){
    const a = document.getElementById('c-new').value, b = document.getElementById('c-con').value;
    const err = document.getElementById('c-err');
    if(a.length < 4){ err.textContent = '4자 이상으로 정해 주세요.'; return; }
    if(a !== b){ err.textContent = '두 번 넣은 비밀번호가 다릅니다.'; return; }
    await busy(btn, async () => {
      const salt = newSalt();
      await db.ref(`students/${S.me.cid}/${S.me.num}`).update({ passwordHash: await sha256(salt + a), salt, isFirstLogin: false });
      ss('me', S.me); await loadMe(); go('home');
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
  'open-essay': () => go('essay'),
  async 'save-sheet'(btn){ await saveMySheet(btn, false); },
  async 'submit-sheet'(btn){ await saveMySheet(btn, true); },
  async 'save-essay'(btn){ await saveMyEssay(btn, false); },
  async 'submit-essay'(btn){ await saveMyEssay(btn, true); },

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
        const old = S.t.rental[num] || {};
        const nr = { st: v.st, memo: v.memo, rentDate: old.rentDate || '', updatedAt: new Date().toISOString(), updatedBy: 'teacher' };
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
  async 't-save-essay'(btn){
    const text = document.getElementById('essay').value, day = document.getElementById('t-esdate').value;
    await busy(btn, async () => {
      const ref = db.ref(`aiactivity/submissions/${S.cls}/reading/essay/${S.stu}`);
      const old = (await ref.get()).val() || {};
      const rec = Object.assign({}, old, { text, updatedAt: new Date().toISOString(), updatedBy: 'teacher' });
      if(day) rec.submittedAt = new Date(day + 'T12:00:00+09:00').toISOString(); else delete rec.submittedAt;
      await ref.set(rec); S.t.essays[S.stu] = rec; toast('저장했습니다'); render();
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
async function saveMyEssay(btn, submit){
  if(submit && !confirm('제출할까요? 제출한 뒤에도 고칠 수 있습니다.')) return;
  const text = document.getElementById('essay').value;
  await busy(btn, async () => { S.d.essay = await Store.saveEssay(S.me.cid, S.me.num, text, 'student', submit); toast(submit ? '제출했습니다' : '저장했습니다'); render(); });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
});
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = { 'l-num': 'login', 'l-pw': 'login', 't-pw': 'tlogin', 'c-con': 'changepw' }[e.target.id];
  if(btn) ACT[btn](document.querySelector(`[data-act=${btn}]`));
});
document.addEventListener('input', e => {
  if(e.target.id === 'essay'){ const c = document.getElementById('cnt'); if(c) c.textContent = e.target.value.length; }
});

/* 시작 — 새로고침해도 들어와 있게 */
(async () => {
  const me = ss('me');
  try{
    if(me?.role === 'student'){ S.me = me; await loadMe(); S.view = 'home'; }
    else if(me?.role === 'teacher'){ S.me = me; await loadClass(); S.view = 'tclass'; }
  }catch(e){ console.error(e); S.me = null; S.view = 'login'; }
  render();
})();
