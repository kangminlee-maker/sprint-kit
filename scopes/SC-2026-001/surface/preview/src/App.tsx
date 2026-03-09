import { useState, useEffect } from "react";
import type { ScenarioKey, ScreenId, TrialLesson } from "./types";
import { scenarioPresets } from "./mock-data";

import TrialHome from "./components/TrialHome";
import TrialLessonDetail from "./components/TrialLessonDetail";
import PostTrialConversion from "./components/PostTrialConversion";
import NoShowSheet from "./components/NoShowSheet";
import TutorNoShowSheet from "./components/TutorNoShowSheet";
import ScenarioControl from "./components/ScenarioControl";

export default function App() {
  const [scenario, setScenario] = useState<ScenarioKey>("normal");
  const [screen, setScreen] = useState<ScreenId>("home");
  const [trials, setTrials] = useState<TrialLesson[]>(scenarioPresets.normal);

  // 노쇼 시트 표시 여부
  const [showStudentNoShow, setShowStudentNoShow] = useState(false);
  const [showTutorNoShow, setShowTutorNoShow] = useState(false);

  // 시나리오 변경 시 상태 갱신
  useEffect(() => {
    setTrials(scenarioPresets[scenario]);
    setScreen("home");

    // 노쇼 시나리오는 자동으로 시트 표시
    if (scenario === "studentNoShow") {
      setShowStudentNoShow(true);
      setShowTutorNoShow(false);
    } else if (scenario === "tutorNoShow") {
      setShowTutorNoShow(true);
      setShowStudentNoShow(false);
    } else {
      setShowStudentNoShow(false);
      setShowTutorNoShow(false);
    }

    // 전체 소진 시나리오는 전환 화면으로
    if (scenario === "allDone") {
      setScreen("conversion");
    }
  }, [scenario]);

  // 잔여 횟수 계산
  const remaining = trials.filter(
    (t) => t.status === "available" || t.status === "reserved" || t.status === "locked"
  ).length;

  function handleNavigate(target: ScreenId) {
    setScreen(target);
  }

  function handleBack() {
    if (screen === "conversion") {
      setScreen("detail");
    } else {
      setScreen("home");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 모바일 뷰포트 컨테이너 */}
      <div className="relative mx-auto max-w-[480px] min-h-screen bg-white shadow-[0_0_40px_rgba(0,0,0,0.08)]">
        {/* 화면 라우팅 */}
        {screen === "home" && (
          <TrialHome trials={trials} onNavigate={handleNavigate} />
        )}
        {screen === "detail" && (
          <TrialLessonDetail
            trials={trials}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}
        {screen === "conversion" && (
          <PostTrialConversion
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {/* 바텀시트 오버레이 */}
        <NoShowSheet
          open={showStudentNoShow}
          onClose={() => setShowStudentNoShow(false)}
          remaining={remaining}
        />
        <TutorNoShowSheet
          open={showTutorNoShow}
          onClose={() => setShowTutorNoShow(false)}
          remaining={remaining}
        />
      </div>

      {/* 시나리오 전환 컨트롤 (PO 리뷰용) */}
      <ScenarioControl current={scenario} onChange={setScenario} />
    </div>
  );
}
