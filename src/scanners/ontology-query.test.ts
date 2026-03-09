import { describe, it, expect } from "vitest";
import { buildOntologyIndex } from "./ontology-index.js";
import { queryOntology } from "./ontology-query.js";

// ─── Fixtures ───

const ONTOLOGY_YAML = `
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
    fk_variants: [studentId, userId]
  - canonical: Ticket
    meaning: "수강권"
    legacy_aliases: [ClassTicket, 레슨권]
    code_entity: Ticket
    db_table: le_ticket
    fk_variants: [classTicketId, ticketId]
  - canonical: Subscribe
    meaning: "구독"
    legacy_aliases: [Subscription]
    code_entity: Subscribe
    db_table: le_subscribe
    fk_variants: [subscribeId]
`;

const ACTIONS_YAML = `
write_actions:
  - id: AUTH-1
    name: SocialLogin
    display_name: "소셜 로그인"
    domain: auth
    actor: Student
    target_entities: [Student, UserOauthMapping]
    source_code: "AuthenticationGateway.oauthLogin()"
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
  - id: TICKET-1
    name: CreateTicket
    display_name: "수강권 생성"
    domain: ticket
    actor: System
    target_entities: [Ticket]
    source_code: "TicketService.create()"
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
entities:
  - name: Lesson
    state_fields:
      - field_name: invoice_status
        transitions:
          - id: L1
            from: null
            to: CREATED
            trigger: "학생이 수업 생성"
            source_code: "LectureCommandServiceImpl.createNewPodoLecture()"
          - id: L2
            from: CREATED
            to: RESERVED
            trigger: "학생이 시간 선택 + 튜터 매칭"
            source_code: "PodoScheduleServiceImplV2.match()"
          - id: L4
            from: RESERVED
            to: CANCEL
            trigger: "학생이 수업 취소"
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
          - id: T2
            from: ACTIVE
            to: EXPIRED
            trigger: "수강권 만료"
            source_code: "TicketBatchService.expire()"
`;

function buildFixtureIndex() {
  return buildOntologyIndex(ONTOLOGY_YAML, ACTIONS_YAML, TRANSITIONS_YAML);
}

// ─── Tests ───

describe("queryOntology", () => {
  describe("키워드 매칭: 정확 매칭", () => {
    it("canonical name으로 정확히 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      expect(result.matched_entities).toContain("Lesson");
      expect(result.matched_entities).not.toContain("Tutor");
    });

    it("legacy alias로 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Teacher"]);

      expect(result.matched_entities).toContain("Tutor");
    });
  });

  describe("키워드 매칭: 부분 매칭", () => {
    it("canonical name의 부분 문자열로 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["less"]);

      expect(result.matched_entities).toContain("Lesson");
    });

    it("legacy alias의 부분 문자열로 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Teach"]);

      expect(result.matched_entities).toContain("Tutor");
    });

    it("meaning 필드의 부분 문자열로 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["수업"]);

      expect(result.matched_entities).toContain("Lesson");
    });
  });

  describe("키워드 매칭: 대소문자 무시", () => {
    it("소문자 키워드로 대문자 canonical name을 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["lesson"]);

      expect(result.matched_entities).toContain("Lesson");
    });

    it("대문자 키워드로 소문자가 포함된 legacy alias를 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["TEACHER"]);

      expect(result.matched_entities).toContain("Tutor");
    });

    it("혼합 대소문자 키워드로 매칭한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["lEsSON"]);

      expect(result.matched_entities).toContain("Lesson");
    });
  });

  describe("한국어 키워드 매칭 (meaning 필드)", () => {
    it("한국어 meaning으로 매칭한다: 수업 → Lesson", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["수업"]);

      expect(result.matched_entities).toContain("Lesson");
      expect(result.db_tables).toContain("GT_CLASS");
    });

    it("한국어 meaning으로 매칭한다: 튜터 → Tutor", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["튜터"]);

      expect(result.matched_entities).toContain("Tutor");
      expect(result.db_tables).toContain("GT_TUTOR");
    });

    it("한국어 meaning으로 매칭한다: 수강권 → Ticket", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["수강권"]);

      expect(result.matched_entities).toContain("Ticket");
    });

    it("한국어 meaning 부분 매칭: 수강 → Ticket (수강권)", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["수강"]);

      expect(result.matched_entities).toContain("Ticket");
    });

    it("한국어 legacy alias로 매칭한다: 레슨권 → Ticket", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["레슨권"]);

      expect(result.matched_entities).toContain("Ticket");
    });
  });

  describe("관련 actions 수집", () => {
    it("매칭된 entity를 target으로 가진 action을 수집한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      const actionIds = result.related_actions.map((a) => a.id);
      expect(actionIds).toContain("LEC-1");
      expect(actionIds).toContain("SCHEDULE-1");
      expect(actionIds).toContain("LEC-R1");
      // AUTH-1은 Student를 target으로 가지므로 포함되지 않아야 함
      expect(actionIds).not.toContain("AUTH-1");
    });

    it("action summary에 display_name과 source_code가 포함된다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      const lec1 = result.related_actions.find((a) => a.id === "LEC-1");
      expect(lec1).toBeDefined();
      expect(lec1!.display_name).toBe("수업 생성 (일반)");
      expect(lec1!.source_code).toBe("LectureCommandServiceImpl.createNewPodoLecture()");
    });
  });

  describe("관련 transitions 수집", () => {
    it("매칭된 entity의 transition을 수집한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      expect(result.related_transitions.length).toBe(3);
      const triggers = result.related_transitions.map((t) => t.trigger);
      expect(triggers).toContain("학생이 수업 생성");
      expect(triggers).toContain("학생이 시간 선택 + 튜터 매칭");
      expect(triggers).toContain("학생이 수업 취소");
    });

    it("transition summary에 entity, from, to, trigger, source_code가 포함된다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Ticket"]);

      expect(result.related_transitions.length).toBe(2);
      const t1 = result.related_transitions[0];
      expect(t1.entity).toBe("Ticket");
      expect(t1.from).toBe("(none)");
      expect(t1.to).toBe("ACTIVE");
      expect(t1.source_code).toBe("TicketService.activate()");
    });
  });

  describe("code_locations 수집", () => {
    it("관련 action의 source_code에서 CodeLocation을 추출한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      expect(result.code_locations.length).toBeGreaterThan(0);
      const refs = result.code_locations.map((cl) => cl.reference);
      expect(refs).toContain("LectureCommandServiceImpl.createNewPodoLecture()");
      expect(refs).toContain("PodoScheduleServiceImplV2.match()");
    });

    it("code_location의 context에 action id와 display_name이 포함된다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      const lec1Location = result.code_locations.find(
        (cl) => cl.reference === "LectureCommandServiceImpl.createNewPodoLecture()",
      );
      expect(lec1Location).toBeDefined();
      expect(lec1Location!.context).toBe("Action LEC-1: 수업 생성 (일반)");
    });
  });

  describe("db_tables 수집", () => {
    it("매칭된 entity의 db_table을 수집한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson"]);

      expect(result.db_tables).toEqual(["GT_CLASS"]);
    });

    it("복수 entity 매칭 시 모든 db_table을 수집한다", () => {
      const index = buildFixtureIndex();
      // "수" 키워드는 "수업"(Lesson), "수강권"(Ticket) 모두 매칭
      const result = queryOntology(index, ["Lesson", "Tutor"]);

      expect(result.db_tables).toContain("GT_CLASS");
      expect(result.db_tables).toContain("GT_TUTOR");
    });
  });

  describe("복수 키워드", () => {
    it("여러 키워드 중 하나라도 매칭되면 해당 entity를 포함한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson", "Tutor"]);

      expect(result.matched_entities).toContain("Lesson");
      expect(result.matched_entities).toContain("Tutor");
    });

    it("각 entity의 관련 action과 transition을 모두 수집한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["Lesson", "Ticket"]);

      const actionIds = result.related_actions.map((a) => a.id);
      expect(actionIds).toContain("LEC-1");
      expect(actionIds).toContain("TICKET-1");

      const entities = result.related_transitions.map((t) => t.entity);
      expect(entities).toContain("Lesson");
      expect(entities).toContain("Ticket");
    });
  });

  describe("0건 매칭 → 빈 결과", () => {
    it("매칭되는 entity가 없으면 모든 배열이 빈 상태이다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, ["nonexistent"]);

      expect(result.matched_entities).toEqual([]);
      expect(result.code_locations).toEqual([]);
      expect(result.db_tables).toEqual([]);
      expect(result.related_actions).toEqual([]);
      expect(result.related_transitions).toEqual([]);
    });

    it("빈 키워드 배열이면 빈 결과를 반환한다", () => {
      const index = buildFixtureIndex();
      const result = queryOntology(index, []);

      expect(result.matched_entities).toEqual([]);
      expect(result.code_locations).toEqual([]);
      expect(result.db_tables).toEqual([]);
      expect(result.related_actions).toEqual([]);
      expect(result.related_transitions).toEqual([]);
    });

    it("빈 인덱스에 키워드를 전달하면 빈 결과를 반환한다", () => {
      const index = buildOntologyIndex("", "", "");
      const result = queryOntology(index, ["Lesson"]);

      expect(result.matched_entities).toEqual([]);
      expect(result.related_actions).toEqual([]);
      expect(result.related_transitions).toEqual([]);
    });
  });
});
