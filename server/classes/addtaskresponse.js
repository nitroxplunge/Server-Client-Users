class AddTaskResponse {
    constructor(taskid, accepted) {
        this.type = "addtaskresponse";
        this.taskid = taskid;
        this.accepted = accepted;
    }
};

module.exports = AddTaskResponse;