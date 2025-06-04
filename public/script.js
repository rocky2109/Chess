const socket = io();
const game = new Chess();
let board = null;
let playerColor = 'white';

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    if (playerColor !== game.turn()) return false;
}

function onDrop(source, target) {
    try {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';
        
        socket.emit('move', move);
        updateStatus();
    } catch (e) {
        return 'snapback';
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

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
    document.getElementById('turn').textContent = game.turn() === playerColor ? 'Your turn' : 'Waiting for opponent';
}

socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join');
});

socket.on('color', (color) => {
    playerColor = color;
    document.getElementById('turn').textContent = 'You are ' + color;
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
    socket.emit('reset');
});

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = Chessboard('board', config);
