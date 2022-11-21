
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import path = require("path");
import * as vscode from 'vscode';
import { AzureDevOpsWiService } from "./azureDevOpsWiService";
import { NodeItemType } from "./nodeType";
import { TreeNode } from "./treeNode";
import { WiqlPathConstant } from "./wiqlPathConstants";

export class AzureDevOpsSprintProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | null | void> = new vscode.EventEmitter<TreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private readonly azureDevopsService: AzureDevOpsWiService) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    switch (element.type) {
      case NodeItemType.sprint:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'azure-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'azure-svgrepo-com.svg')
        };
        break;

      case NodeItemType.team:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'team-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'team-svgrepo-com.svg')
        };
        break;

      case NodeItemType.userstory:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'book-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'book-svgrepo-com.svg')
        };
        break;

      case NodeItemType.bug:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'bug-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'bug-svgrepo-com.svg')
        };
        break;

      case NodeItemType.task:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'stats-check-mark-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'stats-check-mark-svgrepo-com.svg')
        };
        break;

      case NodeItemType.notfound:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'box-empty-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'box-empty-svgrepo-com.svg')
        };
        break;

      default:
        element.iconPath = {
          light: path.join(__filename, '..', '..', 'resources', 'azure-svgrepo-com.svg'),
          dark: path.join(__filename, '..', '..', 'resources', 'azure-svgrepo-com.svg')
        };
        break;
    }

    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    const nodes: TreeNode[] = [];

    if (!this.azureDevopsService.isServiceConfigured()) {
      return [];
    }

    if (!element) {
      nodes.push(new TreeNode("Current Sprint", NodeItemType.sprint, null, "User Stories assigned in current sprint", vscode.TreeItemCollapsibleState.Collapsed));
    }
    else {
      switch (element.contextValue) {
        case NodeItemType.sprint:
          const teams = await this.azureDevopsService.getAllTeams();

          for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            const label = `${team.projectName}\\${team.name}`;

            nodes.push(new TreeNode(label, NodeItemType.team, team, label, vscode.TreeItemCollapsibleState.Collapsed));
          }

          break;

        case NodeItemType.team:
          const stories = await this.azureDevopsService.getAllUserStoriesForTeam(element.data);

          if (stories) {
            for (let i = 0; i < stories.length; i++) {
              const curr: WorkItem = stories[i];

              if (curr.id && curr.fields) {
                const type = NodeItemType.resolveToNodeItemType(curr.fields[WiqlPathConstant.workitemType]);
                let label = `[${curr.id.toString()}] - [${curr.fields[WiqlPathConstant.state]}] - ${curr.fields[WiqlPathConstant.title]}`;
                let tooltip = `${curr.fields[WiqlPathConstant.title]}`;

                tooltip += `\n`;
                tooltip += `\nAREA PATH: ${curr.fields[WiqlPathConstant.areaPath]}`;
                tooltip += `\nSTATE: ${curr.fields[WiqlPathConstant.state]}`;
                tooltip += `\nTAGS: ${curr.fields[WiqlPathConstant.tags]}`;
                tooltip += `\nPRIORITY: ${curr.fields[WiqlPathConstant.priority]}`;
                tooltip += `\nSTORY POINTS: ${curr.fields[WiqlPathConstant.storyPoints]}`;

                nodes.push(new TreeNode(label, type, curr, tooltip, vscode.TreeItemCollapsibleState.Collapsed));
              }
            }
          }
          else {
            nodes.push(new TreeNode("No work items found.", NodeItemType.notfound, null, "No work items were found in the current sprint.", vscode.TreeItemCollapsibleState.None));
          }

          break;

        case NodeItemType.userstory:
        case NodeItemType.bug:

          const tasks = await this.azureDevopsService.getAllAttachedTasks(element.data);

          if (tasks) {
            for (let i = 0; i < tasks.length; i++) {
              const curr: WorkItem = tasks[i];

              if (curr.id && curr.fields) {
                let label = `[${curr.id.toString()}] - [${curr.fields[WiqlPathConstant.state]}] - ${curr.fields[WiqlPathConstant.title]}`;
                let tooltip = `${curr.fields[WiqlPathConstant.title]}`;
                const type = NodeItemType.resolveToNodeItemType(curr.fields[WiqlPathConstant.workitemType]);

                tooltip += `\n`;
                tooltip += `\nSTATE: ${curr.fields[WiqlPathConstant.state]}`;
                tooltip += `\nTAGS: ${curr.fields[WiqlPathConstant.tags]}`;
                tooltip += `\nPRIORITY: ${curr.fields[WiqlPathConstant.priority]}`;

                nodes.push(new TreeNode(label, type, curr, tooltip, vscode.TreeItemCollapsibleState.None));
              }
            }
          }
          else {
            nodes.push(new TreeNode("No linked items found.", NodeItemType.notfound, null, "No linked items were found under this story.", vscode.TreeItemCollapsibleState.None));
          }

          break;
      }
    }

    return Promise.resolve(nodes);
  }
}
