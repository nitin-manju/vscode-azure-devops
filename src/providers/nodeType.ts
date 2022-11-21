export class NodeItemType {
    public static readonly team: string = 'team';
    public static readonly sprint: string = 'sprint';
    public static readonly userstory: string = 'userstory';
    public static readonly bug: string = 'bug';
    public static readonly task: string = 'task';
    public static readonly notfound: string = 'notfound';

    static resolveToNodeItemType(type: string) {
        let ret = "";
        switch (type) {
            case 'User Story':
                ret = NodeItemType.userstory;
                break;

            case 'Bug':
                ret = NodeItemType.bug;
                break;

            case 'Task':
                ret = NodeItemType.task;
                break;
        }

        return ret;
    }
}