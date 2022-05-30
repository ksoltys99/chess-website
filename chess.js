const NUMBER_OF_COLS_OR_ROWS = 8;
const BOTTOM_BOARD_END = 7;
const UPPER_BOARD_END = 0;
const RIGHT_BOARD_END = 7;
const LEFT_BOARD_END = 0
let whiteTurn = true;
let currentColor = "white";
let blackPromotedCounter = 10;
let whitePromotedCounter = 10;
let previousMovesStore = [];
let movesCounter = 0, turnCounter = 0, fullMovesCounter = 0;
let shortCastleNotation = false, longCastleNotation = false;
let scrollX = 0, scrollY = 0;
let checkmateNotation = false;
let checkmate = false;
let isPromotion = false;
let possibleEnPassantTarget = '-';
let noCaptureOrPawnMove = 0;
let gameStarted = false;
let playerColor = '';
let engineColor = '';
let playWith = '';
let gameOver = false;

class Piece{
    constructor(color, coordinates, id, type){
        this.color = color;
        this.coordinates = coordinates;
        this.id = id;
        this.type = type;
        this.currentDiagonals = [];
    }

    putOnBoard(){
        chessboard[this.coordinates[0]][this.coordinates[1]] = this;
    }

    move(row, col, promotionName){
        const previousMove = { 
            "pieceId" : this.id,
            "pieceType" : this.type,
            "moveFrom" : [this.coordinates[0], this.coordinates[1]],
            "moveTo" : [row, col]
        };
        previousMovesStore.push(previousMove);
        clearAttackedKing();
        chessboard[row][col] = this;
        chessboard[this.coordinates[0]][this.coordinates[1]] = "0";
        this.coordinates = [row,col];
        this.firstMove = false;
        
        if(this.type.includes("pawn") && (this.coordinates[0] === UPPER_BOARD_END || this.coordinates[0] === BOTTOM_BOARD_END)) this.promoteTo(promotionName);

        chessPieces.forEach((element) => {
            element.setNextAvailableMove();
            element.setAttackedFields();
        });

        if(this.type.includes("king") && Math.abs(previousMovesStore[movesCounter].moveFrom[1]-previousMovesStore[movesCounter].moveTo[1])>1){
            this.doCastle(col);
            if(previousMovesStore[movesCounter].moveFrom[1]-previousMovesStore[movesCounter].moveTo[1]<0) shortCastleNotation = true;
            else longCastleNotation = true;
        }
        whiteKing.isAttacked = false;
        blackKing.isAttacked = false;

        whiteKing.setNextAvailableMove();
        blackKing.setNextAvailableMove();

        if(this.color==="black"){ 
            if(whiteKing.isFieldAttacked(whiteKing.coordinates[0], whiteKing.coordinates[1])){
                whiteKing.isAttacked = true;
                isItCheckmate(whiteKing);
            }
        }
        if(this.color==="white"){   
            if(blackKing.isFieldAttacked(blackKing.coordinates[0], blackKing.coordinates[1])){
                blackKing.isAttacked = true;
                isItCheckmate(blackKing);
            }
        }

        drawByStalemate(this.color);
        drawByLackOfMaterial(this.color);
        
        clearLastMove();
        showLastMove();
        if(whiteKing.isAttacked) showAttackedKing(whiteKing);
        if(blackKing.isAttacked) showAttackedKing(blackKing);
        movesCounter++;

        if(!whiteTurn) turnCounterFiller();
        movesNotationFiller();

        if(checkmate || gameOver){
            gameStarted = false;
            return;
        }

        const fen = convertToFenNotation(chessboard, currentColor);
        if(playWith==='computer'){
            if(playerColor==="white"){
                if(!whiteTurn) chessEngine('black', fen);
            }
            else if(playerColor==="black"){
                if(whiteTurn) chessEngine('white', fen);
            }
        }
        if(!whiteTurn) fullMovesCounter++;
        possibleEnPassantTarget = '-';
    }

    setTurn(){
        if(whiteTurn===true && this.color==="white"){
            whiteTurn = false;
            currentColor = "black";
            turnCounter++;
            return true;
        }
        if(whiteTurn===false && this.color==="black"){
            whiteTurn = true;
            currentColor = "white";
            return true;
        }
    }

    compareMoveToArray(row, col, array){
        if(array === undefined) array = [];
        for(let i=0; i<array.length; i++){
            if((array[i][0]===row)&&(array[i][1]===col)){
                return true;
            }
        }
        return false;
    }

    //finds diagonals connected to piece's current position and return them as array of fields (including first collision for each direction)
    checkDiagColisions(){
        let x = this.coordinates[0];
        let y = this.coordinates[1];

        let tempX = x;
        let tempY = y;

        let movesArray = [];

        //up left
        while((tempX > UPPER_BOARD_END) && (tempY > UPPER_BOARD_END)){
            tempX=tempX-1;
            tempY=tempY-1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //up right
        while((tempX > UPPER_BOARD_END) && (tempY < BOTTOM_BOARD_END)){
            tempX=tempX-1;
            tempY=tempY+1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //down left
        while((tempX < BOTTOM_BOARD_END) && (tempY > UPPER_BOARD_END)){
            tempX=tempX+1;
            tempY=tempY-1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //down right
        while((tempX < BOTTOM_BOARD_END) && (tempY < BOTTOM_BOARD_END)){
            tempX=tempX+1;
            tempY=tempY+1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }  
        return movesArray;
    }
    
    //same as above (lines instead of diags)
    checkLineColisions(){
        let x = this.coordinates[0];
        let y = this.coordinates[1];

        let tempX = x;
        let tempY = y;

        let movesArray = [];

        //up
        while(tempX > UPPER_BOARD_END){
            tempX=tempX - 1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //right
        while(tempY < BOTTOM_BOARD_END){
            tempY=tempY + 1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //down
        while(tempX < BOTTOM_BOARD_END){
            tempX=tempX + 1;

            if(chessboard[tempX][tempY]==="0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }
        tempX = x;
        tempY = y;

        //left
        while(tempY > UPPER_BOARD_END){
            tempY=tempY - 1;

            if(chessboard[tempX][tempY] === "0") movesArray.push([tempX, tempY]);
            else{
                movesArray.push([tempX, tempY]);
                break;
            }
        }  
        return movesArray;
    }

    isFieldAttacked(row, col){
        let condition = false;
        chessPieces.forEach((element) => {
            if(this.compareMoveToArray(row, col, element.attackedFields) && element.color!==this.color){ 
                condition = true;
            }
        });
        if(condition) return true;
        else return false;
    }
}

class Pawn extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.firstMove = true;
        this.attackedField1;
        this.attackedField2;
        this.notation = 'p';
        if(this.color==="white"){
            this.availableMoves = [[this.coordinates[0]-1, this.coordinates[1]]];
            this.attackedField1 = [this.coordinates[0]-1, this.coordinates[1]+1];
            this.attackedField2 = [this.coordinates[0]-1, this.coordinates[1]-1];
        }
        else{
            this.availableMoves = [[this.coordinates[0]+1, this.coordinates[1]]];
            this.attackedField1 = [this.coordinates[0]+1, this.coordinates[1]+1];
            this.attackedField2 = [this.coordinates[0]+1, this.coordinates[1]-1];
        }
    }
    isLegalMove(row, col){

        if((chessboard[row][col]!=="0")&&(col===this.coordinates[1])) return;
        
        if(this.color==='white'){
            if(chessboard[this.coordinates[0]-1][this.coordinates[1]]!=="0" && col===this.coordinates[1]) return; 
        }
        else{
            if(chessboard[this.coordinates[0]+1][this.coordinates[1]]!=="0" && col===this.coordinates[1]) return;
        }
        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    checkEnPassant(){
        if(movesCounter>0){
            const lastMove = previousMovesStore[previousMovesStore.length-1];
            if(this.color==="white"){
                if(lastMove.pieceId.includes("bp") && lastMove.moveFrom[0]===this.coordinates[0]-2 && lastMove.moveTo[0]===this.coordinates[0]){
                    if(lastMove.moveFrom[1]===this.coordinates[1]-1){ 
                        this.availableMoves.push([this.coordinates[0]-1, this.coordinates[1]-1]);
                        possibleEnPassantTarget = chessboardFields[this.coordinates[0]-1][this.coordinates[1]-1];
                    }
                    else if(lastMove.moveFrom[1]===this.coordinates[1]+1){ 
                        this.availableMoves.push([this.coordinates[0]-1, this.coordinates[1]+1]);
                        possibleEnPassantTarget = chessboardFields[this.coordinates[0]-1][this.coordinates[1]+1];
                    }
                }
            }
            if(this.color==="black"){
                if(lastMove.pieceId.includes("wp") && lastMove.moveFrom[0]===this.coordinates[0]+2 && lastMove.moveTo[0]===this.coordinates[0]){
                    if(lastMove.moveFrom[1]===this.coordinates[1]-1){ 
                        this.availableMoves.push([this.coordinates[0]+1, this.coordinates[1]-1]);
                        possibleEnPassantTarget = chessboardFields[this.coordinates[0]+1][this.coordinates[1]-1];
                    }
                    else if(lastMove.moveFrom[1]===this.coordinates[1]+1){ 
                        this.availableMoves.push([this.coordinates[0]+1, this.coordinates[1]+1]);
                        possibleEnPassantTarget = chessboardFields[this.coordinates[0]+1][this.coordinates[1]+1];
                    }
                }
            }
        }
    }

    setAttackedFields(){
        if(this.color==="white"){ 
            this.attackedField1 = [this.coordinates[0]-1, this.coordinates[1]+1];
            this.attackedField2 = [this.coordinates[0]-1, this.coordinates[1]-1];
        }
        else{
            this.attackedField1 = [this.coordinates[0]+1, this.coordinates[1]+1];
            this.attackedField2 = [this.coordinates[0]+1, this.coordinates[1]-1];
        }
        this.attackedFields = [this.attackedField1, this.attackedField2];
    }

    setNextAvailableMove(){
        this.availableMoves = [];
        if(this.color==="white"){
            if(chessboard[this.coordinates[0]-1][this.coordinates[1]]==="0") this.availableMoves = [[this.coordinates[0]-1, this.coordinates[1]]];

            if(this.firstMove){
                if(chessboard[this.coordinates[0]-1][this.coordinates[1]]==="0" && chessboard[this.coordinates[0]-2][this.coordinates[1]]==="0")
                    this.availableMoves.push([this.coordinates[0]-2, this.coordinates[1]]);
            }
            if(chessboard[this.attackedField1[0]][this.attackedField1[1]]!=="0" && chessboard[this.attackedField1[0]][this.attackedField1[1]]!==undefined){ 
                if(chessboard[this.attackedField1[0]][this.attackedField1[1]].color==="black") this.availableMoves.push(this.attackedField1);
            }

            if(chessboard[this.attackedField2[0]][this.attackedField2[1]]!=="0" && chessboard[this.attackedField2[0]][this.attackedField2[1]]!==undefined){
                if(chessboard[this.attackedField2[0]][this.attackedField2[1]].color==="black") this.availableMoves.push(this.attackedField2);
            }
        }
        else{
            if(chessboard[this.coordinates[0]+1][this.coordinates[1]]==="0") this.availableMoves = [[this.coordinates[0]+1, this.coordinates[1]]];

            if(this.firstMove){
                if(chessboard[this.coordinates[0]+1][this.coordinates[1]]==="0" && chessboard[this.coordinates[0]+2][this.coordinates[1]]==="0")
                    this.availableMoves.push([this.coordinates[0]+2, this.coordinates[1]]);
            }
            if(chessboard[this.attackedField1[0]][this.attackedField1[1]]!=="0" && chessboard[this.attackedField1[0]][this.attackedField1[1]]!==undefined){ 
                if(chessboard[this.attackedField1[0]][this.attackedField1[1]].color==="white") this.availableMoves.push([this.attackedField1[0], this.attackedField1[1]]);
            }

            if(chessboard[this.attackedField2[0]][this.attackedField2[1]]!=="0" && chessboard[this.attackedField2[0]][this.attackedField2[1]]!==undefined){
                if(chessboard[this.attackedField2[0]][this.attackedField2[1]].color==="white") this.availableMoves.push([this.attackedField2[0], this.attackedField2[1]]);
            }
        }
        this.checkEnPassant();
        if(this.coordinates[0]!==7 && this.coordinates[0]!==0) this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter>0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
    }

    promoteTo(piece){ 
        let promotedPawn;
        let newPieceId = `${this.color[0]}${piece[0]}${this.color===`white` ? ++whitePromotedCounter : ++blackPromotedCounter}`;
        let position = [this.coordinates[0], this.coordinates[1]];
        isPromotion = true;

        switch(piece){
            case 'queen':
                promotedPawn = new Queen(this.color, position, newPieceId, 'queen');
                break;
            case 'rook':
                promotedPawn = new Rook(this.color, position, newPieceId, 'rook');
                break;
            case 'bishop':
                promotedPawn = new Bishop(this.color, position, newPieceId, 'bishop');
                break;
            case 'knight':
                promotedPawn = new Knight(this.color, position, newPieceId, 'knight');
                break;
        }

        chessPieces.push(promotedPawn);
        promotedPawn.putOnBoard();
        promotedPawn.setNextAvailableMove();
        promotedPawn.setAttackedFields();
        removePieceFromArray(this.id);
    }
}

class Rook extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.firstMove = true;
        this.notation = 'r';
    }

    isLegalMove(row, col){
        if(row===this.coordinates[0] && col===this.coordinates[1]) return;
        if(this.color==="white"){
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="white") return;
        }
        else{
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="black") return;
        }
        if(this.checkLineColisions(row, col)===false) return;
        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    setAttackedFields(){
        this.attackedFields = this.checkLineColisions();
    }

    setNextAvailableMove(){
        this.availableMoves = this.checkLineColisions();
        this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter > 0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
    }
}

class Knight extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.notation = 'n';
    }

    isLegalMove(row, col){
        if(this.color==="white"){
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="white") return;
        }
        else{
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="black") return;
        }

        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    setAttackedFields(){
        this.attackedFields = deleteMovesBeyondChessboard([
            [this.coordinates[0]-2, this.coordinates[1]+1],
            [this.coordinates[0]-2, this.coordinates[1]-1],
            [this.coordinates[0]+2, this.coordinates[1]+1],
            [this.coordinates[0]+2, this.coordinates[1]-1],
            [this.coordinates[0]-1, this.coordinates[1]+2],
            [this.coordinates[0]-1, this.coordinates[1]-2],
            [this.coordinates[0]+1, this.coordinates[1]+2],
            [this.coordinates[0]+1, this.coordinates[1]-2]
        ]);
    }

    setNextAvailableMove(){
        this.availableMoves = [
            [this.coordinates[0]-2, this.coordinates[1]+1],
            [this.coordinates[0]-2, this.coordinates[1]-1],
            [this.coordinates[0]+2, this.coordinates[1]+1],
            [this.coordinates[0]+2, this.coordinates[1]-1],
            [this.coordinates[0]-1, this.coordinates[1]+2],
            [this.coordinates[0]-1, this.coordinates[1]-2],
            [this.coordinates[0]+1, this.coordinates[1]+2],
            [this.coordinates[0]+1, this.coordinates[1]-2]
        ];
        this.availableMoves = deleteMovesBeyondChessboard(this.availableMoves);
        this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter > 0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
    }
}

class Bishop extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.notation = 'b';
    }

    isLegalMove(row, col){
        if(row===this.coordinates[0] && col===this.coordinates[1]) return;
        if(this.color==="white"){
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="white") return;
        }
        else{
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="black") return;
        }
        if(this.checkDiagColisions(row, col)===false) return;
        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    setAttackedFields(){
        this.attackedFields = this.checkDiagColisions();
    }

    setNextAvailableMove(){
        this.availableMoves = this.checkDiagColisions();
        this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter>0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
    }
}

class Queen extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.notation = 'q';
    }

    isLegalMove(row, col){
        if(row===this.coordinates[0] && col===this.coordinates[1]) return;
        if(this.color==="white"){
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="white") return;
        }
        else{
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="black") return;
        }
        
        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    setAttackedFields(){
        this.diags = this.checkDiagColisions();
        this.lines = this.checkLineColisions();
        this.attackedFields = this.diags.concat(this.lines);
    }

    setNextAvailableMove(){
        this.diags = this.checkDiagColisions();
        this.lines = this.checkLineColisions();
        this.availableMoves = this.diags.concat(this.lines);
        this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter > 0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
    }
}

class King extends Piece{
    constructor(color, coordinates, id, type){
        super(color, coordinates, id, type);
        this.firstMove = true;
        this.isAttacked = false;
        this.notation = 'k';
    }

    isLegalMove(row, col){
        if(this.color==="white"){
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="white") return;
        }
        else{
            if(chessboard[row][col]!=="0" && chessboard[row][col].color==="black") return;
        }

        this.checkCastleCondition();
        if(this.isFieldAttacked(row, col)) return false;

        return this.compareMoveToArray(row, col, this.availableMoves);
    }

    setAttackedFields(){
        this.attackedFields = deleteMovesBeyondChessboard([
            [this.coordinates[0]-1, this.coordinates[1]-1],
            [this.coordinates[0]-1, this.coordinates[1]],
            [this.coordinates[0]-1, this.coordinates[1]+1],
            [this.coordinates[0], this.coordinates[1]-1],
            [this.coordinates[0], this.coordinates[1]+1],
            [this.coordinates[0]+1, this.coordinates[1]-1],
            [this.coordinates[0]+1, this.coordinates[1]],
            [this.coordinates[0]+1, this.coordinates[1]+1]
        ]);
    }

    setNextAvailableMove(){
        this.availableMoves = [
            [this.coordinates[0]-1, this.coordinates[1]-1],
            [this.coordinates[0]-1, this.coordinates[1]],
            [this.coordinates[0]-1, this.coordinates[1]+1],
            [this.coordinates[0], this.coordinates[1]-1],
            [this.coordinates[0], this.coordinates[1]+1],
            [this.coordinates[0]+1, this.coordinates[1]-1],
            [this.coordinates[0]+1, this.coordinates[1]],
            [this.coordinates[0]+1, this.coordinates[1]+1]
        ];
        this.availableMoves = deleteMovesBeyondChessboard(this.availableMoves);
        this.availableMoves = deleteMovesAtOwnPieces(this.availableMoves, this.color);
        if(movesCounter > 0) this.availableMoves = deleteMovesThatWouldExposeKingToCheck(this.availableMoves, this);
        this.checkCastleCondition();
        
        if(movesCounter>0){
            this.availableMoves = this.availableMoves.filter((element)=>{
                return (!this.isFieldAttacked(element[0], element[1]));
            })
        }
    }

    checkCastleCondition(){
        if(this.firstMove===true && this.isAttacked===false){
            const king = this;
            function longCastle(){
                if(king.color==="white"){
                    if(chessboard[7][0].id==="wr1" && chessboard[7][0].firstMove===true){
                        for(let i=3; i>0; i--){
                            if(chessboard[7][i]!=="0") return;
                        }
                        if(king.isFieldAttacked(7,1) || king.isFieldAttacked(7,2) || king.isFieldAttacked(7,3)) return;
                        king.availableMoves.push([7,2]);
                    }
                }
                else{
                    if(chessboard[0][0].id==="br1" && chessboard[0][0].firstMove===true){
                        for(let i=3; i>0; i--){
                            if(chessboard[0][i]!=="0") return;
                        }
                        if(king.isFieldAttacked(0,1) || king.isFieldAttacked(0,2) || king.isFieldAttacked(0,3)) return;
                        king.availableMoves.push([0,2]);
                    }
                }
            }
            longCastle();
            function shortCastle(){
                if(king.color==="white"){
                    if(chessboard[7][7].id==="wr2" && chessboard[7][7].firstMove===true){
                        for(let i=5; i<7; i++){
                            if(chessboard[7][i]!=="0") return;
                        }
                        if(king.isFieldAttacked(7,6) || king.isFieldAttacked(7,5)) return;
                        king.availableMoves.push([7,6]);
                    }
                }
                else{
                    if(chessboard[0][7].id==="br2" && chessboard[0][7].firstMove===true){
                        for(let i=5; i<7; i++){
                            if(chessboard[0][i]!=="0") return;
                        }
                        if(king.isFieldAttacked(0,6) || king.isFieldAttacked(0,5)) return;
                        king.availableMoves.push([0,6]);
                    }
                }
            }
            shortCastle();
        }
    }
    
    doCastle(col){
        let rook, rookFieldId, imageSource;
        
        //O-O
        if(col===6){
            rook = chessboard[this.coordinates[0]][7];

            chessboard[this.coordinates[0]][this.coordinates[1]-1] = rook;
            chessboard[this.coordinates[0]][this.coordinates[1]+1] = "0";

            rookFieldId = [rook.coordinates[0], rook.coordinates[1]-2].join("").toString();
            imageSource = `images/${rook.id.substring(0, 2)}.png`;

            rook.coordinates = [this.coordinates[0], this.coordinates[1]-1];   
        }
        //O-O-O
        else if(col===2){
            rook = chessboard[this.coordinates[0]][0];

            chessboard[this.coordinates[0]][this.coordinates[1]+1] = rook;
            chessboard[this.coordinates[0]][this.coordinates[1]-2] = "0";

            rookFieldId = [rook.coordinates[0], rook.coordinates[1]+3].join("").toString();
            imageSource = `images/${rook.id.substring(0, 2)}.png`;

            rook.coordinates = [this.coordinates[0], this.coordinates[1]+1];
        }

        rook.setNextAvailableMove();
        rook.setAttackedFields();
        document.getElementById(rook.id).remove();
        const rookImg = document.createElement(`img`);
        rookImg.classList.add("piece");
        rookImg.setAttribute("src", imageSource);
        rookImg.setAttribute("id", rook.id);
        rookImg.setAttribute("alt", `${rook.color}_rook`);
        rookImg.setAttribute("draggable", "true");
        document.getElementById(rookFieldId).append(rookImg);
        addPropertyAfterCastle(rook.id);
    }
}

function generateChessboard(){
    const chessboard = [];
    for(let i=0; i<8; i++){

        chessboard[i] = new Array(8);
        
        for(let j=0; j<8; j++){

            chessboard[i][j] = "0";
            
        }
    }
    return chessboard;
}

function prepareBoardToGame(){
    chessPieces.forEach((element)=>{
        element.putOnBoard();
        if(didPawnMove(element)) element.firstMove = false;
        element.setNextAvailableMove();
        element.setAttackedFields();
    });
}

function removePieceFromArray(id){
    for (let i = chessPieces.length - 1; i >= 0; --i) {
        if (chessPieces[i].id === id) {
            chessPieces.splice(i,1);
        }
    }
}

function willKingBeAttacked(piece, targetX, targetY){

    if(!piece.isLegalMove(targetX, targetY)) return;

    let condition = false;

    //hold some of variables crucial to reversion of the process when the function ends
    const pieceX = piece.coordinates[0];
    const pieceY = piece.coordinates[1];
    const target = chessboard[targetX][targetY];
    let enPassantBeatenPawn;

    //do given move only on the virtual chessboard, then check if king is safe now
    //en passant case
    if(piece.type.includes("pawn") && targetY!==pieceY && target==="0"){
        if(piece.color==="white"){
            if(piece.coordinates[0]!==3) return;
            enPassantBeatenPawn = chessboard[targetX+1][targetY];
            chessboard[targetX][targetY] = piece;
            chessboard[pieceX][pieceY] = "0";
            chessboard[targetX+1][targetY] = "0";
        }
        else if(piece.color==="black"){
            if(piece.coordinates[0]!==4) return;
            enPassantBeatenPawn = chessboard[targetX-1][targetY];
            chessboard[targetX][targetY] = piece;
            chessboard[pieceX][pieceY] = "0";
            chessboard[targetX-1][targetY] = "0";
        }
       
        piece.coordinates = [targetX, targetY];
    }
    
    //classic case
    else{
        if(target.hasOwnProperty("type")){
            target.attackedFields = [];
        }  
        chessboard[targetX][targetY] = piece;
        chessboard[pieceX][pieceY] = "0";
        piece.coordinates = [targetX, targetY];  
    }

    chessPieces.forEach((element)=>{
        if(element.id!==target.id) element.setAttackedFields();
    });

    if(enPassantBeatenPawn!=="0" && enPassantBeatenPawn!==undefined) enPassantBeatenPawn.attackedFields = [];

    if(piece.color==="white"){
        if(whiteKing.isFieldAttacked(whiteKing.coordinates[0], whiteKing.coordinates[1])) condition = true;
    }
    else if(piece.color==="black"){
        if(blackKing.isFieldAttacked(blackKing.coordinates[0], blackKing.coordinates[1])) condition = true;
    }

    //reverse process
    //en passant case
    if(piece.type.includes("pawn") && targetY!==pieceY && target==="0"){
        if(piece.color==="white"){ 
            chessboard[pieceX][pieceY] = piece;
            chessboard[targetX][targetY] = "0";
            chessboard[targetX+1][targetY] = enPassantBeatenPawn;
        }
        else if(piece.color==="black"){ 
            chessboard[pieceX][pieceY] = piece;
            chessboard[targetX][targetY] = "0";
            chessboard[targetX-1][targetY] = enPassantBeatenPawn;
        }
        enPassantBeatenPawn.setAttackedFields();
    }
    //classic case
    else{
        if(target!=="0"){
            target.setAttackedFields();
        }
        chessboard[pieceX][pieceY] = piece;
        chessboard[targetX][targetY] = target;
    }

    piece.coordinates = [pieceX, pieceY];
    chessPieces.forEach((element)=>{
        element.setAttackedFields();
    });

    if(condition) return true;
    else return false;
}

function turnCounterFiller(){
    const notationMovesCounter = document.querySelector(".moves-counter");
    const div = document.createElement("div");
    div.innerText = `${turnCounter}.`;
    div.classList.add("notation-item");
    notationMovesCounter.append(div);
}

function movesNotationFiller(){
    let field = chessboardFields[previousMovesStore[movesCounter-1].moveTo[0]][previousMovesStore[movesCounter-1].moveTo[1]];
    let totalFieldString = field;
    const whiteMove = document.querySelector(".white-moves");
    const blackMove = document.querySelector(".black-moves");
    const div = document.createElement("div");
    const pieceType = previousMovesStore[movesCounter-1].pieceType;
    const pieceCol = chessboardFields[0][previousMovesStore[movesCounter-1].moveFrom[1]][0];
    const plusIfKingIsAttacked = (whiteKing.isAttacked || blackKing.isAttacked) ? '+' : ''; 

    div.classList.add("notation-item");

    if(collisionFlag){ 
        field = `x${field}`;
        collisionFlag = false;
        totalFieldString = field;
    }

    if(whiteKing.isAttacked || blackKing.isAttacked) totalFieldString = `${field}+`;
    if(checkmateNotation) totalFieldString = `${field}#`

    div.innerText = `${totalFieldString}`;

    if(!pieceType.includes("pawn")) div.innerText = `${pieceType[0].toUpperCase()}${totalFieldString}`;
    if(pieceType.includes("knight")) div.innerText = `${pieceType[1].toUpperCase()}${totalFieldString}`;
    if(pieceType.includes("pawn") && field[0]==="x") div.innerText = `${pieceCol}${totalFieldString}`;

    if(shortCastleNotation){
        div.innerText = `O-O${plusIfKingIsAttacked}`;
        shortCastleNotation = false;
    }
    if(longCastleNotation){
        div.innerText = `O-O-O${plusIfKingIsAttacked}`;
        longCastleNotation = false;
    }


    if(pieceType.includes('pawn') || totalFieldString.includes('x')) noCaptureOrPawnMove = 0;
    else noCaptureOrPawnMove++;


    if(movesCounter % 2 !== 0) whiteMove.append(div);
    else blackMove.append(div);

    
    document.querySelector(".moves-notation-board").scrollTo(scrollX, scrollY);
    scrollX+=100;
    scrollY+=100;
}

function addGameResult(color, result, reason){
    let gameResultText = ''
    if(result === "draw") gameResultText = `draw by ${reason}`;
    else gameResultText = `${color} won by ${reason}`;

    const modal = document.querySelector('#modal');
    const textBox = document.querySelector('.game-result-info');
    textBox.innerText = gameResultText;
    modal.showModal();
    showOptions();
    localStorage.clear();
    gameOver = true;

    const closeModalBtn = document.querySelector('.close-btn');
    closeModalBtn.addEventListener('click', () => {
        modal.close();
    });
}

function deleteMovesBeyondChessboard(movesArray){
    return movesArray.filter(element => {
        return (element[0]<=7 && element[1]<=7 && element[0]>=0 && element[1]>=0);
    })
}

function deleteMovesAtOwnPieces(movesArray, color){
    return movesArray.filter(element => {
        return (chessboard[element[0]][element[1]].color!==color || chessboard[element[0]][element[1]]==="0");
    })
}

function deleteMovesThatWouldExposeKingToCheck(movesArray, piece){
    return movesArray.filter(element => {
        return(!willKingBeAttacked(piece, element[0], element[1]));
    })
}

function isItCheckmate(king){
    let condition = true;
    chessPieces.forEach((element) => {
        if(element.color === king.color){
            let piece = element;
            if(piece.availableMoves.length>0){
                piece.availableMoves.forEach((element) =>{
                    if(!willKingBeAttacked(piece, element[0], element[1])){
                        condition = false;
                    }
                })
            }
        }
    });
    if(condition){
        checkmateNotation = true;
        checkmate = true;
        localStorage.clear();
        if(king.color==="white") return addGameResult("black", 'won', 'checkmate');
        else if(king.color==="black") return addGameResult("white", 'won', 'checkmate');
    }
}

function drawByStalemate(color){
    let condition = true;
    if(color==="white"){
        if(blackKing.isAttacked) condition = false;
        if(!blackKing.isAttacked){
            chessPieces.forEach((element) => {
                if(element.color==="black"){
                    if(element.availableMoves.some(element => element)){
                        condition = false;
                    }
                }
            });
        }
    }
    else if(color==="black"){
        if(whiteKing.isAttacked) condition = false;
        if(!whiteKing.isAttacked){
            chessPieces.forEach((element) => {
                if(element.color==="white"){
                    if(element.availableMoves.some(element => element)){
                        condition = false;
                    }
                }
            });
        }
    }
    if(condition) addGameResult(color, "draw", "stalemate");
}

function drawByLackOfMaterial(color){
    if(chessPieces.some(element => element.type.includes("rook") || element.type.includes("queen") || element.type.includes("pawn"))) return;

    const lightPieces = chessPieces.filter(element => {
        return element.type.includes("knight") || element.type.includes("bishop");
    });
    
    const lightPiecesCounter = lightPieces.length;

    if(lightPiecesCounter >= 2) return;

    addGameResult(color, "draw", "lack of material");
}

function convertToFenNotation(state, colorOnMove){
    let currentFenString = '';
    let emptyFieldCounter = 0;
    for(let i = 0; i<=7; i++){
        state[i].forEach((el, index) => {
            if(el.hasOwnProperty('type')){ 
                if(emptyFieldCounter > 0) currentFenString += emptyFieldCounter.toString();
                emptyFieldCounter = 0;
                el.color === 'white' ? currentFenString += el.notation.toUpperCase() : currentFenString += el.notation;
            }
            else if(el === '0'){
                emptyFieldCounter++;
                if(emptyFieldCounter === 8 || index === 7){
                    currentFenString += emptyFieldCounter.toString();
                    emptyFieldCounter = 0;
                }
            }
        })
        if(i !== 7) currentFenString += '/';
    }
    const canCastle = checkFenCastlePart();
    const totalFenString = `${currentFenString} ${colorOnMove[0]} ${canCastle} ${possibleEnPassantTarget} ${noCaptureOrPawnMove.toString()} ${(fullMovesCounter+1).toString()}`;
    return totalFenString;
}

function checkFenCastlePart(){
    const wRookKingSide = chessPieces.find(piece => piece.id === 'wr2');
    const wRookQueenSide = chessPieces.find(piece => piece.id === 'wr1');
    const bRookKingSide = chessPieces.find(piece => piece.id === 'br2');
    const bRookQueenSide = chessPieces.find(piece => piece.id === 'br1');

    let totalString = '';

    if(wRookKingSide !== undefined) (wRookKingSide.firstMove && whiteKing.firstMove) ? totalString += 'K' : totalString += '';
    if(wRookQueenSide !== undefined) (wRookQueenSide.firstMove && whiteKing.firstMove) ? totalString += 'Q' : totalString += '';
    if(bRookKingSide !== undefined) (bRookKingSide.firstMove && blackKing.firstMove) ? totalString += 'k' : totalString += '';
    if(bRookQueenSide !== undefined) (bRookQueenSide.firstMove && blackKing.firstMove) ? totalString += 'q' : totalString += '';

    if(totalString === '') totalString = '-';

    return totalString;
}

function createVirtualPieces(position = 'default'){
    let virtualPieces = [];
    if(position === 'default'){
        virtualPieces = [ 
            new Rook('white', [7,0], 'wr1', 'rook'),
            new Knight('white', [7,1], 'wn1', 'knight'),
            new Bishop('white', [7,2], 'wb1', 'bishop'), 
            new Queen('white', [7,3], 'wq1', 'queen'), 
            new King('white', [7,4], 'wk1', 'king'),
            new Bishop('white', [7,5], 'wb2', 'bishop'),
            new Knight('white', [7,6], 'wn2', 'knight'),
            new Rook('white', [7,7], 'wr2', 'rook'),
            new Pawn('white', [6,0], 'wp1', 'pawn'),
            new Pawn('white', [6,1], 'wp2', 'pawn'),
            new Pawn('white', [6,2], 'wp3', 'pawn'), 
            new Pawn('white', [6,3], 'wp4', 'pawn'), 
            new Pawn('white', [6,4], 'wp5', 'pawn'), 
            new Pawn('white', [6,5], 'wp6', 'pawn'), 
            new Pawn('white', [6,6], 'wp7', 'pawn'), 
            new Pawn('white', [6,7], 'wp8', 'pawn'),
            new Rook('black', [0,0], 'br1', 'rook'),
            new Knight('black', [0,1], 'bn1', 'knight'),
            new Bishop('black', [0,2], 'bb1', 'bishop'), 
            new Queen('black', [0,3], 'bq1', 'queen'), 
            new King('black', [0,4], 'bk1', 'king'),
            new Bishop('black', [0,5], 'bb2', 'bishop'),
            new Knight('black', [0,6], 'bn2', 'knight'),
            new Rook('black', [0,7], 'br2', 'rook'),
            new Pawn('black', [1,0], 'bp1', 'pawn'),
            new Pawn('black', [1,1], 'bp2', 'pawn'),
            new Pawn('black', [1,2], 'bp3', 'pawn'), 
            new Pawn('black', [1,3], 'bp4', 'pawn'), 
            new Pawn('black', [1,4], 'bp5', 'pawn'), 
            new Pawn('black', [1,5], 'bp6', 'pawn'), 
            new Pawn('black', [1,6], 'bp7', 'pawn'), 
            new Pawn('black', [1,7], 'bp8', 'pawn')
        ];
    }
    else if(position === 'custom'){
        const customPositionString = localStorage.getItem('position');

        const pieces = JSON.parse(customPositionString);
    
        pieces.forEach(element => {
            let currentPiece;
            switch(element.type){
                case 'pawn':
                    currentPiece = new Pawn(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
                case 'knight':
                    currentPiece = new Knight(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
                case 'bishop':
                    currentPiece = new Bishop(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
                case 'rook':
                    currentPiece = new Rook(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
                case 'queen':
                    currentPiece = new Queen(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
                case 'king':
                    currentPiece = new King(element.color, [parseInt(element.coordinates[0]), parseInt(element.coordinates[1])], element.id, element.type);
                    break;
            }
            virtualPieces.push(currentPiece);
        })
    }
    return virtualPieces;
}

let chessPieces = createVirtualPieces();
let whiteKing = chessPieces.find(piece => piece.id === 'wk1');
let blackKing = chessPieces.find(piece => piece.id === 'bk1');
const chessboardFields = [
    ["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"],
    ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
    ["a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6"],
    ["a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5"],
    ["a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4"],
    ["a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"],
    ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
    ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]];  

let chessboard = generateChessboard();
