interface Props {
  /** 1 | 2 | 3 */
  activeStep: number;
}

/**
 * StepTabs v2 — 3 steps: 신청하기, 체험하기, 리포트
 * Number circles + progress bar below
 */
export default function StepTabs({ activeStep }: Props) {
  const steps = ["신청하기", "체험하기", "리포트"];
  const progressWidth = activeStep === 1 ? "33%" : activeStep === 2 ? "66%" : "100%";

  return (
    <div style={{ padding: "16px 20px 12px" }}>
      {/* Step indicators */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum <= activeStep;

          return (
            <div key={stepNum} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              flex: 1,
            }}>
              {/* Number circle */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: isActive ? "var(--gray-900)" : "var(--gray-300)",
                color: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}>
                {stepNum}
              </div>
              {/* Label */}
              <span style={{
                fontSize: 16,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--gray-900)" : "var(--gray-400)",
                letterSpacing: -0.32,
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: "var(--gray-200)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          width: progressWidth,
          height: "100%",
          background: "var(--gray-900)",
          borderRadius: 2,
          transition: "width 300ms",
        }} />
      </div>
    </div>
  );
}
