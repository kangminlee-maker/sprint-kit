import { useState } from "react";
import { WelcomeBackPopup } from "./components/WelcomeBackPopup";
import "./index.css";

function App() {
  const [showPopup, setShowPopup] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const handleCTA = () => {
    window.open("https://podospeaking.com/welcomeback300", "_blank");
  };

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
  };

  return (
    <div className="min-h-dvh bg-podo-white">
      {/* Simulated home screen behind popup */}
      <div className="px-5 pt-16 pb-20">
        <div className="text-sm text-gray-400 tracking-[-0.28px] leading-5 mb-2">
          만료된 수강권
        </div>
        <div className="text-lg font-bold text-gray-900 tracking-[-0.36px] leading-[26px] mb-6">
          수강권이 만료되었습니다
        </div>
        <div className="rounded-xl bg-gray-100 p-5 text-sm text-gray-500 tracking-[-0.28px] leading-5">
          마지막 수강일로부터 4일이 경과했습니다.
        </div>

        {dismissed && (
          <button
            onClick={() => {
              setShowPopup(true);
              setDismissed(false);
            }}
            className="mt-6 w-full py-3 rounded-xl bg-gray-100 text-sm font-bold text-gray-900 tracking-[-0.28px]"
          >
            팝업 다시 보기 (테스트용)
          </button>
        )}
      </div>

      {showPopup && (
        <WelcomeBackPopup onCTA={handleCTA} onDismiss={handleDismiss} />
      )}
    </div>
  );
}

export default App;
