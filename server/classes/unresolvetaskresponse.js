class UnresolveTaskResponse {
    constructor(accepted, taskid) {
        this.type = "unresolvetaskresponse";
        this.accepted = accepted;
        this.taskid = taskid;
    }
};

module.exports = UnresolveTaskResponse;