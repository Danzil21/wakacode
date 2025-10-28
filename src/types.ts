export interface ActivityRecord {
  timestamp: number;
  duration: number;
  file: string;
  language: string;
  project: string;
  isWrite: boolean;
}

export interface DailyStats {
  date: string;
  totalTime: number;
  languages: Map<string, number>;
  files: Map<string, number>;
  projects: Map<string, number>;
}

export interface SessionStats {
  startTime: number;
  totalTime: number;
  currentFile?: string;
  currentLanguage?: string;
}

export interface StorageData {
  activities: ActivityRecord[];
  dailyStats: {[date: string]: SerializedDailyStats};
}

export interface SerializedDailyStats {
  date: string;
  totalTime: number;
  languages: {[key: string]: number};
  files: {[key: string]: number};
  projects: {[key: string]: number};
}
