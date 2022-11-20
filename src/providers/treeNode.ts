
import * as vscode from 'vscode';

export class TreeNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly data: any,
    tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.contextValue = type;
  }
}