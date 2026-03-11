---
domain: diagnosis
document_type: entities
version: 1.0.0
last_updated: 2026-01-26
---

# 진단 엔티티 문서

## 1. Diagnosis (le_diagnosis)

수업별 진단 분석 결과를 저장하는 엔티티입니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | VARCHAR(32) | PK, NOT NULL | 진단 ID (UUID 기반 MD5) |
| `trace_id` | VARCHAR | NOT NULL | 추적 ID (요청 식별) |
| `user_id` | INT | NOT NULL | 학습자 ID |
| `class_id` | BIGINT | NOT NULL | 수업 ID |
| `result` | TEXT | - | 분석 결과 (JSON) |
| `created_at` | DATETIME | - | 생성일시 |

### result JSON 구조 (LectureAnalysisV1Dto)

```json
{
  "wordPerMinute": 120.5,
  "meanLengthOfRun": 8.3,
  "numberOfTurns": 45,
  "sentenceComplexity": 0.72,
  "tokenDiversity": 0.65,
  "grammarResult": "[{\"grammarId\":\"G001\",\"cefr\":\"B1\",...}]"
}
```

---

## 2. Feedback (le_diagnosis_feedback)

개별 피드백 정보를 저장하는 엔티티입니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | VARCHAR(32) | PK, NOT NULL | 피드백 ID |
| `diagnosis_id` | VARCHAR(32) | NOT NULL, FK | 진단 ID |
| `user_id` | INT | NOT NULL | 학습자 ID |
| `class_id` | BIGINT | NOT NULL | 수업 ID |
| `source` | TEXT | - | 피드백 내용 (JSON) |
| `utc_created_at` | DATETIME | NOT NULL | 생성일시 |

### source JSON 구조

**문장 피드백 (AiFeedbackSentence)**
```json
{
  "aiSentence": "The weather is nice today.",
  "aiHighlight": "nice",
  "aiHighlightTranslation": "좋은",
  "aiExplanation": "'good'보다 'nice'가 날씨를 표현할 때 더 자연스럽습니다.",
  "studentSentence": "The weather is good today.",
  "studentHighlight": "good"
}
```

**어휘 피드백 (AiFeedbackVocab)**
```json
{
  "vocab": "magnificent",
  "vocabTranslation": "웅장한",
  "example": "The view from the mountain was magnificent.",
  "exampleTranslation": "산에서 본 경치는 웅장했다."
}
```

---

## 3. Question (le_diagnosis_question)

생성된 문제를 저장하는 엔티티입니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | VARCHAR(32) | PK, NOT NULL | 문제 ID |
| `feedback_id` | VARCHAR(32) | NOT NULL, FK | 피드백 ID |
| `diagnosis_id` | VARCHAR(32) | NOT NULL, FK | 진단 ID |
| `user_id` | INT | NOT NULL | 학습자 ID |
| `class_id` | BIGINT | NOT NULL | 수업 ID |
| `lang_type` | VARCHAR(10) | NOT NULL | 언어 타입 |
| `source` | TEXT | NOT NULL | 문제 내용 (JSON) |
| `question_type` | ENUM | NOT NULL | 문제 유형 |
| `content_level` | INT | NOT NULL | 콘텐츠 레벨 |
| `utc_created_at` | DATETIME | NOT NULL | 생성일시 |

### QuestionType Enum

```java
public enum QuestionType {
    BLANK_FILLING,        // 빈칸 채우기
    MULTI_CHOICE_WORD,    // 단어 객관식
    MULTI_CHOICE_SENTENCE,// 문장 객관식
    SENTENCE_MAKING,      // 문장 만들기
    NONE                  // 미분류
}
```

### source JSON 구조 (문제 유형별)

**MULTI_CHOICE_WORD (단어 객관식)**
```json
{
  "question": "다음 단어의 뜻은?",
  "answer": 2,
  "aiExplanation": "magnificent는 '웅장한'이라는 뜻입니다.",
  "body": {
    "vocab": "magnificent",
    "options": ["작은", "큰", "웅장한", "빠른"],
    "optionsForeign": ["small", "big", "magnificent", "fast"]
  },
  "hint": {
    "sentence": "The view was magnificent.",
    "highlight": "magnificent",
    "sentenceTranslation": "경치가 웅장했다."
  }
}
```

**MULTI_CHOICE_SENTENCE (문장 객관식)**
```json
{
  "question": "빈칸에 들어갈 알맞은 표현은?",
  "answer": 1,
  "body": {
    "sentence": "The weather is ___ today.",
    "options": ["good", "nice", "well", "fine"],
    "optionsForeign": ["good", "nice", "well", "fine"]
  },
  "hint": [
    {
      "vocab": "nice",
      "vocabTranslation": "좋은"
    }
  ]
}
```

**BLANK_FILLING (빈칸 채우기)**
```json
{
  "question": "빈칸을 채워 문장을 완성하세요.",
  "answer": ["magnificent"],
  "body": ["The", "view", "was", "___", "."],
  "feedbackVocabs": ["magnificent", "wonderful"],
  "aiExplanation": "magnificent는 매우 인상적인 것을 표현할 때 사용합니다.",
  "aiTranslation": "그 경치는 웅장했다."
}
```

**SENTENCE_MAKING (문장 만들기)**
```json
{
  "question": "주어진 단어를 사용하여 문장을 만드세요.",
  "targetWord": "magnificent",
  "hint": "웅장한, 장엄한"
}
```

---

## 4. DiagnosisQuestion (le_diagnosis_question) - 대체 매핑

동일한 테이블에 대한 다른 엔티티 매핑입니다. Builder 패턴을 지원합니다.

### 차이점
| 항목 | Question | DiagnosisQuestion |
|------|----------|-------------------|
| ID 생성 | 생성자에서 UUID 생성 | @PrePersist에서 생성 |
| 시간 처리 | 외부 설정 | @PrePersist에서 자동 설정 |
| Builder | 미지원 | @Builder 지원 |

---

## 5. QuestionSubmit (le_diagnosis_question_submit)

사용자가 제출한 답안을 저장합니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | VARCHAR(32) | PK, NOT NULL | 제출 ID |
| `question_id` | VARCHAR(32) | NOT NULL, FK | 문제 ID |
| `user_id` | INT | NOT NULL | 학습자 ID |
| `class_id` | BIGINT | NOT NULL | 수업 ID |
| `question` | TEXT | NOT NULL | 문제 원문 |
| `question_type` | VARCHAR(30) | NOT NULL | 문제 유형 |
| `answer` | TEXT | - | 사용자 답안 (JSON) |
| `utc_created_at` | DATETIME | NOT NULL | 제출일시 |

### answer JSON 구조 (AnswerCheckDto)

```json
{
  "isCorrect": true,
  "userAnswerSplit": ["magnificent"],
  "userAnswerHighlightIndexes": [],
  "masterAnswerSplit": ["magnificent"],
  "masterAnswerHighlightIndexes": [0],
  "explanation": "magnificent의 뜻은 '웅장한'입니다",
  "questionType": "MULTI_CHOICE_WORD"
}
```

---

## 6. Prompt (le_diagnosis_prompt)

AI 프롬프트 템플릿을 저장합니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | INT | PK, AUTO_INCREMENT | 프롬프트 ID |
| `lang_type` | VARCHAR(10) | - | 언어 타입 |
| `content_level` | INT | - | 콘텐츠 레벨 |
| `system_prompt` | TEXT | NOT NULL | 시스템 프롬프트 |
| `user_prompt` | TEXT | NOT NULL | 사용자 프롬프트 템플릿 |
| `response_schema` | TEXT | NOT NULL | 응답 스키마 (JSON) |
| `type` | ENUM | NOT NULL | 프롬프트 유형 |
| `title` | VARCHAR(40) | - | 프롬프트 제목 |
| `model_id` | VARCHAR(45) | - | 사용 모델 ID |
| `utc_created_at` | DATETIME | - | 생성일시 |
| `version` | INT | - | 버전 |

### PromptType Enum

```java
public enum PromptType {
    FEEDBACK,  // 피드백 생성
    QUESTION,  // 문제 생성
    ANSWER,    // 답안 채점
    NONE       // 미분류
}
```

### 주요 프롬프트 타이틀 예시
- `FEEDBACK_INTERMEDIATE`: 중급 문장 피드백
- `FEEDBACK_BEGINNER`: 초급 어휘 피드백
- `QUESTION_CHOICE_WORD`: 단어 객관식 문제
- `QUESTION_CHOICE_SENTENCE`: 문장 객관식 문제
- `TRANSFORM_KANJI_TO_HIRAGANA`: 한자 -> 히라가나 변환
- `TRANSFORM_HIRAGANA_TO_KOREAN`: 히라가나 -> 한국어 발음 변환

---

## 7. AnalysisStandard (le_diagnosis_analysis_standard)

분석 지표의 정규화 기준을 저장합니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | INT | PK, AUTO_INCREMENT | 기준 ID |
| `type` | ENUM | NOT NULL | 기준 유형 |
| `lesson_time` | INT | NOT NULL | 수업 시간 (분) |
| `lang_type` | VARCHAR | NOT NULL | 언어 타입 |
| `min` | FLOAT | NOT NULL | 최소값 |
| `max` | FLOAT | NOT NULL | 최대값 |
| `version` | INT | NOT NULL | 버전 |
| `created_at` | TIMESTAMP | NOT NULL | 생성일시 |
| `updated_at` | TIMESTAMP | NOT NULL | 수정일시 |

### Type Enum

```java
public enum Type {
    NONE,               // 미분류
    WORD_MINUTE,        // 분당 단어 수
    MIN_LENGTH_RUN,     // 평균 발화 길이
    NUMBER_TURN,        // 발화 횟수
    SENTENCE_COMPLEXITY,// 문장 복잡도
    TOKEN_DIVERSITY,    // 어휘 다양성
    GRAMMAR             // 문법 점수
}
```

---

## 8. DiagnosisFeedback (le_diagnosis_feedback) - 복합키 엔티티

진단-피드백 매핑 관계 (필요시 사용).

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `diagnosis_id` | VARCHAR(32) | PK (복합) | 진단 ID |
| `feedback_id` | VARCHAR(32) | PK (복합) | 피드백 ID |

---

## 9. 엔티티 관계도

```
+-------------------+
|    Diagnosis      |
+-------------------+
| id (PK)           |
| trace_id          |
| user_id (FK)      |------> User
| class_id (FK)     |------> Lecture
| result (JSON)     |
+-------------------+
         |
         | 1:N
         v
+-------------------+
|    Feedback       |
+-------------------+
| id (PK)           |
| diagnosis_id (FK) |
| user_id           |
| class_id          |
| source (JSON)     |
+-------------------+
         |
         | 1:N
         v
+-------------------+       +-------------------+
|    Question       |       |  QuestionSubmit   |
+-------------------+       +-------------------+
| id (PK)           |<------| question_id (FK)  |
| feedback_id (FK)  |       | user_id           |
| diagnosis_id (FK) |       | class_id          |
| question_type     |       | answer (JSON)     |
| source (JSON)     |       +-------------------+
+-------------------+

+-------------------+       +-------------------+
|     Prompt        |       | AnalysisStandard  |
+-------------------+       +-------------------+
| id (PK)           |       | id (PK)           |
| lang_type         |       | type              |
| content_level     |       | lesson_time       |
| system_prompt     |       | lang_type         |
| response_schema   |       | min               |
| type              |       | max               |
| title             |       | version           |
+-------------------+       +-------------------+
```

---

## 10. 인덱스 권장사항

### Diagnosis 테이블
```sql
CREATE INDEX idx_diagnosis_class_id ON le_diagnosis(class_id);
CREATE INDEX idx_diagnosis_user_id ON le_diagnosis(user_id);
CREATE INDEX idx_diagnosis_created ON le_diagnosis(created_at DESC);
```

### Feedback 테이블
```sql
CREATE INDEX idx_feedback_diagnosis_id ON le_diagnosis_feedback(diagnosis_id);
CREATE INDEX idx_feedback_class_id ON le_diagnosis_feedback(class_id);
CREATE INDEX idx_feedback_created ON le_diagnosis_feedback(utc_created_at DESC);
```

### Question 테이블
```sql
CREATE INDEX idx_question_feedback_id ON le_diagnosis_question(feedback_id);
CREATE INDEX idx_question_diagnosis_id ON le_diagnosis_question(diagnosis_id);
CREATE INDEX idx_question_type ON le_diagnosis_question(question_type);
```

### Prompt 테이블
```sql
CREATE INDEX idx_prompt_lang_title ON le_diagnosis_prompt(lang_type, title);
CREATE INDEX idx_prompt_version ON le_diagnosis_prompt(version);
```

### AnalysisStandard 테이블
```sql
CREATE INDEX idx_standard_lookup ON le_diagnosis_analysis_standard(version, lesson_time, lang_type);
```

---

## 11. 파일 위치 인덱스

| 파일 | 경로 |
|------|------|
| Diagnosis Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/Diagnosis.java` |
| Feedback Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/Feedback.java` |
| Question Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/Question.java` |
| DiagnosisQuestion Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/DiagnosisQuestion.java` |
| QuestionSubmit Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/QuestionSubmit.java` |
| Prompt Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/Prompt.java` |
| AnalysisStandard Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/AnalysisStandard.java` |
| DiagnosisFeedback Entity | `src/main/java/com/speaking/podo/applications/diagnosis/domain/DiagnosisFeedback.java` |
| DiagnosisRepository | `src/main/java/com/speaking/podo/applications/diagnosis/repository/DiagnosisRepository.java` |
| FeedbackRepository | `src/main/java/com/speaking/podo/applications/diagnosis/repository/FeedbackRepository.java` |
| QuestionRepository | `src/main/java/com/speaking/podo/applications/diagnosis/repository/QuestionRepository.java` |
| PromptRepository | `src/main/java/com/speaking/podo/applications/diagnosis/repository/PromptRepository.java` |
| AnalysisStandardRepository | `src/main/java/com/speaking/podo/applications/diagnosis/repository/AnalysisStandardRepository.java` |
