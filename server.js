// Grundhosting
var port = 5000;
var hostOrdner = 'web';

var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || port, function(){
	var host = server.address().address;
	console.log('Server started');
	console.log('http://' + host + ':' + port);
});

app.use(express.static(hostOrdner));
var io = require('socket.io')(server);

var lobbys = [];

class Player{
	constructor(id, name){
		this.id = id;
		this.name = name;
		this.color = -1;
		this.points = 0;
		this.type = "player"; // Player / Spectator
		this.answered = false;
	}
}

class Settings{
	constructor(){
		this.mode = "single"; // Single / Team über Farbe / One for all
		this.gameName = "default";
		this.type = "points"; // deathmatch -> Nur id oder -1/ Points nur id oder -1 / Path loops erlaubt
	}
}

class Game{
	constructor(){
		this.sections = [];
		this.settings = null;
		this.curr = 1; // Start id
		this.oldcurr = 1;
		this.status = "running";
		this.allVotes = {}; // {antwort1: [id,id2],}
		this.voteAnz = 0;
	}
	getAnswer(socket, a){
		if(!this.allreadyAnswered(socket.id)){
			if(typeof this.allVotes[a] == "undefined"){
				this.allVotes[a] = [];
			}
			this.allVotes[a].push(socket.id);
			this.voteAnz++;
			return true;
		}
		return false;
	}
	allreadyAnswered(id){
		for(var i in this.allVotes){
			for(var n = 0; n < this.allVotes[i].length; n++){
				if(this.allVotes[i][n].localeCompare(id) == 0){
					return true;
				}
			}
		}
		return false;
	}
	nextSection(){
		if(this.settings.mode == "oneforall"){
			var temp = 0;
			var list = [];
			var answer = -1;
			var all = [];
			for(var i in this.allVotes){
				if(this.allVotes[i].length > temp){
					temp = this.allVotes[i].length;
					list = [];
					list.push(i);
				}
				else if(this.allVotes[i].length == temp){
					list.push(i);
				}
				for(var n = 0; n < this.allVotes[i].length; n++){
					all.push(this.allVotes[i][n]);
				}
			}
			var random = Math.floor(Math.random() * (list.length-1));
			temp = this.getSectionById(list[random]);
			if(temp != -1){
				this.oldcurr = this.curr;
				this.curr = list[random];
				return all; // Return of this Section Winner
			}
			else{
				if(list[random] == 0){
					this.status = "end"; 
					return all; // Return Winner
				}
				else{
					this.status = "end"; 
					return []; // Return Loser
				}	
			}
		}
		else if(this.settings.mode == "single" || this.settings.mode == "team"){
			var winners = [];
			var temp = 0;
			for(var i in this.allVotes){
				if(i != "-1"){
					for(var n = 0; n < this.allVotes[i].length; n++){
						winners.push(this.allVotes[i][n]);
					}
					temp = i;
				}
			}
			if(this.getSectionById(temp) != -1){
				this.oldcurr = this.curr;
				this.curr = temp;
			}
			else{
				if(temp == -1 || temp == 0){
					this.status = "end";
				}
				else{
					var nextCurr = -1;
					var temp2 = this.getSectionById(this.curr);
					for(var i = 0; i < this.sections[temp2].answers.length; i++){
						if(this.sections[temp2].answers[i].jmp >= 0){
							nextCurr = this.sections[temp2].answers[i].jmp;
						}
					}
					if(nextCurr == 0 || nextCurr == -1){
						this.status = "end";
					}
					this.oldcurr = this.curr;
					this.curr = nextCurr;
					
				}
			}
			return winners;
		}
	}
	getSectionById(id){
		for(var i = 0; i < this.sections.length; i++){
			if(this.sections[i].id == id){
				return i;
			}
		}
		return -1;
	}
	returnCurrSection(){
		var temp = getSectionById(this.curr);
		if(temp != -1){
			return this.sections[temp];
		}
		else{
			return null;
		}
	}
}

class Answer{
	constructor(txt, jmp){
		this.txt = txt;
		this.jmp = jmp;
	}
}

class Section{
	constructor(id,question, answers){
		this.id = id;
		this.question = question;
		this.answers = [];
		for(var i = 0; i < answers.length; i++){
			this.answers.push(new Answer(answers[i].t, answers[i].jmp));
		}
	}
}

class Lobby{
	constructor(id,leader){
		this.id = id;
		this.leader = leader;
		this.players = [];
		this.status = "lobby";
		this.settings = null;
		this.uploadedValidFile = false;
		this.game = null;
	}
	getAnswer(socket, id){
		if(this.status == "running"){
			var spec = false;
			for(var i = 0; i < this.players.length; i++){
				if(this.players[i].type == "spectator" && this.players[i].id == socket.id){
					spec = true;
				}
			}
			if(!spec){
				if(this.game.getAnswer(socket, id)){
					var t = this.returnPlayerIndex(socket.id);
					if(t != -1){
						this.players[t].answered = true;
					}
					this.updateAllPlayers();
					if(this.revealAnswers()){
						this.sendAll("revealAnswers");
						var winner = this.game.nextSection();
						this.game.allVotes = {};
						this.game.voteAnz = 0;
						if(this.settings.mode == "oneforall"){
							if(this.game.status == "end"  || winner.length == 0){ // Komplettes Ende
								this.sendAll("win", winner);
								this.status = "end";
							}
							else{
								for(var i = 0; i < this.players.length; i++){
									this.players[i].answered = false;
								}
								this.updateAllPlayers();
								this.sendAll("nextQuestion", this.game.sections[this.game.getSectionById(this.game.curr)]);
							}
						}
						else if(this.settings.mode == "team"){
							var teams = {};
							var anzTeams = 0;
							for(var i = 0; i < this.players.length; i++){
								if(typeof teams[this.players[i].color] == "undefined" && this.players[i].type == "player"){
									teams[this.players[i].color] = [];
									anzTeams++;
								}
								if(Array.isArray(teams[this.players[i].color])){
									teams[this.players[i].color].push(this.players[i].id);
								}
							}
							if(anzTeams > 1){
								if(this.settings.type == "points"){
									this.addPoints(winner);
									for(var i = 0; i < this.players.length; i++){
										this.players[i].answered = false;
									}
									this.updateAllPlayers();
									if(this.game.status == "end"){ // Komplettes Ende
										var pointTeam = 0; // points / index in teams
										var allTeams = [];
										for(var i in teams){
											var tempPoints = 0;
											for(var n = 0; n < teams[i].length; n++){
												var tempPlayer = this.returnPlayerIndex(teams[i][n]);
												if(tempPlayer != -1){
													tempPoints += this.players[tempPlayer].points;
												}
											}
											if(tempPoints > pointTeam){
												pointTeam = tempPoints;
												allTeams = [i];
											}
											else if(tempPoints == pointTeam){
												allTeams.push(i);
											}
										}
										var allWinners = [];
										for(var i = 0; i < allTeams.length; i++){
											for(var n in teams){
												if(n == allTeams[i]){
													for(var s = 0; s < teams[n].length; s++){
														allWinners.push(teams[n][s]);
													}
												}
											}
										}
										console.log("End Game");
										this.sendAll("win", allWinners);
										this.status = "end";
									}
									else{
										this.sendAll("nextQuestion", this.game.sections[this.game.getSectionById(this.game.curr)]);
									}
								}
								else if(this.settings.type == "deathmatch"){
									for(var i in teams){
										var j = false;
										for(var n = 0; n < teams[i].length; n++){
											if(!j){
												for(var p = 0; p < winner.length; p++){
													if(teams[i][n] == winner[p]){
														j = true;
														break;
													}
												}
											}
											else{
												break;
											}
										}
										if(!j){
											for(var n = 0; n < teams[i].length; n++){
												for(var p = 0; p < this.players.length; p++){
													if(this.players[p].id == teams[i][n]){
														this.players[p].type = "spectator";
													}
												}
											}
											delete teams[i];
											anzTeams--;
										}
									}
									for(var i = 0; i < this.players.length; i++){
										this.players[i].answered = false;
									}
									this.updateAllPlayers();
									if(anzTeams <= 1){
										this.game.status = "end";
									}
									if(this.game.status == "end"){ // Komplettes Ende
										console.log("End Game");
										var winnerTeams = [];
										for(var i = 0; i < this.players.length; i++){
											if(this.players[i].type == "player"){
												winnerTeams.push(this.players[i].id);
											}
										}
										this.sendAll("win", winnerTeams);
										this.status = "end";
									}
									else{
										this.sendAll("nextQuestion", this.game.sections[this.game.getSectionById(this.game.curr)]);
									}
								}
							}
							else{
								var winnerTeams = [];
								for(var i = 0; i < this.players.length; i++){
									if(this.players[i].type == "player"){
										winnerTeams.push(this.players[i].id);
									}
								}
								this.sendAll("win", winnerTeams);
								this.sendAll("msg", {id: 0, text: "One team remaining. Game over!"});
								this.status = "end";
							}
						}
						else if(this.settings.mode == "single"){
							if(this.settings.type == "points"){
								this.addPoints(winner);
							}
							else if(this.settings.type == "deathmatch"){
								for(var i = 0; i < this.players.length; i++){
									this.players[i].type = "spectator";
								}
								for(var n = 0; n < winner.length; n++){
									var s = this.returnPlayerIndex(winner[n]);
									if(s != -1){
										this.players[s].type = "player";
									}
								}
								if(winner.length == 0){
									this.game.status = "end";
								}
							}
							var anzPlayers = 0;
							for(var i = 0; i < this.players.length; i++){
								if(this.players[i].type == "player"){
									anzPlayers++;
								}
							}
							if(anzPlayers <= 1){
								this.sendAll("msg", {id: 0, text: "One player remaining. Game over!"});
								this.game.status = "end";
							}
							for(var i = 0; i < this.players.length; i++){
								this.players[i].answered = false;
							}
							this.updateAllPlayers();
							if(this.game.status == "end"){ // Komplettes Ende
								this.status = "end";
								console.log("End Game");
								if(this.settings.type == "points"){
									var tempPoints = 0;
									var allWinners = [];
									for(var i = 0; i < this.players.length; i++){
										if(this.players[i].points > tempPoints){
											allWinners = [this.players[i].id];
											tempPoints = this.players[i].points;
										}
										else if(this.players[i].points == tempPoints){
											allWinners.push(this.players[i].id);
										}
									}
									this.sendAll("win", allWinners);
								}
								else{
									this.sendAll("win", winner);
								}
							}
							else{
								
								this.sendAll("nextQuestion", this.game.sections[this.game.getSectionById(this.game.curr)]);
							}
						}
					}
				}
			}
		}
	}
	returnPlayerIndex(id){
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(id) == 0){
				return i;
			}
		}
		return -1;
	}
	updateAllPlayers(){
		var tempArray = [];
		for(var i = 0; i < this.players.length; i++){
			tempArray.push(this.players[i].id);
		}
		var text = JSON.stringify(tempArray);
		this.sendAll("updatePlayers", text);
	}
	addPoints(data){
		for(var i = 0; i < data.length; i++){
			var temp = this.returnPlayerIndex(data[i]);
			if(temp != -1){
				this.players[temp].points++;
			}
		}
	}
	revealAnswers(){
		var anz = 0;
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].type == "player"){
				anz++;
			}
		}
		if(this.game.voteAnz < anz)
			return false;
		return true;
	}
	addPlayer(id, name){
		this.players.push(new Player(id,name));
	}
	removePlayer(id){
		var temp  = [];
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(id) !== 0){
				temp.push(this.players[i]);
			}
		}
		this.players = temp;
	}
	getPlayerData(from, to){
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(from) === 0){
				var text = JSON.stringify(this.players[i]);
				io.sockets.to(to).emit("getPlayerData",text);
				break;
			}
		}
	}
	nextColor(id){
		var tempColor = -1;
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(id) === 0){		
				if(this.players[i].color >= 7){
					this.players[i].color = 0;
				}
				else{
					this.players[i].color++;
				}
			}
		}
	}
	sendAll(key,data){
		io.in(this.id).emit(key,data);
	}
	getSettingsToAll(){
		this.sendAll("getSettings", this.settings);
	}
	disconnect(socket){
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(socket.id) === 0){
				this.sendAll("msg", {id: 0, text: this.players[i].name + " left the lobby."});
				break;
			}
		}
		socket.leave(this.id);
		this.removePlayer(socket.id);
		console.log("Player left " + this.id);
		this.sendAll("playerleft", socket.id);
		if(this.players.length > 0){
			if(this.status == "lobby"){
				if(socket.id == this.leader){
					this.leader = this.players[0].id;
					this.sendAll("newLeader", this.leader);
					console.log("Lobby " + this.id + " new Leader");
					this.sendAll("msg", {id: 0, text: this.players[0].name + " is the new leader."});
				}
			}
		}
	}
	getWaitingPlayers(){
		var tempArray = [];
		for(var i = 0; i < this.players.length; i++){
			tempArray.push(this.players[i].id);
		}
		var text = JSON.stringify(tempArray);
		this.sendAll("waiting", text);
	}
	join(socket, data){
		if(this.status == "lobby"){
			if(this.players.length < 8){ // MAX PLAYER IN LOBBY
				this.addPlayer(socket.id,data.name);
				this.nextColor(socket.id);
				socket.emit("lobbyId", this.id);
				socket.emit("newLeader", this.leader);
				console.log("Player joined " + data.lobby);
				socket.join(data.lobby);
				this.getWaitingPlayers();
				this.sendAll("msg", {id: 0, text: data.name + " joined the lobby."});
			}
			else{
				socket.emit("servermsg", "This gamelobby is already full!");
			}
		}
		else{
			socket.emit("servermsg", "This gamelobby has already started!");
		}
	}
	updatePlayerColor(socket){
		for(var i = 0; i < this.players.length; i++){
			if(this.players[i].id.localeCompare(socket.id) === 0){
				var text = JSON.stringify(this.players[i]);
				this.sendAll("getPlayerData", text);
				break;
			}
		}
	}
	startGame(socket){
		if(this.players.length > 0){ // MINDESTENS 0 PLAYER TO START
			if(this.game != null && this.settings != null){
				this.status = "running";
				this.getSettingsToAll();
				this.sendAll("startGame",0);
				this.sendAll("nextQuestion", this.game.sections[this.game.getSectionById(this.game.curr)]);
			}
			else{
				socket.emit("servermsg", "There is no game uploaded!. Open 'Game Settings' to upload a game.");
			}
		}
		else{
			socket.emit("servermsg", "There are not enough players to start the game!");
		}
	}
	getSettingsPre(id){
		if(id == this.leader){
			io.sockets.to(id).emit("openSettingsMenu", this.settings);
		}
	}
	getFile(id,data){
		if(!this.uploadedValidFile){
			if(id == this.leader){
				var game = createGame(data.toString());
				if(game != null){
					this.game = game;
					this.settings = this.game.settings;
					this.getSettingsPre(this.leader);
					this.uploadedValidFile = true;
					this.sendAll("msg", {id: 0, text: "Game was uploaded. "});
					this.sendAll("msg", {id: 0, text: "Game Settings:"});
					for(var i in this.settings){
						this.sendAll("msg", {id: 0, text: i + ": " + this.settings[i]});
					}
				}
				else{
					io.sockets.to(id).emit("servermsg", "File is not valid.");
				}
			}
		}
	}
}



// FUNKTIONEN

function createGame(file){
	var game = new Game();
	var obj = null;
	try{
		obj = JSON.parse(file);
	}
	catch(e){
		return null;
	}
	if(!Array.isArray(obj)){
		return null;
	}
	var settings = new Settings;
	var temp = -1;
	
	if((temp = getIdFromArray(obj, "settings")) == 0){
		settings = changeSettings(settings, obj[0]);
		if(!(settings.type == "points" || settings.type == "deathmatch" || settings.type == "path")){
			return null;
		}
		if(!(settings.mode == "oneforall" || settings.mode == "single" || settings.mode == "team")){
			return null;
		}
		if(settings.mode == "oneforall"){
			if(!(settings.type == "path" || settings.type == "deathmatch")){
				return null;
			}
		}
		if(settings.mode == "single" || settings.mode == "team"){
			if(settings.type == "path"){
				return null;
			}
		}
	}
	game.settings = settings;
	var n = 0;
	if(temp == 0){
		n = 1;
	}
	for(var i = n; i < obj.length; i++){
		if(typeof obj[i].id == "number"){
			game.sections.push(new Section(obj[i].id, obj[i].q, obj[i].a));
		}
		else{
			return null;
		}
	}
	if(game.sections.length == 0){
		return null;
	}
	return validGame(game);
}

function validGame(game){
	if(game.getSectionById(1) == -1){
		return null;
	}
	for(var i = 0; i < game.sections.length; i++){
		if(typeof game.sections[i].id != "number" && typeof game.sections[i].question != "string" && Array.isArray(game.sections[i].answers)){
			return null;
		}
		if(game.sections[i].id != Math.round(game.sections[i].id)){
			return null;
		}
		if(game.settings.type != "path"){
			var temp = 0;
			if(game.sections[i].answers.length <= 1){
				return null;
			}
			for(var n = 0; n < game.sections[i].answers.length; n++){
				if(typeof game.sections[i].answers[n].jmp != "number" && typeof game.sections[i].answers[n].txt != "string"){
					return null;
				}
				if(!(game.sections[i].answers[n].jmp == game.sections[i].id + 1 || game.sections[i].answers[n].jmp == 0 || game.sections[i].answers[n].jmp == -1)){
					return null;
				}
			}
		}
	}
	return game;
}

function changeSettings(s1, s2){
	for(var x in s1){
		if(typeof s2[x] == typeof s1[x]){
			s1[x] = s2[x];
		}
	}
	return s1;
}

function getIdFromArray(objArr, id){
	for(var i = 0; i < objArr.length; i++){
		if(objArr[i].id.localeCompare(id) === 0){
			return i;
		}
	}
	return -1;
}

function attributeExist(obj, att){
	for(x in obj){
		if(x == att)
			return true;
	}
	return false;
}

function lobbyExists(id){ // return -1 wenn nicht existitiert sonst return lobbys-index
	for(var i = 0; i < lobbys.length; i++){
		if(lobbys[i].id.localeCompare(id) == 0){
			return i;
		}
	}
	return -1;
}

function createLobby(id, name){
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < 6; i++ ) { // 6 Zeichen Code
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	while(lobbyExists(result) != -1){
		result = '';
		for ( var i = 0; i < 6; i++ ) { // 6 Zeichen Code
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
	}
	lobbys.push(new Lobby(result, id));
	var temp = lobbyExists(result);
	lobbys[temp].addPlayer(id,name);
	lobbys[temp].nextColor(id);
	console.log("Lobby " + result + " created");
	console.log("Player joined " + result);
	return temp;
}

function getPlayerLobby(id){ // return -1 wenn nicht existitiert sonst return lobbys-index des Players
	for(var i = 0; i < lobbys.length; i++){
		for(var n = 0; n < lobbys[i].players.length; n++){
			if(id.localeCompare(lobbys[i].players[n].id) === 0){
				return i;
			}
		}
	}
	return -1;
}

// Verbindungstypen
io.sockets.on('connection', function(socket) {
	socket.on('create', function(data) {
		var temp2 = createLobby(socket.id,data.name);
		if(temp2 != -1){
			socket.emit("lobbyId", lobbys[temp2].id);
			socket.emit("newLeader", lobbys[temp2].leader);
			socket.join(lobbys[temp2].id);
			lobbys[temp2].getWaitingPlayers();
			socket.emit("msg", {id: 0, text: data.name + " joined the lobby."});
		}
	});
	socket.on('join', function(data) {
		var temp = lobbyExists(data.lobby);
		if(temp != -1){
			lobbys[temp].join(socket, data);
		}
		else{
			socket.emit("servermsg", "This gamelobby does not exist!");
		}
		
	});
	socket.on('disconnect', function() {
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].disconnect(socket);
			if(lobbys[temp].players.length == 0){
				console.log("Lobby " + lobbys[temp].id + " deleted");
				lobbys.splice(temp, 1);
			}
		}
	});
	socket.on('nextColor', function(data) {
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].nextColor(socket.id);
			lobbys[temp].updatePlayerColor(socket);
		}
	});
	socket.on("msg", function(data){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].sendAll("msg", {id:socket.id, text:data});
		}
	});
	socket.on("giveAnswer", function(data){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].getAnswer(socket, data);
		}
	});
	socket.on("getPlayerData", function(data){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].getPlayerData(data, socket.id);
		}
	});
	socket.on("getSettings", function(data){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].getSettings(socket.id);
		}
	});
	socket.on("getSettingsPre", function(){ // leader looking Settings / Upload game file
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].getSettingsPre(socket.id);
		}
	});
	socket.on("startGame", function(){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].startGame(socket);
		}
	});
	socket.on("getFile", function(data){
		var temp = getPlayerLobby(socket.id);
		if(temp != -1){
			lobbys[temp].getFile(socket.id,data);
		}
	})
});
