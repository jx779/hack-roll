// popup.js

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
  { id: 'snake', name: 'Snake', icon: '🐍', desc: 'Classic snake game' },
  { id: 'flappy', name: 'Flappy Bird', icon: '🐦', desc: 'Tap to fly' },
  { id: '2048', name: '2048', icon: '🎯', desc: 'Merge the tiles' }
];

// ===== RENDER LOOP =====
function render() {
  const content = document.getElementById('content');
  const headerTitle = document.getElementById('headerTitle');
  const headerSubtitle = document.getElementById('headerSubtitle');

  if (state.currentGame === 'menu') {
    headerTitle.textContent = '🎮 Game Zone';
    headerSubtitle.textContent = 'Time for a brain break!';
    renderMenu(content);
  } else if (state.currentGame === 'snake') {
    headerTitle.textContent = '🐍 Snake';
    headerSubtitle.textContent = 'Eat and grow!';
    renderSnake(content);
  } else if (state.currentGame === 'flappy') {
    headerTitle.textContent = '🐦 Flappy Bird';
    headerSubtitle.textContent = 'Click to flap!';
    renderFlappy(content);
  } else if (state.currentGame === '2048') {
    headerTitle.textContent = '🎯 2048';
    headerSubtitle.textContent = 'Merge to win!';
    render2048(content);
  }
}

function renderMenu(container) {
  container.innerHTML = `
    <div class="game-grid">
      ${games.map(game => `
        <div class="game-card" data-game="${game.id}">
          <div class="game-card-content">
            <div class="game-icon">${game.icon}</div>
            <div class="game-info">
              <h3>${game.name}</h3>
              <p>${game.desc}</p>
            </div>
          </div>
          <div class="game-arrow">▶</div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add event listeners
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
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

// Close button handler
document.getElementById('closeBtn').addEventListener('click', () => {
  window.close();
});

// ===== SNAKE GAME =====
let snakeInterval = null;
let snakeGameState = null;

function renderSnake(container) {
  container.innerHTML = `
    <div class="game-screen">
      <div class="game-header">
        <button class="home-btn" id="snakeHomeBtn">🏠</button>
        <div class="score-display">
          <div class="current">Score: <span id="snakeScoreDisplay">${state.snakeScore}</span></div>
          <div class="high">High: ${state.snakeHighScore}</div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      <div class="game-canvas-container">
        <canvas id="snakeCanvas" width="350" height="350"></canvas>
      </div>
      <div class="game-controls" id="snakeControls">
        <button class="start-btn" id="startSnakeBtn">Start Game</button>
        <p class="controls-hint">Use arrow keys to move</p>
      </div>
    </div>
  `;
  
  document.getElementById('snakeHomeBtn').addEventListener('click', goHome);
  document.getElementById('startSnakeBtn').addEventListener('click', startSnake);
}

function startSnake() {
  if (snakeInterval) clearInterval(snakeInterval);

  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const gridSize = 20;
  const tileSize = 17.5;

  snakeGameState = {
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    gameOver: false
  };

  state.snakeScore = 0;
  
  const controls = document.getElementById('snakeControls');
  if (controls) controls.style.display = 'none';

  snakeInterval = setInterval(() => {
    if (snakeGameState.gameOver) {
      clearInterval(snakeInterval);
      if (state.snakeScore > state.snakeHighScore) state.snakeHighScore = state.snakeScore;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '20px system-ui';
      ctx.fillText(`Score: ${state.snakeScore}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '16px system-ui';
      ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 50);
      
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
    <div class="game-screen">
      <div class="game-header">
        <button class="home-btn" id="flappyHomeBtn">🏠</button>
        <div class="score-display">
          <div class="current">Score: <span id="flappyScoreDisplay">${state.flappyScore}</span></div>
          <div class="high">High: ${state.flappyHighScore}</div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      <div class="game-canvas-container">
        <canvas id="flappyCanvas" width="350" height="450" style="cursor: pointer;"></canvas>
      </div>
      <div class="game-controls" id="flappyControls">
        <button class="start-btn" id="startFlappyBtn">Start Game</button>
        <p class="controls-hint">Click canvas to flap</p>
      </div>
    </div>
  `;
  
  document.getElementById('flappyHomeBtn').addEventListener('click', goHome);
  document.getElementById('startFlappyBtn').addEventListener('click', startFlappy);
}

function startFlappy() {
  if (flappyInterval) clearInterval(flappyInterval);

  const canvas = document.getElementById('flappyCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');

  flappyGameState = {
    bird: { y: 225, velocity: 0 },
    pipes: [{ x: 450, gap: 180, gapY: 180 }],
    frame: 0,
    gameOver: false
  };

  state.flappyScore = 0;
  
  const controls = document.getElementById('flappyControls');
  if (controls) controls.style.display = 'none';

  const gravity = 0.6;
  const jumpStrength = -9;
  const pipeWidth = 60;
  const birdX = 70;
  const birdRadius = 18;

  flappyInterval = setInterval(() => {
    if (flappyGameState.gameOver) {
      clearInterval(flappyInterval);
      if (state.flappyScore > state.flappyHighScore) state.flappyHighScore = state.flappyScore;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '20px system-ui';
      ctx.fillText(`Score: ${state.flappyScore}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '16px system-ui';
      ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 50);
      
      if (controls) controls.style.display = 'block';
      return;
    }

    flappyGameState.frame++;
    flappyGameState.bird.velocity += gravity;
    flappyGameState.bird.y += flappyGameState.bird.velocity;

    if (flappyGameState.bird.y - birdRadius < 0 || flappyGameState.bird.y + birdRadius > canvas.height) {
      flappyGameState.gameOver = true;
      return;
    }

    flappyGameState.pipes.forEach(pipe => {
      pipe.x -= 3;
      
      if (birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + pipeWidth) {
        if (flappyGameState.bird.y - birdRadius < pipe.gapY || 
            flappyGameState.bird.y + birdRadius > pipe.gapY + pipe.gap) {
          flappyGameState.gameOver = true;
        }
      }
      
      if (pipe.x + pipeWidth === birdX && !pipe.scored) {
        pipe.scored = true;
        state.flappyScore++;
        const scoreDisplay = document.getElementById('flappyScoreDisplay');
        if (scoreDisplay) scoreDisplay.textContent = state.flappyScore;
      }
    });

    if (flappyGameState.frame % 100 === 0) {
      flappyGameState.pipes.push({
        x: canvas.width,
        gap: 180,
        gapY: Math.random() * (canvas.height - 280) + 100,
        scored: false
      });
    }

    flappyGameState.pipes = flappyGameState.pipes.filter(pipe => pipe.x > -pipeWidth);

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#22c55e';
    flappyGameState.pipes.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, pipeWidth, canvas.height);
    });

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(birdX, flappyGameState.bird.y, birdRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(birdX + 6, flappyGameState.bird.y - 4, 4, 0, Math.PI * 2);
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
    <div class="game-screen">
      <div class="game-header">
        <button class="home-btn" id="game2048HomeBtn">🏠</button>
        <div class="score-display">
          <div class="current">Score: ${state.game2048Score}</div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      <div class="game-canvas-container" style="text-align: center;">
        <div class="board-2048">
          ${board2048.map((row, i) => `
            <div class="board-row">
              ${row.map((cell, j) => `
                <div class="tile ${cell > 0 ? 'tile-' + cell : ''}">
                  ${cell > 0 ? cell : ''}
                </div>`).join('')}
            </div>`).join('')}
        </div>
      </div>
      <div class="game-controls">
        <button class="reset-btn" id="reset2048Btn">New Game</button>
        <p class="controls-hint">Use arrow keys to play</p>
      </div>
    </div>
  `;
  
  document.getElementById('game2048HomeBtn').addEventListener('click', goHome);
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