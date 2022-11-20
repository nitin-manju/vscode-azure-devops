import * as vscode from 'vscode';
import { AzureDevOpsProvider } from './providers/azureDevopsProvider';
import { AzureDevOpsService, WorkItemStatus } from './providers/azureDevopsService';

export function activate(context: vscode.ExtensionContext) {
	const azureDevOpsService: AzureDevOpsService = new AzureDevOpsService("<Project-Name>", "<PAT>");

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.openItem', (args: any) => {
		if (args) {
			const id = args.data.id;
			const teamProject = args.data.fields["System.TeamProject"];
			const url = `https://dev.azure.com/kognifai/${teamProject}/_workitems/edit/${id}`;

			vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
				vscode.window.showInformationMessage(`Check your browser window for ${args.data.id} - ${args.data.fields['System.Title']}`);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateActive', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.ACTIVE).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Work started on ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => {
				vscode.window.showErrorMessage('Error setting the status.');
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateResolved', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.RESOLVE).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Resolved ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => {
				vscode.window.showErrorMessage('Error setting the status.');
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateClosed', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.CLOSE).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Closed ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => {
				vscode.window.showErrorMessage('Error setting the status.');
			});
		}
	}));

	const dataProvider = new AzureDevOpsProvider(azureDevOpsService);

	vscode.commands.registerCommand('azuredevopspilot.refreshEntry', () =>
		dataProvider.refresh()
	);

	vscode.window.registerTreeDataProvider(
		'azureDevopsView',
		dataProvider
	);
}

export function deactivate() { }
