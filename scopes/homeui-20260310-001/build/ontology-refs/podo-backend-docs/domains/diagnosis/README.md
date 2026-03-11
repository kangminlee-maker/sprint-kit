---
domain: diagnosis
version: 1.0.0
last_updated: 2026-01-26
author: AI Documentation Generator
status: active
complexity: high
---

# 진단 도메인 개요

## 목적
진단 도메인은 학습자의 수업 음성을 분석하여 학습 피드백과 맞춤형 문제를 생성하는 AI 기반 진단 시스템입니다.

## 주요 기능

### 1. 수업 분석 (Diagnosis)
- STT(Speech-to-Text) 결과 분석
- 유창성(Fluency) 점수 산출
- 어휘력(Vocabulary) 점수 산출
- 문장 복잡도(Complexity) 점수 산출
- 문법 분석

### 2. 피드백 생성 (Feedback)
- AI 기반 문장 교정 피드백
- 어휘 학습 피드백
- 발음 변환 (일본어: 한자 -> 히라가나 -> 한국어 발음)

### 3. 문제 생성 (Question)
- 빈칸 채우기 (BLANK_FILLING)
- 단어 객관식 (MULTI_CHOICE_WORD)
- 문장 객관식 (MULTI_CHOICE_SENTENCE)
- 문장 만들기 (SENTENCE_MAKING)

### 4. 진단 리포트 (Report)
- 수업별 진단 리포트 조회
- 동일 조건 학습자 대비 점수 비교
- 등급 산출 (A~F)

## 아키텍처

```
DiagnosisController (API Layer)
       |
       v
DiagnosisGateway (Orchestration Layer)
       |
       v
DiagnosisService (Business Logic Layer)
       |
       +---> LemonBoardAdapter (AI/LLM 연동)
       |
       v
DiagnosisRepository / FeedbackRepository / QuestionRepository (Data Access Layer)
```

## 파이프라인 구조

진단 처리는 파이프라인 패턴으로 구성됩니다:

```
STT 완료 이벤트
       |
       v
LoadSrtStep (SRT 파일 로드)
       |
       v
ChunkStep (청크 분리)
       |
       v
CorrectedStep (문장 교정)
       |
       v
FeedbackStep (피드백 생성)
       |
       v
QuestionStep (문제 생성)
       |
       v
AnalyzeMetricsStep (지표 분석)
       |
       v
NotificationStep (알림 발송)
```

## 핵심 엔티티

| 엔티티 | 설명 |
|--------|------|
| `Diagnosis` | 수업 분석 결과 |
| `Feedback` | 개별 피드백 |
| `Question` | 생성된 문제 |
| `QuestionSubmit` | 문제 제출 답안 |
| `Prompt` | AI 프롬프트 템플릿 |
| `AnalysisStandard` | 분석 기준 테이블 |

## 연관 도메인

- **Lecture**: 수업 정보
- **User**: 학습자 정보
- **Notification**: 진단 완료 알림

## 파일 인덱스

| 파일 경로 | 역할 |
|-----------|------|
| `domain/Diagnosis.java` | 진단 결과 엔티티 |
| `domain/Feedback.java` | 피드백 엔티티 |
| `domain/Question.java` | 문제 엔티티 |
| `domain/QuestionSubmit.java` | 답안 제출 엔티티 |
| `domain/Prompt.java` | AI 프롬프트 엔티티 |
| `domain/AnalysisStandard.java` | 분석 기준 엔티티 |
| `delivery/DiagnosisController.java` | REST API 컨트롤러 |
| `gateway/DiagnosisGateway.java` | 비즈니스 로직 오케스트레이션 |
| `service/DiagnosisService.java` | 서비스 인터페이스 |
| `service/DiagnosisServiceImpl.java` | 서비스 구현체 |
| `pipeline/*.java` | 파이프라인 단계별 처리 클래스 |

## 관련 문서

- [정책 문서](./policies.md) - 진단/문제 생성 정책 상세
- [엔티티 문서](./entities.md) - 엔티티 스키마 및 관계
