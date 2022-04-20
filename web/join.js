var username = "";

function join(){
	if(valideName(username)){
		if(valideLobbyId(document.getElementById("lobbyid").value)){
			socket.emit('join', { lobby:document.getElementById("lobbyid").value, name: username });
		}
	}
}

function valideLobbyId(a){
	if(a.length == 6){
		const filter = /[^a-zA-Z0-9]+/g;
		if(!filter.test(a)){
			return true;
		}
		else{
			alert("Unguelitige Zeichen fuer die Lobby-Id verwendet!");
			return false;
		}
	}
	else{
		alert("Eine Lobby-Id ist 6 Zeichen lang!");
	}
}

function refresh(){
	socket.emit("getLobbyInfo");
}

socket.on("returnLobbyList", function(data){
	document.getElementById("publicLobbys").innerHTML = "";
	if(data.length == 0){
		document.getElementById("publicLobbys").innerHTML = "No Public Lobbys";
	}
	else{
		for(var i = 0; i < data.length; i++){
			var node = document.createElement("div");
			node.className = "activeLobby";
			node.innerHTML = data[i].players + "/8 Players";
			node.lobbyid = data[i].id;
			node.onclick = function(){
				socket.emit('join', { lobby:this.lobbyid, name: username });
			}
			document.getElementById("publicLobbys").appendChild(node);
		}
	}
});

function playNext(){
	if(valideName(document.getElementById("name").value)){
		username = document.getElementById("name").value;
		document.getElementById("join").innerHTML = "";
		var node = document.createElement("ul");
		var li1 = document.createElement("li");
		li1.innerHTML = "<details><summary onclick='refresh()'>Public Lobbys</summary><p id='publicLobbys'></p><p><button onclick='refresh()'>Refresh</button></p></details>";
		node.appendChild(li1);
		var li2 = document.createElement("li");
		li2.innerHTML = "<details><summary>Private Lobby</summary><p><input id='lobbyid' placeholder='Lobbyid'><button onclick='join()'>Join</button></p></details>";
		node.appendChild(li2);
		var li3 = document.createElement("li");
		li3.innerHTML = "Create Lobby";
		li3.onclick = function(){
			socket.emit('create',{name:username});
		}
		node.appendChild(li3);
		var li4 = document.createElement("li");
		li4.innerHTML = "Change Name";
		li4.onclick = function(){
			location.reload();
		}
		node.appendChild(li4);
		document.getElementById("join").appendChild(node);
	}
}

function valideName(a){
	if(a.length >= 3){
		const filter = /[^a-zA-Z]+/g;
		if(!filter.test(a)){
			return true;
		}
		else{
			alert("Only use letters!");
			return false;
		}
	}
	else{
		alert("Name too short!");
	}
}
