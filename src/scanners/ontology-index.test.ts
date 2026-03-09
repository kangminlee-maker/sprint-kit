import { describe, it, expect, vi } from "vitest";
import { buildOntologyIndex } from "./ontology-index.js";

// ─── Fixtures (실제 podo-ontology 구조 기반 소규모 데이터) ───

const ONTOLOGY_YAML = `
version: "1.0"
glossary:
  - canonical: Lesson
    meaning: "수업"
    legacy_aliases: [Class, Lecture]
    code_entity: Lecture
    db_table: GT_CLASS
    fk_variants: [classId, class_id, lectureId]
  - canonical: Tutor
    meaning: "튜터"
    legacy_aliases: [Teacher]
    code_entity: Tutor
    db_table: GT_TUTOR
    fk_variants: [tutorId, TUTOR_ID]
  - canonical: Student
    meaning: "학생"
    legacy_aliases: [User]
    code_entity: User
    db_table: GT_USER
    fk_variants: [studentId, userId, user_id]
  - canonical: Ticket
    meaning: "수강권"
    legacy_aliases: [ClassTicket, 레슨권]
    code_entity: Ticket
    db_table: le_ticket
    fk_variants: [classTicketId, ticketId]
`;

const ACTIONS_YAML = `
version: "1.0"
write_actions:
  - id: AUTH-1
    name: SocialLogin
    display_name: "소셜 로그인"
    domain: auth
    actor: Student
    target_entities: [Student, UserOauthMapping]
    source_code: "AuthenticationGateway.oauthLogin(), OauthService.authenticate()"
  - id: LEC-1
    name: CreateLecture
    display_name: "수업 생성 (일반)"
    domain: lecture
    actor: Student
    target_entities: [Lesson, LectureOnline]
    source_code: "LectureCommandServiceImpl.createNewPodoLecture()"
  - id: SCHEDULE-1
    name: MatchTutor
    display_name: "튜터 매칭"
    domain: schedule
    actor: Student
    target_entities: [Lesson]
    source_code: "PodoScheduleServiceImplV2.match()"
read_actions:
  - id: LEC-R1
    name: GetLessonDetail
    display_name: "수업 상세 조회"
    domain: lecture
    actor: Student
    target_entities: [Lesson]
    source_code: "LectureGateway.getLectureDetail()"
`;

const TRANSITIONS_YAML = `
version: "1.0"
entities:
  - name: Lesson
    state_fields:
      - field_name: invoice_status
        transitions:
          - id: L1
            from: null
            to: CREATED
            trigger: "학생이 수업 생성 (예습 시작)"
            source_code: "LectureCommandServiceImpl.createNewPodoLecture()"
          - id: L2
            from: CREATED
            to: RESERVED
            trigger: "학생이 시간 선택 + 튜터 매칭"
            source_code: "PodoScheduleServiceImplV2.match()"
          - id: L4
            from: RESERVED
            to: CANCEL
            trigger: "학생이 수업 시작 2시간+ 전 취소"
            source_code: "PodoScheduleServiceImplV2.cancel()"
  - name: Ticket
    state_fields:
      - field_name: status
        transitions:
          - id: T1
            from: null
            to: ACTIVE
            trigger: "수강권 활성화"
            source_code: "TicketService.activate()"
`;

// ─── Tests ───

describe("buildOntologyIndex", () => {
  describe("정상 YAML 파싱 → 인덱스 구성", () => {
    it("glossary를 파싱하고 canonical name(소문자)으로 키를 설정한다", () => {
      const index = buildOntologyIndex(ONTOLOGY_YAML, "", "");

      expect(index.glossary.size).toBe(4);
      expect(index.glossary.has("lesson")).toBe(true);
      expect(index.glossary.has("tutor")).toBe(true);
      expect(index.glossary.has("student")).toBe(true);
      expect(index.glossary.has("ticket")).toBe(true);

      const lesson = index.glossary.get("lesson")!;
      expect(lesson.canonical).toBe("Lesson");
      expect(lesson.meaning).toBe("수업");
      expect(lesson.legacy_aliases).toEqual(["Class", "Lecture"]);
      expect(lesson.code_entity).toBe("Lecture");
      expect(lesson.db_table).toBe("GT_CLASS");
      expect(lesson.fk_variants).toEqual(["classId", "class_id", "lectureId"]);
    });

    it("actions를 파싱하고 action id로 키를 설정한다", () => {
      const index = buildOntologyIndex("", ACTIONS_YAML, "");

      expect(index.actions.size).toBe(4);
      expect(index.actions.has("AUTH-1")).toBe(true);
      expect(index.actions.has("LEC-1")).toBe(true);
      expect(index.actions.has("SCHEDULE-1")).toBe(true);
      expect(index.actions.has("LEC-R1")).toBe(true);

      const auth1 = index.actions.get("AUTH-1")!;
      expect(auth1.name).toBe("SocialLogin");
      expect(auth1.display_name).toBe("소셜 로그인");
      expect(auth1.domain).toBe("auth");
      expect(auth1.actor).toBe("Student");
      expect(auth1.target_entities).toEqual(["Student", "UserOauthMapping"]);
      expect(auth1.source_code).toBe(
        "AuthenticationGateway.oauthLogin(), OauthService.authenticate()",
      );
    });

    it("write_actions와 read_actions 모두 파싱한다", () => {
      const index = buildOntologyIndex("", ACTIONS_YAML, "");

      // write_actions: AUTH-1, LEC-1, SCHEDULE-1
      // read_actions: LEC-R1
      expect(index.actions.has("LEC-R1")).toBe(true);
      const readAction = index.actions.get("LEC-R1")!;
      expect(readAction.display_name).toBe("수업 상세 조회");
    });

    it("transitions를 파싱하고 entity name(소문자)으로 키를 설정한다", () => {
      const index = buildOntologyIndex("", "", TRANSITIONS_YAML);

      expect(index.transitions.size).toBe(2);
      expect(index.transitions.has("lesson")).toBe(true);
      expect(index.transitions.has("ticket")).toBe(true);

      const lessonTransitions = index.transitions.get("lesson")!;
      expect(lessonTransitions).toHaveLength(3);

      const l1 = lessonTransitions[0];
      expect(l1.entity).toBe("Lesson");
      expect(l1.field_name).toBe("invoice_status");
      expect(l1.from).toBe("(none)");
      expect(l1.to).toBe("CREATED");
      expect(l1.trigger).toBe("학생이 수업 생성 (예습 시작)");

      const l2 = lessonTransitions[1];
      expect(l2.from).toBe("CREATED");
      expect(l2.to).toBe("RESERVED");
    });

    it("3개 YAML을 모두 전달하면 전체 인덱스가 구성된다", () => {
      const index = buildOntologyIndex(ONTOLOGY_YAML, ACTIONS_YAML, TRANSITIONS_YAML);

      expect(index.glossary.size).toBe(4);
      expect(index.actions.size).toBe(4);
      expect(index.transitions.size).toBe(2);
    });
  });

  describe("빈 YAML → 빈 Map (에러 아님)", () => {
    it("빈 문자열이면 모든 섹션이 빈 Map이다", () => {
      const index = buildOntologyIndex("", "", "");

      expect(index.glossary.size).toBe(0);
      expect(index.actions.size).toBe(0);
      expect(index.transitions.size).toBe(0);
    });

    it("공백만 있는 문자열도 빈 Map으로 처리한다", () => {
      const index = buildOntologyIndex("   ", "  \n  ", "\t\n");

      expect(index.glossary.size).toBe(0);
      expect(index.actions.size).toBe(0);
      expect(index.transitions.size).toBe(0);
    });

    it("부분적으로 빈 YAML이어도 나머지는 정상 파싱한다", () => {
      const index = buildOntologyIndex(ONTOLOGY_YAML, "", TRANSITIONS_YAML);

      expect(index.glossary.size).toBe(4);
      expect(index.actions.size).toBe(0);
      expect(index.transitions.size).toBe(2);
    });
  });

  describe("잘못된 YAML → throw (빈 결과와 구분)", () => {
    it("ontology YAML 파싱 에러 시 throw한다", () => {
      const badYaml = "glossary:\n  - canonical: [invalid\n    meaning: broken";
      expect(() => buildOntologyIndex(badYaml, "", "")).toThrow();
    });

    it("actions YAML 파싱 에러 시 throw한다", () => {
      const badYaml = "write_actions:\n  - id: [broken\n    name: bad";
      expect(() => buildOntologyIndex("", badYaml, "")).toThrow();
    });

    it("transitions YAML 파싱 에러 시 throw한다", () => {
      const badYaml = "entities:\n  - name: [broken\n    state_fields: bad";
      expect(() => buildOntologyIndex("", "", badYaml)).toThrow();
    });
  });

  describe("엣지 케이스", () => {
    it("glossary가 없는 YAML도 빈 Map으로 처리한다", () => {
      const yamlWithoutGlossary = "version: '1.0'\nmetadata:\n  title: test";
      const index = buildOntologyIndex(yamlWithoutGlossary, "", "");
      expect(index.glossary.size).toBe(0);
    });

    it("target_entities가 null인 action도 처리한다", () => {
      const actionsWithNull = `
write_actions:
  - id: AUTH-2
    name: Logout
    display_name: "로그아웃"
    domain: auth
    actor: Student
    target_entities: null
    source_code: "AuthenticationGateway.logout()"
`;
      const index = buildOntologyIndex("", actionsWithNull, "");
      const action = index.actions.get("AUTH-2")!;
      expect(action.target_entities).toEqual([]);
    });

    it("from이 null인 transition은 '(none)'으로 변환한다", () => {
      const index = buildOntologyIndex("", "", TRANSITIONS_YAML);
      const lessonTransitions = index.transitions.get("lesson")!;
      const l1 = lessonTransitions[0];
      expect(l1.from).toBe("(none)");
    });

    it("glossary에 중복 key가 있으면 console.warn을 출력한다", () => {
      const duplicateYaml = `
glossary:
  - canonical: Lesson
    meaning: "수업"
    legacy_aliases: []
    fk_variants: []
  - canonical: lesson
    meaning: "수업 (중복)"
    legacy_aliases: []
    fk_variants: []
`;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const index = buildOntologyIndex(duplicateYaml, "", "");

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        '[sprint-kit] [ontology] Duplicate glossary key: "lesson" (canonical: "lesson")',
        "",
      );
      // 후속 항목이 덮어쓰기
      expect(index.glossary.size).toBe(1);
      expect(index.glossary.get("lesson")!.meaning).toBe("수업 (중복)");

      warnSpy.mockRestore();
    });
  });
});
