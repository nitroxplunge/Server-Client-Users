class AssignEventResponse {
    constructor(accepted, taskid, removed) {
        this.type = "assigneventresponse";
        this.accepted = accepted;
        this.taskid = taskid;
        this.removed = removed;
    }
};

module.exports = AssignEventResponse;