import * as azdev from "azure-devops-node-api";
import { CoreApi } from "azure-devops-node-api/CoreApi";
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { WebApiTeam } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { Wiql, WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import * as wi from "azure-devops-node-api/WorkItemTrackingApi";

export class AzureDevOpsService {

    private readonly orgUrl: string;
    private readonly authHandler: IRequestHandler;
    private readonly connection: azdev.WebApi;

    constructor(projectName: string, token: string) {
        this.orgUrl = `https://dev.azure.com/${projectName}`;
        this.authHandler = azdev.getPersonalAccessTokenHandler(token);
        this.connection = new azdev.WebApi(this.orgUrl, this.authHandler);
    }

    public async getAllTeams() {
        const coreApi: CoreApi = await this.connection.getCoreApi();
        return await coreApi.getAllTeams(true);
    }

    public async getAllUserStoriesForTeam(team: WebApiTeam): Promise<WorkItem[]> {
        let wi: wi.WorkItemTrackingApi = await this.connection.getWorkItemTrackingApi();
        let teamPath = `[${team.projectName}]\\${team.name}`;

        const query: Wiql = {
            query: `SELECT [System.Id], [System.Title], [System.State] 
                    FROM WorkItems 
                    WHERE ([System.WorkItemType] = 'User Story' OR [System.WorkItemType] = 'Bug')
                    AND [System.AssignedTo] = @Me 
                    AND [System.IterationPath] = @CurrentIteration('${teamPath}') 
                    ORDER BY [System.State] ASC, [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC`
        };

        let res = await wi.queryByWiql(query);

        if (res && res.workItems) {
            const ids: number[] = [];
            res.workItems.forEach((item: WorkItem) => { if (item.id) { ids.push(item.id.valueOf()) } });
            return await wi.getWorkItems(ids);
        }

        return [];
    }

    public async setWorkItemStatus(workItem: WorkItem, status: WorkItemStatus) {
        let wi: wi.WorkItemTrackingApi = await this.connection.getWorkItemTrackingApi();

        if (workItem.id && workItem.fields) {
            let value = "";
            switch (status) {
                case WorkItemStatus.ACTIVE:
                    value = "Active";
                    break;

                case WorkItemStatus.RESOLVE:
                    value = "Resolved";
                    break;

                case WorkItemStatus.CLOSE:
                    value = "Closed";
                    break;
            }

            let docs = [];
            docs.push({
                op: Operation.Replace,
                path: "/fields/System.State",
                value: value
            });

            await wi.updateWorkItem(null, docs, workItem.id, workItem.fields["System.TeamProject"]);
        }
    }
}

export enum WorkItemStatus {
    ACTIVE = 0,
    RESOLVE = 1,
    CLOSE = 2
}