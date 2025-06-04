import { Server } from 'socket.io';

let games = {};

export default function handler(req, res) {
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io');
        
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('New client connected');
            
            let gameId = null;
            let playerColor = null;

            socket.on('join', () => {
                // Find or create a game
                for (const id in games) {
                    if (games[id].players < 2) {
                        gameId = id;
                        playerColor = 'black';
                        games[gameId].players++;
                        games[gameId].sockets.push(socket.id);
                        break;
                    }
                }

                if (!gameId) {
                    gameId = Math.random().toString(36).substring(2, 8);
                    playerColor = 'white';
                    games[gameId] = {
                        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                        players: 1,
                        sockets: [socket.id]
                    };
                }

                socket.join(gameId);
                socket.emit('color', playerColor);
                socket.emit('gameState', games[gameId].fen);
            });

            socket.on('move', (move) => {
                if (gameId) {
                    games[gameId].fen = move.after;
                    socket.to(gameId).emit('move', move);
                }
            });

            socket.on('reset', () => {
                if (gameId) {
                    games[gameId].fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                    io.to(gameId).emit('gameState', games[gameId].fen);
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
                if (gameId && games[gameId]) {
                    games[gameId].players--;
                    games[gameId].sockets = games[gameId].sockets.filter(id => id !== socket.id);
                    
                    if (games[gameId].players === 0) {
                        delete games[gameId];
                    }
                }
            });
        });
    }
    res.end();
}
