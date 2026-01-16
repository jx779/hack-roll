// ===== STATE =====
const state = {
  currentGame: 'menu',
  snakeScore: 0,
  snakeHighScore: 0,
  flappyScore: 0,
  flappyHighScore: 0,
  game2048Score: 0
};

const games = [
  { id: 'snake', name: 'Snake', color: 'bg-green-200'},
  { id: 'flappy', name: 'Flappy Bird', color: 'bg-blue-200'},
  { id: '2048', name: '2048', color: 'bg-yellow-200'}
];

// ===== RENDER LOOP =====
function render() {
  const content = document.getElementById('content');

  if (state.currentGame === 'menu') renderMenu(content);
  else if (state.currentGame === 'snake') renderSnake(content);
  else if (state.currentGame === 'flappy') renderFlappy(content);
  else if (state.currentGame === '2048') render2048(content);
}

function renderMenu(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border-4 border-purple-200 w-full max-w-sm mx-4 p-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Game Zone</h1>
        <button id="closeWindowBtn" class="text-gray-500 hover:text-red-500 text-2xl font-bold transition-colors" title="Close">
          ✕
        </button>
      </div>
      <div class="text-center mb-8">
        <p class="text-gray-600">Choose your game and beat boredom!</p>
      </div>
      <div class="space-y-4">
        ${games.map(game => `
          <button data-game="${game.id}"
            class="game-select-btn w-full ${game.color} hover:opacity-80 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-between shadow-lg">
            <span class="text-xl">${game.name}</span>
            <span class="text-2xl">▶</span>
          </button>`).join('')}
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('closeWindowBtn').addEventListener('click', closeWindow);
  document.querySelectorAll('.game-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gameId = e.currentTarget.dataset.game;
      selectGame(gameId);
    });
  });
}

function selectGame(gameId) {
  state.currentGame = gameId;
  render();
}

function goHome() {
  // Clean up any running games
  if (snakeInterval) {
    clearInterval(snakeInterval);
    snakeInterval = null;
  }
  if (flappyInterval) {
    clearInterval(flappyInterval);
    flappyInterval = null;
  }
  
  state.currentGame = 'menu';
  render();
}

function closeWindow() {
  window.close();
}

// ===== SNAKE GAME =====
let snakeInterval = null;
let snakeGameState = null;

function renderSnake(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border-4 border-purple-200 w-full max-w-sm mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <button id="snakeHomeBtn" class="text-gray-800 hover:text-purple-400 text-2xl">🏠</button>
        <div class="text-gray-800 text-center flex-1">
          <div class="text-sm text-gray-600">Score: <span id="snakeScoreDisplay">${state.snakeScore}</span></div>
          <div class="text-xs text-gray-500">High: ${state.snakeHighScore}</div>
        </div>
        <button id="snakeCloseBtn" class="text-gray-500 hover:text-red-500 text-2xl font-bold" title="Close">✕</button>
      </div>
      <div class="flex justify-center mb-4">
        <canvas id="snakeCanvas" width="300" height="300" class="border-4 border-green-200 rounded-lg bg-gray-900"></canvas>
      </div>
      <div id="snakeControls" class="text-center mt-4">
        <button id="startSnakeBtn"
          class="bg-green-200 hover:bg-green-300 text-gray-800 font-bold py-3 px-8 rounded-xl transition-all">
          Start Game
        </button>
        <p class="text-gray-600 text-sm mt-2">Use arrow keys to move</p>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('snakeHomeBtn').addEventListener('click', goHome);
  document.getElementById('snakeCloseBtn').addEventListener('click', closeWindow);
  document.getElementById('startSnakeBtn').addEventListener('click', startSnake);
}

function startSnake() {
  if (snakeInterval) clearInterval(snakeInterval);

  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const gridSize = 20;
  const tileSize = 15;

  snakeGameState = {
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    gameOver: false
  };

  state.snakeScore = 0;
  
  // Hide start button
  const controls = document.getElementById('snakeControls');
  if (controls) controls.style.display = 'none';

  snakeInterval = setInterval(() => {
    if (snakeGameState.gameOver) {
      clearInterval(snakeInterval);
      if (state.snakeScore > state.snakeHighScore) state.snakeHighScore = state.snakeScore;
      
      // Show game over
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px Arial';
      ctx.fillText(`Score: ${state.snakeScore}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '14px Arial';
      ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 40);
      
      if (controls) controls.style.display = 'block';
      return;
    }

    snakeGameState.direction = snakeGameState.nextDirection;
    const head = { 
      x: snakeGameState.snake[0].x + snakeGameState.direction.x, 
      y: snakeGameState.snake[0].y + snakeGameState.direction.y 
    };

    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || 
        snakeGameState.snake.some(s => s.x === head.x && s.y === head.y)) {
      snakeGameState.gameOver = true;
      return;
    }

    snakeGameState.snake.unshift(head);

    if (head.x === snakeGameState.food.x && head.y === snakeGameState.food.y) {
      state.snakeScore += 10;
      const scoreDisplay = document.getElementById('snakeScoreDisplay');
      if (scoreDisplay) scoreDisplay.textContent = state.snakeScore;
      snakeGameState.food = { 
        x: Math.floor(Math.random() * gridSize), 
        y: Math.floor(Math.random() * gridSize) 
      };
    } else {
      snakeGameState.snake.pop();
    }

    // Draw
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#86efac';
    snakeGameState.snake.forEach(s => 
      ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 1, tileSize - 1)
    );

    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(snakeGameState.food.x * tileSize, snakeGameState.food.y * tileSize, tileSize - 1, tileSize - 1);
  }, 150);
}

// ===== FLAPPY BIRD =====
let flappyInterval = null;
let flappyGameState = null;

function renderFlappy(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border-4 border-purple-200 w-full max-w-sm mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <button id="flappyHomeBtn" class="text-gray-800 hover:text-purple-400 text-2xl">🏠</button>
        <div class="text-gray-800 text-center flex-1">
          <div class="text-sm text-gray-600">Score: <span id="flappyScoreDisplay">${state.flappyScore}</span></div>
          <div class="text-xs text-gray-500">High: ${state.flappyHighScore}</div>
        </div>
        <button id="flappyCloseBtn" class="text-gray-500 hover:text-red-500 text-2xl font-bold" title="Close">✕</button>
      </div>
      <div class="flex justify-center mb-4">
        <canvas id="flappyCanvas" width="300" height="400" class="border-4 border-blue-200 rounded-lg cursor-pointer bg-sky-200"></canvas>
      </div>
      <div id="flappyControls" class="text-center mt-4">
        <button id="startFlappyBtn"
          class="bg-blue-200 hover:bg-blue-300 text-gray-800 font-bold py-3 px-8 rounded-xl transition-all">
          Start Game
        </button>
        <p class="text-gray-600 text-sm mt-2">Click canvas to flap</p>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('flappyHomeBtn').addEventListener('click', goHome);
  document.getElementById('flappyCloseBtn').addEventListener('click', closeWindow);
  document.getElementById('startFlappyBtn').addEventListener('click', startFlappy);
}



function startFlappy() {
  if (flappyInterval) clearInterval(flappyInterval);

  const canvas = document.getElementById('flappyCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');

  flappyGameState = {
    bird: { y: 200, velocity: 0 },
    pipes: [{ x: 400, gap: 150, gapY: 150 }],
    frame: 0,
    gameOver: false,
    score: 0
  };

  state.flappyScore = 0;
  
  // Hide start button
  const controls = document.getElementById('flappyControls');
  if (controls) controls.style.display = 'none';

  const gravity = 0.5;
  const jumpStrength = -8;
  const pipeWidth = 50;
  const birdX = 50;
  const birdRadius = 15;

  flappyInterval = setInterval(() => {
    if (flappyGameState.gameOver) {
      clearInterval(flappyInterval);
      if (state.flappyScore > state.flappyHighScore) state.flappyHighScore = state.flappyScore;
      
      // Show game over
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px Arial';
      ctx.fillText(`Score: ${state.flappyScore}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '14px Arial';
      ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 40);
      
      if (controls) controls.style.display = 'block';
      return;
    }

    flappyGameState.frame++;
    flappyGameState.bird.velocity += gravity;
    flappyGameState.bird.y += flappyGameState.bird.velocity;

    // Check collision with ground/ceiling
    if (flappyGameState.bird.y - birdRadius < 0 || flappyGameState.bird.y + birdRadius > canvas.height) {
      flappyGameState.gameOver = true;
      return;
    }

    // Move pipes
    flappyGameState.pipes.forEach(pipe => {
      pipe.x -= 3;
      
      // Check collision with pipes
      if (birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + pipeWidth) {
        if (flappyGameState.bird.y - birdRadius < pipe.gapY || 
            flappyGameState.bird.y + birdRadius > pipe.gapY + pipe.gap) {
          flappyGameState.gameOver = true;
        }
      }
      
      // Score when passing pipe
      if (pipe.x + pipeWidth === birdX && !pipe.scored) {
        pipe.scored = true;
        state.flappyScore++;
        const scoreDisplay = document.getElementById('flappyScoreDisplay');
        if (scoreDisplay) scoreDisplay.textContent = state.flappyScore;
      }
    });

    // Add new pipes
    if (flappyGameState.frame % 90 === 0) {
      flappyGameState.pipes.push({
        x: canvas.width,
        gap: 150,
        gapY: Math.random() * (canvas.height - 250) + 75,
        scored: false
      });
    }

    // Remove off-screen pipes
    flappyGameState.pipes = flappyGameState.pipes.filter(pipe => pipe.x > -pipeWidth);

    // Draw background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    ctx.fillStyle = '#22c55e';
    flappyGameState.pipes.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, pipeWidth, canvas.height);
    });

    // Draw bird
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(birdX, flappyGameState.bird.y, birdRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(birdX + 5, flappyGameState.bird.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }, 20);

  canvas.onclick = () => {
    if (!flappyGameState.gameOver) {
      flappyGameState.bird.velocity = jumpStrength;
    }
  };
}

// ===== 2048 =====
let board2048 = [];

function render2048(container) {
  if (board2048.length === 0) init2048();

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border-4 border-purple-200 w-full max-w-sm mx-4 p-6">
      <div class="flex justify-between items-center mb-4">
        <button id="game2048HomeBtn" class="text-gray-800 hover:text-purple-400 text-2xl">🏠</button>
        <div class="text-gray-800 text-xl font-bold flex-1 text-center">Score: ${state.game2048Score}</div>
        <button id="game2048CloseBtn" class="text-gray-500 hover:text-red-500 text-2xl font-bold" title="Close">✕</button>
      </div>
      <div class="flex justify-center mb-4">
        <div class="bg-gray-300 p-3 rounded-lg">
          ${board2048.map((row, i) => `
            <div class="flex gap-2 ${i < 3 ? 'mb-2' : ''}">
              ${row.map((cell, j) => `
                <div class="w-16 h-16 ${getTileColor(cell)} rounded flex items-center justify-center text-2xl font-bold text-gray-800">
                  ${cell > 0 ? cell : ''}
                </div>`).join('')}
            </div>`).join('')}
        </div>
      </div>
      <div id="game2048Controls" class="text-center mt-4">
        <button id="reset2048Btn" class="bg-yellow-200 hover:bg-yellow-300 text-gray-800 font-bold py-2 px-6 rounded-xl transition-all mb-2">
          New Game
        </button>
        <p class="text-gray-600 text-sm">Use arrow keys to play</p>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('game2048HomeBtn').addEventListener('click', goHome);
  document.getElementById('game2048CloseBtn').addEventListener('click', closeWindow);
  document.getElementById('reset2048Btn').addEventListener('click', () => {
    board2048 = [];
    init2048();
    render();
  });
}

function init2048() {
  board2048 = Array(4).fill(null).map(() => Array(4).fill(0));
  addNewTile2048();
  addNewTile2048();
  state.game2048Score = 0;
}

function addNewTile2048() {
  const empty = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board2048[i][j] === 0) empty.push([i, j]);
    }
  }
  if (empty.length > 0) {
    const [i, j] = empty[Math.floor(Math.random() * empty.length)];
    board2048[i][j] = Math.random() < 0.9 ? 2 : 4;
  }
}

function getTileColor(value) {
  const colors = {
    0: 'bg-gray-200',
    2: 'bg-yellow-100',
    4: 'bg-yellow-200',
    8: 'bg-orange-200',
    16: 'bg-orange-300',
    32: 'bg-red-200',
    64: 'bg-red-300',
    128: 'bg-yellow-300',
    256: 'bg-yellow-400',
    512: 'bg-pink-300',
    1024: 'bg-pink-400',
    2048: 'bg-purple-300'
  };
  return colors[value] || 'bg-purple-400';
}

function move2048(direction) {
  let moved = false;
  const newBoard = board2048.map(r => [...r]);
  const compress = r => r.filter(v => v !== 0);
  const merge = r => {
    for (let i = 0; i < r.length - 1; i++) {
      if (r[i] === r[i + 1] && r[i] !== 0) {
        r[i] *= 2;
        state.game2048Score += r[i];
        r[i + 1] = 0;
      }
    }
    return r;
  };
  const processRow = r => {
    let c = compress(r);
    c = merge(c);
    c = compress(c);
    while (c.length < 4) c.push(0);
    return c;
  };

  if (direction === 'left' || direction === 'right') {
    for (let i = 0; i < 4; i++) {
      let row = newBoard[i];
      if (direction === 'right') row = row.reverse();
      const processed = processRow(row);
      if (direction === 'right') processed.reverse();
      if (JSON.stringify(processed) !== JSON.stringify(newBoard[i])) moved = true;
      newBoard[i] = processed;
    }
  } else {
    for (let j = 0; j < 4; j++) {
      let col = newBoard.map(r => r[j]);
      if (direction === 'down') col = col.reverse();
      const processed = processRow(col);
      if (direction === 'down') processed.reverse();
      if (JSON.stringify(processed) !== JSON.stringify(col)) moved = true;
      for (let i = 0; i < 4; i++) newBoard[i][j] = processed[i];
    }
  }
  
  if (moved) {
    board2048 = newBoard;
    addNewTile2048();
    render();
  }
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener('keydown', (e) => {
  // Snake controls
  if (state.currentGame === 'snake' && snakeGameState && !snakeGameState.gameOver) {
    if (e.key === 'ArrowUp' && snakeGameState.direction.y === 0) {
      e.preventDefault();
      snakeGameState.nextDirection = { x: 0, y: -1 };
    }
    if (e.key === 'ArrowDown' && snakeGameState.direction.y === 0) {
      e.preventDefault();
      snakeGameState.nextDirection = { x: 0, y: 1 };
    }
    if (e.key === 'ArrowLeft' && snakeGameState.direction.x === 0) {
      e.preventDefault();
      snakeGameState.nextDirection = { x: -1, y: 0 };
    }
    if (e.key === 'ArrowRight' && snakeGameState.direction.x === 0) {
      e.preventDefault();
      snakeGameState.nextDirection = { x: 1, y: 0 };
    }
  }
  
  // 2048 controls
  if (state.currentGame === '2048') {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      move2048('up');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move2048('down');
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      move2048('left');
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      move2048('right');
    }
  }
});

// ===== INITIAL RENDER =====
render();