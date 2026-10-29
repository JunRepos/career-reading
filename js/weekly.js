/* weekly.js — 주간 독서 기록 (1~4주). 종이 「주간 독서 기록지」와 같은 칸, 같은 순서
   1~2차시 활동지 ⑤ 독서 계획의 1주~4주와 같은 주입니다. 주마다 따로 저장 · 제출합니다. */

const WEEKS = ['w1', 'w2', 'w3', 'w4'];
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
