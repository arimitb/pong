$(() => {
	// Start the game when the user selects which player they want to play as.
	$('.player-select > h1').on('click', e => {
		// Take the selfId (either 0 or 1) from the "data-player" attribute of the button
		// they clicked. data-player is a custom attribute.
		const selfId = parseInt($(e.target).attr('data-player'))

		// If our player is 0, the opponent is 1; the our player is 1, the opponent is 0
		const opponentId = selfId == 0 ? 1 : 0

		// Remove the selection box once the selection has been made.
		$('.player-select').css('display', 'none')

		// Initialise objects (variables) related to the game.
		// The dimensions of the arena dictated here aren't the dimensions of the
		// actual <canvas> element. Rather, they're the "logical dimensions" of the canvas,
		// used to compute things like how much a paddle can move, when is the ball out of bounds, etc.

		// This is because people might be playing on screens of different sizes, in which
		// case we need a consistent size for the Pong arena.

		// The scale multiplier dictates the actual size of the <canvas> element as shown
		// on screen. If the multiplier is 2, the 800px * 400px logical canvas would be
		// displayed as 1600px * 800px on the user's screen.
		let gameInfo = {
			arena: {
				width: 800,
				height: 400
			},
			paddle: {
				width: 10,
				height: 100,
				speed: 4
			},
			scaleMultiplier: 1,
			gameState: 'start',
		}

		// Players is an array of objects. The first element of the array (i.e. players[0])
		// refers to Player 1 (on the left). The second element (players[1]) refers to Player 2.
		
		// The position is calculated from the top left of the paddle.
		// So, in order to place the paddle at the center of the arena, we do:
		// (Height of arena / 2) - (Height of paddle / 2)
		// Or in other words: (Height of arena - Height of paddle) / 2

		// We use the variables "up" and "down" here to know if the player is moving,
		// and if so, in what direction.
		const players = [
			{
				position: (gameInfo.arena.height - gameInfo.paddle.height) / 2,
				score: 0,
				up: false,
				down: false
			},
			{
				position: (gameInfo.arena.height - gameInfo.paddle.height) / 2,
				score: 0,
				up: false,
				down: false
			}
		]
		
		// The ball starts at a certain speed ("startSpeed").
		// It moves faster every time it hits a paddle by a factor of 1.1 (the "acceleration").
		// Once it gets to the "maxSpeed", it stops getting faster and stays at that maxSpeed.

		// The position of the ball is calculated from its centre, so to place it in the middle
		// of the arena we can simply use the formula:
		// X Coordinate: (Width of arena / 2)
		// Y Coordinate: (Height of arena / 2)

		// The velocity of ball is stored in two variables:
		// The velocity in the X axis and Y axis.
		// When X is positive, the ball is moving right.
		// When X is negative, the ball is moving left.
		// When Y is positive, the ball is moving up.
		// When Y is negative, the ball is moving down.
		// A combination of the velocity on the X and Y axis
		// makes the ball move diagonally.
		const ball = {
			radius: 10,
			startSpeed: 5,
			maxSpeed: 10,
			acceleration: 1.1,
			position: {
				x: gameInfo.arena.width / 2,
				y: gameInfo.arena.height / 2
			},
			velocity: {
				x: 0,
				y: 0
			}
		}
		
		// Here we initialise the canvas API.
		// The canvas is what lets us draw whatever we want on the
		// webpage on a pixel-by-pixel basis, similar to Processing.
		// You can learn what the Canvas API is and how to use it over here:
		// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
		const canvas = $('.game-canvas')[0]
		const ctx = canvas.getContext('2d')
		
		// Because of how the Canvas API functions, you cannot use
		// CSS to set the dimensions of the canvas. By default, the
		// dimensions of the canvas element is 300px * 150px
		// If you set the width and height of the canvas element in
		// CSS, it will stretch those same 300 pixels across the width of
		// the screen, and those same 150 pixels across the height.
		// This will create a very blurry and stretch image. Because of this,
		// you should set the dimensions of the canvas element through JavaScript.
		function resizeCanvas () {
			// Here we compare the aspect ratio of the screen to the aspect ratio of the arena.
			// If the screen's aspect ratio is taller than the arena's, then we make the arena
			// fit the width of the screen, leaving space on the top and bottom.
			// Otherwise, we make the arena fit the height of the screen,
			// leaving space on the left and right.

			// The "16:9" aspect ratio can literally be written as "16 / 9" (16 divided by 9) = 1.778
			// Where 16 is the width and 9 is the height. The heigher this number, the wider the screen.
			// These numbers in relation to the screen and the arena is what we compare below.
			if (window.innerWidth / window.innerHeight > gameInfo.arena.width / gameInfo.arena.height) {
				// The screen is wider than the arena.

				// Here we calculate the game's scaleMultiplier mentioned above.
				// The scaleMultiplier is used to translate the "logical" dimensions
				// of the arena into the dimensions of the <canvas> you actually see
				// on screen.
				gameInfo.scaleMultiplier = window.innerHeight / gameInfo.arena.height

				// Here the height of the <canvas> is set to the height of the screen
				// and the width is calculated based on the scale multiplier.
				canvas.height = window.innerHeight
				canvas.width = gameInfo.arena.width * gameInfo.scaleMultiplier
			} else {
				// The screen is taller than the arena.
				gameInfo.scaleMultiplier = window.innerWidth / gameInfo.arena.width
				canvas.width = window.innerWidth
				canvas.height = gameInfo.arena.height * gameInfo.scaleMultiplier
			}
		}
		
		// We need to resize the <canvas> once as soon as the game is initiated in order to
		// override the default size of the canvas.
		resizeCanvas()
		
		// If the window is resized, we need to re-calculate the size of the <canvas>.
		window.addEventListener('resize', () => {
			resizeCanvas()
		})
		
		// The game loop is how we constantly update the position of the ball, the paddles, etc.
		// This function runs approximately 60 times per second (which becomes the framerate of the game).
		// We also check when the ball bounces inside this function.
		function gameLoop () {

			// Update the position of the playeer's paddle based on whether "up" or "down" is active.
			if (players[selfId].up && players[selfId].position > 0) {
				players[selfId].position -= gameInfo.paddle.speed
			} else if (players[selfId].down && players[selfId].position < gameInfo.arena.height - gameInfo.paddle.height) {
				players[selfId].position += gameInfo.paddle.speed
			}

			// Communicate this updated position to the server
			emitPosition()
			
			// Update the position of the ball by adding its velocity to it
			ball.position.x += ball.velocity.x
			ball.position.y += ball.velocity.y

			// If the ball hits the top or bottom of the arena,
			// reverse it's velocity in the Y axis (i.e. make it bounce)

			// Because the position of the ball is calculated from the top-right of the arena,
			// it hits the top wall when its position is 0 + the radius of the ball (since the
			// position of the ball is calculated from its center)
			if (ball.position.y <= ball.radius || ball.position.y >= gameInfo.arena.height - ball.radius) {
				ball.velocity.y *= -1
			}

			// We only check whether our player has lost, not whether they have won.
			// We emit this to the server, so if we get the message that the other
			// player has lost, then we would automatically know that our player has won.
			if (selfId == 0) {
				// Check for player 1

				// Has the ball reached the paddle?
				if (ball.position.x <= gameInfo.paddle.width) {
					// Has our player been able to hit it?
					// (We check this by checking whether the position of the ball is between
					// the position of the paddle and the (position + height) of the paddle.
					// This difference is again because the position of the ball is calculated from its
					// center, whereas the position of the paddle is calculated from its top.)
					if (ball.position.y >= players[0].position && ball.position.y <= players[0].position + gameInfo.paddle.height) {
						// If our player is able to hit it, reverse the velocity of the ball on the
						// X-axis (AKA make it bounce.)
						ball.velocity.x *= -1 * ball.acceleration
						ball.position.x = gameInfo.paddle.width + 1

						// Emit the velocity and position of the ball.
						// This is just to make sure that the position of
						// the ball remains the same between the two players,
						// and isn't out of sync because of any differences in
						// the game's framerate.
						emitRally()
					} else {
						// The player lost. Reset the game, and emit the reset event to
						// the server so the other player resets as well.
						resetGame()
						emitReset()
					}
				}
			} else {
				// Check for player 2
				if (ball.position.x >= gameInfo.arena.width - gameInfo.paddle.width) {
					if (ball.position.y >= players[selfId].position && ball.position.y <= players[selfId].position + gameInfo.paddle.height) {
						ball.velocity.x *= -1
						ball.position.x = gameInfo.arena.width - gameInfo.paddle.width - 1
						emitRally()
					} else {
						resetGame()
						emitReset()
					}
				}
			}
			
			// This is where we actually draw the updates to the <canvas>.

			// Clear the previous frame's <canvas>.
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			
			// Set the color of the game.
			ctx.fillStyle = '#fff'
			
			// fillRect let's us draw rectangles on the canvas and fill them
			// with the color specified above. The four parameters are:
			// (X position, Y position, width, height)
			// Just like the paddles, the position is calculated from the top left.

			// This is also where the scaleMultiplier comes into play.
			// The players' positions, as well as the position of the ball, are
			// relative to the arena. That's why we multiply these by the
			// scaleMultiplier in order to display these elements on the <canvas>
			// at the right size.

			// Draw player 1
			ctx.fillRect(
				0,
				players[0].position * gameInfo.scaleMultiplier,
				gameInfo.paddle.width * gameInfo.scaleMultiplier,
				gameInfo.paddle.height * gameInfo.scaleMultiplier
			)

			// Draw player 2
			ctx.fillRect(
				canvas.width - (gameInfo.paddle.width * gameInfo.scaleMultiplier),
				players[1].position * gameInfo.scaleMultiplier,
				gameInfo.paddle.width * gameInfo.scaleMultiplier,
				gameInfo.paddle.height * gameInfo.scaleMultiplier
			)
			
			// Draw the ball on screen. The parameters are:
			// (X position, Y position, radius, start angle, end angle, clockwise)
			// Just like the ball, the position is calculated relative to the center.
			ctx.beginPath()
			ctx.arc(
				ball.position.x * gameInfo.scaleMultiplier,
				ball.position.y * gameInfo.scaleMultiplier,
				ball.radius * gameInfo.scaleMultiplier,
				0,
				Math.PI * 2,
				false
			)
			// In case of the circle, you need to fill them in separately.
			// This also implies "closePath()", negating the need to specifcy
			// that explicity.
			ctx.fill()
				
			// This line is what tells the browser to run this function
			// again and again, 60 times per second.
			window.requestAnimationFrame(gameLoop)
		}
		
		// This is necessary to start the gameLoop for the first time,
		// before it can continue calling itself.
		gameLoop()
		
		// Reset the ball and the paddles on reset.
		function resetGame () {
			ball.velocity.x = 0
			ball.velocity.y = 0
			ball.position.x = gameInfo.arena.width / 2
			ball.position.y = gameInfo.arena.height / 2
	
			gameInfo.gameState = 'start'
			players[0].position = (gameInfo.arena.height - gameInfo.paddle.height) / 2
			players[1].position = (gameInfo.arena.height - gameInfo.paddle.height) / 2
			players[0].up = false
			players[0].down = false
			players[1].up = false
			players[1].down = false
		}
		
		// Activates up or down for our player
		// when they press the up or down arrow key.
		$(document).on('keydown', e => {
			if (e.key == 'ArrowUp') {
				players[selfId].up = true
			} else if (e.key == 'ArrowDown') {
				players[selfId].down = true
			}
		})
		
		// Deactivates up or down for our player
		// when they release the up or down arrow key.
		$(document).on('keyup', e => {
			if (e.key == 'ArrowUp') {
				players[selfId].up = false
			} else if (e.key == 'ArrowDown') {
				players[selfId].down = false
			} else if (e.key == 'Enter' && gameInfo.gameState == 'start') {
				// Starts the game when the player presses enter.
				startGame()
			}
		})

		// Start the game.
		function startGame(velocity) {
			gameInfo.gameState = 'playing'

			if (velocity) {
				// The other player started the game and set the
				// initial velocity of the ball. Set the ball to
				// the same velocity to synchronise.
				ball.velocity.x = velocity.x
				ball.velocity.y = velocity.y
			} else {
				// Our player started the game. Calculate the
				// initial velocity of the ball and emit it to the server.

				// The initlal velocty is randomised.
				// Math.random() returns a number between 0 and 1.
				// If that number is more than 0.5, the ball starts towards
				// the left, otherwise it starts towards the right.
				ball.velocity.x = (Math.random() > 0.5 ? 1 : -1) * ball.startSpeed

				// Same as above for the Y velocity, except this time we add another
				// Math.random() to vary the actual speed of the ball in the Y axis.
				ball.velocity.y = (Math.random() > 0.5 ? 1 : -1) * Math.random() * ball.startSpeed

				// Emit the new velocity to the server.
				emitStart()
			}
		}

		function emitStart () {
			// Emit start game event along with ball's velocity
		}

		function emitReset () {
			// Emit reset game event
		}

		function emitPosition () {
			// Emit our player's position
		}

		function emitRally () {
			// Emit ball position and velocity
		}
	})
})