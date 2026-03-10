# homeui-20260310-001 — Build Artifacts

## Scope

**홈 화면 상태 기반 재설계**

홈 화면을 현재 4상태 정적 분기에서, 체험 여정 전체(미신청→대기→레슨 중→완료→예외)를 커버하는 상태 기반 동적 전환 구조로 확장하고, 모든 상태에서 결제 전환 접점을 확보한다.

## 파일 목록

| 파일 | 설명 | 독자 |
|------|------|------|
| `align-packet.md` | 방향·범위 확인 문서. 10건의 충돌(tension)과 PO 결정 요청을 담고 있다. | PO |
| `draft-packet.md` | 12건 constraint에 대한 상세 선택지와 PO/Builder 결정 결과를 담고 있다. | PO, Builder |
| `build-spec.md` | 구현 명세서. 10개 IMPL(구현 항목) + 15개 CHG(파일 변경)를 정의한다. | Builder |
| `delta-set.json` | 변경 목록. 15개 파일의 create/modify 작업을 JSON으로 구조화한 것이다. | Builder (자동화 도구) |
| `validation-plan.md` | 검증 계획. 11개 inject constraint별 검증 시나리오와 edge case를 정의한다. | Builder, QA |
| `brownfield-detail.md` | 기존 코드 상세. 변경 대상 5개 영역의 현재 구조, 의존 관계, 컨벤션을 기록한다. | Builder |

## 워크플로우 진행 상태

```
/start ✅ → /align ✅ → /draft ✅ → compile ✅ → apply → validate → close
```

- **현재 상태**: `compiled`
- **다음 단계**: `apply` — Builder가 build-spec.md와 delta-set.json을 참조하여 podo-app 코드에 변경을 적용

## Constraint 결정 요약

| CST | 결정 | 요약 |
|-----|------|------|
| CST-001 | inject | 4상태 → 8상태 확장 |
| CST-002 | inject | 체험 완료 미결제 리다이렉트 제거 → 홈 내 결제 전환 |
| CST-003 | inject | 노쇼/취소 예외 상태 홈 표시 |
| CST-004 | inject | 전환 실패 36.1% → 결제 CTA 상시 노출 (간접 대응) |
| CST-005 | inject | 학생 노쇼(red+패널티) vs 튜터 노쇼(blue+복구) 분리 |
| CST-006 | inject | 취소 경고 체험(무료)/정규(3단계) 분기 |
| CST-007 | **defer** | 유료 체험 상품 정보 확인 후 구현 |
| CST-008 | inject | greetingStatusSchema 8개 enum 확장 (Builder) |
| CST-009 | inject | SSR prefetch 추가 (Builder) |
| CST-010 | inject | StickyBottom CTA — 결제 전환 목적 상태에만 |
| CST-011 | inject | 홈 CTA는 '예약하기'만, 상세 제한은 예약 플로우 |
| CST-012 | inject | 디버그 UI dev 환경에서만 표시 (Builder) |

## Surface 미리보기

```bash
cd surface/preview && npm install && npm run dev
# http://localhost:5173 에서 확인
# 우측 상단 ◆ 버튼으로 8개 시나리오 전환
```

## 관련 소스

- podo-backend: `https://github.com/re-speak/podo-backend`
- podo-app: `https://github.com/re-speak/podo-app`
- podo-ontology: `https://github.com/re-speak/podo-ontology`
- 디자인 가이드: `sources/podo-design-guide-v2.md`
