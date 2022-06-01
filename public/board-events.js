let previousMoveFieldsIds = [];
let lastEnlightenField = '';
let collisionFlag = false;
const pieces = document.querySelectorAll(".piece");
const fields = document.querySelectorAll(".field");

pieces.forEach((element)=>{
    element.setAttribute("draggable", "true");
});

fields.forEach((element)=>{
    element.setAttribute("ondrop", "drop_handler(event)");
    element.setAttribute("ondragover", "dragover_handler(event)");
    element.setAttribute("ondragenter", "dragenter_handler(event)");
});

function dragstart_handler(ev){
    
    if(!gameStarted) return;
    if(playWith==='computer'){
        const piece = chessPieces.find(element => element.id === ev.target.id);
        if(piece.color !== playerColor) return;
    }
    ev.dataTransfer.setData("text/plain", ev.target.id); 
    chessPieces.forEach(element => element.setNextAvailableMove());
    clearAvailableMoves(previousMoveFieldsIds);
    showAvailableMoves(ev.target.id);
}

window.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll(".piece");
        elements.forEach((element)=>{
        element.addEventListener("dragstart", dragstart_handler);
        });
});

function dragover_handler(ev){
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

function drop_handler(ev){
    ev.preventDefault();

    clearAvailableMoves(previousMoveFieldsIds);
    clearEnlightenFields();

    const selectedPiece = document.getElementById('promotion-select');
    const selectedValue = selectedPiece.options[selectedPiece.selectedIndex].value;

    const data = ev.dataTransfer.getData("text/plain");
    let x, y, currentPiece, fieldAfterThePawnId;

    chessPieces.forEach((element)=>{
        if(element.id===data){
            const targetCoords = ev.currentTarget.id.split("");
            x = parseInt(targetCoords[0]);
            y = parseInt(targetCoords[1]);
            currentPiece = element;
        }
    }); 

    if((chessboard[x][y] !== '0') && currentPiece.color===chessboard[x][y].color) return;
    
    if(willKingBeAttacked(currentPiece, x, y)) return;
    
    if(ev.target.outerHTML.startsWith("<span")) return;

    if(!ev.currentTarget.outerHTML.includes('img')){      
        if(currentPiece.isLegalMove(x, y) && currentPiece.setTurn()){           
            //en passant
            if(currentPiece.type.includes("pawn") && currentPiece.coordinates[1]!==y && y===previousMovesStore[movesCounter-1].moveTo[1]){
                if(currentPiece.color==="white"){
                    fieldAfterThePawnId = [x+1, y].join("").toString();
                    document.getElementById(chessboard[x+1][y].id).remove();
                    removePieceFromArray(chessboard[x+1][y].id);
                    chessboard[x+1][y]="0";
                }
                else{
                    fieldAfterThePawnId = [x-1, y].join("").toString();
                    document.getElementById(chessboard[x-1][y].id).remove();
                    removePieceFromArray(chessboard[x-1][y].id);
                    chessboard[x-1][y]="0";
                }
                collisionFlag = true;
            }
            ev.target.appendChild(document.getElementById(data));
            currentPiece.move(x, y, selectedValue);
        }
    }
    else if(ev.currentTarget.outerHTML.includes('img')){
        if(ev.target.outerHTML.includes("td")) return;
        if(currentPiece.isLegalMove(x, y) && currentPiece.setTurn()){
            removePieceFromArray(chessboard[x][y].id);
            collisionFlag = true;
            ev.target.replaceWith(document.getElementById(data));
            currentPiece.move(x, y, selectedValue);
        }
    }

    if(currentPiece.type==='pawn'){
        if((currentPiece.coordinates[0]===0) || (currentPiece.coordinates[0]===7)){
            const pieceImage = switchImageAfterPromotion(currentPiece, selectedValue);
            document.getElementById(currentPiece.id).remove();
            ev.currentTarget.append(pieceImage);
            pieceImage.addEventListener("dragstart", dragstart_handler);
        }
    }
}

function addPropertyAfterCastle(id){
    document.getElementById(id).addEventListener("dragstart", dragstart_handler);
}

function switchImageAfterPromotion(piece, promotedTo){
    const pieceImg = document.createElement('img');
    let pieceShortcut = `${piece.color.charAt(0)}${promotedTo.charAt(0)}`;
    if(promotedTo === 'knight') pieceShortcut = `${piece.color.charAt(0)}${promotedTo.charAt(1)}`;
    let imgPath = `images/${pieceShortcut}.png`;
    pieceImg.classList.add('piece');
    pieceImg.setAttribute('src', imgPath);
    pieceImg.setAttribute('id', `${pieceShortcut}${piece.color === `white` ? whitePromotedCounter : blackPromotedCounter}`);
    pieceImg.setAttribute('alt', `${piece.color}_${promotedTo}`);
    pieceImg.setAttribute("draggable","true");
    return pieceImg;
}

function showLastMove(){
    const field1 = [previousMovesStore[previousMovesStore.length-1].moveFrom[0], previousMovesStore[previousMovesStore.length-1].moveFrom[1]].join("").toString();
    const field2 = [previousMovesStore[previousMovesStore.length-1].moveTo[0], previousMovesStore[previousMovesStore.length-1].moveTo[1]].join("").toString();

    document.getElementById(field1).classList.add("lastMove");
    document.getElementById(field2).classList.add("lastMove");  
}

function clearLastMove(){
    document.querySelectorAll('.lastMove').forEach(element =>{
        element.classList.remove('lastMove');
    })
}

function showAttackedKing(king){
    document.getElementById(king.id).classList.add("attacked-king");
}

function clearAttackedKing(){
    document.getElementById("wk1").classList.remove("attacked-king");
    document.getElementById("bk1").classList.remove("attacked-king");
}

function showAvailableMoves(id){
    const piece = chessPieces.find((element) => element.id === id);
    if(piece.color!==currentColor) return;
    previousMoveFieldsIds = [];
    piece.availableMoves.forEach(element => {
        let field = document.getElementById(element.join("").toString())
        field.classList.toggle("available-moves");
        if(field.outerHTML.includes('img')) field.classList.toggle("available-moves-filled");
        previousMoveFieldsIds.push(element.join("").toString());
    });
}

function clearAvailableMoves(array){
    array.forEach(element => {
        document.getElementById(element).classList.remove("available-moves-filled");
        document.getElementById(element).classList.remove("available-moves");
    });
}