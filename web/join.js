function startjoin(a){
	if(valideName(input2.value)){
		if(a){ // join
			if(valideLobbyId){
				socket.emit('join', { lobby:input1.value, name: input2.value });
			}
		}
		else{ // create
			socket.emit('create',{name:input2.value});
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

function valideName(a){
	if(a.length >= 3){
		const filter = /[^a-zA-Z]+/g;
		if(!filter.test(a)){
			return true;
		}
		else{
			alert("Bitte verwende nur Buchstaben!");
			return false;
		}
	}
	else{
		alert("Dein Name ist zu kurz!");
	}
}
