import { describe, it, expect } from "vitest";
import { parseBrief, type ParsedBrief } from "./brief-parser.js";

// ─── Test fixtures ───

const COMPLETE_BRIEF = `# my-project — Brief

<!-- 이 문서는 /start 실행 전에 작성하는 프로젝트 준비 문서입니다. -->

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? -->

튜터 차단 기능을 추가해야 합니다.
학생이 부적절한 튜터를 신고하면 매칭에서 제외되어야 합니다.

## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->

학생 사용자 (초등~고등학생)

## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->

차단된 튜터가 매칭 후보에서 제외됩니다.
학생이 차단 목록을 관리할 수 있습니다.

## 포함 범위
차단 API 엔드포인트
매칭 로직 수정

## 제외 범위
관리자 대시보드 변경
튜터 측 알림

## 제약 및 참고사항
기존 매칭 알고리즘 성능에 영향 최소화

## 소스
### 자동 로드 (환경설정)
- [x] 백엔드 소스 (add-dir: ./src/backend)

### 추가 소스
- [x] API 서버 (add-dir: /projects/api)
- [ ] 디자인 파일 (figma-mcp: abc123)
`;

const EMPTY_BRIEF = `# my-project — Brief

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? -->


## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->


## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->

`;

const PARTIAL_BRIEF = `# my-project — Brief

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? -->

결제 시스템 개선

## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->


## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->

결제 실패율 50% 감소
`;

const SOURCES_BRIEF = `# my-project — Brief

## 변경 목적 (필수)
소스 파싱 테스트

## 대상 사용자 (필수)
개발자

## 기대 결과 (필수)
소스가 올바르게 파싱됩니다.

## 소스
### 자동 로드 (환경설정)
- [x] 기본 소스 (add-dir: ./src)

### 추가 소스
- [x] API 서버 (add-dir: /projects/api)
- [ ] 디자인 시스템 (figma-mcp: figma-key-123)
- [x] 온톨로지 (github-tarball: https://github.com/org/ontology)
- [ ] 회사 문서 (obsidian-vault: /vaults/docs)
- [ ] (여기에 추가 소스를 기입하세요)
`;

const NO_SOURCES_BRIEF = `# my-project — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
모든 사용자

## 기대 결과 (필수)
기능이 동작합니다.

## 소스
### 자동 로드 (환경설정)
- 환경설정 파일(.sprint-kit.yaml)이 없거나 소스가 정의되지 않았습니다.

### 추가 소스
- [ ] (여기에 추가 소스를 기입하세요)
`;

// ─── Tests ───

describe("parseBrief", () => {
  it("extracts all fields from a complete brief", () => {
    const result = parseBrief(COMPLETE_BRIEF);

    expect(result.title).toBe("튜터 차단 기능을 추가해야 합니다.");
    expect(result.purpose).toContain("튜터 차단 기능을 추가해야 합니다.");
    expect(result.purpose).toContain("학생이 부적절한 튜터를 신고하면");
    expect(result.targetUsers).toBe("학생 사용자 (초등~고등학생)");
    expect(result.expectedResult).toContain("차단된 튜터가 매칭 후보에서 제외됩니다.");
    expect(result.includeScope).toContain("차단 API 엔드포인트");
    expect(result.excludeScope).toContain("관리자 대시보드 변경");
    expect(result.constraints).toContain("기존 매칭 알고리즘 성능에 영향 최소화");

    // Description = purpose + expectedResult
    expect(result.description).toContain("튜터 차단 기능을 추가해야 합니다.");
    expect(result.description).toContain("차단된 튜터가 매칭 후보에서 제외됩니다.");

    // Validation
    expect(result.validation.isComplete).toBe(true);
    expect(result.validation.missingFields).toEqual([]);
  });

  it("reports missing required fields when brief is empty", () => {
    const result = parseBrief(EMPTY_BRIEF);

    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.missingFields).toEqual([
      "변경 목적",
      "대상 사용자",
      "기대 결과",
    ]);
    expect(result.title).toBe("");
  });

  it("reports partially missing required fields", () => {
    const result = parseBrief(PARTIAL_BRIEF);

    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.missingFields).toEqual(["대상 사용자"]);
    expect(result.title).toBe("결제 시스템 개선");
    expect(result.purpose).toBe("결제 시스템 개선");
    expect(result.expectedResult).toBe("결제 실패율 50% 감소");
  });

  it("parses additional sources into SourceEntry[]", () => {
    const result = parseBrief(SOURCES_BRIEF);

    expect(result.additionalSources).toHaveLength(4);

    // add-dir
    expect(result.additionalSources[0]).toEqual({
      type: "add-dir",
      path: "/projects/api",
      description: "API 서버",
    });

    // figma-mcp
    expect(result.additionalSources[1]).toEqual({
      type: "figma-mcp",
      file_key: "figma-key-123",
      description: "디자인 시스템",
    });

    // github-tarball
    expect(result.additionalSources[2]).toEqual({
      type: "github-tarball",
      url: "https://github.com/org/ontology",
      description: "온톨로지",
    });

    // obsidian-vault
    expect(result.additionalSources[3]).toEqual({
      type: "obsidian-vault",
      path: "/vaults/docs",
      description: "회사 문서",
    });
  });

  it("returns empty array when no additional sources", () => {
    const result = parseBrief(NO_SOURCES_BRIEF);

    expect(result.additionalSources).toEqual([]);
    expect(result.validation.isComplete).toBe(true);
  });

  it("ignores placeholder items containing '여기에 추가'", () => {
    const result = parseBrief(SOURCES_BRIEF);

    // Should not include the placeholder item
    const descriptions = result.additionalSources.map((s) =>
      "description" in s ? s.description : "",
    );
    expect(descriptions).not.toContain("여기에 추가 소스를 기입하세요");
  });

  it("handles brief with only HTML comments in sections", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? 해결하려는 문제를 설명해 주세요. -->

## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->

## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->
`;

    const result = parseBrief(brief);
    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.missingFields).toEqual([
      "변경 목적",
      "대상 사용자",
      "기대 결과",
    ]);
  });

  it("returns undefined for optional sections when not present", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
사용자

## 기대 결과 (필수)
성공
`;

    const result = parseBrief(brief);
    expect(result.includeScope).toBeUndefined();
    expect(result.excludeScope).toBeUndefined();
    expect(result.constraints).toBeUndefined();
  });
});
