// Simple chess bot with three difficulty levels
class ChessBot {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
    }

    getMove(game) {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return null;

        // Filter captures in higher difficulties
        const captures = moves.filter(m => m.captured);
        const checks = moves.filter(m => m.san.includes('+'));
        const goodMoves = [...captures, ...checks];

        switch (this.difficulty) {
            case 'easy':
                // Random moves
                return moves[Math.floor(Math.random() * moves.length)];
            
            case 'medium':
                // Prefer captures and checks, otherwise random
                if (goodMoves.length > 0) {
                    return goodMoves[Math.floor(Math.random() * goodMoves.length)];
                }
                return moves[Math.floor(Math.random() * moves.length)];
            
            case 'hard':
                // Simple evaluation - prefer material gain
                if (goodMoves.length > 0) {
                    // Sort captures by captured piece value
                    const sortedCaptures = [...captures].sort((a, b) => {
                        return this.pieceValue(b.captured) - this.pieceValue(a.captured);
                    });
                    if (sortedCaptures.length > 0) return sortedCaptures[0];
                    return goodMoves[0];
                }
                
                // Otherwise random, but prefer center control
                const centerMoves = moves.filter(m => {
                    const to = m.to;
                    return (to[0] >= 'd' && to[0] <= 'e') && (to[1] >= '4' && to[1] <= '5');
                });
                if (centerMoves.length > 0) {
                    return centerMoves[Math.floor(Math.random() * centerMoves.length)];
                }
                return moves[Math.floor(Math.random() * moves.length)];
        }
    }

    pieceValue(piece) {
        const values = {
            'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
        };
        return values[piece.toLowerCase()] || 0;
    }
}

module.exports = ChessBot;
