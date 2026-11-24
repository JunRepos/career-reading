/* config.js — Firebase 설정과 반 목록
   수업앱(ai-career)과 같은 Firebase 를 씁니다. 학생 계정 · 교사 비밀번호 · 9월에 고른 책을 그대로 읽습니다.

   이 사이트가 저장하는 자리 — aiactivity/submissions/{반}/reading/…
     schedule          반별 일정 (대여일 · 1·2차시 · 활동지 마감 · 주간 기록 · 반납일 · 최종 보고서 마감 essayDue)
     sheet/{학번}       1~2차시 활동지  { data, ocr, source:'paper'|'web', submittedAt, updatedAt, updatedBy }
     weekly/{학번}/w1~w4 주간 독서 기록 { data, ocr, source:'paper'|'web', submittedAt, updatedAt, updatedBy }
     report/{학번}      최종 독서 보고서 { data, ocr, source, submittedAt, updatedAt, updatedBy }   칸은 report.js
     inquiry/{학번}     독서 연계 탐구 보고서 { 위와 같음 + presented: 발표했는지 }
     bookFix/{학번}     책을 바꾼 학생  { title, author, cover, updatedAt, updatedBy }
     rental/{학번}      대여 도서 목록  { st:'대여'|'결석'|'대여 안 함'|'미정', memo, check, rentDate, returned, returnedAt, updatedAt, updatedBy }
                        check 는 종이 판독이 확실하지 않은 줄 — 선생님이 그 줄을 저장하면 지워집니다
     pwReset/{학번}     비밀번호 초기화 요청 { at, name } — 선생님이 초기화하거나 지우면 없어집니다. 수업앱 학생관리에도 표시됩니다
   세특 초안은 여기에 저장하지 않습니다 (선생님 브라우저에만 남습니다). 이 데이터베이스는 로그인 없이 읽을 수 있기 때문입니다.
   이미 쓰기가 허용된 자리라 데이터베이스 규칙을 바꾸지 않아도 됩니다.
   수업앱은 이 아래에서 정해진 이름(customActivities · activityOpen · plan …)만 읽으므로 서로 부딪히지 않습니다. */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAnizrBWkqStaoWxIOpd8HFUS_CuqXjw2k",
  authDomain:        "sindong-informatics.firebaseapp.com",
  databaseURL:       "https://sindong-informatics-default-rtdb.firebaseio.com",
  projectId:         "sindong-informatics",
  storageBucket:     "sindong-informatics.firebasestorage.app",
  messagingSenderId: "542931253736",
  appId:             "1:542931253736:web:d83620fe9079c3f0998c5d"
};

const CLASSES = ['career-2-1', 'career-2-2', 'career-2-3', 'career-2-4', 'career-2-5', 'career-2-6'];
const CLS_LABEL = cid => cid.replace('career-', '');          // 'career-2-3' → '2-3'
const CLS_OF = num => (/^20[1-6]\d\d$/.test(num) ? 'career-2-' + num[2] : null);  // 20321 → career-2-3

const BOOK_ACT = 'actCareerRead01';                            // 9월에 책을 고른 활동
const RENT_ST = ['', '대여', '결석', '대여 안 함', '미정'];      // 도서 목록의 대여 칸
const RET_NA = ['대여 안 함', '미정'];                          // 반납할 책이 없는 학생

// 일정의 처음 값 — 선생님이 반마다 고칩니다
const DEFAULT_SCHEDULE = {
  rent:       '2026-10-21',
  s1:         '2026-10-21',
  s2:         '',
  sheetDue:   '',
  w1: '',                                                      // 주간 독서 기록을 쓴 날 (한 번만 걷었습니다)
  returnDate: '2026-11-24',
  essayDue:   '2026-12-01',
};
