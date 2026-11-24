/* weekly.js — 주간 독서 기록. 종이 「주간 독서 기록」과 같은 칸, 같은 순서
   처음에는 1~4주로 네 번 받으려 했지만 실제로는 한 번만 걷었습니다 (2026-11-24). 그래서 한 장만 받습니다.
   저장 자리는 그대로 weekly/{학번}/w1 — WEEKS 에 w2… 를 다시 넣으면 여러 번 받는 화면으로 돌아가지는 않으니 화면도 함께 고쳐야 합니다. */

const WEEKS = ['w1'];
const WK = 'w1';
const WEEK_TITLE = '주간 독서 기록';

function blankWeek(){ return { readFrom: '', readTo: '', chapter: '', feel: '', quote: '', quotePage: '', why: '' }; }
function fillWeek(d){ return Object.assign(blankWeek(), d || {}); }

function weekForm(d){
  d = fillWeek(d);
  const i = (k, cls = '') => `<input data-wk="${k}" value="${esc(d[k])}" class="${cls}">`;
  const t = (k, rows) => `<textarea data-wk="${k}" rows="${rows}">${esc(d[k])}</textarea>`;
  return `<div class="read"><label>읽은 부분${i('readFrom', 'pg')}</label><span>쪽 ~</span>${i('readTo', 'pg')}<span>쪽</span></div>
    <label>장 제목${i('chapter')}</label>
    <label>읽으면서 느낀 점${t('feel', 5)}</label>
    <div class="grid2 q"><label>기억에 남는 문장${t('quote', 3)}</label><label>쪽${i('quotePage', 'pg')}</label></div>
    <label>이 문장이 기억에 남는 이유${t('why', 3)}</label>`;
}

function readWeek(root){
  const d = blankWeek();
  root.querySelectorAll('[data-wk]').forEach(el => { d[el.dataset.wk] = el.value; });
  return d;
}

const weekDiff = (a, b) => JSON.stringify(fillWeek(a)) !== JSON.stringify(fillWeek(b));
