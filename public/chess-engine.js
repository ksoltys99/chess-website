const stockfish = new Worker('stockfish.js');
function chessEngine(color, fen){    
    const computerColor = color;
    const selectedPromotionValue = document.getElementById('promotion-select');
    const promoteTo = selectedPromotionValue.options[selectedPromotionValue.selectedIndex].value;
    sendPositionToStockfish(fen);

    function computerMove(move){
        move = handleCastle(move);
        let computerPieces = chessPieces.filter(element => element.color === computerColor); 
        let chosenMove = move !== '' ? formatMoveFromEngine(move) : chooseMove(computerPieces);
        const piece = chosenMove[0];
        const field = [chosenMove[1][0], chosenMove[1][1]];

        let target = document.getElementById(field.join("").toString());
        let x = field[0];
        let y = field[1];

        if(!target.outerHTML.includes('img')){      
            if(piece.isLegalMove(x, y) && piece.setTurn()){           
                //en passant
                if(piece.type.includes("pawn") && piece.coordinates[1]!==y && y===previousMovesStore[movesCounter-1].moveTo[1]){
                    if(piece.color==="white"){
                        fieldAfterThePawnId = [x+1, y].join("").toString();
                        document.getElementById(chessboard[x+1][y].id).remove();
                        removePieceFromArray(chessboard[x+1][y].id);
                        chessboard[x+1][y] = "0";
                    }
                    else{
                        fieldAfterThePawnId = [x-1, y].join("").toString();
                        document.getElementById(chessboard[x-1][y].id).remove();
                        removePieceFromArray(chessboard[x-1][y].id);
                        chessboard[x-1][y] = "0";
                    }
                    collisionFlag = true;
                }
                target.appendChild(document.getElementById(piece.id));
                piece.move(x, y, promoteTo);
            }
        }
        else if(target.outerHTML.includes('img')){
            let targetId = target.querySelector('img').id;
            target = document.getElementById(targetId);
            if(piece.isLegalMove(x, y) && piece.setTurn()){
                collisionFlag = true;
                removePieceFromArray(chessboard[x][y].id);
                target.replaceWith(document.getElementById(piece.id));
                piece.move(x, y, promoteTo);
            }
        }

        if(piece.type==='pawn'){
            if((piece.coordinates[0] === 0) || (piece.coordinates[0] === 7)){
                target = document.getElementById(field.join("").toString());
                const pieceImage = switchImageAfterPromotion(piece, promoteTo);
                document.getElementById(piece.id).remove();
                target.append(pieceImage);
                pieceImage.addEventListener("dragstart", dragstart_handler);
                isPromotion = false;
            }
        }
    }

    function formatMoveFromEngine(givenMove){
        const moveFrom = givenMove.substring(0, 2);
        const moveTo = givenMove.substring(2, 4);
        function findFieldByName(name){
            let fieldCords = [];
            for(let i = 0; i<8; i++){
                chessboardFields[i].forEach((element, index) => {
                    if(element === name) {
                        fieldCords[0] = i;
                        fieldCords[1] = index;
                    }
                })
            }
            return fieldCords;
        }
        let pieceCords = findFieldByName(moveFrom);
        let piece = chessboard[pieceCords[0]][pieceCords[1]];
        let moveCords = findFieldByName(moveTo);
        return [piece, moveCords];
    }

    function handleCastle(m){
        if(blackKing.firstMove){
            if(m === 'e8h8') m = `e8g8`;
            if(m === 'e8a8') m = `e8c8`;
        }
        if(whiteKing.firstMove){
            if(m === 'e1h1') m = `e1g1`;
            if(m === 'e1a1') m = `e1c1`;
        }
        return m;
    }

    function chooseMove(pieces){
        let chosenPiece, chosenMove;

        pieces = pieces.filter(element => element.availableMoves.length > 0);
        pieces = pieces.sort((a,b) => 0.5 - Math.random());
        chosenPiece = pieces[0];
        chosenMove = chosenPiece.availableMoves[0];
        
        return [chosenPiece, chosenMove];
    }
    
    function sendPositionToStockfish(fen){
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage('go');
    
        stockfish.onmessage = function(event){     
            const result = event.data;
            prepareStockfishData(result);
        }    
    }
    
    function prepareStockfishData(data){
        if(data.includes('bestmove')){
            const engineMove = data.substring(9,13);
            computerMove(engineMove);
        }
    }
}
