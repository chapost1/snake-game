const Directions =  {
	LEFT: "ArrowLeft",
	RIGHT: "ArrowRight",
	UP: "ArrowUp",
	DOWN: "ArrowDown",
};

const DirectionsToDeg =  {
	[Directions.LEFT]: "90deg",
	[Directions.RIGHT]: "-90deg",
	[Directions.UP]: "180deg",
	[Directions.DOWN]: "0deg",
};

class SnakeGame {
	isRunning = false;
	paused = true;
	gameOver = false;
	score = 0;
	record = 0;
	gameBoard = null;
	direction = null;

	constructor(direction, start = false) {
		this.direction = direction || Directions.RIGHT;
		this.resetGame();

		if(start) {
			this.isRunning = true;
			this.toggleStatus();
		}
	}

	resetGame() {
		let that = this;
		this.gameOver = false;
		this.score = 0;
		const controlPanelScore = document.getElementById("control-panel-item-inner-score");
		if(controlPanelScore) {
			controlPanelScore.innerHTML = String(this.score);
		}
		this.direction = Directions.RIGHT;
		if(this.gameBoard) {
			this.gameBoard.removeListener('gameOver');
		}
		this.gameBoard = new GameBoard(this.direction);
		this.gameBoard.on('gameOver', function(score){
			that.gameOver = true;
			that.score = score;
			if(that.score > that.record) {
				that.record = that.score;
				const controlPanelRecord = document.getElementById("control-panel-item-inner-record");
				if(controlPanelRecord) {
					controlPanelRecord.innerHTML = String(that.record);
				}
			}
			that.toggleStatus();
			that.isRunning = false;

			const gameOverPopup = document.getElementById("game-over");
			const gameOverBackdrop = document.getElementById("game-backdrop-layer");
			if(gameOverPopup) {
				gameOverPopup.style.display = "block";
			}
			if(gameOverBackdrop) {
				gameOverBackdrop.style.display = "block";
			}
		});

		const gameOverPopup = document.getElementById("game-over");
		const gameOverBackdrop = document.getElementById("game-backdrop-layer");
		if(gameOverPopup) {
			gameOverPopup.style.display = "none";
		}
		if(gameOverBackdrop) {
			gameOverBackdrop.style.display = "none";
		}

		setTimeout(()=> {
			that.gameBoard.render();
			that.gameBoard.setEntities();
		}, 300)
	}

	changeDirection(direction) {
		if(!this.gameOver) {
			const okay = this.gameBoard.changeDirection(direction);
			if (okay) {
				this.direction = direction;
			}
		}
	}

	toggleStatus() {
		const pauseLayer = document.getElementById("game-board-paused-layer");
		this.paused = !this.paused;
		if(this.paused) {
			pauseLayer.classList.add("active");
		} else {
			pauseLayer.classList.remove("active");
			if(!this.isRunning) {
				this.resetGame();
				this.isRunning = true;
			}
		}
		this.gameBoard.toggleStatus(this.paused);
	}
}

class GameBoard extends EventEmitter {
	static columnRowsNumber = 15;
	static defaultSnakeLength = 4;

	static snakeSymbol = "S";
	static snakeHeadSymbol = "H";
	static appleSymbol = "A";

	static defaultEntitiesPositions = {
		snake: {
			Y: 7,
			X: 1
		},
		apple: {
			Y: 7,
			X: 10
		}
	};

	score = 0;
	board = GameBoard.defaultBoard;
	direction = null;
	paused = true;
	canChangeDirection = true;
	appleLocation = {
		row: GameBoard.defaultEntitiesPositions.apple.Y,
		column: GameBoard.defaultEntitiesPositions.apple.X
	};

	snake = [];

	snakeMovingNextTaskHolder = null;

	constructor(direction = Directions.RIGHT) {
		super();

		this.direction = direction;

		this.snake = this.newSnake();
	}

	setEntities() {
		const gameBoardWithEntities = document.getElementById("game-board-with-entities");
		gameBoardWithEntities.innerHTML = "";
		this.board.forEach(row => {
			const rowElementWithEntities = document.createElement("div");
			rowElementWithEntities.className = "board-row";

			row.forEach(column => {
				const columnElementWithEntities = document.createElement("div");
				columnElementWithEntities.classList.add("board-entity-square");

				if(column !== null) {
					switch (column) {
						case GameBoard.snakeSymbol: {
							columnElementWithEntities.classList.add("snake");
							break;
						}
						case GameBoard.snakeHeadSymbol: {
							columnElementWithEntities.classList.add("snake-head");
							columnElementWithEntities.style.transform = `rotate(${DirectionsToDeg[this.direction]}) scale(1.1)`;
							break;
						}
						case GameBoard.appleSymbol: {
							columnElementWithEntities.classList.add("apple");
							break;
						}
					}
				}

				rowElementWithEntities.appendChild(columnElementWithEntities);
			});

			gameBoardWithEntities.appendChild(rowElementWithEntities);
		});

	}

	render() {
		const gameBoard = document.getElementById("game-board");
		gameBoard.innerHTML = "";

		for(let y = 0; y < GameBoard.columnRowsNumber; y++) {
			const rowElement = document.createElement("div");
			rowElement.className = "board-row";

			for(let x = 0; x < GameBoard.columnRowsNumber; x++) {
				const columnElement = document.createElement("div");
				columnElement.className = "board-square";

				rowElement.appendChild(columnElement);
			}

			gameBoard.appendChild(rowElement);
		}
	}

	setApple() {
		let okay = false;
		while(!okay) {
			const potentialRow = Math.floor(Math.random() * GameBoard.columnRowsNumber);
			const potentialColumn = Math.floor(Math.random() * GameBoard.columnRowsNumber);
			if(this.board[potentialRow][potentialColumn] === null) {
				okay = true;
				this.appleLocation.row = potentialRow;
				this.appleLocation.column = potentialColumn;
				this.board[potentialRow][potentialColumn] = GameBoard.appleSymbol;
			}
		}
	}

	changeDirection(direction) {
		let okay = false;

		if(this.canChangeDirection && this.direction !== direction) {

			switch (direction) {
				case Directions.UP: {
					if (this.direction !== Directions.DOWN) {
						okay = true;
					}
					break;
				}
				case Directions.DOWN: {
					if (this.direction !== Directions.UP) {
						okay = true;
					}
					break;
				}
				case Directions.LEFT: {
					if (this.direction !== Directions.RIGHT) {
						okay = true;
					}
					break;
				}
				case Directions.RIGHT: {
					if (this.direction !== Directions.LEFT) {
						okay = true;
					}
					break;
				}
			}
			if (okay) {
				this.canChangeDirection = false;
				this.direction = direction;
			}
		}
		return okay;
	}

	toggleStatus(paused) {
		if(paused) {
			// paused
			if(this.snakeMovingNextTaskHolder) {
				clearTimeout(this.snakeMovingNextTaskHolder);
			}
		} else {
			// set task
			this.assignSnakeMovingForwardTask();
		}
	}

	assignSnakeMovingForwardTask() {
		if(this.snakeMovingNextTaskHolder) {
			this.canChangeDirection = true;
			clearTimeout(this.snakeMovingNextTaskHolder);
		}

		const minimumTimeoutValue = 100;
		let downer = 3;
		if(this.score >= 12) {
			downer = 2
		}
		let timeOutValue = 200 - (this.score * downer);
		if(timeOutValue < minimumTimeoutValue) {
			timeOutValue = minimumTimeoutValue;
		}

		this.snakeMovingNextTaskHolder = setTimeout(
			() => this.snakeMovingNextTask(),
			timeOutValue);
	}

	snakeMovingNextTask() {
		const result  = this.getNextSnakePositionByDirection();
		if(!result.okay) {
			this.emit('gameOver', this.score);
			this.score = 0;
		} else {
			const newHeadPositions = {current: result.currentPosition, next: result.nextPosition};
			// update all snake body parts
			const lastForApple = this.updateSnakeBodyPartsPositions(newHeadPositions);
			if(result.apple) {
				this.score++;
				const controlPanelScore = document.getElementById("control-panel-item-inner-score");
				if(controlPanelScore) {
					controlPanelScore.innerHTML = String(this.score);
				}
				// add next body part using unshift
				this.snake.unshift(lastForApple);

				this.updateEntitiesBoard();

				this.setApple();
			} else {
				this.updateEntitiesBoard();

				if(this.board[this.appleLocation.row][this.appleLocation.column] === null) {
					this.board[this.appleLocation.row][this.appleLocation.column] = GameBoard.appleSymbol;
				}
			}

			this.setEntities();

			this.assignSnakeMovingForwardTask();
		}
		this.canChangeDirection = true;
	}

	updateEntitiesBoard() {
		const board = Array(GameBoard.columnRowsNumber).fill(null);
		for(let i = 0; i < GameBoard.columnRowsNumber; i++) {
			board[i] = new Array(GameBoard.columnRowsNumber).fill(null);
		}

		this.snake.forEach((snakeBodyPart, index, array) => {
			let symbol = GameBoard.snakeSymbol;
			if(index === array.length -1) {
				symbol = GameBoard.snakeHeadSymbol;
			}
			board[snakeBodyPart.positions.current.Y][snakeBodyPart.positions.current.X] = symbol;
		});
		this.board = board;
	}

	updateSnakeBodyPartsPositions(nextHeadPosition) {
		const lastForApple = this.snake[0];
		const tempSnake = [];

		const newHead = new SnakeBodyPart({current: nextHeadPosition.current, next: nextHeadPosition.next});

		const otherBodyParts = this.snake.slice(0, this.snake.length);
		otherBodyParts.forEach((bodyPart, index, array) =>{
			// take the next body part pose to the current
			if(array[index + 1] && array[index + 1] !== undefined) {
				tempSnake.push(new SnakeBodyPart({current: array[index + 1].positions.current, next: array[index + 1].positions.next}))
			}
		});
		// update head to have the new head pose
		tempSnake.push(newHead);
		this.snake = tempSnake;
		return lastForApple;
	}

	getNextSnakePositionByDirection() {
		const current = this.snake[this.snake.length - 1].positions.current;

		const result = {okay: false, apple: false, currentPosition: {Y: current.Y, X: current.X}, nextPosition: {Y: current.Y, X: current.X}};


		let nextCellStatus = null;

		switch (this.direction) {
			case Directions.UP: {
				result.currentPosition.Y = current.Y - 1;
				result.nextPosition.Y = result.currentPosition.Y - 1;
				break;
			}
			case Directions.DOWN: {
				result.currentPosition.Y = current.Y + 1;
				result.nextPosition.Y = result.currentPosition.Y + 1;
				break;
			}
			case Directions.LEFT: {
				result.currentPosition.X = current.X - 1;
				result.nextPosition.X = result.currentPosition.X - 1;
				break;
			}
			case Directions.RIGHT: {
				result.currentPosition.X = current.X + 1;
				result.nextPosition.X = result.currentPosition.X + 1;
				break;
			}
		}

		if(result.currentPosition.Y >= GameBoard.columnRowsNumber || result.currentPosition.X >= GameBoard.columnRowsNumber
		|| result.currentPosition.Y === -1 || result.currentPosition.X === -1) {
			// out of board
		} else {
			if(this.board[result.currentPosition.Y] !== undefined && this.board[result.currentPosition.Y][result.currentPosition.X] !== undefined) {
				nextCellStatus = this.board[result.currentPosition.Y][result.currentPosition.X];
				if(nextCellStatus === GameBoard.snakeSymbol || nextCellStatus === GameBoard.snakeHeadSymbol) {
					// game over because of ouch
				} else if(nextCellStatus === GameBoard.appleSymbol) {
					result.okay = true;
					result.apple = true;
					// eating apple, get bigger and set new apple
				} else {
					result.okay = true;
					// free to go
				}
			}
		}
		return result;
	}

	newSnake() {
		const headPositions = {current: {Y: 7, X: 4}, next: {Y: 7, X: 5}};
		switch (this.direction) {
			case Directions.UP: {
				headPositions.next.Y--;
				break;
			}
			case Directions.DOWN: {
				headPositions.next.Y++;
				break;
			}
		}

		return [
			new SnakeBodyPart({current: {Y: 7, X: 1}, next: {Y: 7, X: 2}}),
			new SnakeBodyPart({current: {Y: 7, X: 2}, next: {Y: 7, X: 3}}),
			new SnakeBodyPart({current: {Y: 7, X: 3}, next: {Y: 7, X: 4}}),
			new SnakeBodyPart(headPositions),
		];
	}

	static get defaultBoard() {
		const board = Array(GameBoard.columnRowsNumber).fill(null);
		for(let i = 0; i < GameBoard.columnRowsNumber; i++) {
			board[i] = new Array(GameBoard.columnRowsNumber).fill(null);
		}

		for(let i = 0; i < GameBoard.defaultSnakeLength; i++) {
			if(i === GameBoard.defaultSnakeLength - 1) {
				board[GameBoard.defaultEntitiesPositions.snake.Y][GameBoard.defaultEntitiesPositions.snake.X + i] = GameBoard.snakeHeadSymbol;
			} else {
				board[GameBoard.defaultEntitiesPositions.snake.Y][GameBoard.defaultEntitiesPositions.snake.X + i] = GameBoard.snakeSymbol;
			}
		}

		board[GameBoard.defaultEntitiesPositions.apple.Y][GameBoard.defaultEntitiesPositions.apple.X] = GameBoard.appleSymbol;
		return board;
	}

}

class SnakeBodyPart {
	_positions = {
		current: {
			Y: null,
			X: null
		},
		next: {
			Y: null,
			X: null
		}
	};

	constructor(positions) {
		this.positions = positions;
	}

	set positions(positions){
		this._positions = positions;
	}

	get positions() {
		return this._positions;
	}
}

function detectButton(event) {
	let direction = null;
	switch (event.code) {
		case "Space":
			game.toggleStatus();
			break;
		case Directions.LEFT:
			direction = Directions.LEFT;
			break;
		case Directions.UP:
			direction = Directions.UP;
			break;
		case Directions.RIGHT:
			direction = Directions.RIGHT;
			break;
		case Directions.DOWN:
			direction = Directions.DOWN;
			break;
	}
	if(direction) {
		if (game && game.isRunning && !game.gameOver) {
			game.changeDirection(direction);
		} else if(!game || (game && !game.gameOver)){
			startGame(direction, true);
		}
	}
}

let game;
function startGame(direction, start) {
	game = new SnakeGame(direction, start);
}

document.addEventListener('keydown', detectButton);

window.addEventListener("load", () => {
	startGame(null, false);
	setTimeout(()=>{
		const gameMain = document.getElementById("game-main");
		gameMain.style.display= "block";
		const spinner = document.getElementById("spinner");
		spinner.style.display = "none";
	}, 200);

});


