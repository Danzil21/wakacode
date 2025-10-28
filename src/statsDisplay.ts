import * as path from 'path';
import * as vscode from 'vscode';

import {TimeTracker} from './timeTracker';
import {SerializedDailyStats} from './types';

export class StatsDisplay {
  private tracker: TimeTracker;

  constructor(tracker: TimeTracker) {
    this.tracker = tracker;
  }

  public async showTodayStats() {
    const stats = this.tracker.getTodayStats();
    const sessionStats = this.tracker.getSessionStats();

    if (!stats && sessionStats.totalTime === 0) {
      vscode.window.showInformationMessage('Сегодня вы еще не работали!');
      return;
    }

    const totalTime = stats ? stats.totalTime + sessionStats.totalTime :
                              sessionStats.totalTime;

    let message =
        `Сегодня вы работали: ${this.tracker.formatTime(totalTime)}\n`;
    message +=
        `Текущая сессия: ${this.tracker.formatTime(sessionStats.totalTime)}`;

    const panel = vscode.window.createWebviewPanel(
        'todayStats', 'Статистика за сегодня', vscode.ViewColumn.One, {});

    panel.webview.html =
        this.getSimpleStatsHtml(totalTime, sessionStats, stats);
  }

  public async showAllStats() {
    const allStats = this.tracker.getAllStats();
    const entries =
        Object.entries(allStats).sort((a, b) => b[0].localeCompare(a[0]));

    if (entries.length === 0) {
      vscode.window.showInformationMessage('Еще нет записанной активности!');
      return;
    }

    const panel = vscode.window.createWebviewPanel(
        'allStats', 'Вся статистика', vscode.ViewColumn.One, {});

    panel.webview.html = this.getAllStatsSimpleHtml(entries);
  }

  private getSimpleStatsHtml(
      totalTime: number, sessionStats: any,
      stats: SerializedDailyStats|undefined): string {
    let languagesHtml = '';
    if (stats && stats.languages) {
      languagesHtml = '<h3>Языки:</h3><ul>';
      for (const [lang, time] of Object.entries(stats.languages)) {
        languagesHtml += `<li>${lang}: ${this.tracker.formatTime(time)}</li>`;
      }
      languagesHtml += '</ul>';
    }

    let filesHtml = '';
    if (stats && stats.files) {
      filesHtml = '<h3>Топ файлов:</h3><ul>';
      const topFiles =
          Object.entries(stats.files).sort((a, b) => b[1] - a[1]).slice(0, 5);
      for (const [file, time] of topFiles) {
        const fileName = path.basename(file);
        filesHtml += `<li>${fileName}: ${this.tracker.formatTime(time)}</li>`;
      }
      filesHtml += '</ul>';
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Статистика за сегодня</title>
</head>
<body>
    <h1>Статистика за сегодня</h1>
    <h2>Общее время: ${this.tracker.formatTime(totalTime)}</h2>
    <p>Текущая сессия: ${this.tracker.formatTime(sessionStats.totalTime)}</p>
    <hr>
    ${languagesHtml}
    ${filesHtml}
</body>
</html>
        `;
  }

  private getAllStatsSimpleHtml(entries: [string, SerializedDailyStats][]):
      string {
    const totalAllTime =
        entries.reduce((sum, [, stats]) => sum + stats.totalTime, 0);

    let daysList = '<ul>';
    for (const [date, stats] of entries) {
      daysList += `<li><strong>${date}</strong>: ${
          this.tracker.formatTime(stats.totalTime)}</li>`;
    }
    daysList += '</ul>';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Вся статистика</title>
</head>
<body>
    <h1>Вся статистика</h1>
    <h2>Общее время за все дни: ${this.tracker.formatTime(totalAllTime)}</h2>
    <hr>
    <h3>По дням:</h3>
    ${daysList}
</body>
</html>
        `;
  }
}
