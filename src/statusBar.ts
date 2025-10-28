import * as vscode from 'vscode';

import {TimeTracker} from './timeTracker';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private tracker: TimeTracker;
  private updateInterval: NodeJS.Timeout|undefined;

  constructor(tracker: TimeTracker) {
    this.tracker = tracker;

    this.statusBarItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    this.statusBarItem.command = 'wakacode.showToday';
    this.statusBarItem.show();
    this.startUpdating();
  }

  private startUpdating() {
    this.updateDisplay();
    this.updateInterval = setInterval(() => {
      this.updateDisplay();
    }, 1000);
  }

  private updateDisplay() {
    const stats = this.tracker.getSessionStats();
    const timeStr = this.tracker.formatTime(stats.totalTime);

    let tooltip = `Время сессии: ${timeStr}`;
    if (stats.currentLanguage) {
      tooltip += `\nЯзык: ${stats.currentLanguage}`;
    }
    if (stats.currentFile) {
      const fileName = stats.currentFile.split('/').pop();
      tooltip += `\nФайл: ${fileName}`;
    }
    tooltip += '\n\nНажмите чтобы посмотреть статистику';

    this.statusBarItem.text = `$(clock) ${timeStr}`;
    this.statusBarItem.tooltip = tooltip;
  }

  public dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.statusBarItem.dispose();
  }
}
