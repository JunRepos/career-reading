/* sheet.js — 1~2차시 「진로 독서 활동지」 (종이 활동지와 같은 칸, 같은 순서)
   2026-10-21 책 대여일에 나눠 준 종이 활동지를 그대로 옮겼습니다. 2차시에는 같은 종이의 ⑥ 오늘의 독서를 이어 씁니다. */

const SHEET_TITLE = '진로 독서 활동지 (1~2차시)';
const DONE_OPTS = ['', '○', '△', '×'];

function blankSheet(){
  return { title: '', author: '', field: '', why: '', expect: '',
           toc: [['', ''], ['', '']],
           plan: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
           readFrom: '', readTo: '', chapter: '', feel: '', quote: '', quotePage: '' };
}
function fillSheet(d){
  const b = blankSheet();
  if(!d) return b;
  const o = Object.assign(b, d);
  o.toc = [0, 1].map(i => Object.assign(['', ''], (d.toc || [])[i] || []));
  o.plan = [0, 1, 2, 3].map(i => Object.assign(['', '', ''], (d.plan || [])[i] || []));
  return o;
}

const ta = (k, v, rows, ph = '') =>
  `<textarea data-k="${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(v)}</textarea>`;
const inp = (k, v, ph = '', cls = '') =>
  `<input data-k="${k}" value="${esc(v)}" placeholder="${esc(ph)}" class="${cls}">`;

/* 활동지 그리기 — locked 이면 읽기만 */
function sheetForm(d){
  d = fillSheet(d);
  const done = (i, v) => `<select data-k="plan.${i}.2">${DONE_OPTS.map(o =>
      `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
  return `<div class="sheet">
    <section><h3><b>1</b>내가 고른 책</h3>
      <div class="grid2"><label>책 제목${inp('title', d.title)}</label><label>지은이${inp('author', d.author)}</label></div>
      <label>관심 분야 · 진로 분야${inp('field', d.field)}</label></section>
    <section><h3><b>2</b>이 책을 고른 이유</h3>
      <p class="hint">무엇이 궁금했는지, 어디에 흥미를 느꼈는지 · 관심·진로 분야와 연결해 쓰면 좋아요</p>
      ${ta('why', d.why, 4)}</section>
    <section><h3><b>3</b>이 책에서 기대하는 것</h3>
      <p class="hint">다 읽고 나면 알게 되거나 얻고 싶은 것</p>${ta('expect', d.expect, 3)}</section>
    <section><h3><b>4</b>끌리는 목차</h3><p class="hint">목차를 훑어보고 눈에 띄는 장 2개</p>
      ${[0, 1].map(i => `<div class="toc"><label>목차(장 제목)${inp(`toc.${i}.0`, d.toc[i][0])}</label>
        <label>끌리는 이유${ta(`toc.${i}.1`, d.toc[i][1], 2)}</label></div>`).join('')}</section>
    <section><h3><b>5</b>앞으로의 독서 계획</h3>
      <table class="plan"><tr><th>주차</th><th>읽을 범위(쪽·장)</th><th>실제로 읽은 쪽</th><th>달성</th></tr>
      ${d.plan.map((p, i) => `<tr><td>${i + 1}주</td><td>${inp(`plan.${i}.0`, p[0])}</td>
        <td>${inp(`plan.${i}.1`, p[1])}</td><td>${done(i, p[2])}</td></tr>`).join('')}</table></section>
    <section><h3><b>6</b>오늘의 독서</h3>
      <div class="read"><label>읽은 부분${inp('readFrom', d.readFrom, '', 'pg')}</label><span>쪽 ~</span>
        ${inp('readTo', d.readTo, '', 'pg')}<span>쪽</span></div>
      <label>장 제목${inp('chapter', d.chapter)}</label>
      <label>읽으면서 느낀 점${ta('feel', d.feel, 5)}</label>
      <div class="grid2 q"><label>기억에 남는 문장${ta('quote', d.quote, 4)}</label>
        <label class="pgq">쪽${inp('quotePage', d.quotePage, '', 'pg')}</label></div></section>
  </div>`;
}

/* 화면에서 값 거두기 */
function readSheet(root){
  const d = blankSheet();
  root.querySelectorAll('[data-k]').forEach(el => {
    const path = el.dataset.k.split('.');
    if(path.length === 1) d[path[0]] = el.value;
    else d[path[0]][+path[1]][+path[2]] = el.value;
  });
  return d;
}

/* 비교용 — 원래 판독(ocr)과 지금 내용이 다른 칸 */
function sheetDiff(a, b){
  a = fillSheet(a); b = fillSheet(b);
  return JSON.stringify(a) !== JSON.stringify(b);
}
