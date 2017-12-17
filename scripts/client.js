var ws = new WebSocket('ws://localhost:8080');

function login(LoginRequest) {
  var reqjson = JSON.stringify(LoginRequest);
  ws.send(reqjson);
}

ws.onopen = function (event) {
  login(new LoginRequest("test", "test"));
};
ws.addEventListener('message', function (event) {
  console.log(event.data);
  var data = JSON.parse(event.data);
  if (data.type === "loginresponse") {
    console.log(data.accepted + ", " + data.userid + ", " + data.secret);
  }
});