import * as azdev from "azure-devops-node-api";
import { CoreApi } from "azure-devops-node-api/CoreApi";
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { WebApiTeam } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { Wiql, WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import * as wi from "azure-devops-node-api/WorkItemTrackingApi";
import { WorkItemStatus } from "./workItemStatus";

export class AzureDevOpsWiService {
    private readonly orgUrl: string;
    private readonly authHandler: IRequestHandler;
    private readonly connection: azdev.WebApi;
    private isConfigured: boolean = false;

    constructor(projectName: string, token: string) {
        this.orgUrl = `https://dev.azure.com/${projectName}`;
        this.authHandler = azdev.getPersonalAccessTokenHandler(token);
        this.connection = new azdev.WebApi(this.orgUrl, this.authHandler);

        this.isConfigured = (projectName !== "" && token !== "");
    }

    public isServiceConfigured(): boolean {
        return this.isConfigured;
    }

    public async getAllTeams(): Promise<WebApiTeam[]> {
        const coreApi: CoreApi = await this.connection.getCoreApi();
        return await coreApi.getAllTeams(true);
    }

    public async getAllUserStoriesForTeam(team: WebApiTeam): Promise<WorkItem[]> {
        const wi: wi.WorkItemTrackingApi = await this.connection.getWorkItemTrackingApi();
        const teamPath = `[${team.projectName}]\\${team.name}`;
        const query: Wiql = {
            query: `SELECT [System.Id], [System.Title], [System.State] 
                    FROM WorkItems 
                    WHERE ([System.WorkItemType] = 'User Story' OR [System.WorkItemType] = 'Bug')
                    AND [System.AssignedTo] = @Me 
                    AND [System.IterationPath] = @CurrentIteration('${teamPath}') 
                    ORDER BY [System.State] ASC, [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC`
        };

        const res = await wi.queryByWiql(query);

        if (res && res.workItems) {
            const ids: number[] = [];
            res.workItems.forEach((item: WorkItem) => { if (item.id) { ids.push(item.id.valueOf()) } });
            return await wi.getWorkItems(ids);
        }

        return [];
    }

    public async setWorkItemStatus(workItem: WorkItem, status: WorkItemStatus) {
        const wi: wi.WorkItemTrackingApi = await this.connection.getWorkItemTrackingApi();

        if (workItem.id && workItem.fields) {
            let value = "";
            switch (status) {
                case WorkItemStatus.active:
                    value = "Active";
                    break;

                case WorkItemStatus.resolve:
                    value = "Resolved";
                    break;

                case WorkItemStatus.close:
                    value = "Closed";
                    break;
            }

            const docs = [{
                op: Operation.Replace,
                path: "/fields/System.State",
                value: value
            }];

            await wi.updateWorkItem(null, docs, workItem.id, workItem.fields["System.TeamProject"]);
        }
    }
}