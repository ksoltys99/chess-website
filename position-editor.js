let lastEnlightenField = '';

function drag(ev){
    ev.dataTransfer.setData('text/html', ev.target.id);
}

function allowDrop(ev){
    ev.preventDefault();
}

function copyAndDrop(ev){
    ev.preventDefault();

    clearEnlightenFields();
    
    const data = ev.dataTransfer.getData('text/html');
    const nodeCopy = document.getElementById(data).cloneNode(true);
    if(checkIfKingIsOnBoard(nodeCopy)) return;
    if(isPawnOnFirstOrLastRow(nodeCopy, ev.target)) return;  

    nodeCopy.classList.remove('piece-to-drag');
    nodeCopy.classList.add('piece');
    nodeCopy.id += '1';

    if(ev.target.outerHTML.startsWith('<img')) ev.target.replaceWith(nodeCopy);
    else ev.target.appendChild(nodeCopy);

    
}

function isPawnOnFirstOrLastRow(piece, target){
    if(!piece.alt.includes('pawn')) return false;
    const row = target.id.toString();
    if(row[0] === '0' || row[0] === '7') return true;
}

function setAttributesToFieldsAndPieces(){
    const pieces = document.querySelectorAll(".piece-to-drag");
    pieces.forEach((element)=>{
        element.setAttribute("draggable", "true");
        element.addEventListener("dragstart", drag);
    });

    const fields = document.querySelectorAll(".field");
    fields.forEach((element)=>{
        element.setAttribute("ondrop", "copyAndDrop(event)");
        element.setAttribute("ondragover", "allowDrop(event)");
        element.setAttribute("ondragenter", "dragenter_handler(event)");
    });
}

function clearPosition(){
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(element => {
        element.remove();
    })
}

function checkIfKingIsOnBoard(draggedPiece){
    let condition = false;
    if(!draggedPiece.alt.includes('king')) return;
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(element => {
            if(element.alt === draggedPiece.alt) condition = true;
    });
    return condition;
}

function generateDataForVirtualBoard(){
    let boardInfo = [];
    let wPawns = 0, bPawns = 0, wKnights = 0, bKnights = 0, wBishops = 0, bBishops = 0, wRooks = 0, bRooks = 0, wQueens = 0, bQueens = 0, wKing = 0, bKing = 0; 

    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(element => {

        const currentPiece = Object.create(null);
        currentPiece.color = element.alt.substring(0, 5);
        currentPiece.type = element.alt.substring(6, element.alt.length);
        currentPiece.coordinates = element.parentElement.id.split("");

        switch(currentPiece.type){
            case 'pawn':
                currentPiece.color == 'white' ? wPawns++ : bPawns++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[0]}${currentPiece.color == 'white' ? wPawns : bPawns}`;
                break;
            case 'knight':
                currentPiece.color == 'white' ? wKnights++ : bKnights++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[1]}${currentPiece.color == 'white' ? wKnights : bKnights}`;
                break;
            case 'bishop':
                currentPiece.color == 'white' ? wBishops++ : bBishops++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[0]}${currentPiece.color == 'white' ? wBishops : bBishops}`;
                break;
            case 'rook':
                currentPiece.color == 'white' ? wRooks++ : bRooks++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[0]}${currentPiece.color == 'white' ? wRooks : bRooks}`;
                break;
            case 'queen':
                currentPiece.color == 'white' ? wQueens++ : bQueens++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[0]}${currentPiece.color == 'white' ? wQueens : bQueens}`;
                break;
            case 'king':
                currentPiece.color == 'white' ? wKing++ : bKing++;
                currentPiece.id = `${currentPiece.color[0]}${currentPiece.type[0]}${currentPiece.color == 'white' ? wKing : bKing}`;
                break;
        }

        boardInfo.push(currentPiece);
    })

    return boardInfo;
}

function startGameFromPosition(){
    const position = generateDataForVirtualBoard();
    window.localStorage.setItem('position', JSON.stringify(position));

    const onMoveSelect = document.getElementById('color-on-move-select');
    const currentMove = onMoveSelect.options[onMoveSelect.selectedIndex].value;
    window.localStorage.setItem('first-move-custom', currentMove);
    window.localStorage.setItem('is-custom-position', 'true');

    if(!areBothKingsOnBoard()) return handleMissingKing();

    window.location.replace('index.html');
}

function areBothKingsOnBoard(){
    const pieces = document.querySelectorAll('.piece');
    let isWhiteKingOnBoard = false, isBlackKingOnBoard = false;
    pieces.forEach(element => {
        if(element.alt === 'white king') isWhiteKingOnBoard = true;
        if(element.alt === 'black king') isBlackKingOnBoard = true;
    })
    if(isWhiteKingOnBoard && isBlackKingOnBoard) return true;
    else return false;
}

function handleMissingKing(){
    const modal = document.getElementById('editor-modal');
    modal.showModal();
    const closeBtn = document.querySelector('.close-btn-editor');

    localStorage.clear();

    closeBtn.addEventListener('click', () => {
        modal.close();
    })
}

setAttributesToFieldsAndPieces();
clearPosition();