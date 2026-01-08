import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, StopCircle, Brain, ShieldCheck, PenTool, ArrowLeft, ArrowRight, BookOpen, Feather, ScrollText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LearningTopic, LearningMode, EngineState, MasteryLevel, Question, ExplanationContent, PracticeItem, VerificationScenario } from '../types';
import * as Gemini from '../services/geminiService';

interface Props {
  topic: LearningTopic;
  onExit: () => void;
}

// --- Ancient Manuscript Card Component ---
const PalmLeafCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scaleY: 0.95, filter: 'blur(2px)' }}
    animate={{ opacity: 1, scaleY: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scaleY: 0.95, filter: 'blur(2px)' }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // Custom ease for unrolling feel
    className={`relative bg-[#E8DFCA] text-[#2C241B] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border-y border-[#C8BFA5] mx-auto w-full ${className}`}
  >
    {/* Texture: Subtle Horizontal Leaf Veins */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply" 
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(80, 50, 30, 0.08) 28px)`
      }} 
    />
    
    {/* Texture: Organic Noise */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-multiply"></div>

    {/* Binding Holes (Ancient Manuscript Style) - Left & Right */}
    <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1F1209] opacity-10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] z-20 border border-white/10"></div>
    <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1F1209] opacity-10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] z-20 border border-white/10"></div>

    {/* Content Container */}
    <div className="relative z-10 px-6 py-8 md:px-20 md:py-14 font-serif">
      {children}
    </div>
  </motion.div>
);

export const LearningCycle: React.FC<Props> = ({ topic, onExit }) => {
  // --- ENGINE STATE ---
  const [engineState, setEngineState] = useState<EngineState>({
    mode: LearningMode.DIAGNOSTIC,
    mastery: MasteryLevel.NOVICE,
    practiceAccuracy: 0,
    questionsAnswered: 0
  });

  // --- CONTENT STATE ---
  const [loading, setLoading] = useState(true);
  const [diagnosticData, setDiagnosticData] = useState<Question[]>([]);
  const [explanationData, setExplanationData] = useState<ExplanationContent | null>(null);
  const [practiceItem, setPracticeItem] = useState<PracticeItem | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationScenario | null>(null);
  
  // --- INTERACTION STATE ---
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<boolean[]>([]);
  
  // Indices
  const [diagScore, setDiagScore] = useState(0);
  const [diagIndex, setDiagIndex] = useState(0);
  const [explIndex, setExplIndex] = useState(0); 
  const [verifIndex, setVerifIndex] = useState(0);
  
  const [reflectionText, setReflectionText] = useState("");

  // --- EFFECT: MODE SWITCHER ---
  useEffect(() => {
    loadModeContent();
  }, [engineState.mode]);

  const loadModeContent = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedOption(null);

    try {
      switch (engineState.mode) {
        case LearningMode.DIAGNOSTIC:
          const diag = await Gemini.generateDiagnostic(topic.query);
          setDiagnosticData(diag);
          break;
        case LearningMode.EXPLANATION:
          const exp = await Gemini.generateExplanation(topic.query);
          setExplanationData(exp);
          setExplIndex(0); // Reset slide index
          break;
        case LearningMode.PRACTICE:
          await loadNextPracticeItem();
          break;
        case LearningMode.VERIFICATION:
          const ver = await Gemini.generateVerification(topic.query);
          setVerificationData(ver);
          setVerifIndex(0); // Reset verification index
          break;
        case LearningMode.REFLECTION:
          setLoading(false);
          break;
        case LearningMode.COMPLETE:
          setLoading(false);
          break;
      }
    } catch (e) {
      console.error("Content Load Failed", e);
    } finally {
      if (engineState.mode !== LearningMode.PRACTICE) {
        setLoading(false);
      }
    }
  };

  const loadNextPracticeItem = async () => {
    setLoading(true);
    setFeedback(null);
    setSelectedOption(null);
    const difficulty = engineState.questionsAnswered > 5 ? 'hard' : 'medium';
    const item = await Gemini.generatePracticeItem(topic.query, difficulty);
    setPracticeItem(item);
    setLoading(false);
  };

  // --- HANDLERS ---

  const handleDiagnosticAnswer = (index: number) => {
    setSelectedOption(index);
    const currentQ = diagnosticData[diagIndex];
    const isCorrect = index === currentQ.correctIndex;
    
    setFeedback({
      isCorrect,
      text: currentQ.explanation
    });
    
    if (isCorrect) setDiagScore(prev => prev + 1);
  };

  const nextDiagnostic = () => {
    if (diagIndex < diagnosticData.length - 1) {
      setDiagIndex(prev => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      setEngineState(prev => ({ ...prev, mode: LearningMode.EXPLANATION, diagnosticScore: diagScore }));
    }
  };

  const nextExplanationSlide = () => {
    if (explanationData && explIndex < explanationData.sections.length - 1) {
      setExplIndex(prev => prev + 1);
      window.scrollTo(0, 0); // Ensure top of card on new slide
    }
  };

  const prevExplanationSlide = () => {
    if (explIndex > 0) {
      setExplIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const finishExplanation = () => {
    setEngineState(prev => ({ ...prev, mode: LearningMode.PRACTICE, mastery: MasteryLevel.FOUNDATION }));
  };

  const handlePracticeAnswer = (index: number) => {
    if (!practiceItem) return;
    setSelectedOption(index);
    const isCorrect = index === practiceItem.question.correctIndex;
    const newHistory = [...practiceHistory, isCorrect];
    setPracticeHistory(newHistory);
    
    const correctCount = newHistory.filter(Boolean).length;
    const accuracy = Math.round((correctCount / newHistory.length) * 100);

    setEngineState(prev => ({
      ...prev,
      practiceAccuracy: accuracy,
      questionsAnswered: prev.questionsAnswered + 1
    }));

    setFeedback({
      isCorrect,
      text: practiceItem.question.explanation
    });
  };

  // Verification: Multi-Question Loop
  const handleVerificationAnswer = (index: number) => {
    if (!verificationData) return;
    const currentQ = verificationData.questions[verifIndex];
    setSelectedOption(index);
    const isCorrect = index === currentQ.correctIndex;
    
    setFeedback({
      isCorrect,
      text: currentQ.explanation
    });

    // Forced Mastery Rule: Fail = Restart Loop
    if (!isCorrect) {
        setTimeout(() => {
            alert("Application Error detected. Returning to Practice Cycle to reinforce fundamentals.");
            setEngineState(prev => ({ ...prev, mode: LearningMode.PRACTICE }));
        }, 3000);
    }
  };

  const nextVerificationQuestion = () => {
      if (!verificationData) return;
      if (verifIndex < verificationData.questions.length - 1) {
          setVerifIndex(prev => prev + 1);
          setSelectedOption(null);
          setFeedback(null);
      } else {
          setEngineState(prev => ({ ...prev, mode: LearningMode.REFLECTION, mastery: MasteryLevel.PROFICIENT }));
      }
  };

  const submitReflection = () => {
      setEngineState(prev => ({ ...prev, mode: LearningMode.COMPLETE, mastery: MasteryLevel.MASTER }));
  };

  const getProgressPercentage = () => {
    switch (engineState.mode) {
      case LearningMode.DIAGNOSTIC: return 10;
      case LearningMode.EXPLANATION: return 30;
      case LearningMode.PRACTICE: return 50;
      case LearningMode.VERIFICATION: return 75;
      case LearningMode.REFLECTION: return 90;
      case LearningMode.COMPLETE: return 100;
      default: return 0;
    }
  };

  // --- SUB-RENDERERS ---

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-24 space-y-6">
      <div className="relative">
          <Feather className="w-12 h-12 text-[#8B5A2B] animate-pulse" />
          <motion.div 
            className="absolute -bottom-2 -right-1 w-2 h-2 bg-[#2C1810] rounded-full"
            animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
      </div>
      <div className="font-display text-xs tracking-[0.2em] text-[#8B5A2B] uppercase">Scribing Knowledge...</div>
    </div>
  );

  const renderDiagnosticUI = () => {
    const question = diagnosticData[diagIndex];
    if (!question) return null; 
    return (
      <PalmLeafCard>
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#C8BFA5]/50">
          <h3 className="text-xl font-display font-bold text-[#2C1810]">
            Initial Assessment <span className="text-[#8B5A2B]">{diagIndex + 1}</span><span className="text-[#C8BFA5]">/</span><span className="text-[#2C1810]">{diagnosticData.length}</span>
          </h3>
          <div className="flex items-center gap-2 text-[#8B5A2B]">
             <Feather size={16} />
             <span className="text-xs font-display tracking-widest uppercase">Diagnostic</span>
          </div>
        </div>
        
        <p className="text-xl font-serif text-[#2C1810] mb-10 leading-relaxed max-w-2xl">
            {question.text}
        </p>

        <div className="space-y-4 max-w-2xl">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !feedback && handleDiagnosticAnswer(i)}
              disabled={!!feedback}
              className={`w-full text-left p-5 border-l-2 transition-all duration-300 font-serif text-base
                ${selectedOption === i 
                  ? feedback?.isCorrect 
                    ? 'bg-[#E0E8D0] border-green-700 text-green-900 shadow-sm' 
                    : 'bg-[#E8D0D0] border-red-700 text-red-900 shadow-sm'
                  : 'bg-white/40 border-[#C8BFA5] hover:border-[#8B5A2B] hover:bg-white/60 text-[#2C1810]'
                }
              `}
            >
              <span className="font-bold mr-4 font-display opacity-60">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
        </div>
        {feedback && (
          <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="mt-8 pt-6 border-t border-[#C8BFA5]/50">
            <p className="text-base font-serif italic text-[#5A4A42] mb-4">{feedback.text}</p>
            <button onClick={nextDiagnostic} className="px-8 py-3 bg-[#2C1810] text-[#E8DFCA] font-display text-xs uppercase tracking-[0.15em] hover:bg-[#8B5A2B] transition-colors shadow-lg">
              Proceed
            </button>
          </motion.div>
        )}
      </PalmLeafCard>
    );
  };

  const renderExplanationUI = () => {
    if (!explanationData) return null;
    const currentSection = explanationData.sections[explIndex];
    const isLastSlide = explIndex === explanationData.sections.length - 1;
    const isFirstSlide = explIndex === 0;

    return (
      <PalmLeafCard className="min-h-[600px] flex flex-col">
        {/* Manuscript Header */}
        <div className="flex items-center justify-between mb-8 border-b border-[#C8BFA5]/50 pb-6">
            <div className="text-sm font-display tracking-[0.2em] text-[#8B5A2B] uppercase flex items-center gap-3">
                <span className="text-2xl opacity-40 select-none">❧</span> 
                {currentSection.title}
            </div>
            <div className="text-xs font-serif italic text-[#2C1810]/60">
                Leaf {explIndex + 1} of {explanationData.sections.length}
            </div>
        </div>
        
        {/* Content Body */}
        <motion.div 
            key={explIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="prose prose-lg prose-headings:font-display prose-headings:text-[#2C1810] prose-p:font-serif prose-p:text-[#4A3B32] prose-strong:text-[#8B5A2B] max-w-none text-justify leading-relaxed flex-grow"
        >
           <ReactMarkdown>{currentSection.content}</ReactMarkdown>
        </motion.div>

        {/* Footer Controls */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-[#C8BFA5]/50">
            <button 
                onClick={prevExplanationSlide}
                disabled={isFirstSlide}
                className={`flex items-center gap-3 text-xs font-display uppercase tracking-[0.15em] transition-colors 
                    ${isFirstSlide ? 'opacity-30 cursor-not-allowed' : 'text-[#8B5A2B] hover:text-[#2C1810]'}`}
            >
                <ArrowLeft size={14} /> Previous Leaf
            </button>

            {!isLastSlide ? (
                <button 
                    onClick={nextExplanationSlide}
                    className="flex items-center gap-3 px-8 py-3 bg-white/50 border border-[#C8BFA5] hover:border-[#8B5A2B] text-[#2C1810] font-display text-xs uppercase tracking-[0.15em] hover:bg-white transition-all shadow-sm group"
                >
                    Turn Leaf <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            ) : (
                <button 
                    onClick={finishExplanation}
                    className="flex items-center gap-3 px-10 py-4 bg-[#2C1810] text-[#E8DFCA] font-display text-xs uppercase tracking-[0.15em] hover:bg-[#8B5A2B] transition-all shadow-lg"
                >
                    <Brain size={16} /> Enter Practice
                </button>
            )}
        </div>
      </PalmLeafCard>
    );
  };

  const renderPracticeUI = () => {
    if (!practiceItem) return null;
    return (
      <div className="w-full">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
            <div className="bg-[#E8DFCA] p-4 border-t border-b border-[#C8BFA5] text-center shadow-sm">
                <div className="text-[10px] text-[#8B5A2B] uppercase tracking-widest mb-1 font-display">Accuracy</div>
                <div className="text-3xl font-display font-bold text-[#2C1810]">{engineState.practiceAccuracy}%</div>
            </div>
            <div className="bg-[#E8DFCA] p-4 border-t border-b border-[#C8BFA5] text-center shadow-sm">
                <div className="text-[10px] text-[#8B5A2B] uppercase tracking-widest mb-1 font-display">Completed</div>
                <div className="text-3xl font-display font-bold text-[#2C1810]">{engineState.questionsAnswered}</div>
            </div>
            <div className="flex items-center justify-center">
                <button 
                    onClick={() => setEngineState(prev => ({ ...prev, mode: LearningMode.VERIFICATION }))}
                    disabled={engineState.practiceAccuracy < 60 && engineState.questionsAnswered > 0}
                    className={`w-full h-full border border-[#C8BFA5] text-[10px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 bg-[#E8DFCA]
                        ${engineState.practiceAccuracy >= 60 || engineState.questionsAnswered === 0
                            ? 'text-[#8B5A2B] hover:bg-[#8B5A2B] hover:text-[#E8DFCA] hover:border-[#8B5A2B] cursor-pointer shadow-sm' 
                            : 'opacity-50 cursor-not-allowed'}
                    `}
                >
                    <StopCircle size={18} />
                    <span>Verify Mastery</span>
                </button>
            </div>
        </div>

        <PalmLeafCard>
            <div className="absolute top-0 right-0 p-6 opacity-50">
               {/* Difficulty Indicator stamp */}
                <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 border border-current rounded-full ${practiceItem.difficulty === 'hard' ? 'text-red-800' : 'text-blue-800'}`}>
                    {practiceItem.difficulty}
                </span>
            </div>
            
            <h3 className="text-xl font-serif text-[#2C1810] mb-8 leading-relaxed pr-10">
                {practiceItem.question.text}
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {practiceItem.question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => !feedback && handlePracticeAnswer(i)}
                    disabled={!!feedback}
                    className={`w-full text-left p-5 border-l-2 transition-all duration-200 font-serif text-base
                      ${selectedOption === i 
                        ? feedback?.isCorrect 
                          ? 'bg-[#E0E8D0] border-green-700 text-green-900' 
                          : 'bg-[#E8D0D0] border-red-700 text-red-900'
                        : 'bg-white/40 border-[#C8BFA5] hover:border-[#8B5A2B] hover:bg-white/60 text-[#2C1810]'
                      }
                    `}
                  >
                    <span className="font-bold mr-4 font-display opacity-60">{String.fromCharCode(65 + i)}.</span> {opt}
                  </button>
                ))}
            </div>
            
            {feedback && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mt-8 pt-6 border-t border-[#C8BFA5]/50">
                <div className={`text-sm font-display font-bold uppercase tracking-widest mb-3 ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {feedback.isCorrect ? 'Correct Analysis' : 'Flawed Logic'}
                </div>
                <p className="text-base font-serif text-[#5A4A42] italic mb-6">{feedback.text}</p>
                <button onClick={loadNextPracticeItem} className="px-8 py-3 bg-[#2C1810] text-[#E8DFCA] font-display text-xs uppercase tracking-[0.15em] hover:bg-[#8B5A2B] transition-colors shadow-lg">
                  Next Exercise
                </button>
              </motion.div>
            )}
        </PalmLeafCard>
      </div>
    );
  };

  const renderVerificationUI = () => {
    if (!verificationData) return null;
    const currentQ = verificationData.questions[verifIndex];

    return (
      <PalmLeafCard className="border-[#8B5A2B] border-opacity-40">
        <div className="flex flex-col gap-8">
            {/* Case Study Context - Sticky or prominent */}
            <div className="bg-[#2C1810] text-[#E8DFCA] p-8 md:p-10 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
                <div className="absolute top-4 right-4 text-white/10">
                    <ShieldCheck size={80} strokeWidth={0.5} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-[10px] font-display tracking-[0.3em] text-[#8B5A2B] uppercase">Case Study Application</div>
                        <div className="text-[10px] font-display tracking-[0.1em] text-[#E8DFCA]/60 uppercase">
                            Step {verifIndex + 1} of {verificationData.questions.length}
                        </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-serif leading-relaxed italic text-[#E8DFCA] opacity-90">
                        "{verificationData.scenario}"
                    </h3>
                </div>
            </div>

            {/* Questions Container */}
            <div className="px-2 md:px-4">
                <motion.div
                    key={verifIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <ScrollText size={20} className="text-[#8B5A2B]" />
                        <span className="text-xs font-display uppercase tracking-widest text-[#8B5A2B]">
                            Assessment Phase: {verifIndex === 0 ? "Diagnosis" : verifIndex === 1 ? "Implementation" : "Consequence"}
                        </span>
                    </div>

                    <p className="text-xl font-bold font-display text-[#2C1810] mb-8">
                        {currentQ.text}
                    </p>

                    <div className="space-y-4">
                        {currentQ.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => !feedback && handleVerificationAnswer(i)}
                                disabled={!!feedback}
                                className={`w-full text-left p-5 border-l-2 transition-all duration-300 font-serif
                                    ${selectedOption === i 
                                        ? feedback?.isCorrect 
                                            ? 'bg-[#E0E8D0] border-green-700 text-green-900' 
                                            : 'bg-[#E8D0D0] border-red-700 text-red-900'
                                        : 'bg-white/40 border-[#C8BFA5] hover:border-[#8B5A2B] hover:bg-white/60 text-[#2C1810]'
                                    }
                                `}
                            >
                                <span className="font-bold mr-4 font-display opacity-60">{String.fromCharCode(65 + i)}.</span> {opt}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {feedback && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8 p-6 bg-[#2C1810]/5 text-[#2C1810] border-t border-[#2C1810]/10">
                        <p className="font-serif italic mb-4">{feedback.text}</p>
                        {feedback.isCorrect && (
                            <button 
                                onClick={nextVerificationQuestion}
                                className="px-6 py-2 bg-[#2C1810] text-[#E8DFCA] text-xs font-display uppercase tracking-widest hover:bg-[#8B5A2B] transition-colors"
                            >
                                {verifIndex < verificationData.questions.length - 1 ? "Proceed to Next Phase" : "Finalize Verification"}
                            </button>
                        )}
                         {!feedback.isCorrect && (
                             <div className="text-xs font-display uppercase tracking-widest text-red-800 mt-2">
                                 Mastery Check Failed. Re-initializing Practice...
                             </div>
                         )}
                    </motion.div>
                )}
            </div>
        </div>
      </PalmLeafCard>
    );
  };

  const renderReflectionUI = () => {
    return (
      <PalmLeafCard>
          <div className="w-full flex flex-col justify-center h-full pt-4">
            <div className="text-center mb-10">
                <div className="inline-block p-4 border rounded-full border-[#8B5A2B]/30 mb-6 bg-[#E8DFCA]">
                    <PenTool className="text-[#8B5A2B]" size={32} strokeWidth={1} />
                </div>
                <h2 className="text-3xl font-display font-bold text-[#2C1810] mb-3">Synthesis & Reflection</h2>
                <p className="text-[#5A4A42] font-serif text-lg italic">Distill the essence of this knowledge into your own words.</p>
            </div>
            
            <textarea 
                className="w-full h-48 p-8 bg-[#F4EFDC] border border-[#C8BFA5] focus:border-[#8B5A2B] focus:outline-none font-serif text-xl leading-relaxed resize-none shadow-inner text-[#2C1810] placeholder-[#2C1810]/30 transition-all"
                placeholder="The core principle is..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
            />

            <button 
                onClick={submitReflection}
                disabled={reflectionText.length < 20}
                className="mt-10 w-full py-4 bg-[#2C1810] text-[#E8DFCA] font-display uppercase tracking-[0.2em] hover:bg-[#8B5A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
                Commit to Long-Term Memory
            </button>
          </div>
      </PalmLeafCard>
    );
  };

  const renderCompleteUI = () => {
    return (
      <PalmLeafCard>
          <div className="flex flex-col items-center justify-center py-10 text-center max-w-lg mx-auto">
            <div className="mb-8 p-6 bg-[#E0E8D0] rounded-full border border-[#C8BFA5]">
                <CheckCircle size={64} className="text-green-800" strokeWidth={1} />
            </div>
            <h1 className="text-4xl font-display font-bold text-[#2C1810] mb-4">Mastery Verified</h1>
            <p className="text-xl font-serif text-[#5A4A42] mb-12 italic">You have successfully internalized <span className="text-[#2C1810] font-bold not-italic border-b border-[#8B5A2B]">{topic.query}</span>.</p>
            
            <div className="w-full bg-[#F4EFDC] p-8 border border-[#C8BFA5] mb-10 shadow-inner">
                <div className="grid grid-cols-2 gap-8 text-center divide-x divide-[#C8BFA5]">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8B5A2B] mb-2">Final Accuracy</div>
                        <div className="text-3xl font-bold font-display text-[#2C1810]">{engineState.practiceAccuracy}%</div>
                    </div>
                    <div className="pl-8">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8B5A2B] mb-2">Problems Solved</div>
                        <div className="text-3xl font-bold font-display text-[#2C1810]">{engineState.questionsAnswered}</div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onExit}
                className="px-10 py-4 bg-[#2C1810] text-[#E8DFCA] font-display uppercase tracking-[0.2em] hover:bg-[#8B5A2B] transition-colors shadow-lg w-full"
            >
                Return to Engine Index
            </button>
          </div>
      </PalmLeafCard>
    );
  };

  // --- MAIN RENDER LOGIC ---

  const renderContent = () => {
    if (loading) return renderLoading();

    switch (engineState.mode) {
      case LearningMode.DIAGNOSTIC: return renderDiagnosticUI();
      case LearningMode.EXPLANATION: return renderExplanationUI();
      case LearningMode.PRACTICE: return renderPracticeUI();
      case LearningMode.VERIFICATION: return renderVerificationUI();
      case LearningMode.REFLECTION: return renderReflectionUI();
      case LearningMode.COMPLETE: return renderCompleteUI();
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-screen pb-10">
      
      {/* Header with Progress */}
      <div className="w-full flex flex-col gap-6 mb-8">
        {/* Learning Depth Progress Bar */}
        <div className="w-full bg-[#2C1810]/10 rounded-full h-1 overflow-hidden">
           <motion.div 
             className="h-full bg-[#8B5A2B]"
             initial={{ width: 0 }}
             animate={{ width: `${getProgressPercentage()}%` }}
             transition={{ duration: 1, ease: "easeInOut" }}
           />
        </div>

        {/* Navigation & Title */}
        <div className="flex justify-between items-end border-b border-[#2C1810]/10 pb-4">
          <div>
            <button 
              onClick={onExit} 
              className="group flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.15em] text-[#8B5A2B] hover:text-[#2C1810] mb-3 transition-colors"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              Return to Index
            </button>
            <div className="text-xs font-display tracking-[0.2em] text-[#2C1810] opacity-60 uppercase font-bold mb-1">
              {engineState.mode.replace('_', ' ')}
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#2C1810] tracking-tight">{topic.query}</h2>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-display text-[#8B5A2B] uppercase tracking-[0.15em] mb-1">Mastery Level</div>
            <div className="text-xl font-display font-bold text-[#2C1810]">{engineState.mastery}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={engineState.mode + (loading ? '-loading' : '')}
          className="w-full flex-grow"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

    </div>
  );
};