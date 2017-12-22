class Task {
    constructor(tasktype, taskid, contents, userid, open, done) {
        this.type = "task";
        this.tasktype = tasktype;
        this.taskid = taskid;
        this.contents = contents;
        this.userid = userid;
        this.open = open;
        this.done = done;
    }
};

module.exports = Task;