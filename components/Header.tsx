
import React from 'react';
import { Level } from '../types';

interface HeaderProps {
  currentLevel: Level;
  onLevelChange: (level: Level) => void;
  wordCount: number;
}

const Header: React.FC<HeaderProps> = ({ currentLevel, onLevelChange, wordCount }) => {
  return (
    <header className="py-6 px-4 mb-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MedTerm <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            醫學系必備單字閃卡 • {wordCount} 個單字已導入
          </p>
        </div>
        
        <nav className="flex bg-slate-800 p-1 rounded-xl shadow-inner">
          {Object.values(Level).map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                currentLevel === level
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {level}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
