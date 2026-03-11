---
domain: diagnosis
document_type: policies
version: 1.0.0
last_updated: 2026-01-26
---

# 진단 정책 문서

## 1. 문제 유형 (QuestionType)

| 유형 | 설명 | 분류 |
|------|------|------|
| `BLANK_FILLING` | 빈칸 채우기 | 주관식 |
| `MULTI_CHOICE_WORD` | 단어 객관식 (어휘 뜻 맞추기) | 객관식 |
| `MULTI_CHOICE_SENTENCE` | 문장 객관식 (문맥에 맞는 표현 선택) | 객관식 |
| `SENTENCE_MAKING` | 문장 만들기 | 주관식 |
| `NONE` | 미분류 | - |

### 문제 출제 비율
영어(EN)의 경우 객관식:주관식 = 1:1 비율로 출제됩니다.
- 총 10문제 요청 시: 객관식 5문제 + 주관식 5문제

### 언어별 차이
- 영어(EN): 모든 문제 유형 지원
- 일본어(JP), 중국어(CN): 객관식/주관식 비율 구분 없이 순차 출제

---

## 2. 프롬프트 유형 (PromptType)

AI 프롬프트는 목적에 따라 분류됩니다.

| 유형 | 설명 |
|------|------|
| `FEEDBACK` | 피드백 생성용 프롬프트 |
| `QUESTION` | 문제 생성용 프롬프트 |
| `ANSWER` | 답안 채점용 프롬프트 |
| `NONE` | 미분류 |

### 프롬프트 버전 관리
- 동일한 `langType` + `title` 조합에서 `utcCreatedAt`이 가장 최신인 프롬프트 사용
- `version` 필드로 버전 관리

---

## 3. 분석 지표 (Analysis Metrics)

### 3.1 유창성 (Fluency)
두 가지 지표의 평균으로 계산:

| 지표 | 설명 | 산출 방식 |
|------|------|-----------|
| WPM (Word Per Minute) | 분당 단어 수 | 총 단어 수 / (총 발화 시간 / 60초) |
| MLR (Mean Length of Run) | 평균 발화 길이 | 한 발화당 평균 단어 수 |

### 3.2 어휘력 (Vocabulary)
| 지표 | 설명 |
|------|------|
| Token Diversity | 사용된 고유 단어 / 총 단어 수 |

### 3.3 문장 복잡도 (Complexity)
| 지표 | 설명 |
|------|------|
| Sentence Complexity | 문장의 복잡도 점수 |

### 3.4 문법 (Grammar) - Deprecated
문법 점수는 현재 복잡도 점수로 대체됨.
CEFR 레벨별 가중치:
- A1: 1점
- A2: 3점
- B1: 9점
- B2: 27점
- C1: 81점
- C2: 100점

---

## 4. 분석 기준 (AnalysisStandard)

수업 시간과 언어에 따라 정규화 기준이 다릅니다.

### 기준 유형
| 유형 | 설명 |
|------|------|
| `WORD_MINUTE` | 분당 단어 수 기준 |
| `MIN_LENGTH_RUN` | 평균 발화 길이 기준 |
| `NUMBER_TURN` | 발화 횟수 기준 |
| `SENTENCE_COMPLEXITY` | 문장 복잡도 기준 |
| `TOKEN_DIVERSITY` | 어휘 다양성 기준 |
| `GRAMMAR` | 문법 점수 기준 |

### 정규화 수식
```
normalized_score = clamp((value - min) / (max - min), 0, 1)
```
- `min`: 해당 지표의 최소 기준값
- `max`: 해당 지표의 최대 기준값
- 결과: 0~1 사이 값 (0~100점으로 변환)

---

## 5. 등급 산출 정책

동일 조건(수업시간, 언어) 학습자 대비 상대 순위로 등급 결정:

| 등급 | 상위 비율 |
|------|-----------|
| A | 상위 5% |
| B | 상위 25% |
| C | 상위 40% |
| D | 상위 60% |
| E | 상위 80% |
| F | 나머지 (하위 20%) |

---

## 6. 피드백 유형

### 6.1 문장 피드백 (FEEDBACK_INTERMEDIATE, FEEDBACK_AI_INTERMEDIATE)
중급 이상 학습자용 문장 교정 피드백:
- `aiSentence`: AI 교정 문장
- `studentSentence`: 학생 원문
- `aiHighlight`: 교정 포인트
- `aiExplanation`: 교정 설명

### 6.2 어휘 피드백 (FEEDBACK_BEGINNER)
초급 학습자용 어휘 피드백:
- `vocab`: 학습 어휘
- `vocabTranslation`: 어휘 번역
- `example`: 예문
- `exampleTranslation`: 예문 번역

### 6.3 일본어 발음 변환
일본어의 경우 추가 필드 제공:
- `*DictionNativeLang`: 히라가나 표기
- `*DictionSpeakerLang`: 한국어 발음

---

## 7. 답안 채점 정책

### 7.1 객관식 채점
정답 인덱스 비교로 즉시 채점:
```java
boolean isCorrect = userAnswer.equals(masterAnswer);
```

### 7.2 주관식 채점
AI 기반 채점 (별도 프롬프트 사용)

### 7.3 답안 저장
모든 제출 답안은 `QuestionSubmit` 테이블에 기록:
- 문제 ID, 사용자 ID, 수업 ID
- 문제 원문, 문제 유형
- 사용자 답안

---

## 8. 진단 파이프라인 처리

### 8.1 트리거
STT(Speech-to-Text) 완료 이벤트 수신 시 진단 파이프라인 시작

### 8.2 처리 단계

| 단계 | 클래스 | 역할 |
|------|--------|------|
| 1 | `LoadSrtStep` | SRT 파일 로드 |
| 2 | `ChunkStep` | 청크 분리 |
| 3 | `CorrectedStep` | 문장 교정 |
| 4 | `FeedbackStep` | 피드백 생성 |
| 5 | `QuestionStep` | 문제 생성 |
| 6 | `AnalyzeMetricsStep` | 지표 분석 |
| 7 | `NotificationStep` | 알림 발송 |

### 8.3 비동기 처리
진단 결과 저장은 메시지 큐를 통해 비동기 처리:
- 큐 이름: `diagnosis`
- 이벤트 타입: `SAVE_DIAGNOSIS_ALL`, `SAVE_QUESTION_SUBMIT`

---

## 9. 피드백 생성 정책 (FeedbackStep)

### 9.1 학생 발화 필터링

**파일**: `src/main/java/com/speaking/podo/applications/diagnosis/pipeline/FeedbackStep.java`

피드백 생성 시 학생의 발화만 필터링하여 AI에게 전달:
- `studentUserId`를 기반으로 학생 발화 추출
- 전체 대화(`fullTranscript`)와 학생 발화(`studentUtterances`)를 구분하여 프롬프트에 전달

### 9.2 프롬프트 플레이스홀더

프롬프트에서 사용 가능한 플레이스홀더:

| 플레이스홀더 | 설명 | 예시 |
|-------------|------|------|
| `{{student_id}}` | 학생 사용자 ID | `12345` |
| `{{student_utterances}}` | 학생 발화만 추출 | `Student: Hello teacher...` |
| `{{transcript}}` | 전체 대화 (학생+튜터) | `Teacher: Hi!\nStudent: Hello...` |
| `{{chunk_text}}` | 전체 대화 (transcript와 동일) | - |

**학생 발화 판별 로직**:
1. SRT `speaker` 필드가 `studentUserId`와 일치
2. 텍스트가 `{studentUserId}:` 로 시작
3. 텍스트에 `[{studentUserId}]` 또는 `({studentUserId})` 포함

### 9.3 재시도 정책

피드백 생성 실패 시 최대 3회 재시도 (`MAX_RETRY = 3`)

---

## 10. 콘텐츠 레벨

문제 생성 시 콘텐츠 레벨에 따라 다른 프롬프트 사용:

| 레벨 | 대상 |
|------|------|
| 1 | 초급 |
| 2 | 중급 |
| 3 | 고급 |

---

## 11. API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/v1/diagnosis` | 진단 요청 | 내부 |
| GET | `/api/v1/diagnosis/getDiagnosisReport` | 진단 리포트 조회 | 사용자 |
| GET | `/api/v1/diagnosis/getQuestions` | 문제 목록 조회 | 사용자 |
| POST | `/api/v1/diagnosis/checkAnswer` | 답안 채점 | 사용자 |
| POST | `/api/v1/diagnosis/handleSttFinished` | STT 완료 웹훅 | 내부 |
| POST | `/api/v1/diagnosis/generateDiagnosisReportAdmin` | 진단 생성 (관리자) | 관리자 |
| POST | `/api/v1/diagnosis/calGrammarScoreByAdmin` | 문법 점수 계산 | 관리자 |

---

## 12. 피드백 개수 제한

한 수업당 표시되는 피드백 개수: **5개**
- 최신 생성순으로 정렬하여 상위 5개만 노출

---

## 13. 객관식 정답 랜덤화

객관식 문제의 정답 위치를 랜덤하게 배치:
```java
// 정답 번호를 랜덤하게 하기 위해 shuffle
shuffleInSync(options, optionsForeign);
newAnswerIndex = options.indexOf(originalAnswer);
```

---

## 14. 캐싱 정책

성능 최적화를 위한 캐싱:

| 캐시 | 키 | 설명 |
|------|-----|------|
| `GET_QUESTION` | questionId | 문제 조회 캐시 |
| `GET_FEEDBACK` | feedbackId | 피드백 조회 캐시 |

캐시 관리자: `hierarchicalCacheManager`
