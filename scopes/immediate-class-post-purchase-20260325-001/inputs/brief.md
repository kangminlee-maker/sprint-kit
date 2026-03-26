# immediate-class-post-purchase — Brief

<!-- 이 문서는 /start 실행 전에 작성하는 프로젝트 준비 문서입니다. -->
<!-- 필수 항목을 채운 후 /start immediate-class-post-purchase을 다시 실행하면 프로세스가 시작됩니다. -->

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? 해결하려는 문제를 설명해 주세요. -->

수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->

수강권 구매를 방금 완료한 모든 사용자. 구매 완료 페이지에서 바로 노출된다.

## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->

구매 후 수업 0회 → 환불하는 비율을 현재 8%에서 2~3%로 낮춘다. 구매 완료 시점에 수업 예약 전환율을 높여, 최소 1회 수업 수강 비율을 극대화한다.



## 포함 범위
<!-- 이번에 포함할 기능이나 변경 사항을 나열해 주세요. (선택) -->



## 제외 범위
<!-- 이번에 포함하지 않을 사항을 나열해 주세요. (선택) -->



## 제약 및 참고사항
<!-- 이미 알고 있는 제약(일정, 기술 제한 등)이나 참고할 정보를 적어 주세요. (선택) -->



## 소스
<!-- .sprint-kit.yaml에서 자동 로드됨. 추가 소스를 아래에 기입하세요. -->

### 자동 로드 (환경설정)
- [x] podo 백엔드 (github-tarball: https://github.com/re-speak/podo-backend)
- [x] podo 앱 (github-tarball: https://github.com/re-speak/podo-app)
- [x] podo 온톨로지 (github-tarball: https://github.com/re-speak/podo-ontology)
- [x] podo Design System, 디자인 온톨로지, 디자인 assets (github-tarball: https://github.com/re-speak/vibe-design/tree/feat/prevent-purchase-duplication)
- [x] 로컬 참고 자료 (디자인 가이드, 이용약관) (add-dir: ./sources)
- [x] 사용자 행동 이벤트 분석 (퍼널 전환율, 상태별 분포, 이탈 지점) (mcp: clickhouse)

### 추가 소스
- [ ] (여기에 추가 소스를 기입하세요)
