import React, { useState } from 'react';
import { Home } from './components/Home';
import { LearningCycle } from './components/LearningCycle';
import { Layout } from './components/Layout';
import { AppState, LearningTopic } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [currentTopic, setCurrentTopic] = useState<LearningTopic | null>(null);

  const handleInitiateCycle = (topic: string) => {
    setCurrentTopic({
      // Fix: Property name must match LearningTopic interface 'query'
      query: topic,
      timestamp: Date.now()
    });
    // Fix: Use correct enum member LEARNING_ENGINE defined in types.ts
    setAppState(AppState.LEARNING_ENGINE);
  };

  const handleReturnHome = () => {
    setAppState(AppState.HOME);
    setCurrentTopic(null);
  };

  return (
    <Layout mode={appState === AppState.HOME ? 'dark' : 'light'}>
      {appState === AppState.HOME && (
        <Home onInitiate={handleInitiateCycle} />
      )}
      {/* Fix: Use correct enum member LEARNING_ENGINE defined in types.ts */}
      {appState === AppState.LEARNING_ENGINE && currentTopic && (
        <LearningCycle 
          topic={currentTopic} 
          onExit={handleReturnHome}
        />
      )}
    </Layout>
  );
}