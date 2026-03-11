# Validation Plan: 홈 화면 체험 상태 기반 동적 전환

scope: homeui-20260311-001

---

### VAL-001 | CST-001 | inject

**검증 대상:** useGreetingStatus
**검증 방법:** 각 상태 mock 데이터로 훅 호출
**통과 조건:** 7상태 각각 올바른 TrialStatus 반환
**실패 시 조치:** 판별 로직 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 수강권 없음 + 체험 이력 없음 | NOT_APPLIED |
| 체험 3회 완료 + 다음 레슨 없음 | EXHAUSTED |

---

### VAL-002 | CST-004 | inject

**검증 대상:** 레슨 이력 API
**검증 방법:** 홈 진입 시 네트워크 확인
**통과 조건:** 3개 API 병렬 호출
**실패 시 조치:** 호출 로직 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| API 3초 지연 | Suspense fallback 후 정상 |

---

### VAL-003 | CST-007 | inject

**검증 대상:** 체험 횟수 계산
**검증 방법:** TRIAL_FREE 3건 완료 mock
**통과 조건:** EXHAUSTED 분기
**실패 시 조치:** 계산 로직 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| NOSHOW 1건 + COMPLETED 2건 = 3건 | EXHAUSTED |

---

### VAL-004 | CST-010 | inject

**검증 대상:** 수강권 유형 분기
**검증 방법:** 정규 수강권 mock으로 진입
**통과 조건:** 기존 4상태 UI 표시
**실패 시 조치:** 분기 조건 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 정규 만료 후 수강권 없음 | NO_TICKET (기존 UI) |

---

### VAL-005 | CST-009 | inject

**검증 대상:** 결제 후 전환
**검증 방법:** 결제 완료 시뮬레이션
**통과 조건:** 홈 복귀 시 정규 UI 즉시 표시
**실패 시 조치:** invalidateQueries 타이밍 조정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 결제 직후 뒤로가기 | 정규 UI 표시 |

---

### VAL-006 | CST-002 | inject

**검증 대상:** 프로그레스바
**검증 방법:** 각 상태에서 단계 확인
**통과 조건:** 올바른 단계 활성화
**실패 시 조치:** 매핑 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 튜터 노쇼 | step 1 복귀 |

---

### VAL-007 | CST-003 | inject

**검증 대상:** StickyBottom CTA
**검증 방법:** 각 상태에서 라벨 확인
**통과 조건:** 올바른 CTA 라벨/네비게이션
**실패 시 조치:** CTA 매핑 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| LESSON_READY CTA 클릭 | 레슨룸 이동 |

---

### VAL-008 | CST-005 | inject

**검증 대상:** trial-status-mapper
**검증 방법:** invoiceStatus/classState 조합 테스트
**통과 조건:** 올바른 TrialStatus 반환
**실패 시 조치:** 매핑 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| RESERVED+PREFINISH | LESSON_READY |

---

### VAL-009 | CST-006 | inject

**검증 대상:** 노쇼 표시
**검증 방법:** NOSHOW_S mock으로 진입
**통과 조건:** STUDENT_ABSENT 카드
**실패 시 조치:** 판별 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| CANCEL_NOSHOW_T | TUTOR_NOSHOW 카드 |

---

### VAL-010 | CST-011 | inject

**검증 대상:** 예습 단계
**검증 방법:** RESERVED + pre_study_time>0
**통과 조건:** step 1 활성
**실패 시 조치:** 조건 수정

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| pre_study_time=0 | step 1, 진행률 0% |

---
