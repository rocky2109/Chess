const socket = io();
const game = new Chess();
let board = null;
let playerColor = 'white';
let gameMode = null;
let gameId = null;

// Initialize chessboard
function initBoard() {
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    board = Chessboard('board', config);
}

// Game mode selection
document.getElementById('playFriend').addEventListener('click', () => {
    gameMode = 'friend';
    document.getElementById('gameArea').style.display = 'block';
    document.querySelector('.game-mode').style.display = 'none';
    document.getElementById('friendCode').style.display = 'block';
    socket.emit('join', { mode: 'friend' });
});

document.getElementById('playBot').addEventListener('click', () => {
    gameMode = 'bot';
    playerColor = 'white';
    document.getElementById('gameArea').style.display = 'block';
    document.querySelector('.game-mode').style.display = 'none';
    initBoard();
    updateStatus();
    document.getElementById('turn').textContent = 'Your turn (vs Computer)';
});

document.getElementById('copyCode').addEventListener('click', () => {
    const codeInput = document.getElementById('gameCode');
    codeInput.select();
    document.execCommand('copy');
    alert('Game code copied! Share it with your friend.');
});

// Chess move handlers
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    if (gameMode === 'bot' && game.turn() !== playerColor) return false;
    if (gameMode === 'friend' && game.turn() !== playerColor) return false;
}

function onDrop(source, target) {
    try {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';
        
        if (gameMode === 'friend') {
            socket.emit('move', { gameId, move });
        } else if (gameMode === 'bot') {
            setTimeout(makeBotMove, 500);
        }
        
        updateStatus();
    } catch (e) {
        return 'snapback';
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

// Simple bot move logic
function makeBotMove() {
    if (game.game_over()) return;
    
    const moves = game.moves();
    if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        game.move(move);
        board.position(game.fen());
        updateStatus();
    }
}

// Update game status
function updateStatus() {
    let status = '';
    let moveColor = 'White';
    if (game.turn() === 'b') moveColor = 'Black';

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = moveColor + ' to move';
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    document.getElementById('status').textContent = status;
    
    if (gameMode === 'friend') {
        document.getElementById('turn').textContent = game.turn() === playerColor ? 'Your turn' : 'Opponent\'s turn';
    }
}

// Socket.io events
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('gameCreated', (data) => {
    gameId = data.gameId;
    playerColor = data.color;
    document.getElementById('gameCode').value = gameId;
    initBoard();
    updateStatus();
});

socket.on('gameState', (fen) => {
    game.load(fen);
    board.position(fen);
    updateStatus();
});

socket.on('move', (move) => {
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

document.getElementById('reset').addEventListener('click', () => {
    game.reset();
    board.position('start');
    updateStatus();
    
    if (gameMode === 'friend') {
        socket.emit('reset', { gameId });
    } else if (gameMode === 'bot') {
        playerColor = 'white';
        document.getElementById('turn').textContent = 'Your turn (vs Computer)';
    }
});
