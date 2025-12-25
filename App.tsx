
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Level, MedicalWord } from './types';
import { INITIAL_VOCAB } from './data/initialVocab';
import { expandVocabulary } from './services/geminiService';
import Header from './components/Header';
import Flashcard from './components/Flashcard';

const STORAGE_KEY_WORDS = 'medterm_pro_words_v2';
const STORAGE_KEY_PROGRESS = 'medterm_pro_last_indices_v2';

const App: React.FC = () => {
  const [words, setWords] = useState<MedicalWord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORDS);
    return saved ? JSON.parse(saved) : INITIAL_VOCAB;
  });

  const [currentLevel, setCurrentLevel] = useState<Level>(Level.BASIC);
  
  const [lastIndices, setLastIndices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return saved ? JSON.parse(saved) : { [Level.BASIC]: 0, [Level.COMMON]: 0, [Level.ADVANCED]: 0 };
  });

  const [currentIndex, setCurrentIndex] = useState(lastIndices[Level.BASIC] || 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const levelWords = useMemo(() => 
    words.filter(w => w.level === currentLevel), 
    [words, currentLevel]
  );

  const currentWord = levelWords[currentIndex] || null;

  const progressPercent = useMemo(() => {
    if (levelWords.length === 0) return 0;
    const masteredCount = levelWords.filter(w => w.mastered).length;
    return Math.round((masteredCount / levelWords.length) * 100);
  }, [levelWords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words));
  }, [words]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(lastIndices));
  }, [lastIndices]);

  const handleLevelChange = (level: Level) => {
    setCurrentLevel(level);
    const savedIdx = lastIndices[level] || 0;
    const count = words.filter(w => w.level === level).length;
    const safeIdx = savedIdx < count ? savedIdx : 0;
    setCurrentIndex(safeIdx);
    setIsFlipped(false);
  };

  const updatePosition = (newIdx: number) => {
    setCurrentIndex(newIdx);
    setLastIndices(prev => ({ ...prev, [currentLevel]: newIdx }));
  };

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      const nextIdx = (currentIndex + 1) % levelWords.length;
      updatePosition(nextIdx);
    }, 150);
  }, [currentIndex, levelWords.length]);

  const prevCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      const prevIdx = (currentIndex - 1 + levelWords.length) % levelWords.length;
      updatePosition(prevIdx);
    }, 150);
  }, [currentIndex, levelWords.length]);

  const toggleMastery = (id: string, isMastered: boolean) => {
    setWords(prev => prev.map(w => 
      w.id === id ? { ...w, mastered: isMastered } : w
    ));
    setTimeout(nextCard, 400);
  };

  const handleExpand = async () => {
    if (isExpanding) return;
    setIsExpanding(true);
    setFeedback("正在使用 AI 生成 50 個專業醫學單字 (大約需要 15-20 秒)...");
    try {
      const existing = words.map(w => w.word);
      const newWords = await expandVocabulary(currentLevel, existing);
      if (newWords.length > 0) {
        setWords(prev => [...prev, ...newWords]);
        setFeedback(`成功！已為您擴充 ${newWords.length} 個 '${currentLevel}' 單字。`);
      } else {
        setFeedback("擴充完成，但沒有新的單字被加入。");
      }
    } catch (err) {
      setFeedback("擴充失敗，請確認 API Key 是否正確或網路是否穩定。");
    } finally {
      setIsExpanding(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
      if (e.key === ' ' || e.key === 'Enter') setIsFlipped(f => !f);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextCard, prevCard]);

  return (
    <div className="min-h-screen flex flex-col pb-12 bg-slate-950">
      <Header 
        currentLevel={currentLevel} 
        onLevelChange={handleLevelChange} 
        wordCount={levelWords.length}
      />

      <main className="flex-grow flex flex-col items-center justify-center px-4 max-w-6xl mx-auto w-full">
        {currentWord ? (
          <>
            {/* 進度顯示區域 */}
            <div className="w-full max-w-lg mb-10">
              <div className="flex justify-between items-end mb-3">
                <div className="flex flex-col">
                  <span className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Learning Progress</span>
                  <span className="text-white text-2xl font-black">{progressPercent}%</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-sm font-bold">{currentIndex + 1} / {levelWords.length} Cards</span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="w-full flex justify-end mb-4 max-w-lg">
              <button 
                onClick={handleExpand}
                disabled={isExpanding}
                className={`flex items-center gap-2 text-[10px] font-black py-2 px-5 rounded-full border tracking-tighter transition-all ${
                  isExpanding 
                    ? 'border-slate-800 text-slate-600 bg-slate-900 cursor-not-allowed animate-pulse' 
                    : 'border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 shadow-lg shadow-blue-900/10'
                }`}
              >
                {isExpanding ? "AI PROCESSING 50 WORDS..." : "+ AI 批量擴充 (50個)"}
              </button>
            </div>

            {feedback && (
              <div className="mb-4 text-xs font-bold text-blue-400 text-center animate-pulse bg-blue-900/10 py-2 px-4 rounded-lg">
                {feedback}
              </div>
            )}

            <Flashcard 
              word={currentWord} 
              isFlipped={isFlipped} 
              onFlip={() => setIsFlipped(!isFlipped)} 
              onMarkMastery={(mastered) => toggleMastery(currentWord.id, mastered)}
            />

            {/* 控制區 */}
            <div className="mt-12 flex items-center gap-8">
              <button 
                onClick={prevCard}
                className="p-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 transition-all active:scale-90 shadow-xl"
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <button 
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-14 py-5 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-2xl shadow-blue-900/40 hover:bg-blue-500 hover:-translate-y-1 transition-all active:translate-y-0 active:scale-95"
              >
                {isFlipped ? "看單字" : "看定義"}
              </button>

              <button 
                onClick={nextCard}
                className="p-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600 transition-all active:scale-90 shadow-xl"
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            
            {/* 底部快速標記 */}
            <div className="mt-10 flex gap-8">
               <button 
                onClick={() => toggleMastery(currentWord.id, false)}
                className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${!currentWord.mastered ? 'bg-red-500/10' : 'hover:bg-red-500/5'}`}
               >
                 <div className={`p-3 rounded-xl transition-all ${!currentWord.mastered ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-slate-900 text-slate-600 group-hover:text-red-400'}`}>
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${!currentWord.mastered ? 'text-red-400' : 'text-slate-700'}`}>仍陌生</span>
               </button>

               <button 
                onClick={() => toggleMastery(currentWord.id, true)}
                className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${currentWord.mastered ? 'bg-green-500/10' : 'hover:bg-green-500/5'}`}
               >
                 <div className={`p-3 rounded-xl transition-all ${currentWord.mastered ? 'bg-green-500 text-white shadow-lg shadow-green-900/40' : 'bg-slate-900 text-slate-600 group-hover:text-green-400'}`}>
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${currentWord.mastered ? 'text-green-400' : 'text-slate-700'}`}>已熟悉</span>
               </button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-900"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-500 font-black tracking-widest uppercase text-sm">Initializing Medical Database...</p>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-slate-800 text-[10px] font-bold tracking-[0.4em] uppercase">
        MedTerm Pro • Clinical Vocabulary System
      </footer>
    </div>
  );
};

export default App;
