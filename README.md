<h1> Custom Game Lobby</h1>
<p>This tool provides a multiplayer game lobby and game hosting with your input in your webbrowser. The lobby leader, who created a lobby uploads a game file.
If the file is valid to be played, it can be started. There are multiple game modes and types to play. You can only play multiple choice games, like "Who wants to be a millionaire?"</p>

<h2>Files</h2>
<li><code>server.js</code>: This file is the server file for game and webhosting.</li>
<li><code>web</code>: This directory is containing the website.</li>

<h2>Hosting</h2>
<p>Make sure that <code>Node.js</code> is installed.<br>
Write <code>node server.js</code> in windows console to run the server. You get a message in console, if its running.
Return Error on failure. 
Your ip adress will be used to connect to the server. The stanard port for connection is <code>5000</code>. To get access, you have to
type <code>localhost:5000</code>, if its running on the same device or <code>your ipv4:5000</code>, if you reach it from somewhere.</p>
  
<h2>Game types</h2>
<p><li><code>deathmatch</code>: A knockout Battle</li>
<li><code>points</code>: Win with most points</li>
<li><code>path</code>: Knockout, but possible to jump back to earlier questions and do them again. Its possible to create stories like <code>Black Mirror: Bandersnatch</code></li></p>

<h2>Game modes</h2>
<p><li><code>single</code>: Play alone against others</li>
<li><code>team</code>: Play with your team (same color)</li>
<li><code>oneforall</code>: All player play together</li></p>

<h2>Game file</h2>
<p>Note: The whole gamefile has to be a <code>.txt</code> file in <code>JSON</code>.</p>
<h3>Settings</h3>
<h4>Type-Mode:<h4>
<li><code>deathmatch</code>: all modes available</li>
<li><code>points</code>: <code>single</code> or <code>teams</code></li>
<li><code>path</code>: only <code>oneforall</code></li>
<h4>Game Name</h4>
<p><code>gameName</code>: Your Name for this game / story</p>
<h3>Section</h3>
<p>Note: Starting ID have to be <code>1</code></p>
<p>One section is made of:</p>
<li><code>id</code>: Id to jump</li>
<li><code>q</code>: Question to ask</li>
<li><code>a</code>: Array (List) of <code>answers</code></li>
<p>A answer is made of:</p>
<li><code>t</code>: Text of answer</li>
<li><code>jmp</code>: Jump to ID section</li>
<h3>Example:</h3>
  <pre>[
	{
		"id": "settings",
		"gameName": "2 Question Game",
		"type": "deathmatch",
		"mode": "single"
	},
	{
		"id": 1,
		"q": "1+1?'",
		"a":
			[	
				{"t": "4",	"jmp": -1},
				{"t": "3",	"jmp": -1},
				{"t": "5",	"jmp": -1},
				{"t": "2",	"jmp": 2}
			]
	},
	{
		"id": 2,
		"q": "Do you want to win?",
		"a":
			[
				{"t": "No",   "jmp": -1},
				{"t": "Maybe","jmp": -1},
				{"t": "42",   "jmp": -1},
        {"t": "Yes",  "jmp": 0}
			]
	}
]</pre>
<h2>Playing</h2>
<p>Multiple choise. When the game is finished, it tells you if you won or lost.</p>

<h2>Notes</h2>
<p>One Section have to be there to play. There have to be only correct answer, exept you play path.</p>
  <p>IMPORTANT: <code>-1</code> at jmp means <code>lose</code> and <code>0</code> means <code>win</code></p>
