import { useState } from 'react'
import { SCENARIOS } from './types'
import PageLayout from './components/PageLayout'
import TopNav from './components/TopNav'
import TrialProgressBar from './components/TrialProgressBar'
import GreetingCard from './components/GreetingCard'
import ContentSection from './components/ContentSection'
import StickyBottom from './components/StickyBottom'
import GNB from './components/GNB'
import DebugPanel from './components/DebugPanel'

function App() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const scenario = SCENARIOS[scenarioIndex]

  const cycleScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length)
  }

  const prevScenario = () => {
    setScenarioIndex((prev) => (prev - 1 + SCENARIOS.length) % SCENARIOS.length)
  }

  return (
    <PageLayout>
      <DebugPanel
        label={scenario.label}
        onNext={cycleScenario}
        onPrev={prevScenario}
        index={scenarioIndex}
        total={SCENARIOS.length}
      />

      <TopNav scenario={scenario} />

      <div className="px-5 pt-4 pb-[140px]">
        <TrialProgressBar step={scenario.progressStep} status={scenario.id} />

        <div className="mt-6">
          <GreetingCard greeting={scenario.greeting} subtitle={scenario.subtitle} />
        </div>

        <div className="mt-5">
          <ContentSection bodyContent={scenario.bodyContent} />
        </div>
      </div>

      <StickyBottom
        ctaText={scenario.ctaText}
        pulsing={scenario.id === 'LESSON_READY'}
      />

      <GNB />
    </PageLayout>
  )
}

export default App
