import * as vscode from 'vscode';

import {StatsDisplay} from './statsDisplay';
import {StatusBarManager} from './statusBar';
import {TimeTracker} from './timeTracker';

let tracker: TimeTracker;
let statusBar: StatusBarManager;
let statsDisplay: StatsDisplay;

export function activate(context: vscode.ExtensionContext) {
  console.log('Wakacode запущен!');

  tracker = new TimeTracker(context);
  statsDisplay = new StatsDisplay(tracker);
  statusBar = new StatusBarManager(tracker);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme === 'file') {
      tracker.recordActivity(event.document);
    }
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.uri.scheme === 'file') {
      tracker.recordActivity(editor.document);
    }
  });

  vscode.commands.registerCommand('wakacode.showStats', () => {
    statsDisplay.showAllStats();
  });

  vscode.commands.registerCommand('wakacode.showToday', () => {
    statsDisplay.showTodayStats();
  });

  vscode.commands.registerCommand('wakacode.resetStats', async () => {
    const answer = await vscode.window.showWarningMessage(
        'Вы уверены? Вся статистика будет удалена!', 'Да', 'Нет');

    if (answer === 'Да') {
      tracker.resetStats();
      vscode.window.showInformationMessage('Статистика очищена!');
    }
  });

  vscode.window.showInformationMessage('Wakacode отслеживает ваше время!');
}

export function deactivate() {
  if (tracker) {
    tracker.dispose();
  }
  if (statusBar) {
    statusBar.dispose();
  }
}
