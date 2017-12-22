var ws = new WebSocket('ws://localhost:7308');

function buttonLogin() {
  login(document.getElementById("username").value, document.getElementById("password").value);
}

function login(username, password) {
  var reqjson = JSON.stringify(new LoginRequest(username, password));
  ws.send(reqjson);
}

function requestData(datatype, userid, secret, all) {
  var reqjson = JSON.stringify(new DataRequest(datatype, userid, secret, all));
  console.log(reqjson);
  ws.send(reqjson);
}

function tasksPage(userid, secret, usersession) {
  console.log(usersession);
  usersession.page = "tasks";

  document.getElementById("dashboard").innerHTML = "";

  var taskdiv = document.createElement("div");
  taskdiv.className = "fulltaskdiv";
  taskdiv.id = "taskdiv";
  taskdiv.innerHTML = "<center><p class=\"largetextsection\" style=\"padding-top: 15px; margin-bottom: 0px;\">Unresolved Tasks</p></center>";
  document.getElementById("dashboard").appendChild(taskdiv);

  var innertaskdiv = document.createElement("div");
  innertaskdiv.id = "innertaskdiv";
  document.getElementById("taskdiv").appendChild(innertaskdiv);

  var back = document.createElement("button");
  back.className = "normalbutton";
  back.onclick = function() { loadDash(userid, secret, usersession) };
  back.innerHTML = "Back";
  document.getElementById("taskdiv").appendChild(back);

  requestData("task", userid, secret, true);
}

function loadDash(userid, secret, usersession) {
  usersession.page = "home";

  document.getElementById("dashboard").innerHTML = "";
  var p = document.createElement("p");
  p.className = "largetextsection";
  p.innerHTML = "7308 User Dashboard";
  document.getElementById("dashboard").appendChild(p);

  var taskdiv = document.createElement("div");
  taskdiv.className = "taskdiv";
  taskdiv.id = "taskdiv";
  taskdiv.innerHTML = "<center><p class=\"largetextsection\" style=\"padding-top: 15px; margin-bottom: 0px;\">Active Tasks</p></center>";
  document.getElementById("dashboard").appendChild(taskdiv);

  var innertaskdiv = document.createElement("div");
  innertaskdiv.id = "innertaskdiv";
  document.getElementById("taskdiv").appendChild(innertaskdiv);

  var taskbutton = document.createElement("button");
  taskbutton.className = "normalbutton";
  taskbutton.onclick = function() { tasksPage(userid, secret, usersession) };
  taskbutton.innerHTML = "See All";
  document.getElementById("taskdiv").appendChild(taskbutton);

  requestData("task", userid, secret, false);
}

function requestTask(taskid, userid, secret) {
  var reqjson = JSON.stringify(new AssignEventRequest("task", taskid, userid, secret));
  console.log(reqjson);
  ws.send(reqjson);
}

var usersession = new UserSession(0, "", "home");

ws.onopen = function (event) {
  console.log("Connected to server");
};

ws.onmessage = function (msg) {
  var data = JSON.parse(msg.data);
  //console.log(data);

  if (Object.prototype.toString.call(data) === '[object Array]') {
    if (data.length == 0) {
      document.getElementById("innertaskdiv").innerHTML = "";
      var p = document.createElement("p");
      p.className = "textsection";
      p.color = "darkgray";
      p.innerHTML = "No tasks. Add some with \"See All\"";
      p.style.marginTop = "10px";
      p.style.marginBottom = "10px";
      document.getElementById("innertaskdiv").appendChild(p);
    }
    else if (data[0].type === "task") {
      document.getElementById("innertaskdiv").innerHTML = "";
      for (var i = 0; i < data.length; i++) {
        var div = document.createElement("div");
        div.className = "codetask";
        div.id = "task#" + i;
        document.getElementById("innertaskdiv").appendChild(div);
        var p = document.createElement("p");
        p.innerHTML = data[i].contents;
        document.getElementById("task#" + i).appendChild(p);
        if (data[i].userid == usersession.userid || data[i].open == true) {
          var button = document.createElement("button");
          if (data[i].userid == usersession.userid) {
            button.className = "remtaskbutton";
          } else {
            button.className = "addtaskbutton";
          }
          button.id = data[i].taskid;
          button.onclick = function() { requestTask(this.id, usersession.userid, usersession.secret); console.log("click"); };
          document.getElementById("task#" + i).appendChild(button);

          var resolvebutton = document.createElement("button");
          button.className = "resolvetaskbutton";
          resolvebutton.id = "resolve#" + data[i].taskid;
          resolvebutton.onclick = function() { resolveTask(this.id.split(-1), usersession.userid, usersession.secret); console.log("click"); };
          document.getElementById("task#" + i).appendChild(resolvebutton);
        }
      }
    }
  }

  else if (data.type === "loginresponse") {
    if (data.accepted == true) {

      var loggedin = data.accepted;
      var secret = data.secret;
      var userid = data.userid;
      if (loggedin) {
        usersession.userid = data.userid;
        usersession.secret = data.secret;
      }
      console.log("Logged in");
      document.getElementById("dashboard").innerHTML = "<center><img class=\"loading\" src=\"https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif\"></center>";

      loadDash(userid, secret, usersession);

    } else {
      console.log("Login failed");
      document.getElementById("errmsg").innerHTML = "Login failed. Please try again.";
    }
  }

  else if (data.type === "assigneventresponse") {
    if (data.accepted == true) {
      console.log(data);
      if (data.removed == false) {
        document.getElementById(data.taskid).className = "remtaskbutton";
      } else {
        document.getElementById(data.taskid).className = "addtaskbutton";
        if (usersession.page === "home") {
          loadDash(usersession.userid, usersession.secret, usersession);
        }
      }
    }
  }
};