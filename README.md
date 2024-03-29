<h1>Custom Game Lobby</h1>
<p>This tool provides a multiplayer game lobby and game hosting with your input in your webbrowser. The lobby leader, who created a lobby uploads a game file.
If the file is valid to be played, it can be started. There are multiple game modes and types to play. You can only play multiple choice games, like "Who wants to be a millionaire?"</p>

<h2>Files</h2>
<li><code>server.js</code>: This file is the server file for game and webhosting.</li>
<li><code>web</code>: This directory is containing the website.</li>

<h2>Hosting</h2>
<p>Make sure that <code>Node.js</code> is installed.<br>
Write <code>node server.js</code> in windows console to run the server. You get a message in console, if its running.
Return Error on failure. 
Your ip adress will be used to connect to the server. The standard port for connection is <code>5000</code>. To get access, you have to
type <code>localhost:5000</code>, if its running on the same device or <code>your ipv4:5000</code>, if you reach it from somewhere.</p>
  
<h2>Game types</h2>
<p><li><code>deathmatch</code>: A knockout Battle <em>(only 1 right answer)</em></li>
<li><code>points</code>: Win with most points <em>(only 1 right answer)</em></li>
<li><code>path</code>: Knockout, but possible to jump back to earlier questions and do them again <em>(multiple right answers)</em>. Its possible to create stories like <code>Black Mirror: Bandersnatch</code></li></p>

<h2>Game modes</h2>
<p><li><code>single</code>: Play alone against others</li>
<li><code>team</code>: Play with your team (same color)</li>
<li><code>oneforall</code>: All player play together</li></p>

<h2>Game file</h2>
<p>Note: The whole gamefile has to be a <code>JSON</code> file.</p>
<h3>Settings</h3>
<p>The settings object have to be on top of the file with an id of <code>settings</code>.</p>
<h4>Type-Mode:</h4>
<li><code>deathmatch</code>: <code>single</code>,<code>teams</code> and <code>oneforall</code></li>
<li><code>points</code>: <code>single</code> or <code>teams</code></li>
<li><code>path</code>: only <code>oneforall</code></li>
<h4>Game Name</h4>
<p><code>gameName</code>: Your Name for this game / story</p>
<h4>Shuffle</h4>
<p><code>shuffle</code>: Shuffle the answers or not</p>
<h4>Timer</h4>
<p><code>timer</code>: Time (in seconds) to answer a question.</p>
<p>Note: Minimum of <code>5</code> seconds have to be set to enable the time.</p>
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
		"mode": "single",
		"shuffle": true,
		"timer": 90
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
<h3>Errors</h3>
<p>If the uploaded gamefile is invalid, the exact error will be shown in chat.</p>
<h2>Playing</h2>
<p>Multiple choise. When the game is finished, it tells you if you won or lost. Max. 8 Players. There is no timelimit. If you play <code>deathmatch</code> and you are out, you can spectate the game.</p>

<h2>New</h2>
<p><em>Private</em> and <em>Public</em> lobbys.</p>
<p>You can only join a <em>Private</em> lobby by its ID</p>
<p>If <em>Public</em> is set, everyone can join you game, because it is shown in a public list.</p>
<h2>Notes</h2>
<p>One Section have to be there to play. There have to be only correct answer, exept you play path. If you want to play alone, choose 'oneforall', else it needs 2 players to start.</p>
  <p>IMPORTANT: <code>-1</code> at jmp means <code>lose</code> and <code>0</code> means <code>win</code>. <code>-1</code> will be ignored, if <code>points</code> is set.</p>
