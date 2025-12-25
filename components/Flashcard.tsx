
import React, { useState } from 'react';
import { MedicalWord } from '../types';
import { getTTS, playPCM } from '../services/geminiService';

interface FlashcardProps {
  word: MedicalWord;
  isFlipped: boolean;
  onFlip: () => void;
  onMarkMastery: (mastered: boolean) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, isFlipped, onFlip, onMarkMastery }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioData = await getTTS(word.word);
      await playPCM(audioData);
    } catch (err) {
      console.error("播放失敗", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div 
      className="relative w-full max-w-lg aspect-[4/3] perspective-1000 cursor-pointer group mx-auto"
      onClick={onFlip}
    >
      <div className={`card-inner relative w-full h-full preserve-3d ${isFlipped ? 'flipped' : ''}`}>
        
        {/* 正面: 喇叭(上)、單字(中)、音標(下) */}
        <div className="absolute inset-0 backface-hidden bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          {word.mastered && (
            <div className="absolute top-6 right-6 px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30">
              已熟悉
            </div>
          )}

          <div className="flex flex-col items-center gap-8">
            <button 
               onClick={handleSpeak}
               disabled={isSpeaking}
               className={`p-5 rounded-full bg-slate-700/50 hover:bg-blue-600 transition-all active:scale-90 shadow-lg ${isSpeaking ? 'animate-pulse bg-blue-500 ring-4 ring-blue-500/20' : ''}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
               </svg>
             </button>

            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight break-words px-4">
                {word.word}
              </h2>
              <p className="text-2xl text-blue-400 font-serif italic tracking-wide">
                {word.kk}
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-6 text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] opacity-40">
            點擊查看定義與例句
          </div>
        </div>

        {/* 反面: 中文、英文、例句 */}
        <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl border border-blue-900/30 shadow-2xl flex flex-col p-8 rotate-y-180 overflow-y-auto">
          <div className="mb-6">
            <span className="inline-block px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
              中文定義
            </span>
            <p className="text-3xl font-bold text-white leading-tight">
              {word.chinese}
            </p>
          </div>

          <div className="mb-6">
            <span className="inline-block px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
              英文解釋
            </span>
            <p className="text-lg text-slate-300 leading-relaxed font-medium">
              {word.englishDef}
            </p>
          </div>

          <div className="mb-8">
            <span className="inline-block px-2 py-0.5 rounded bg-teal-900/40 text-teal-400 text-[10px] font-black uppercase tracking-widest mb-2">
              臨床應用
            </span>
            <p className="text-lg text-slate-400 leading-relaxed italic border-l-2 border-teal-500/30 pl-4">
              "{word.example}"
            </p>
          </div>

          <div className="mt-auto flex justify-center gap-4 pt-4 border-t border-slate-800">
             <button 
              onClick={(e) => { e.stopPropagation(); onMarkMastery(false); }}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-red-400 text-sm font-bold hover:bg-red-900/20 transition-colors"
             >
               仍陌生
             </button>
             <button 
              onClick={(e) => { e.stopPropagation(); onMarkMastery(true); }}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-green-400 text-sm font-bold hover:bg-green-900/20 transition-colors"
             >
               已熟悉
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
