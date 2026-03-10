/**
 * VideoCard v2 — Purple gradient, 16/10 aspect ratio
 * Play button with backdrop-blur, caption at bottom
 */
export default function VideoCard() {
  return (
    <div
      style={{
        margin: "0 20px",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        aspectRatio: "16 / 10",
        background: "linear-gradient(135deg, #9B59B6, #8E44AD)",
        cursor: "pointer",
      }}
      onClick={() => alert("영상 재생 (미구현)")}
    >
      {/* Play button */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>

      {/* Caption */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px 20px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
      }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--white)",
          letterSpacing: -0.28,
        }}>
          무료체험은 어떻게 진행되나요?
        </p>
      </div>
    </div>
  );
}
