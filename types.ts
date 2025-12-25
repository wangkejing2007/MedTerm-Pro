
export enum Level {
  BASIC = '基礎',
  COMMON = '常用',
  ADVANCED = '進階'
}

export interface MedicalWord {
  id: string;
  word: string;
  kk: string;
  chinese: string;
  englishDef: string;
  example: string;
  level: Level;
  mastered?: boolean;
}

export interface VocabState {
  words: MedicalWord[];
  currentIndex: number;
  level: Level;
}
