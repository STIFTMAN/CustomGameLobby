var socket = io();
var players = []; // Player-Data independent from Game-Player-Data
var lobby = {status: "lobby"};
var buttonSound = new Audio("sound2.mp3");
var resetSound = new Audio("sound1.mp3");
var winSound = new Audio("sound3.mp3");
var timer = null;
var timer_time = 0;
var timer_max = 0;

function clickButtonSound(){
	buttonSound.play();
	buttonSound.currenTime = 0;
}

function clickResetSound(){
	resetSound.play();
	resetSound.currenTime = 0;
}

class Player{
	constructor(id){
		this.id = id;
	}
	update(){
		if(document.getElementById(this.id)){
			if(this.type == "player"){
				document.getElementById(this.id).style.backgroundColor = getColor(this.color);
				if(!this.answered){
					document.getElementById(this.id).style.borderBottom = "5px orange solid";
				}
				else{
					document.getElementById(this.id).style.borderBottom = "none";
				}
				if(lobby.settings.type == "points"){
					document.getElementById(this.id).innerHTML = this.name + '<br>' + this.points;
				}
				else{
					document.getElementById(this.id).innerHTML = this.name; 
				}
			}
			else{
				document.getElementById(this.id).style.backgroundColor = "#CCC";
				document.getElementById("container").style.zIndex = "-1";
			}
		}
	}
}

function playerExists(id){
	for(var i = 0; i < players.length; i++){
		if(players[i].id.localeCompare(id) === 0){
			return i;
		}
	}
	return -1;
}

function getColor(i){
	if(i == 0){
		return "#000";
	}
	else if(i == 1){
		return "#00F";
	}
	else if(i == 2){
		return "#0F0";
	}
	else if(i == 3){
		return "#0FF";
	}
	else if(i == 4){
		return "#F00";
	}
	else if(i == 5){
		return "#F0F";
	}
	else if(i == 6){
		return "#BB0";
	}
	else if(i == 7){
		return "#DDD";
	}
}

function getMsg(data){
	if(document.getElementById("chat")){
		var node = document.createElement("LI");
		var temp = playerExists(data.id);
		if(temp != -1){
			node.style.color = getColor(players[temp].color);
		}
		else{
			node.style.color = "#167e1a";
		}
		if(data.id != 0){
			node.innerHTML = players[temp].name + ": " + data.text;
		}
		else{
			node.innerHTML = data.text;
		}
		document.getElementById("output").appendChild(node);
		document.getElementById("output").scrollTop = document.getElementById("output").scrollHeight;
	}
}

function openSettingsMenu(data){
	closeSettingsMenu();
	if(!document.getElementById("settingsDIV")){
		var node = document.createElement("DIV");
		node.id = "settingsDIV";
		if(data == null){
			node.innerHTML = "<h2>Upload Game File</h2><fieldset id='uploadcontainer'><legend>Drag & Drop .txt file</legend></fieldset><h2 id='settingsButtons'><button onclick='closeSettingsMenu()'>Cancel</button></h2>";
		}
		else{
			node.innerHTML = "<h2>Game Settings</h2><ul id='settingsList'></ul><h2 id='settingsButtons'><button onclick='closeSettingsMenu()'>Cancel</button></h2>";
		}
		document.body.appendChild(node);
		if(data == null){
			document.getElementById("uploadcontainer").addEventListener('drop', handleDrop, false);
			;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
				document.getElementById("uploadcontainer").addEventListener(eventName, preventDefaults, false)
			});
		}
		else{
			lobby.settings = data;
			for(var i in lobby.settings){
				var node = document.createElement("LI");
				node.innerHTML = i + ":<i class='right'>" + lobby.settings[i] + "</i>";
				document.getElementById("settingsList").appendChild(node);
			}
		}
	}
}

function closeSettingsMenu(){
	if(document.getElementById("settingsDIV")){
		document.getElementById("settingsDIV").remove();
	}
}

function preventDefaults (e) { 				// Für Upload Drag&Drop
	e.preventDefault();
	e.stopPropagation();
}

function handleDrop(e) {					// Drag&Drop
	if(document.getElementById("uploadcontainer")){
		let file = e.dataTransfer.files[0];
		if(typeof file != "undefined"){
			if(file.type == "text/plain"){
				socket.emit("getFile", file);
			}
			else{
				alert("Your file is no '.txt' file.");
			}
		}
	}
}

function stopTimer(){
	clearInterval(timer);
	if(timer_time <= 0.0){
		socket.emit("giveAnswer",-1);
	}
	if(document.getElementById("timer")){
		document.getElementById("timer").remove();
	}
}

function handleTimer(){
	//timer_time = Math.round((timer_time - 0.1)*100) / 100;
	timer_time--;
	if(timer_time >= 0.0){
		document.getElementById("timer").innerHTML = timer_time;
		var color = Math.abs(Math.round((timer_time/timer_max)*255));
		document.getElementById("timer").style.backgroundColor = "rgb(" + (255-color) + "," + color + ",0)";
	}
	if(timer_time <= 0.0){
		stopTimer();
	}
}

function startTimer(data){
	if(!document.getElementById("timer")){
		var node = document.createElement("DIV");
		node.id = "timer";
		node.innerHTML = data;
		document.body.appendChild(node);
	}
	timer_time = data;
	timer_max = data;
	timer = setInterval(handleTimer, 1000);
}

function copyId(){
	var TempText = document.createElement("input");
	TempText.value = document.getElementById("lobbyid").innerHTML;
	document.body.appendChild(TempText);
	TempText.select();

	document.execCommand("copy");
	document.body.removeChild(TempText);

	alert("Copied to Clipboard: " + TempText.value);
}

socket.on("startGame", function(data){
	if(document.getElementById("waiting")){
		document.getElementById("waiting").remove();
	}
	var node = document.createElement("DIV");
	node.id = "container";
	node.innerHTML = "<table id='headertable'><tr id='header'><td>" + lobby.settings.gameName + "</td><tr></table><div id='questions'></div>";
	document.body.appendChild(node);
	var chat = document.getElementById("chat");
	document.getElementById("chat").remove();
	document.body.appendChild(chat);
	var inputChat = document.getElementById("inputChat");
	document.getElementById("inputChat").remove();
	inputChat.style.width = "20%";
	inputChat.style.right = "0";
	document.body.appendChild(inputChat);
	document.getElementById("chat").style.zIndex = "-1";
	for(var i = 0; i < players.length; i++){
		var node2 = document.createElement("td");
		node2.id = players[i].id;
		node2.className = "player";
		document.getElementById("header").appendChild(node2);
		players[i].update();
	}
	lobby.status = "running";
});

socket.on("win", function(data){
	var j = false;
	for(var i = 0; i < data.length; i++){
		if(socket.id == data[i]){
			j = true;
		}
	}
	var node = document.createElement("DIV");
	node.style.width = "100%";
	node.style.height = "100%";
	node.style.position = "fixed";
	node.style.zIndex = "10";
	node.style.top = "0";
	node.style.opacity = "0.2";
	if(j){
		winSound.play();
		getMsg({id: 0, text:"You won!"});
		node.style.backgroundImage = "url('win.gif')";
	}
	else{
		getMsg({id: 0, text:"You lost!"});
		node.style.backgroundImage = "url('lose.gif')";
	}
	document.body.appendChild(node);
});

socket.on("nextQuestion",function(data){
	clickResetSound();
	if(!document.getElementById("q")){
		var node = document.createElement("DIV");
		node.id = "q";
		node.innerHTML = data.question;
		document.getElementById("container").appendChild(node);
	}
	else{
		document.getElementById("q").innerHTML = data.question;
	}
	if(!document.getElementById("a")){
		node = document.createElement("ul");
		node.id = "a";
		document.getElementById("container").appendChild(node);
	}
	else{
		document.getElementById("a").innerHTML = "";
	}
	for(var i = 0; i < data.answers.length; i++){
		var node2 = document.createElement("LI");
		node2.innerHTML = data.answers[i].txt;
		node2.id = data.answers[i].jmp;
		node2.onclick = function(){
			clickButtonSound();
			socket.emit("giveAnswer",this.id);
			stopTimer();
		}
		document.getElementById("a").appendChild(node2);
	}
	if(lobby.settings.timer >= 5){
		startTimer(lobby.settings.timer);
	}
});

socket.on("servermsg", function(data){
	alert(data);
});

socket.on("msg", function(data){
	getMsg(data);
});

socket.on("waiting", function(data){ // Spieler werden aktualisiert
	document.getElementById("waitingPlayers").innerHTML = "";
	players = [];
	for(var x in data){
		if(data.hasOwnProperty(x)){
			socket.emit("getPlayerData",data[x]);
		}
	}
});

socket.on("updatePlayers",function(data){
	for(var x in data){
		if(data.hasOwnProperty(x)){
			socket.emit("getPlayerData",data[x]);
		}
	}
});

socket.on("playerleft", function(data){
	var temp = [];
	for(var i = 0; i < players.length; i++){
		if(data.localeCompare(players[i].id) !== 0){
			temp.push(players[i]);
		}
		else{
			document.getElementById(players[i].id).remove();
		}
	}
	players = temp;
});

socket.on("newLeader", function(data){
	lobby.leader = data;
	if(lobby.leader == socket.id){ // Button mit Lobbyeinstellungen und start button
		var node = document.createElement("h2");
		var string = "";
		node.id = "settingsButtons";
		string += "<button class='buttonleft' onclick='socket.emit(" + '"getSettingsPre", 0' + ");'>Game Settings</button>";
		string += "<button class='buttonright' onclick='socket.emit(" + '"startGame", 0 ' + ");'>Start Game</button>";
		node.innerHTML = string;
		document.getElementById("waiting").appendChild(node);
	}
	var string = "";
	var temp = playerExists(lobby.leader);
	if(temp != -1){
		if(players[temp].id == socket.id){
			string += "(You) ";
		}
		if(lobby.leader == players[temp].id){
			string += "(Leader) ";
		}
		string += players[temp].name;
		if(string != document.getElementById(players[temp].id).innerHTML){
			document.getElementById(players[temp].id).innerHTML = string;
		}
	}
});

socket.on("getPlayerData",function(data){
	var obj = JSON.parse(data);
	var temp = playerExists(obj.id);
	var newPlayer = new Player(obj.id);
	for(var x in obj){
		if(obj.hasOwnProperty(x)){
			newPlayer[x] = obj[x];
		}
	}
	if(temp == -1){
		players.push(newPlayer);
	}
	else{
		players[temp] = newPlayer;
	}
	if(lobby.status == "lobby"){
		if(temp == -1){
			var node = document.createElement("LI");
			node.id = newPlayer.id;
			var string = "";
			if(newPlayer.id == socket.id){
				string += "(You) ";
			}
			if(lobby.leader == newPlayer.id){
				string += "(Leader) ";
			}
			string += newPlayer.name;
			node.innerHTML = string;
			node.style.color = getColor(newPlayer.color);
			document.getElementById("waitingPlayers").appendChild(node);
		}
		else{
			var string = "";
			if(players[temp].id == socket.id){
				string += "(You) ";
			}
			if(lobby.leader == players[temp].id){
				string += "(Leader) ";
			}
			string += players[temp].name;
			if(string != document.getElementById(players[temp].id).innerHTML){
				document.getElementById(players[temp].id).innerHTML = string;
			}
			document.getElementById(players[temp].id).style.color = getColor(players[temp].color);
		}
	}
	else{
		players[temp].update();
	}
});

socket.on("lobbyId", function(data){
	if(document.getElementById("join")){
		document.getElementById("join").remove();
	}
	if(!document.getElementById("waiting")){
		var div = document.createElement("DIV");
		div.id = "waiting";
		var string = "<h1>Waiting for Players ...</h1>";
		string += "<h2>The leader has to start the game.</h2>";
		string += "<h2 id='waitingButtons'><button onclick='socket.emit(" + '"nextColor", 0' + ");'>Change Color</button> ";
		string += "Lobby-Id: <div id='lobbyidcontainer'><em id='lobbyid'>" + data + "</em><button onclick='copyId()'>Copy</button></div></h2>";
		string += "<h1>Players in Lobby</h1>";
		string += "<ul id='waitingPlayers'></ul>";
		div.innerHTML = string;
		document.body.appendChild(div);
		var div = document.createElement("DIV");
		div.id = "chat";
		var string = "<ul id='output'></ul><input type='text' id='inputChat'>";
		div.innerHTML = string;
		document.body.appendChild(div);
	}
});

socket.on("getSettings", function(obj){
	var settings = {};
	for(var x in obj){
		if(obj.hasOwnProperty(x)){
			settings[x] = obj[x];
		}
	}
	lobby.settings = settings;
});

socket.on("openSettingsMenu", function(data){
	openSettingsMenu(data);
});
document.addEventListener('keypress', keyPressed);

function keyPressed(e) { // Chat sachen
	if(document.getElementById("inputChat")){
		if(document.getElementById("inputChat").value != ""){
			if(e.code == "Enter"){
				socket.emit("msg", document.getElementById("inputChat").value);
				document.getElementById("inputChat").value = "";
			}
		}
	}
}
