# Source Layout

모듈 경계:

- `kernel/` — 이벤트 저장소, 리듀서, 상태 기계, 제약 풀, stale 감지, 해시, scope 관리
- `commands/` — `/start`, `/align`, `/draft`, `/apply`, `/close`, `stale-check` 실행 진입점
- `scanners/` — 소스 스캔 (local, tarball, vault, figma), 온톨로지 파이프라인 (index, query, resolve, code-chunk-collector, viewpoint-collectors), brownfield 빌더
- `compilers/` — compile, compile-defense (L1/L2/L3), Build Spec 생성
- `renderers/` — scope.md, Align Packet, Draft Packet, Build Spec Section 7 (순수 함수)
- `validators/` — apply 및 validation 실행기
- `config/` — `.sprint-kit.yaml` 로딩, 소스 해석, CLI 입력 파싱
- `parsers/` — Brief 마크다운 파서
- `logger.ts` — 구조화 로거

공개 API 진입점: `index.ts` (외부 소비자는 이 파일만 import)
