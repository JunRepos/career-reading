/* config.js — Firebase 설정과 반 목록
   수업앱(ai-career)과 같은 Firebase 를 씁니다. 학생 계정 · 교사 비밀번호 · 9월에 고른 책을 그대로 읽습니다.

   이 사이트가 저장하는 자리 — aiactivity/submissions/{반}/reading/…
     schedule          반별 일정 (대여일 · 1·2차시 · 활동지 마감 · 반납일 · 최종 소감문 완성일 · 소감문 열기)
     sheet/{학번}       1~2차시 활동지  { data, ocr, source:'paper'|'web', submittedAt, updatedAt, updatedBy }
     essay/{학번}       최종 소감문     { text, submittedAt, updatedAt, updatedBy }
     bookFix/{학번}     책을 바꾼 학생  { title, author }
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

// 일정의 처음 값 — 선생님이 반마다 고칩니다
const DEFAULT_SCHEDULE = {
  rent:       '2026-10-21',
  s1:         '2026-10-21',
  s2:         '',
  sheetDue:   '',
  returnDate: '2026-11-24',
  essayDue:   '2026-12-01',
  essayOpen:  false,
};
