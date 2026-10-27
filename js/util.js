/* util.js — 해시 · 날짜 · 이스케이프 */

async function sha256(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
}
function newSalt(){
  const a = new Uint8Array(16); crypto.getRandomValues(a);
  return Array.from(a).map(x => x.toString(16).padStart(2, '0')).join('');
}
// 수업앱과 같은 방식 — salt 가 있으면 sha256(salt + 비밀번호), 없으면 sha256(비밀번호)
async function checkPw(pw, hash, salt){
  return (salt ? await sha256(salt + pw) : await sha256(pw)) === hash;
}

function esc(s){
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const nl2br = s => esc(s).replace(/\n/g, '<br>');

/* 날짜는 'YYYY-MM-DD' 문자열로 다룹니다 (한국 시간) */
function today(){
  const d = new Date(Date.now() + 9 * 3600e3);
  return d.toISOString().slice(0, 10);
}
function kDate(s){                      // '2026-11-24' → '11월 24일 (화)'
  if(!s) return '미정';
  const d = new Date(s + 'T00:00:00+09:00');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
}
function dday(s){                       // 남은 날
  if(!s) return '';
  const n = Math.round((new Date(s + 'T00:00:00+09:00') - new Date(today() + 'T00:00:00+09:00')) / 864e5);
  return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`;
}
function kTime(iso){                    // 저장 시각 → '10월 27일 14:05'
  if(!iso) return '';
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 3600e3);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
}
const dateOf = iso => iso ? new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10) : '';

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 1800);
}

function ss(key, val){                  // sessionStorage — 막혀 있어도 사이트는 돌아가야 합니다
  try{
    if(val === undefined) return JSON.parse(sessionStorage.getItem(key) || 'null');
    if(val === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(val));
  }catch(e){ return null; }
}
