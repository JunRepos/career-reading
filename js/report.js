/* report.js — 「최종 독서 보고서」와 「독서 연계 탐구 보고서」 (종이 보고서와 같은 칸, 같은 안내 문장, 칸 높이도 종이의 줄 수만큼)
   칸을 여기 한 곳에 적어 두고 학생 화면 · 선생님 화면 · 엑셀이 모두 이것을 읽습니다.
   page:true 인 칸은 쪽 · 장 제목을 함께 받습니다 (키는 칸 이름 + Page / Chapter).
   min 은 권장 글자 수 — 모자라도 제출을 막지 않습니다. 글자 수 옆에 보여 주고, 제출할 때 한 번 묻기만 합니다. */

const DOCS = {
  report: { title: '최종 독서 보고서', fields: [
    { k: 'field', label: '관심 분야 또는 진로', input: true },
    { k: 'why', label: '이 책을 고른 이유', min: 100, rows: 9,
      hint: '내 관심이나 경험, 평소 궁금했던 점과 이 책이 어떻게 연결되는지 써 보세요.' },
    { k: 'core', label: '책의 핵심 내용', min: 150, rows: 11,
      hint: '책에서 중요하게 다루는 내용을 자신이 이해한 말로 간략하게 설명해 보세요.' },
    { k: 'part', label: '기억에 남는 부분과 내 생각', min: 150, rows: 10, page: true,
      hint: '인상 깊었던 내용, 의문이 들었던 주장, 공감하거나 동의하기 어려웠던 부분 등을 골라 자신의 생각을 써 보세요.' },
    { k: 'after', label: '읽고 나서 생각한 점', min: 100, rows: 8,
      hint: '책을 읽으며 새롭게 알게 되거나 생각이 깊어진 점을 써 보세요. 자신이나 세상을 보는 시각, 관심 분야와 진로에 대한 생각을 자유롭게 담아도 좋습니다.' },
    { k: 'more', label: '더 알아보고 싶은 것', min: 50, rows: 5,
      hint: '책을 읽고 생긴 궁금증이나 더 알아보고 싶은 내용을 써 보세요. 무엇 때문에 궁금해졌는지도 함께 담아 주세요. 탐구 보고서를 쓰는 사람은 이것이 탐구 주제가 됩니다.' },
  ] },
  inquiry: { title: '독서 연계 탐구 보고서', sub: '원하는 사람만 씁니다 · 발표 5분 이내', fields: [
    { k: 'topic', label: '탐구 주제', input: true },
    { k: 'start', label: '탐구를 시작한 이유', min: 80, rows: 6, page: true,
      hint: '책의 어떤 내용에서 궁금증이 생겼으며, 무엇을 알아보고 싶었는지 써 보세요.' },
    { k: 'process', label: '탐구한 과정과 내용', min: 250, rows: 21,
      hint: '궁금증을 풀기 위해 어떻게 알아보았고, 무엇을 알게 되었는지 설명해 보세요. 알아보는 과정에서 비교하거나 고민한 점, 예상과 달랐던 점이 있다면 함께 담아 주세요.' },
    { k: 'think', label: '탐구를 통해 내린 생각', min: 100, rows: 9,
      hint: '처음 궁금했던 점에 대해 지금은 어떻게 생각하는지, 알아본 내용을 바탕으로 써 보세요. 아직 답하기 어렵거나 더 확인하고 싶은 점이 남아 있어도 괜찮습니다.' },
    { k: 'refs', label: '참고한 자료', rows: 5,
      hint: '탐구에 활용한 책, 기사, 영상, 통계 등의 제목과 출처를 다른 사람도 찾아볼 수 있도록 남겨 주세요.' },
  ] },
};
const DOC_KEYS = ['report', 'inquiry'];

const docKeys = key => DOCS[key].fields.flatMap(f => f.page ? [f.k + 'Page', f.k + 'Chapter', f.k] : [f.k]);
function fillDoc(key, d){ const o = {}; docKeys(key).forEach(k => { o[k] = String(d?.[k] ?? ''); }); return o; }
const docHas = (key, d) => Object.values(fillDoc(key, d)).some(v => v.trim());
const docDiff = (key, a, b) => JSON.stringify(fillDoc(key, a)) !== JSON.stringify(fillDoc(key, b));

function docForm(key, d){
  d = fillDoc(key, d);
  return `<div class="sheet doc" data-doc="${key}">${DOCS[key].fields.map((f, i) => `<section><h3><b>${i + 1}</b>${f.label}</h3>
    ${f.hint ? `<p class="hint">${f.hint}</p>` : ''}
    ${f.page ? `<div class="read"><label>쪽<input data-dk="${f.k}Page" value="${esc(d[f.k + 'Page'])}" class="pg" inputmode="numeric"></label>
      <label class="grow">장 제목<input data-dk="${f.k}Chapter" value="${esc(d[f.k + 'Chapter'])}"></label></div>` : ''}
    ${f.input ? `<input data-dk="${f.k}" value="${esc(d[f.k])}" aria-label="${f.label}">`
              : `<textarea data-dk="${f.k}" rows="${f.rows}" aria-label="${f.label}">${esc(d[f.k])}</textarea>
                 <div class="count${f.min && d[f.k].length >= f.min ? ' ok' : ''}" data-min="${f.min || 0}"><span class="cnt">${d[f.k].length}</span>자${f.min ? ` / 권장 ${f.min}자 이상` : ''}</div>`}</section>`).join('')}</div>`;
}
// 권장 글자 수보다 짧은 칸의 이름들
const docShort = (key, d) => DOCS[key].fields.filter(f => f.min && String(d[f.k] || '').trim().length < f.min).map(f => f.label);

function readDoc(root, key){
  const d = fillDoc(key);
  root.querySelectorAll('[data-dk]').forEach(el => { d[el.dataset.dk] = el.value; });
  return d;
}

/* 쓰다가 나가도 글이 남게 — 학생이 쓰는 동안 그 기기에만 따로 적어 둡니다. 저장하면 지웁니다 */
const draftKey = key => `draft:${S.me.cid}:${S.me.num}:${key}`;
function loadDraft(key, rec){
  const dr = ls(draftKey(key));
  if(!dr) return null;
  if((rec?.updatedAt && rec.updatedAt >= dr.at) || !docDiff(key, dr.data, rec?.data)){ ls(draftKey(key), null); return null; }
  return dr.data;
}
