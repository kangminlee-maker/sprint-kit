import StickyBottom from "../StickyBottom";

/** 상태 4: 체험 완료 (미결제) — 결제 전환 유도 */
export default function TrialCompleted() {
  return (
    <>
      {/* Greeting — white bg, 완료 축하 */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#127881;</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--gray-900)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
          marginBottom: 8,
        }}>
          체험을 완료했어요!
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
        }}>
          PODO와 함께 영어 실력을 키워보세요.
        </p>
      </div>

      {/* 첫 수강 혜택 카드 — green-500 border */}
      <div style={{
        margin: "16px 20px 0",
        padding: "24px 20px",
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        border: "2px solid var(--green-500)",
      }}>
        <div style={{
          display: "inline-block",
          background: "var(--green-500)",
          color: "var(--white)",
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 4,
          marginBottom: 12,
          letterSpacing: -0.24,
        }}>
          첫 수강 혜택
        </div>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 8,
          letterSpacing: -0.4,
        }}>
          지금 시작하면 30% 할인
        </h3>
        <p style={{
          fontSize: 14,
          color: "var(--gray-700)",
          lineHeight: 1.6,
          marginBottom: 16,
          letterSpacing: -0.28,
        }}>
          체험을 완료한 지금, 정규 수강권을 특별 가격에 시작할 수 있어요.
        </p>

        <div style={{
          background: "var(--gray-50)",
          borderRadius: 8,
          padding: "12px 16px",
        }}>
          {[
            "원어민 튜터 1:1 레슨",
            "AI 학습 콘텐츠 무제한",
            "맞춤형 커리큘럼",
          ].map((label) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 14, color: "var(--gray-900)", letterSpacing: -0.28 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />

      <StickyBottom
        label="수강권 구매하기"
        onClick={() => alert("결제 페이지 이동 (미구현)")}
        subText="첫 달 30% 할인 혜택이 적용돼요"
      />
    </>
  );
}
