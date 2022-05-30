let whitePerspective = true;

function flipBoard(){
    
    document.querySelector('.chessboard').classList.toggle('rotate');

    const fields = document.querySelectorAll('.field');
    fields.forEach(element => {
        element.classList.toggle('rotate');
    });

    const spansToHideOrReveal = document.querySelectorAll('.col-white, .row-white, .col-black, .row-black');
    spansToHideOrReveal.forEach(element => {
        element.classList.toggle('invisible');
    });

    if(whitePerspective) whitePerspective = false;
    else if(!whitePerspective) whitePerspective = true;
}

function turnBoardForColor(color){
    if(color==='white'){
        if(whitePerspective) return;
        flipBoard();
    }
    else if(color==='black'){
        if(!whitePerspective) return;
        flipBoard();
    }
}

function dragenter_handler(ev){
    let currentTarget;
    if(ev.target.outerHTML.startsWith('<img') || ev.target.outerHTML.startsWith('<span')) currentTarget = ev.target.parentNode;
    else currentTarget = ev.target;

    currentTarget.classList.add('dragover-field');

    if(lastEnlightenField !== '' && lastEnlightenField !== currentTarget.id) document.getElementById(lastEnlightenField).classList.remove('dragover-field');

    lastEnlightenField = currentTarget.id;
}

function clearEnlightenFields(){
    const enlightenFields = document.querySelectorAll('.dragover-field');
    enlightenFields.forEach(element => {
        element.classList.remove('dragover-field');
    })
}

const newGame = () => {
    clearBoard();
    resetGlobalVariables();
    setNewBoard();

    if(!isPositionValid()){
        localStorage.clear();
        return handleInvalidPosition();
    }

    const selectedColor = document.getElementById('color-select');
    const color = selectedColor.options[selectedColor.selectedIndex].value;
    playerColor = color;
    gameStarted = true;
    turnBoardForColor(color);
    playerColor === 'white' ? engineColor = 'black' : engineColor = 'white';

    hideOptions();
    document.querySelector('.moves-counter').innerHTML = '';
    document.querySelector('.white-moves').innerHTML = '';
    document.querySelector('.black-moves').innerHTML = '';

    chessPieces.forEach(element => {
        element.setNextAvailableMove();
        element.setAttackedFields();
    })

    if(currentColor === 'white'){
        if(whiteKing.isFieldAttacked(whiteKing.coordinates[0], whiteKing.coordinates[1])){
            whiteKing.isAttacked = true;
            isItCheckmate(whiteKing);
        }
    }
    else{
        if(blackKing.isFieldAttacked(blackKing.coordinates[0], blackKing.coordinates[1])){
            blackKing.isAttacked = true;
            isItCheckmate(blackKing);
        }
    }

    drawByLackOfMaterial(currentColor);
    currentColor === 'white' ? drawByStalemate('black') : drawByStalemate('white');

    if(playWith === 'computer'){
        if(playerColor === 'black') chessEngine('white', convertToFenNotation(chessboard, 'white'));
        else if(playerColor ==='white' && localStorage.getItem('first-move-custom') === 'black'){
            turnCounterFiller();
            const div = document.createElement("div");
            const whiteMove = document.querySelector(".white-moves");
            div.classList.add('notation-item');
            div.innerText = '-';
            whiteMove.append(div);
            chessEngine('black', convertToFenNotation(chessboard, 'black'));
        };
    }
}

const handleSurrender = () => {
    gameStarted = false;
    addGameResult(engineColor, 'won', 'resignation');
}

const clearBoard = () => {
    clearAvailableMoves(previousMoveFieldsIds);
    clearLastMove();
    clearAttackedKing();
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(element => {
        element.remove();
    });
}

const setNewBoard = () => {
    const customPosition = !!localStorage.getItem('is-custom-position');
    const customPositionStartingColor = localStorage.getItem('first-move-custom');

    chessPieces = customPosition === true ? createVirtualPieces('custom') : createVirtualPieces();

    if(customPosition){
        movesCounter = 2;
        fullMovesCounter = 1;
        turnCounter = 1;
        let customMove = {
            "pieceId" : 'bk1',
            "pieceType" : 'king',
            "moveFrom" : [0, 0],
            "moveTo" : [0, 1]
        }
        previousMovesStore.push(customMove);
        previousMovesStore.push(customMove);
        if(customPositionStartingColor === 'black'){
            whiteTurn = false;
            currentColor = 'black';
            movesCounter = 3;
            previousMovesStore.push(customMove);
        }
    }

    chessboard = generateChessboard();
    chessPieces.forEach(element => {
        if(didPawnMove(element)) element.firstMove = false;
        const fieldId = element.coordinates.join('').toString();
        const pieceImage = document.createElement('img');
        const pieceShortcut = `${element.color[0]}${element.notation}`;
        pieceImage.classList.add('piece');
        pieceImage.setAttribute('src', `./images/${pieceShortcut}.png`);
        pieceImage.setAttribute('id', `${element.id}`);
        pieceImage.setAttribute('alt', `${element.color}_${element.type}`);
        pieceImage.setAttribute("draggable","true");
        document.getElementById(fieldId).append(pieceImage);
    })
    whiteKing = chessPieces.find(piece => piece.id === 'wk1');
    blackKing = chessPieces.find(piece => piece.id === 'bk1');
    prepareBoardToGame();
    document.querySelectorAll('.piece').forEach(element => {
        element.addEventListener("dragstart", dragstart_handler);
    })
}

const showOptions = () => {
    const hiddenElements = document.querySelectorAll('.hide-during-game');
    hiddenElements.forEach(element => {
        element.classList.remove('hidden');
    });
    const resignButton = document.querySelector('.resign-btn');
    resignButton.classList.add('hidden');
    resignButton.setAttribute('disabled', 'disabled');
    const newGameButton = document.querySelector('.start-game-btn');
    newGameButton.removeAttribute('disabled');
}

const hideOptions = () => {
    const resignButton = document.querySelector('.resign-btn');
    resignButton.removeAttribute('disabled');
    const elementsToHide = document.querySelectorAll('.hide-during-game');
    elementsToHide.forEach(element => {
        element.classList.add('hidden');
    })
    document.querySelector('.resign-btn').classList.remove('hidden');
    const newGameButton = document.querySelector('.start-game-btn');
    newGameButton.setAttribute('disabled', 'disabled');
}

const redirect = (url) => {
    localStorage.clear();
    window.location.replace(url);
}

const resetGlobalVariables = () => {
    const chooseOpponentBox = document.querySelector('#opponent-select');
    playWith = chooseOpponentBox.options[chooseOpponentBox.selectedIndex].value;
    turnCounter = 0;
    fullMovesCounter = 0;
    movesCounter = 0;
    blackPromotedCounter = 10;
    whitePromotedCounter = 10;
    whiteTurn = true;
    currentColor = 'white';
    shortCastleNotation = false;
    longCastleNotation = false;
    checkmate = false;
    checkmateNotation = false;
    isPromotion = false;
    noCaptureOrPawnMove = 0;
    possibleEnPassantTarget = '-';
    previousMovesStore = [];
    gameOver = false;
}

const isPositionValid = () => {
    if(whiteTurn){
        if(blackKing.isFieldAttacked(blackKing.coordinates[0], blackKing.coordinates[1])) return false;
    }
    else{
        if(whiteKing.isFieldAttacked(whiteKing.coordinates[0], whiteKing.coordinates[1])) return false;
    }
    return true;
}

const handleInvalidPosition = () => {
    const modal = document.getElementById("invalid-position-modal");
    modal.showModal();
    const btn = document.getElementById("invalid-position-close-btn");
    btn.addEventListener('click', () => {
        modal.close();
        redirect("position-editor.html");
    })
}

const didPawnMove = (piece) => {
    if(piece.type === 'pawn'){
        if(piece.coordinates[0] === 6 && piece.color === 'white') return false;
        if(piece.coordinates[0] === 1 && piece.color === 'black') return false;
        return true;
    }
}

setNewBoard();