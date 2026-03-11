# Validation Plan: 홈 화면 체험 상태 기반 재설계

scope: homeui-20260311-001

---

### VAL-001 | CST-001 | inject

**검증 대상:** HomeRedirection
**검증 방법:** 체험완료 학생 리다이렉트 미발생
**통과 조건:** 홈 화면 체험완료 Greeting 표시
**실패 시 조치:** 조건 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 정규 수강생 | 기존 동작 유지 |

---

### VAL-002 | CST-002 | inject

**검증 대상:** greetingStatusSchema
**검증 방법:** 8개 enum exhaustive 통과
**통과 조건:** 컴파일 성공
**실패 시 조치:** 누락 분기 추가

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 기존 4개 상태 | 동일 동작 |

---

### VAL-003 | CST-003 | inject

**검증 대상:** page.tsx
**검증 방법:** SSR prefetch 정상 동작
**통과 조건:** 클라이언트 추가 요청 없음
**실패 시 조치:** 쿼리 키 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| SSR 실패 | 4개 상태 fallback |

---

### VAL-004 | CST-005 | inject

**검증 대상:** greeting-content
**검증 방법:** 8개 상태별 올바른 변형 표시
**통과 조건:** Surface와 일치
**실패 시 조치:** 매핑 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 신규 사용자 | trial 변형 |

---

### VAL-005 | CST-007 | inject

**검증 대상:** use-greeting-status
**검증 방법:** CANCEL_NOSHOW_T → TUTOR_NOSHOW
**통과 조건:** 튜터노쇼 화면 표시
**실패 시 조치:** 판별 로직 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 튜터노쇼+trialClassCompYn=Y | TUTOR_NOSHOW 우선 |

---

### VAL-006 | CST-008 | inject

**검증 대상:** 결제 완료
**검증 방법:** 정기권 구매 후 체험 카드 미표시
**통과 조건:** 정규 Greeting 표시
**실패 시 조치:** invalidateQueries 키 추가

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 결제 실패 후 복귀 | 체험 상태 유지 |

---

### VAL-007 | CST-009 | inject

**검증 대상:** GreetingCard
**검증 방법:** CTA 카드 내부 + GNB 비겹침
**통과 조건:** CTA 접근 가능
**실패 시 조치:** 패딩 조정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 긴 콘텐츠 스크롤 | CTA 스크롤 내 포함 |

---

### VAL-008 | CST-004 | defer

**검증 대상:** "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 비간섭 확인
**검증 방법:** 검증 파일: podo-ontology, podo-backend. 해당 파일이 이번 변경에서 수정되지 않았는지 확인
**통과 조건:** podo-ontology, podo-backend 변경 없음
**실패 시 조치:** 의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정

---

### VAL-009 | CST-006 | defer

**검증 대상:** 노쇼 판정 기준 불일치 — 백엔드 코드 5분 vs 이용약관 10분 비간섭 확인
**검증 방법:** 검증 파일: podo-backend, terms-of-service.md. 해당 파일이 이번 변경에서 수정되지 않았는지 확인
**통과 조건:** podo-backend, terms-of-service.md 변경 없음
**실패 시 조치:** 의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정

---

### VAL-010 | CST-010 | defer

**검증 대상:** 스마트토크 체험은 AI 6회→튜터 1회 순차 개방 — 프로그레스 구조 영향 비간섭 확인
**검증 방법:** 검증 파일: terms-of-service.md. 해당 파일이 이번 변경에서 수정되지 않았는지 확인
**통과 조건:** terms-of-service.md 변경 없음
**실패 시 조치:** 의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정

---
