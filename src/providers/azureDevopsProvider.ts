
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import path = require("path");
import * as vscode from 'vscode';
import { AzureDevOpsService } from "./azureDevopsService";
import { TreeNode } from "./treeNode";

export class AzureDevOpsProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | null | void> = new vscode.EventEmitter<TreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private readonly azureDevopsService: AzureDevOpsService) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    switch (element.type) {
      case "team":
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'team-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'team-svgrepo-com.svg')
        };
        break;

      case "userstory":
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'book-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'book-svgrepo-com.svg')
        };
        break;

      case "bug":
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'bug-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'bug-svgrepo-com.svg')
        };
        break;

      case "notfound":
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'box-empty-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'box-empty-svgrepo-com.svg')
        };
        break;
    }

    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    let dependencies: TreeNode[] = [];

    if (!element) {
      let teams = await this.azureDevopsService.getAllTeams();

      for (let i = 0; i < teams.length; i++) {
        let team = teams[i];
        let label = `${team.projectName}\\${team.name}`;

        dependencies.push(new TreeNode(label, "team", team, label, vscode.TreeItemCollapsibleState.Collapsed));
      }
    }
    else if (element.contextValue === 'team') {
      dependencies.push(new TreeNode("Current Sprint", "sprint", element.data, "User Stories assigned in current sprint", vscode.TreeItemCollapsibleState.Collapsed));
    }
    else if (element.contextValue === 'sprint') {

      let wis = await this.azureDevopsService.getAllUserStoriesForTeam(element.data);
      if (wis) {
        for (let i = 0; i < wis.length; i++) {
          const curr: WorkItem = wis[i];

          if (curr.id && curr.fields) {
            const type = curr.fields['System.WorkItemType'] === 'User Story' ? "userstory" : "bug";
            let label = `[${curr.id.toString()}] - [${curr.fields['System.State']}] - ${curr.fields['System.Title']}`;
            let tooltip = `${curr.fields['System.Title']}`;

            tooltip += `\n`;
            tooltip += `\nAREA PATH: ${curr.fields['System.AreaPath']}`;
            tooltip += `\nSTATE: ${curr.fields['System.State']}`;
            tooltip += `\nTAGS: ${curr.fields['System.Tags']}`;
            tooltip += `\nPRIORITY: ${curr.fields['Microsoft.VSTS.Common.Priority']}`;
            tooltip += `\nSTORY POINTS: ${curr.fields['Microsoft.VSTS.Scheduling.StoryPoints']}`;

            let node = new TreeNode(label, type, curr, tooltip, vscode.TreeItemCollapsibleState.None);
            /*  node.command = {
              title: "Open Details",
              command: "azuredevopspilot.openWiDetails",
              arguments: [curr]
            }; */

            dependencies.push(node);
          }
        }
      }
      else {
        dependencies.push(new TreeNode("No work items found.", "notfound", null, "No work items were found in the current sprint.", vscode.TreeItemCollapsibleState.None));
      }
    }

    return Promise.resolve(dependencies);
  }
}
