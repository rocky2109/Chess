import { Server } from 'socket.io';

let games = {};

export default function handler(req, res) {
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io');
        
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('New client connected');
            
            socket.on('join', (data) => {
                if (data.mode === 'friend') {
                    handleFriendGame(socket);
                }
            });

            socket.on('move', (data) => {
                const { gameId, move } = data;
                if (games[gameId]) {
                    games[gameId].fen = move.after;
                    socket.to(gameId).emit('move', move);
                }
            });

            socket.on('reset', (data) => {
                const { gameId } = data;
                if (games[gameId]) {
                    games[gameId].fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                    io.to(gameId).emit('gameState', games[gameId].fen);
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
                // Clean up games
                for (const id in games) {
                    games[id].sockets = games[id].sockets.filter(s => s !== socket.id);
                    if (games[id].sockets.length === 0) {
                        delete games[id];
                    }
                }
            });

            function handleFriendGame(socket) {
                // Try to find existing game waiting for player
                for (const id in games) {
                    if (games[id].players < 2) {
                        joinGame(socket, id, 'black');
                        return;
                    }
                }

                // Create new game
                const newGameId = generateGameId();
                games[newGameId] = {
                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                    players: 1,
                    sockets: [socket.id]
                };
                joinGame(socket, newGameId, 'white');
            }

            function joinGame(socket, gameId, color) {
                socket.join(gameId);
                games[gameId].players++;
                games[gameId].sockets.push(socket.id);
                socket.emit('gameCreated', { gameId, color });
                socket.emit('gameState', games[gameId].fen);
            }

            function generateGameId() {
                return Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        });
    }
    res.end();
}
