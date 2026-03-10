import StickyBottom from "../StickyBottom";

/** 상태 7: 전체 소진 — 유료 체험 + 정규 수강권 안내 */
export default function TrialExhausted() {
  return (
    <>
      {/* Greeting — white bg */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--gray-900)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
          marginBottom: 8,
        }}>
          무료 체험을 모두 사용했어요
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
        }}>
          더 많은 레슨을 원하시면 아래 옵션을 선택해 주세요.
        </p>
      </div>

      {/* 유료 체험 카드 — blue variant */}
      <div style={{
        margin: "0 20px",
        padding: "24px 20px",
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--blue-200)",
      }}>
        <div style={{
          display: "inline-block",
          background: "var(--blue-500)",
          color: "var(--white)",
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 4,
          marginBottom: 12,
          letterSpacing: -0.24,
        }}>
          추가 체험
        </div>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 4,
          letterSpacing: -0.4,
        }}>
          유료 체험 3회
        </h3>
        <p style={{
          fontSize: 14,
          color: "var(--gray-700)",
          marginBottom: 16,
          letterSpacing: -0.28,
        }}>
          5,000원으로 3회 더 체험할 수 있어요
        </p>
        <button
          onClick={() => alert("유료 체험 결제 (미구현)")}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 5,
            background: "var(--white)",
            color: "var(--blue-500)",
            fontSize: 14,
            fontWeight: 600,
            border: "1.5px solid var(--blue-500)",
            cursor: "pointer",
            letterSpacing: -0.28,
          }}
        >
          유료 체험 시작하기
        </button>
      </div>

      {/* 정규 수강권 카드 — green border, 추천 */}
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
          추천
        </div>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 4,
          letterSpacing: -0.4,
        }}>
          정규 수강권
        </h3>
        <p style={{
          fontSize: 14,
          color: "var(--gray-700)",
          marginBottom: 4,
          letterSpacing: -0.28,
        }}>
          매일 원어민 튜터와 1:1 레슨
        </p>
        <p style={{
          fontSize: 14,
          color: "var(--green-500)",
          fontWeight: 600,
          letterSpacing: -0.28,
        }}>
          첫 달 30% 할인 혜택 적용 중
        </p>
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
