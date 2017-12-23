class Task {
    constructor(tasktype, taskid, contents, userid, open, resolved) {
        this.type = "task";
        this.tasktype = tasktype;
        this.taskid = taskid;
        this.contents = contents;
        this.userid = userid;
        this.open = open;
        this.resolved = resolved;
    }
};

module.exports = Task;