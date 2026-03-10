interface FeatureItem {
  title: string;
  description: string;
  iconBg: string;
  iconContent: React.ReactNode;
}

interface Props {
  items?: FeatureItem[];
}

const defaultItems: FeatureItem[] = [
  {
    title: "원어민 1:1 레슨",
    description: "검증된 원어민 튜터와 화상 영어",
    iconBg: "#9B59B6",
    iconContent: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    title: "AI 맞춤 학습",
    description: "레슨 전 AI가 예습 콘텐츠를 제공",
    iconBg: "#6184FF",
    iconContent: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: "레슨 리포트",
    description: "레슨 후 상세 피드백과 교정 리포트",
    iconBg: "#E91E63",
    iconContent: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

/**
 * FeatureListCard v2 — icon circle + title/desc + chevron
 * mx-5 mb-3 rounded-xl border border-gray-200 bg-white px-4 py-5
 */
export default function FeatureListCard({ items = defaultItems }: Props) {
  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            border: "1px solid var(--gray-200)",
            background: "var(--white)",
            padding: "20px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          {/* Icon circle */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: item.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {item.iconContent}
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--gray-900)",
              letterSpacing: -0.32,
              marginBottom: 4,
            }}>
              {item.title}
            </p>
            <p style={{
              fontSize: 14,
              color: "var(--gray-500)",
              letterSpacing: -0.28,
            }}>
              {item.description}
            </p>
          </div>

          {/* Chevron */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </div>
  );
}
