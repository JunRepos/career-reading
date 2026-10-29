/* store.js — 데이터 읽고 쓰기 (경로는 config.js 머리말 참고) */

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const R = cid => `aiactivity/submissions/${cid}/reading`;

async function get(path){ const s = await db.ref(path).get(); return s.exists() ? s.val() : null; }

const Store = {
  roster:   cid => get(`students/${cid}`).then(v => v || {}),
  student:  (cid, num) => get(`students/${cid}/${num}`),
  teacher:  () => get('auth/teacher'),

  async schedule(cid){ return Object.assign({}, DEFAULT_SCHEDULE, await get(`${R(cid)}/schedule`) || {}); },
  saveSchedule: (cid, sc) => db.ref(`${R(cid)}/schedule`).set(sc),

  // 9월에 고른 책 + 선생님이 고친 책
  async books(cid){
    const [picks, fix] = await Promise.all([get(`aiactivity/submissions/${cid}/${BOOK_ACT}`), get(`${R(cid)}/bookFix`)]);
    const out = {};
    for(const [num, v] of Object.entries(picks || {})){
      const b = v?.answers?.book;
      if(b?.title) out[num] = { title: b.title, author: (b.author || '').replace(/\s*\(옮김:[^)]*\)/, ''), cover: b.cover || '' };
    }
    for(const [num, b] of Object.entries(fix || {})) if(b?.title) out[num] = Object.assign({}, out[num], b, { fixed: true });
    return out;
  },
  saveBook: (cid, num, b) => db.ref(`${R(cid)}/bookFix/${num}`).set(b),

  rental:     cid => get(`${R(cid)}/rental`).then(v => v || {}),
  saveRental: (cid, num, r) => db.ref(`${R(cid)}/rental/${num}`).set(r),

  sheets:  cid => get(`${R(cid)}/sheet`).then(v => v || {}),
  sheet:   (cid, num) => get(`${R(cid)}/sheet/${num}`),
  essays:  cid => get(`${R(cid)}/essay`).then(v => v || {}),
  essay:   (cid, num) => get(`${R(cid)}/essay/${num}`),

  /* 활동지 저장 — by: 'student' | 'teacher'. submit 이면 제출 시각을 처음 한 번만 남깁니다 */
  async saveSheet(cid, num, data, by, submit){
    const ref = db.ref(`${R(cid)}/sheet/${num}`);
    const old = (await ref.get()).val() || {};
    const now = new Date().toISOString();
    const rec = Object.assign({}, old, { data, updatedAt: now, updatedBy: by });
    if(!old.source) rec.source = 'web';
    if(submit && !old.submittedAt) rec.submittedAt = now;
    await ref.set(rec);
    return rec;
  },
  async saveEssay(cid, num, text, by, submit){
    const ref = db.ref(`${R(cid)}/essay/${num}`);
    const old = (await ref.get()).val() || {};
    const now = new Date().toISOString();
    const rec = Object.assign({}, old, { text, updatedAt: now, updatedBy: by });
    if(submit && !old.submittedAt) rec.submittedAt = now;
    await ref.set(rec);
    return rec;
  },
};

/* 선생님이 책을 고칠 때 — 제목이 바뀌면 9월 책 표지가 남지 않게 표지를 비웁니다 */
function fixedBook(old, title, author){
  return { title, author, cover: title === (old?.title || '') ? (old?.cover || '') : '',
           updatedAt: new Date().toISOString(), updatedBy: 'teacher' };
}

/* 상태 — 미제출 · 제출 · 늦게 제출 (늦은 제출도 받습니다. 표시만 다릅니다) */
function statusOf(rec, due){
  if(!rec?.submittedAt) return rec?.updatedAt ? { k: 'draft', t: '작성 중' } : { k: 'none', t: '미제출' };
  const late = due && dateOf(rec.submittedAt) > due;
  return late ? { k: 'late', t: '늦게 제출' } : { k: 'done', t: '제출' };
}
