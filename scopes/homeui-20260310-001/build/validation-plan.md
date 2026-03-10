# Validation Plan: 홈 화면 상태 기반 재설계

scope: homeui-20260310-001

---

### VAL-001 | CST-001 | inject

**검증 대상:** 홈 화면 8상태 분기
**검증 방법:** 디버그 UI로 8개 시나리오 순회하며 각 상태별 올바른 화면 표시 확인
**통과 조건:** 8개 상태 모두 해당 컴포넌트가 렌더링됨
**실패 시 조치:** 누락된 상태의 컴포넌트 추가

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| invoiceStatus가 예상 외 값(예: NOSHOW_BOTH)일 때 | fallback 화면 표시 또는 가장 유사한 상태로 분기 |

---

### VAL-002 | CST-002 | inject

**검증 대상:** 체험완료 미결제 사용자 홈 접근
**검증 방법:** trialClassCompYn=Y, paymentYn=N 사용자로 홈 진입
**통과 조건:** 리다이렉트 없이 TRIAL_COMPLETED 상태 화면 표시
**실패 시 조치:** HomeRedirection 조건 재확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| localStorage에 AUTO_REDIRECTED 플래그가 남아있을 때 | 플래그에 관계없이 홈 화면 표시 |

---

### VAL-003 | CST-003 | inject

**검증 대상:** 예외 상태 홈 표시
**검증 방법:** invoiceStatus=NOSHOW_S/CANCEL_NOSHOW_T/CANCEL으로 각각 테스트
**통과 조건:** 3개 예외 상태 모두 홈에서 올바른 화면 표시
**실패 시 조치:** invoiceStatus 조회 로직 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 최근 레슨이 없는 상태에서 홈 진입 | TRIAL_IDLE(미신청) 상태로 분기 |

---

### VAL-004 | CST-004 | inject

**검증 대상:** 체험 완료 후 결제 CTA 노출
**검증 방법:** TRIAL_COMPLETED 상태에서 혜택 카드와 StickyBottom CTA 확인
**통과 조건:** 첫 수강 혜택 카드 + '수강권 구매하기' CTA 표시
**실패 시 조치:** TRIAL_COMPLETED 컴포넌트 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 체험 완료 후 앱 재진입(세션 갱신) | 동일한 TRIAL_COMPLETED 화면 유지 |

---

### VAL-005 | CST-005 | inject

**검증 대상:** 학생 노쇼 vs 튜터 노쇼 분리
**검증 방법:** NOSHOW_S와 CANCEL_NOSHOW_T 각각 테스트
**통과 조건:** 학생노쇼=red 경고+패널티, 튜터노쇼=blue 안내+복구
**실패 시 조치:** invoiceStatus 분기 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 학생 노쇼 후 72시간 경과(패널티 해제) | CTA가 disabled→enabled로 전환, '다시 예약하기' 활성 |

---

### VAL-006 | CST-006 | inject

**검증 대상:** 취소 경고 체험/정규 분기
**검증 방법:** PODO_TRIAL과 PODO 수업 각각 취소 시도
**통과 조건:** 체험='무료 취소' 안내, 정규=시간별 3단계 경고
**실패 시 조치:** Lesson.city 분기 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 정규 수업을 수업 시작 1시간 이내에 취소 시도 | 유료 취소 경고 + 수강권 차감 안내 |

---

### VAL-007 | CST-008 | inject

**검증 대상:** greetingStatusSchema 8개 enum 확장
**검증 방법:** TypeScript 컴파일 + ts-pattern exhaustive match 통과
**통과 조건:** tsc --noEmit 성공, 모든 상태에 match 분기 존재
**실패 시 조치:** 누락된 match 분기 추가

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| 새 enum 값 추가 시 match에 분기 없음 | 컴파일 에러 발생 (exhaustive match 보호) |

---

### VAL-008 | CST-009 | inject

**검증 대상:** SSR prefetch 추가
**검증 방법:** 홈 page.tsx에서 4개 API 병렬 prefetch 확인
**통과 조건:** 서버 사이드에서 4개 API 데이터가 HydrationBoundary로 전달됨
**실패 시 조치:** prefetch 호출 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| getTrialStepInfo API 실패 | ErrorBoundary가 해당 섹션만 fallback 표시, 나머지 정상 |

---

### VAL-009 | CST-010 | inject

**검증 대상:** StickyBottom CTA 조건부 배치
**검증 방법:** 8개 상태 순회하며 StickyBottom 존재 여부 확인
**통과 조건:** 상태 1,4,7에만 StickyBottom, 나머지는 인라인 CTA
**실패 시 조치:** 조건 분기 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| StickyBottom이 BottomNav와 겹침 | StickyBottom이 BottomNav 위에 위치 (z-index 30 > 10) |

---

### VAL-010 | CST-011 | inject

**검증 대상:** 예약 CTA 활성/비활성 조건
**검증 방법:** 이미 예약 있는 상태 + 패널티 중 상태에서 CTA 확인
**통과 조건:** CTA disabled + Toast로 사유 안내
**실패 시 조치:** disabled 조건 로직 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| disabled CTA 터치 시 | Toast로 예약 불가 사유 안내 (C2: 거부에도 이유 전달) |

---

### VAL-011 | CST-012 | inject

**검증 대상:** 디버그 UI dev-only
**검증 방법:** production build에서 ScenarioControl 미포함 확인
**통과 조건:** NODE_ENV=production 빌드에서 디버그 UI 코드 제거
**실패 시 조치:** 환경 변수 조건 확인

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| dev 서버 실행 시 | 디버그 UI 정상 표시, 8개 시나리오 전환 가능 |

---

### VAL-012 | CST-007 | defer

**검증 대상:** 체험권은 유료(TRIAL, 금액은 Subscribe 상품 레코드 기준)와 무료(TRIAL_FREE)로 구분되며, 체험 미이용 사용자만 결제 가능하다. 온톨로지에는 유료 체험 3회 상품 정보가 없다 비간섭 확인
**검증 방법:** 검증 파일: podo-backend, podo-ontology. 해당 파일이 이번 변경에서 수정되지 않았는지 확인
**통과 조건:** podo-backend, podo-ontology 변경 없음
**실패 시 조치:** 의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정

---
