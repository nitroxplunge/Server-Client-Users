class ResolveTaskResponse {
    constructor(accepted, taskid) {
        this.type = "resolvetaskresponse";
        this.accepted = accepted;
        this.taskid = taskid;
    }
};

module.exports = ResolveTaskResponse;