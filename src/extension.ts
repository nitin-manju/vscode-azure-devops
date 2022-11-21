import * as vscode from 'vscode';
import { AzureDevOpsSprintProvider } from './providers/azureDevopsSprintProvider';
import { AzureDevOpsWiService } from './providers/azureDevOpsWiService';
import { WorkItemStatus } from './providers/workItemStatus';

export async function activate(context: vscode.ExtensionContext) {

	const settings = vscode.workspace.getConfiguration('azureDevopsPilot');

	let orgName: string = settings.get('organizationName') as string;
	let devOpsPAT = await context.secrets.get("azuredevopspilot.devOpsPAT") as string;

	if (!orgName || !devOpsPAT) {
		//vscode.commands.executeCommand('setContext', 'azuredevopspilot.isConfigured', true);
	}

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'azureDevopsPilot');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.setDevOpsPAT', async (token?: string) => {
		if (!token) {
			token = await vscode.window.showInputBox({
				placeHolder: vscode.l10n.t("Enter PAT here"),
				prompt: vscode.l10n.t("Enter PAT here")
			});
		}

		if (token) {
			context.secrets.store("azuredevopspilot.devOpsPAT", token);
			devOpsPAT = token;
		}
	}));

	const azureDevOpsService: AzureDevOpsWiService = new AzureDevOpsWiService(orgName, devOpsPAT);
	const dataProvider = new AzureDevOpsSprintProvider(azureDevOpsService);

	vscode.commands.registerCommand('azuredevopspilot.refreshEntry', () =>
		dataProvider.refresh()
	);

	vscode.window.registerTreeDataProvider(
		'azureDevOpsSprintView',
		dataProvider
	);

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.openItem', (args: any) => {
		if (args) {
			const url = `https://dev.azure.com/kognifai/${args.data.fields["System.TeamProject"]}/_workitems/edit/${args.data.id}`;

			vscode.env.openExternal(vscode.Uri.parse(url))
				.then(() => vscode.window.showInformationMessage(`Check your browser window for ${args.data.id} - ${args.data.fields['System.Title']}`));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateActive', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.active).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Work started on ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => vscode.window.showErrorMessage(`Error setting the status.`));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateResolved', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.resolve).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Resolved ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => vscode.window.showErrorMessage('Error setting the status.'));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('azuredevopspilot.changeStateClosed', (args: any) => {
		if (args) {
			azureDevOpsService.setWorkItemStatus(args.data, WorkItemStatus.close).then(() => {
				dataProvider.refresh();
				vscode.window.showInformationMessage(`Closed ${args.data.id} - ${args.data.fields['System.Title']}`);
			}).catch((error) => vscode.window.showErrorMessage('Error setting the status.'));
		}
	}));
}

export function deactivate() { }
