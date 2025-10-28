import * as path from 'path';
import * as vscode from 'vscode';

import {ActivityRecord, SerializedDailyStats, SessionStats, StorageData} from './types';

export class TimeTracker {
  private context: vscode.ExtensionContext;
  private lastActivity: number = 0;
  private currentFile?: string;
  private currentLanguage?: string;
  private sessionStart: number;
  private sessionTime: number = 0;
  private updateInterval: NodeJS.Timeout|undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.sessionStart = Date.now();
    this.lastActivity = Date.now();
    this.startTracking();
  }

  private startTracking() {
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivity;

      if (timeSinceLastActivity < 120000) {
        this.sessionTime += 1;
      }
    }, 1000);
  }

  public recordActivity(document: vscode.TextDocument) {
    this.lastActivity = Date.now();

    const fileName = document.fileName;
    const languageId = document.languageId;

    this.currentFile = fileName;
    this.currentLanguage = languageId;

    this.updateDailyStats(fileName, languageId);
  }

  private updateDailyStats(fileName: string, languageId: string) {
    const data = this.loadData();
    const today = this.getTodayString();

    if (!data.dailyStats[today]) {
      data.dailyStats[today] =
          {date: today, totalTime: 0, languages: {}, files: {}, projects: {}};
    }

    const stats = data.dailyStats[today];
    stats.totalTime += 1;

    if (!stats.languages[languageId]) {
      stats.languages[languageId] = 0;
    }
    stats.languages[languageId] += 1;

    if (!stats.files[fileName]) {
      stats.files[fileName] = 0;
    }
    stats.files[fileName] += 1;

    this.saveData(data);
  }

  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private loadData(): StorageData {
    const data = this.context.globalState.get<StorageData>('timeTrackingData');
    return data || {activities: [], dailyStats: {}};
  }

  private saveData(data: StorageData) {
    this.context.globalState.update('timeTrackingData', data);
  }

  public getSessionStats(): SessionStats {
    return {
      startTime: this.sessionStart,
      totalTime: this.sessionTime,
      currentFile: this.currentFile,
      currentLanguage: this.currentLanguage
    };
  }

  public getTodayStats(): SerializedDailyStats|undefined {
    const data = this.loadData();
    const today = this.getTodayString();
    return data.dailyStats[today];
  }

  public getAllStats(): {[date: string]: SerializedDailyStats} {
    const data = this.loadData();
    return data.dailyStats;
  }

  public resetStats() {
    this.context.globalState.update(
        'timeTrackingData', {activities: [], dailyStats: {}});
    this.sessionTime = 0;
    this.sessionStart = Date.now();
  }

  public dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  public formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  }
}
