// popup.js

// ===== CLOSE BUTTON HANDLER =====
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chrome.windows.getCurrent((window) => {
        chrome.windows.remove(window.id);
      });
    });
  }
});

// ===== COUNTDOWN TIMER =====
let countdownSeconds = 300; // 5 minutes = 300 seconds
let countdownInterval = null;

function startCountdown() {
  const timerDisplay = document.getElementById('timerDisplay');
  const countdownTimer = document.getElementById('countdownTimer');
  
  countdownInterval = setInterval(() => {
    countdownSeconds--;
    
    // Update display
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Warning when under 1 minute
    if (countdownSeconds <= 60 && !countdownTimer.classList.contains('warning')) {
      countdownTimer.classList.add('warning');
    }
    
    // Close window when time's up
    if (countdownSeconds <= 0) {
      clearInterval(countdownInterval);
      closeWindow();
    }
  }, 1000);
}

function closeWindow() {
  // Show warning message
  alert('⏰ Time\'s up! Window will close now.');
  
  // Close the entire popup window
  chrome.windows.getCurrent((window) => {
    chrome.windows.remove(window.id);
  });
}

// Start countdown when page loads
startCountdown();

// ===== STATE =====
const state = {
  currentGame: 'menu',
  snakeScore: 0,
  snakeHighScore: 0,
  flappyScore: 0,
  flappyHighScore: 0,
  game2048Score: 0,
  tetrisScore: 0,
  tetrisHighScore: 0
};

const games = [
  { id: 'snake', name: 'Snake', icon: '🐍', desc: 'Classic snake game' },
  { id: 'flappy', name: 'Flappy Bird', icon: '🐦', desc: 'Tap to fly' },
  { id: '2048', name: '2048', icon: '🎯', desc: 'Merge the tiles' },
  { id: 'tetris', name: 'Tetris', icon: '🧱', desc: 'Stack the blocks' }
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
  } else if (state.currentGame === 'tetris') {
    headerTitle.textContent = '🧱 Tetris';
    headerSubtitle.textContent = 'Stack and clear!';
    renderTetris(content);
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
  if (tetrisInterval) {
    clearInterval(tetrisInterval);
    tetrisInterval = null;
  }
  
  state.currentGame = 'menu';
  render();
}

// ===== SNAKE GAME (1 or 2 PLAYER) =====
let snakeInterval = null;
let snakeGameState = null;

function renderSnake(container) {
  container.innerHTML = `
    <div class="game-screen">
      <div class="game-header">
        <button class="home-btn" id="snakeHomeBtn">🏠</button>
        <div class="score-display" id="snakeScoreHeader">
          <div class="current">Score: <span id="snakeScoreDisplay">${state.snakeScore}</span></div>
          <div class="high">High: ${state.snakeHighScore}</div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      <div class="game-canvas-container" style="position: relative;">
        <canvas id="snakeCanvas" width="350" height="350"></canvas>
        
        <!-- Player Mode Selection Popup -->
        <div id="snakeModePopup" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; border-radius: 16px;">
          <div style="background: white; padding: 32px; border-radius: 20px; text-align: center; max-width: 280px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">Select Mode</h2>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              <button class="mode-btn" data-mode="1" style="background: linear-gradient(135deg, #a7f3d0 0%, #86efac 100%); color: #065f46; border: none; padding: 14px 24px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                Single Player
              </button>
              <button class="mode-btn" data-mode="2" style="background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%); color: #78350f; border: none; padding: 14px 24px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                Two Players
              </button>
            </div>
            
            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
              <p style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Controls:</p>
              <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;" id="controlsText">
                Use arrow keys to move
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="game-controls" id="snakeControls" style="display: none;">
        <button class="start-btn" id="startSnakeBtn">Start Game</button>
      </div>
    </div>
  `;
  
  document.getElementById('snakeHomeBtn').addEventListener('click', goHome);
  
  // Add mode selection handlers
  const modeBtns = document.querySelectorAll('.mode-btn');
  const popup = document.getElementById('snakeModePopup');
  const controlsText = document.getElementById('controlsText');
  
  modeBtns.forEach(btn => {
    // Add hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
      
      // Show appropriate controls on hover
      const mode = btn.getAttribute('data-mode');
      if (mode === '1') {
        controlsText.innerHTML = 'Use arrow keys to move';
      } else {
        controlsText.innerHTML = 'Player 1: W A S D<br>Player 2: Arrow Keys';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    });
    
    btn.addEventListener('click', () => {
      const selectedMode = parseInt(btn.getAttribute('data-mode'));
      
      // Add a brief animation before closing
      popup.style.transition = 'opacity 0.3s ease';
      popup.style.opacity = '0';
      
      setTimeout(() => {
        popup.style.display = 'none';
        startSnake(selectedMode);
      }, 300);
    });
  });
}

function startSnake(playerMode) {
  if (snakeInterval) clearInterval(snakeInterval);

  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const gridSize = 20;
  const tileSize = 17.5;

  // Update score header based on mode
  const scoreHeader = document.getElementById('snakeScoreHeader');
  if (playerMode === 2) {
    scoreHeader.innerHTML = `
      <div style="display: flex; gap: 20px; justify-content: center;">
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #86efac; font-weight: bold;">Player 1 (Green)</div>
          <div class="current">Score: <span id="snake1ScoreDisplay">0</span></div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 12px; color: #60a5fa; font-weight: bold;">Player 2 (Blue)</div>
          <div class="current">Score: <span id="snake2ScoreDisplay">0</span></div>
        </div>
      </div>
    `;
  }

  if (playerMode === 1) {
    // Single player mode
    snakeGameState = {
      mode: 1,
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      gameOver: false
    };

    state.snakeScore = 0;
  } else {
    // Two player mode
    snakeGameState = {
      mode: 2,
      // Player 1 (Green) - starts on left
      snake1: [{ x: 5, y: 10 }],
      direction1: { x: 1, y: 0 },
      nextDirection1: { x: 1, y: 0 },
      score1: 0,
      alive1: true,
      
      // Player 2 (Blue) - starts on right
      snake2: [{ x: 14, y: 10 }],
      direction2: { x: -1, y: 0 },
      nextDirection2: { x: -1, y: 0 },
      score2: 0,
      alive2: true,
      
      // Food
      food: { x: 10, y: 5 },
      gameOver: false
    };
  }
  
  const controls = document.getElementById('snakeControls');
  if (controls) controls.style.display = 'none';

  snakeInterval = setInterval(() => {
    if (snakeGameState.gameOver) {
      clearInterval(snakeInterval);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      
      if (playerMode === 1) {
        // Single player game over
        if (state.snakeScore > state.snakeHighScore) state.snakeHighScore = state.snakeScore;
        
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px system-ui';
        ctx.fillText(`Score: ${state.snakeScore}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = '16px system-ui';
        ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 50);
      } else {
        // Two player game over
        let resultText = 'Game Over!';
        if (snakeGameState.score1 > snakeGameState.score2) {
          resultText = 'Player 1 Wins!';
        } else if (snakeGameState.score2 > snakeGameState.score1) {
          resultText = 'Player 2 Wins!';
        } else if (!snakeGameState.alive1 && !snakeGameState.alive2) {
          resultText = "It's a Tie!";
        }
        
        ctx.fillText(resultText, canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '18px system-ui';
        ctx.fillText(`Player 1: ${snakeGameState.score1}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`Player 2: ${snakeGameState.score2}`, canvas.width / 2, canvas.height / 2 + 35);
        ctx.font = '14px system-ui';
        ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 65);
      }
      
      if (controls) controls.style.display = 'block';
      return;
    }

    if (playerMode === 1) {
      // Single player game logic
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

      // Draw single player
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#86efac';
      snakeGameState.snake.forEach(s => 
        ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 1, tileSize - 1)
      );

      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(snakeGameState.food.x * tileSize, snakeGameState.food.y * tileSize, tileSize - 1, tileSize - 1);
    } else {
      // Two player game logic
      // Update Player 1
      if (snakeGameState.alive1) {
        snakeGameState.direction1 = snakeGameState.nextDirection1;
        const head1 = { 
          x: snakeGameState.snake1[0].x + snakeGameState.direction1.x, 
          y: snakeGameState.snake1[0].y + snakeGameState.direction1.y 
        };

        // Check wall collision
        if (head1.x < 0 || head1.x >= gridSize || head1.y < 0 || head1.y >= gridSize) {
          snakeGameState.alive1 = false;
        }
        // Check self collision
        else if (snakeGameState.snake1.some(s => s.x === head1.x && s.y === head1.y)) {
          snakeGameState.alive1 = false;
        }
        // Check collision with Player 2
        else if (snakeGameState.snake2.some(s => s.x === head1.x && s.y === head1.y)) {
          snakeGameState.alive1 = false;
        }
        else {
          snakeGameState.snake1.unshift(head1);

          // Check food collision
          if (head1.x === snakeGameState.food.x && head1.y === snakeGameState.food.y) {
            snakeGameState.score1 += 10;
            const scoreDisplay = document.getElementById('snake1ScoreDisplay');
            if (scoreDisplay) scoreDisplay.textContent = snakeGameState.score1;
            
            // Spawn new food
            spawnFood();
          } else {
            snakeGameState.snake1.pop();
          }
        }
      }

      // Update Player 2
      if (snakeGameState.alive2) {
        snakeGameState.direction2 = snakeGameState.nextDirection2;
        const head2 = { 
          x: snakeGameState.snake2[0].x + snakeGameState.direction2.x, 
          y: snakeGameState.snake2[0].y + snakeGameState.direction2.y 
        };

        // Check wall collision
        if (head2.x < 0 || head2.x >= gridSize || head2.y < 0 || head2.y >= gridSize) {
          snakeGameState.alive2 = false;
        }
        // Check self collision
        else if (snakeGameState.snake2.some(s => s.x === head2.x && s.y === head2.y)) {
          snakeGameState.alive2 = false;
        }
        // Check collision with Player 1
        else if (snakeGameState.snake1.some(s => s.x === head2.x && s.y === head2.y)) {
          snakeGameState.alive2 = false;
        }
        else {
          snakeGameState.snake2.unshift(head2);

          // Check food collision
          if (head2.x === snakeGameState.food.x && head2.y === snakeGameState.food.y) {
            snakeGameState.score2 += 10;
            const scoreDisplay = document.getElementById('snake2ScoreDisplay');
            if (scoreDisplay) scoreDisplay.textContent = snakeGameState.score2;
            
            // Spawn new food
            spawnFood();
          } else {
            snakeGameState.snake2.pop();
          }
        }
      }

      // Check if game is over (both players dead)
      if (!snakeGameState.alive1 && !snakeGameState.alive2) {
        snakeGameState.gameOver = true;
        return;
      }

      // Draw two player
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Player 1 (Green)
      ctx.fillStyle = snakeGameState.alive1 ? '#86efac' : '#4b5563';
      snakeGameState.snake1.forEach((s, i) => {
        const alpha = snakeGameState.alive1 ? 1 : 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 1, tileSize - 1);
      });
      ctx.globalAlpha = 1;

      // Draw Player 2 (Blue)
      ctx.fillStyle = snakeGameState.alive2 ? '#60a5fa' : '#4b5563';
      snakeGameState.snake2.forEach((s, i) => {
        const alpha = snakeGameState.alive2 ? 1 : 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 1, tileSize - 1);
      });
      ctx.globalAlpha = 1;

      // Draw food
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(snakeGameState.food.x * tileSize, snakeGameState.food.y * tileSize, tileSize - 1, tileSize - 1);
    }
  }, 150);

  function spawnFood() {
    let validPosition = false;
    let newFood;
    
    while (!validPosition) {
      newFood = { 
        x: Math.floor(Math.random() * gridSize), 
        y: Math.floor(Math.random() * gridSize) 
      };
      
      if (playerMode === 2) {
        // Check if food is not on either snake
        const onSnake1 = snakeGameState.snake1.some(s => s.x === newFood.x && s.y === newFood.y);
        const onSnake2 = snakeGameState.snake2.some(s => s.x === newFood.x && s.y === newFood.y);
        
        if (!onSnake1 && !onSnake2) {
          validPosition = true;
        }
      } else {
        validPosition = true;
      }
    }
    
    snakeGameState.food = newFood;
  }
}

// In your keyboard controls section, replace the snake controls with:
if (state.currentGame === 'snake' && snakeGameState && !snakeGameState.gameOver) {
  if (snakeGameState.mode === 1) {
    // Single player controls (Arrow Keys)
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
  } else if (snakeGameState.mode === 2) {
    // Player 1 controls (WASD)
    if (snakeGameState.alive1) {
      if (e.key === 'w' || e.key === 'W') {
        if (snakeGameState.direction1.y === 0) {
          e.preventDefault();
          snakeGameState.nextDirection1 = { x: 0, y: -1 };
        }
      }
      if (e.key === 's' || e.key === 'S') {
        if (snakeGameState.direction1.y === 0) {
          e.preventDefault();
          snakeGameState.nextDirection1 = { x: 0, y: 1 };
        }
      }
      if (e.key === 'a' || e.key === 'A') {
        if (snakeGameState.direction1.x === 0) {
          e.preventDefault();
          snakeGameState.nextDirection1 = { x: -1, y: 0 };
        }
      }
      if (e.key === 'd' || e.key === 'D') {
        if (snakeGameState.direction1.x === 0) {
          e.preventDefault();
          snakeGameState.nextDirection1 = { x: 1, y: 0 };
        }
      }
    }
    
    // Player 2 controls (Arrow Keys)
    if (snakeGameState.alive2) {
      if (e.key === 'ArrowUp') {
        if (snakeGameState.direction2.y === 0) {
          e.preventDefault();
          snakeGameState.nextDirection2 = { x: 0, y: -1 };
        }
      }
      if (e.key === 'ArrowDown') {
        if (snakeGameState.direction2.y === 0) {
          e.preventDefault();
          snakeGameState.nextDirection2 = { x: 0, y: 1 };
        }
      }
      if (e.key === 'ArrowLeft') {
        if (snakeGameState.direction2.x === 0) {
          e.preventDefault();
          snakeGameState.nextDirection2 = { x: -1, y: 0 };
        }
      }
      if (e.key === 'ArrowRight') {
        if (snakeGameState.direction2.x === 0) {
          e.preventDefault();
          snakeGameState.nextDirection2 = { x: 1, y: 0 };
        }
      }
    }
  }
}

// ===== FLAPPY BIRD GAME =====
let flappyInterval = null;
let flappyGameState = null;
let birdImage = new Image();
let birdImageLoaded = false;

// Load the bird image
birdImage.src = 'images/bird.png'; // CHANGE THIS to your image path
birdImage.onload = function() {
  birdImageLoaded = true;
  console.log('Bird image loaded successfully!');
};
birdImage.onerror = function() {
  console.error('Failed to load bird image. Using default circle.');
};

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
        <p class="controls-hint">Press Spacebar or ↑ to flap</p>
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
  const birdRadius = 30;
  const birdSize = 45; // Size for the image (2 * birdRadius)

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
      
      if (pipe.x + pipeWidth < birdX && !pipe.scored) {
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

    // Draw the bird - use image if loaded, otherwise use circle
    if (birdImageLoaded) {
      // Draw the image centered on the bird position
      ctx.drawImage(
        birdImage, 
        birdX - birdSize / 2, 
        flappyGameState.bird.y - birdSize / 2, 
        birdSize, 
        birdSize
      );
    } else {
      // Fallback to original circle if image hasn't loaded
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(birdX, flappyGameState.bird.y, birdRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(birdX + 6, flappyGameState.bird.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 20);
}// ===== 2048 =====
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

// ===== TETRIS =====
let tetrisInterval = null;
let tetrisGameState = null;

const TETRIS_COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

const TETRIS_SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};

// Difficulty levels with different drop speeds
const DIFFICULTY_LEVELS = {
  easy: { speed: 800, label: 'Easy' },
  medium: { speed: 500, label: 'Medium' },
  hard: { speed: 250, label: 'Hard' }
};

function renderTetris(container) {
  container.innerHTML = `
    <div class="game-screen">
      <div class="game-header">
        <button class="home-btn" id="tetrisHomeBtn">🏠</button>
        <div class="score-display">
          <div class="current">Score: <span id="tetrisScoreDisplay">${state.tetrisScore}</span></div>
          <div class="high">High: ${state.tetrisHighScore}</div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      <div class="game-canvas-container" style="position: relative;">
        <canvas id="tetrisCanvas" width="300" height="600"></canvas>
        
        <!-- Difficulty Selection Popup -->
        <div id="difficultyPopup" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; border-radius: 16px;">
          <div style="background: white; padding: 32px; border-radius: 20px; text-align: center; max-width: 280px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">Select Difficulty</h2>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              <button class="difficulty-btn" data-level="easy" style="background: linear-gradient(135deg, #a7f3d0 0%, #86efac 100%); color: #065f46; border: none; padding: 14px 24px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                Easy
              </button>
              <button class="difficulty-btn" data-level="medium" style="background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%); color: #78350f; border: none; padding: 14px 24px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                Medium
              </button>
              <button class="difficulty-btn" data-level="hard" style="background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%); color: #7f1d1d; border: none; padding: 14px 24px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                Hard
              </button>
            </div>
            
            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
              <p style="font-size: 14px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">Controls:</p>
              <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
                ← → to move left/right<br>
                ↓ to move down faster<br>
                ↑ to rotate
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="game-controls" id="tetrisControls" style="display: none;">
        <button class="start-btn" id="startTetrisBtn">Start Game</button>
      </div>
    </div>
  `;
  
  document.getElementById('tetrisHomeBtn').addEventListener('click', goHome);
  
  // Add difficulty selection handlers
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  const popup = document.getElementById('difficultyPopup');
  
  difficultyBtns.forEach(btn => {
    // Add hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    });
    
    btn.addEventListener('click', () => {
      const selectedDifficulty = btn.getAttribute('data-level');
      
      // Add a brief animation before closing
      popup.style.transition = 'opacity 0.3s ease';
      popup.style.opacity = '0';
      
      setTimeout(() => {
        popup.style.display = 'none';
        startTetris(selectedDifficulty);
      }, 300);
    });
  });
}

function startTetris(difficulty) {
  if (tetrisInterval) clearInterval(tetrisInterval);

  const canvas = document.getElementById('tetrisCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;

  // Get initial speed based on difficulty
  const initialSpeed = DIFFICULTY_LEVELS[difficulty].speed;

  tetrisGameState = {
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(0)),
    currentPiece: null,
    currentX: 0,
    currentY: 0,
    currentType: null,
    gameOver: false,
    dropCounter: 0,
    dropInterval: initialSpeed,
    difficulty: difficulty
  };

  state.tetrisScore = 0;
  
  const controls = document.getElementById('tetrisControls');
  if (controls) controls.style.display = 'none';

  function getRandomPiece() {
    const types = Object.keys(TETRIS_SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: TETRIS_SHAPES[type],
      type: type
    };
  }

  function spawnPiece() {
    const piece = getRandomPiece();
    tetrisGameState.currentPiece = piece.shape;
    tetrisGameState.currentType = piece.type;
    tetrisGameState.currentX = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
    tetrisGameState.currentY = 0;

    if (collides()) {
      tetrisGameState.gameOver = true;
    }
  }

  function collides(offsetX = 0, offsetY = 0, piece = tetrisGameState.currentPiece) {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const newX = tetrisGameState.currentX + x + offsetX;
          const newY = tetrisGameState.currentY + y + offsetY;
          
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && tetrisGameState.board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function merge() {
    tetrisGameState.currentPiece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = tetrisGameState.currentY + y;
          const boardX = tetrisGameState.currentX + x;
          if (boardY >= 0) {
            tetrisGameState.board[boardY][boardX] = tetrisGameState.currentType;
          }
        }
      });
    });
  }

  function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (tetrisGameState.board[y].every(cell => cell !== 0)) {
        tetrisGameState.board.splice(y, 1);
        tetrisGameState.board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++; // Check same line again
      }
    }
    if (linesCleared > 0) {
      state.tetrisScore += linesCleared * 100;
      const scoreDisplay = document.getElementById('tetrisScoreDisplay');
      if (scoreDisplay) scoreDisplay.textContent = state.tetrisScore;
      
      // Speed up the game as score increases (progressive difficulty)
      // Every 500 points, reduce interval by 30ms
      const speedReduction = Math.floor(state.tetrisScore / 500) * 30;
      const minSpeed = tetrisGameState.difficulty === 'easy' ? 200 : 
                       tetrisGameState.difficulty === 'medium' ? 150 : 100;
      const newInterval = Math.max(minSpeed, initialSpeed - speedReduction);
      
      if (newInterval !== tetrisGameState.dropInterval) {
        tetrisGameState.dropInterval = newInterval;
        // Restart interval with new speed
        clearInterval(tetrisInterval);
        startTetrisLoop(newInterval);
      }
    }
  }

  function rotate() {
    const rotated = tetrisGameState.currentPiece[0].map((_, i) =>
      tetrisGameState.currentPiece.map(row => row[i]).reverse()
    );
    if (!collides(0, 0, rotated)) {
      tetrisGameState.currentPiece = rotated;
    }
  }

  function moveDown() {
    if (!collides(0, 1)) {
      tetrisGameState.currentY++;
    } else {
      merge();
      clearLines();
      spawnPiece();
    }
  }

  function moveLeft() {
    if (!collides(-1, 0)) {
      tetrisGameState.currentX--;
    }
  }

  function moveRight() {
    if (!collides(1, 0)) {
      tetrisGameState.currentX++;
    }
  }

  function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    tetrisGameState.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = TETRIS_COLORS[value];
          ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }
      });
    });

    // Draw current piece
    if (tetrisGameState.currentPiece) {
      ctx.fillStyle = TETRIS_COLORS[tetrisGameState.currentType];
      tetrisGameState.currentPiece.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const drawX = (tetrisGameState.currentX + x) * BLOCK_SIZE;
            const drawY = (tetrisGameState.currentY + y) * BLOCK_SIZE;
            ctx.fillRect(drawX, drawY, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          }
        });
      });
    }
  }

  // Store movement functions for keyboard handler
  tetrisGameState.moveLeft = moveLeft;
  tetrisGameState.moveRight = moveRight;
  tetrisGameState.moveDown = moveDown;
  tetrisGameState.rotate = rotate;

  spawnPiece();

  function startTetrisLoop(interval) {
    tetrisInterval = setInterval(() => {
      if (tetrisGameState.gameOver) {
        clearInterval(tetrisInterval);
        if (state.tetrisScore > state.tetrisHighScore) state.tetrisHighScore = state.tetrisScore;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px system-ui';
        ctx.fillText(`Score: ${state.tetrisScore}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = '16px system-ui';
        ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 50);
        
        if (controls) controls.style.display = 'block';
        return;
      }

      moveDown();
      draw();
    }, interval);
  }

  startTetrisLoop(tetrisGameState.dropInterval);
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
  
  if (state.currentGame === 'flappy' && flappyGameState && !flappyGameState.gameOver) {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      flappyGameState.bird.velocity = -9; // jumpStrength
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

  if (state.currentGame === 'tetris' && tetrisGameState && !tetrisGameState.gameOver) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tetrisGameState.moveLeft();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tetrisGameState.moveRight();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      tetrisGameState.moveDown();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      tetrisGameState.rotate();
    }
  }
});

// ===== INITIAL RENDER =====
render();