let isBoardFlipped = false;
let piecePositions, activeColour, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber = null;
let activePiece = null, legalMoves = [];
let pieceMoveAnimation = "ease-in-out";
let lastMoveSquares = [], selectedSquare = null;

function parseFen(fen) {
    let ranksParsed = 0;
    let evalPiecePositions = [];
    let evalActiveColour, evalCastlingRights, evalEnPassantSquare, evalHalfmoveClock, evalFullmoveNumber = null;
    function readValueFromFen() {
        let value = "";
        i++;
        if (i < fen.length) fenChar = fen[i];
        else return;
        while (fenChar !== " ") {
            value += fenChar;
            i++;
            if (i < fen.length) fenChar = fen[i];
            else break;
        }
        return value;
    }
    let i = 0, fenChar = "";
    if (i < fen.length) fenChar = fen[i];
    else return false;
    while (fenChar !== " ") {
        if (!(parseInt(fenChar) || fenChar === "/")) {
            evalPiecePositions.push(fenChar);
        } else if (fenChar === "/") {
            ranksParsed++;
            if (evalPiecePositions.length !== 8 * ranksParsed) return false;
        } else {
            for (let j = parseInt(fenChar); j > 0; j--) evalPiecePositions.push(null);
        }
        i++;
        if (i < fen.length) fenChar = fen[i];
        else return false;
    }
    if (evalPiecePositions.length !== 64 || ranksParsed !== 7) return false;
    evalActiveColour = readValueFromFen();
    if (!evalActiveColour == true || !(evalActiveColour === "w" || evalActiveColour === "b")) return false;
    evalCastlingRights = readValueFromFen();
    if (!evalCastlingRights == true || evalCastlingRights.length > 4) return false;
    evalEnPassantSquare = readValueFromFen();
    if (!evalEnPassantSquare == true || evalEnPassantSquare.length > 2 || (evalEnPassantSquare !== "-" && (evalEnPassantSquare[1] !== "3" && evalEnPassantSquare[1] !== "6"))) return false;
    if (evalEnPassantSquare === "-") evalEnPassantSquare = null;
    evalHalfmoveClock = Number(readValueFromFen());
    if (!evalHalfmoveClock == true && evalHalfmoveClock !== 0) return false;
    evalFullmoveNumber = parseInt(readValueFromFen());
    if (!evalFullmoveNumber == true) return false;
    if (evalPiecePositions.filter(x => x === "K").length !== 1 || evalPiecePositions.filter(x => x === "k").length !== 1) return false;
    piecePositions = evalPiecePositions;
    activeColour = evalActiveColour;
    castlingRights = evalCastlingRights;
    enPassantSquare = evalEnPassantSquare;
    halfmoveClock = evalHalfmoveClock;
    fullmoveNumber = evalFullmoveNumber;
    return true;
}
function setUpBoard() {
    const chessBoard = document.createElement("div");
    let isLightSquare;
    let squareNumber = isBoardFlipped ? 63 : 0;
    for (let rank = 8; rank > 0; rank--) {
        isLightSquare = rank%2 > 0;
        for (let file = 0; file < 8; file++) {
            isLightSquare = !isLightSquare;
            const square = document.createElement("div");
            square.className = "board-square";
            if (isLightSquare) square.classList.add("light-board-square");
            square.id = isBoardFlipped ? `${String.fromCharCode("h".charCodeAt(0) - file)}${9 - rank}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`;
            square.style.gridRow = `${9 - rank} / ${10 - rank}`;
            square.style.gridColumn = `${file + 1} / ${file + 2}`;
            chessBoard.appendChild(square);
            squareNumber = isBoardFlipped ? squareNumber-1 : squareNumber+1;
        }
    }
    const pieceArea = document.createElement("div");
    pieceArea.id = "piece-area";
    chessBoard.appendChild(pieceArea);
    const fileList = document.createElement("div");
    fileList.id = "file-indicator";
    for (let file = 0; file < 8; file++) {
        isLightSquare = !isLightSquare;
        const fileName = document.createElement("div");
        fileName.style.color = isLightSquare ? "var(--board-colour)" : "var(--light-square-colour)";
        fileName.innerText = isBoardFlipped ? String.fromCharCode("h".charCodeAt(0) - file) : String.fromCharCode("a".charCodeAt(0) + file);
        fileList.appendChild(fileName);
    }
    chessBoard.appendChild(fileList);
    const rankList = document.createElement("div");
    rankList.id = "rank-indicator";
    for (let rank = 1; rank < 9; rank++) {
        isLightSquare = !isLightSquare;
        const rankName = document.createElement("div");
        rankName.style.color = isLightSquare ? "var(--light-square-colour)" : "var(--board-colour)";
        rankName.innerText = isBoardFlipped ? rank : 9 - rank;
        rankList.appendChild(rankName);
    }
    chessBoard.appendChild(rankList);
    document.getElementById("chess-board").remove();
    chessBoard.id = "chess-board";
    document.getElementById("board-container").appendChild(chessBoard);
    setUpPieces();
    addClickToMove();
    addDragAndDropToMove();
}
function setUpPieces() {
    const fen = document.getElementById("fen-input").value.trim();
    const isFenValid = parseFen(fen);
    if (isFenValid) {
        document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "var(--colour)" opacity = "0.6">
            <path d = "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
    } else {
        document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "red">
                <path d = "m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>`;
    }
    const chessBoard = document.getElementById("chess-board");
    const pieceArea = document.createElement("div");
    let squareNumber = isBoardFlipped ? 63 : 0;
    for (let rank = 8; rank > 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                piece.className = `chess-piece ${pieceAtSquare}`;
                piece.id = isBoardFlipped ? `${String.fromCharCode("h".charCodeAt(0) - file)}${9 - rank}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`;
                piece.style.top = `calc(${8 - rank} * var(--board-square-width))`;
                piece.style.left = `calc(${file} * var(--board-square-width))`;

                piece.addEventListener("mouseenter", () => mouseEntersPiece(piece.id));
                piece.addEventListener("mouseleave", () => mouseLeavesPiece(piece.id));
                pieceArea.appendChild(piece);
            }
            squareNumber = isBoardFlipped ? squareNumber-1 : squareNumber+1;
        }
    }
    document.getElementById("piece-area").remove();
    pieceArea.id = "piece-area";
    chessBoard.appendChild(pieceArea);
}
function convertSquareToIndex(square) {
    return 8 * (8 - square[1]) + square.charCodeAt(0) - "a".charCodeAt(0);
}
function getLegalMoves(pieceSquare) {
    const piece = piecePositions[convertSquareToIndex(pieceSquare)];
    const pieceFile = pieceSquare[0];
    const pieceRank = parseInt(pieceSquare[1]);
    const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const boardRanks = [1, 2, 3, 4, 5, 6, 7, 8];
    let friendlyPieces = ["R", "N", "B", "Q", "K", "P"];
    if (!friendlyPieces.includes(piece)) friendlyPieces = ["r", "n", "b", "q", "k", "p"];
    legalMoves = [];
    function isValidMove(file, rank) {
        if (boardFiles.includes(file) && boardRanks.includes(rank)) {
            const targetSquare = `${file}${rank}`;
            const targetPiece = piecePositions[convertSquareToIndex(targetSquare)];
            return !friendlyPieces.includes(targetPiece);
        }
        return false;
    }
    function addDirectionalMoves(directions) {
        directions.forEach(([fileStep, rankStep]) => {
            let f = pieceFile, r = pieceRank;
            while (true) {
                f = String.fromCharCode(f.charCodeAt(0) + fileStep);
                r += rankStep;
                if (!isValidMove(f, r)) break;
                legalMoves.push(`${f}${r}`);
                if (piecePositions[convertSquareToIndex(`${f}${r}`)]) break;
            }
        });
    }
    switch (piece.toLowerCase()) {
        case "r":
            addDirectionalMoves([[1, 0], [-1, 0], [0, 1], [0, -1]]);
            break;
        case "b":
            addDirectionalMoves([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
            break;
        case "q":
            addDirectionalMoves([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
            break;
        case "k":
            [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                if (isValidMove(f, r)) legalMoves.push(`${f}${r}`);
            });
            break;
        case "n":
            [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                if (isValidMove(f, r)) legalMoves.push(`${f}${r}`);
            });
            break;
        case "p":
            let forward = piece === "P" ? 1 : -1;
            let startRank = piece === "P" ? 2 : 7;
            let promotionRank = piece === "P" ? 8 : 1;
            let frontSquare = `${pieceFile}${pieceRank + forward}`;
            if (!piecePositions[convertSquareToIndex(frontSquare)]) {
                legalMoves.push(frontSquare);
                if (pieceRank === startRank) {
                    let doubleFront = `${pieceFile}${pieceRank + 2 * forward}`;
                    if (!piecePositions[convertSquareToIndex(doubleFront)]) legalMoves.push(doubleFront);
                }
            }
            [[-1, forward], [1, forward]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                let captureSquare = `${f}${r}`;
                if (isValidMove(f, r) && piecePositions[convertSquareToIndex(captureSquare)]) legalMoves.push(captureSquare);
            });
            if (enPassantSquare && Math.abs(pieceFile.charCodeAt(0) - enPassantSquare[0].charCodeAt(0)) === 1 && pieceRank + forward === parseInt(enPassantSquare[1]) && (piece === "P" && enPassantSquare[1] === "6" || piece === "p" && enPassantSquare[1] === "3")) legalMoves.push(enPassantSquare);
    }
}
function highlightLegalMoves(chessPiece, dragged) {
    if (!dragged) {
        const ripple = document.createElement("div");
        ripple.className = "ripple";
        document.querySelector(`#${chessPiece.id}.board-square`).appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
    highlightSelectedSquare(chessPiece.id);
    document.querySelectorAll(".move-indicator").forEach(indicator => {
        indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
        setTimeout(() => indicator.remove(), 200);
    });
    if (activePiece && legalMoves.includes(chessPiece.id)) {
        chessPiece.style.opacity = "0";
        setTimeout(() => chessPiece.remove(), 300);
        movePiece(chessPiece.id);
        halfmoveClock = 0;
        activePiece = null;
        return;
    }
    const pieceType = piecePositions[convertSquareToIndex(chessPiece.id)];
    if (chessPiece === activePiece || (activeColour === "w" ? pieceType.toLowerCase() === pieceType : pieceType.toUpperCase() === pieceType)) {
        activePiece = null;
        return;
    }
    activePiece = chessPiece;
    getLegalMoves(chessPiece.id);
    legalMoves.forEach(square => {
        const boardSquare = document.querySelector(`#${square}.board-square`);
        const moveIndicator = document.createElement("div");
        moveIndicator.className = "move-indicator";
        moveIndicator.id = square;
        if (piecePositions[convertSquareToIndex(square)] || (square === enPassantSquare && piecePositions[convertSquareToIndex(activePiece.id)].toLowerCase() === "p")) {
            moveIndicator.classList.add("ring");
        } else {
            moveIndicator.classList.add("filled-circle");
        }
        boardSquare.appendChild(moveIndicator);
    });
}
function movePiece(targetSquare, dropped) {
    const file = targetSquare[0].charCodeAt(0) - "a".charCodeAt(0);
    const rank = parseInt(targetSquare[1]);
    const pieceType = piecePositions[convertSquareToIndex(activePiece.id)];
    piecePositions[convertSquareToIndex(activePiece.id)] = null;
    const previousRank = parseInt(activePiece.id[1]);
    document.querySelector(`#${activePiece.id}.board-square`).style.outline = null;
    highlightMoveSquares(activePiece.id, targetSquare);
    activePiece.id = targetSquare;
    const activePieceStyle = activePiece.style;
    if (!dropped) activePieceStyle.transition = `top 0.3s ${pieceMoveAnimation}, left 0.3s ${pieceMoveAnimation}, opacity 0.3s ease-out`;
    activePieceStyle.top = `calc(${isBoardFlipped ? rank - 1 : 8 - rank} * var(--board-square-width))`;
    activePieceStyle.left = `calc(${isBoardFlipped ? 7 - file : file} * var(--board-square-width))`;
    if (!dropped) setTimeout(() => activePieceStyle.transition = `opacity 0.3s ease-out`, 300);
    if (pieceType.toLowerCase() === "p" && enPassantSquare === targetSquare) {
        const enemyPawnSquare = `${String.fromCharCode("a".charCodeAt(0) + file)}${previousRank}`;
        const enemyPawn = document.querySelector(`#${enemyPawnSquare}.chess-piece`);
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = null;
        enemyPawn.style.opacity = "0";
        setTimeout(() => enemyPawn.remove(), 300);
    }
    piecePositions[convertSquareToIndex(targetSquare)] = pieceType;
    enPassantSquare = null;
    if (pieceType.toLowerCase() === "p" && Math.abs(rank - previousRank) === 2) enPassantSquare = pieceType === "P" ? `${String.fromCharCode("a".charCodeAt(0) + file)}${3}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${6}`;
    activeColour = activeColour === "w" ? "b" : "w";
    if (pieceType.toLowerCase() === "p") halfmoveClock = 0;
    else halfmoveClock++;
    if (activeColour === "w") {
        document.getElementById("to-move").innerText = `White to Move (Last Move: ${fullmoveNumber}… ${lastMoveSquares[0]} – ${lastMoveSquares[1]})`;
        fullmoveNumber++;
    } else {
        document.getElementById("to-move").innerText = `Black to Move (Last Move: ${fullmoveNumber}. ${lastMoveSquares[0]} – ${lastMoveSquares[1]})`;
    }
}
function highlightSelectedSquare(square) {
    if (square && !lastMoveSquares.includes(square)) {
        if (selectedSquare !== null) document.querySelector(`#${selectedSquare}.highlight-square`).remove();
        selectedSquare = square;
        const newHighlightSquare = document.createElement("div");
        newHighlightSquare.id = square;
        newHighlightSquare.className = "highlight-square";
        document.querySelector(`#${square}.board-square`).appendChild(newHighlightSquare);
    } else {
        if (selectedSquare !== null) document.querySelector(`#${selectedSquare}.highlight-square`).remove();
        selectedSquare = null;
    }
}
function highlightMoveSquares(fromSquare, toSquare) {
    lastMoveSquares.forEach(square => {
        const highlightSquare = document.querySelector(`#${square}.highlight-square`);
        highlightSquare.style.backgroundColor = "transparent";
        setTimeout(() => highlightSquare.remove(), 200);
    });
    lastMoveSquares = [fromSquare, toSquare];
    lastMoveSquares.forEach(square => {
        const highlightSquare = document.createElement("div");
        highlightSquare.id = square;
        highlightSquare.className = "highlight-square";
        document.querySelector(`#${square}.board-square`).appendChild(highlightSquare);
    });
}
function addClickToMove() {
    document.querySelectorAll(".chess-piece").forEach(piece => {
        piece.addEventListener("click", () => highlightLegalMoves(piece));
    });
    document.querySelectorAll(".board-square").forEach(square => {
        square.addEventListener("click", () => {
            if (activePiece && legalMoves.includes(square.id)) movePiece(square.id);
            else highlightSelectedSquare(null);
        });
    });
}
function addDragAndDropToMove() {
    document.querySelectorAll(".chess-piece").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", (event) => {
            activePiece = null;
            highlightLegalMoves(piece, true);
            event.dataTransfer.setData("text", piece.id);
            event.dataTransfer.effectAllowed = "move";
            document.querySelectorAll(".board-square").forEach(square => {
                square.style.outline = "none";
            });
        });
        piece.addEventListener("dragend", () => {
            const ripple = document.createElement("div");
            ripple.className = "ripple";
            highlightSelectedSquare(piece.id);
            document.querySelector(`#${piece.id}.board-square`).appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
            document.querySelectorAll(".move-indicator").forEach(indicator => {
                indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                setTimeout(() => indicator.remove(), 200);
            });
            activePiece = null;
            document.querySelectorAll(".board-square").forEach(square => {
                square.style.outline = null;
            });
        });
        piece.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.effectAllowed = "move";
        });
        piece.addEventListener("dragenter", () => {
            const square = document.querySelector(`#${piece.id}.board-square`);
            if (document.querySelector(`#${square.id}.highlight-square`)) {
                document.querySelector(`#${square.id}.highlight-square`).style.outline = "calc(var(--board-square-width) / 25) solid white";
            } else {
                square.style.outline = "calc(var(--board-square-width) / 25) solid white";
            }
            square.style.zIndex = "1";
            square.style.boxShadow = "0 0 calc(var(--board-square-width) * 6/25) calc(var(--board-square-width) * 2/25) rgba(0, 0, 0, 0.8)";
            if (document.querySelector(`#${square.id}.ring`)) {
                const moveIndicator = document.querySelector(`#${square.id}.ring`).style;
                moveIndicator.width = moveIndicator.height = "70%";
                moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-colour)";
            }
        });
        piece.addEventListener("dragleave", () => {
            const square = document.querySelector(`#${piece.id}.board-square`);
            if (document.querySelector(`#${square.id}.highlight-square`)) {
                document.querySelector(`#${square.id}.highlight-square`).style.outline = null;
            }
            square.style.outline = null;
            square.style.zIndex = null;
            square.style.boxShadow = null;
            if (document.querySelector(`#${square.id}.ring`)) {
                const moveIndicator = document.querySelector(`#${square.id}.ring`).style;
                moveIndicator.width = moveIndicator.height = null;
                moveIndicator.boxShadow = null;
            }
        });
        piece.addEventListener("drop", (event) => {
            event.preventDefault();
            const square = document.querySelector(`#${piece.id}.board-square`);
            if (document.querySelector(`#${square.id}.highlight-square`)) {
                document.querySelector(`#${square.id}.highlight-square`).style.outline = null;
            }
            square.style.outline = null;
            square.style.zIndex = null;
            square.style.boxShadow = null;
            if (legalMoves.includes(square.id)) {
                piece.style.opacity = "0";
                setTimeout(() => piece.remove(), 300);
                movePiece(square.id, true);
                halfmoveClock = 0;
            }
        });
    });
    document.querySelectorAll(".board-square").forEach(square => {
        square.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.effectAllowed = "move";
        });
        square.addEventListener("dragenter", () => {
            square.style.outline = "calc(var(--board-square-width) / 25) solid white";
            square.style.zIndex = "1";
            square.style.boxShadow = "0 0 calc(var(--board-square-width) * 6/25) calc(var(--board-square-width) * 2/25) rgba(0, 0, 0, 0.8)";
            if (document.querySelector(`#${square.id}.filled-circle`)) {
                const moveIndicator = document.querySelector(`#${square.id}.filled-circle`).style;
                moveIndicator.width = moveIndicator.height = "50%";
            } else if (document.querySelector(`#${square.id}.ring`)) {
                const moveIndicator = document.querySelector(`#${square.id}.ring`).style;
                moveIndicator.width = moveIndicator.height = "70%";
                moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-colour)";
            }
        });
        square.addEventListener("dragleave", () => {
            square.style.outline = null;
            square.style.zIndex = null;
            square.style.boxShadow = null;
            if (document.querySelector(`#${square.id}.filled-circle`)) {
                const moveIndicator = document.querySelector(`#${square.id}.filled-circle`).style;
                moveIndicator.width = moveIndicator.height = null;
            } else if (document.querySelector(`#${square.id}.ring`)) {
                const moveIndicator = document.querySelector(`#${square.id}.ring`).style;
                moveIndicator.width = moveIndicator.height = null;
                moveIndicator.boxShadow = null;
            }
        });
        square.addEventListener("drop", (event) => {
            event.preventDefault();
            square.style.outline = null;
            square.style.zIndex = null;
            square.style.boxShadow = null;
            if (legalMoves.includes(square.id)) movePiece(square.id, true);
        });
    });
}
function mouseEntersPiece(square) {
    const boardSquare = document.querySelector(`#${square}.board-square`);
    if (document.querySelector(`#${square}.highlight-square`)) {
        document.querySelector(`#${square}.highlight-square`).style.outline = "calc(var(--board-square-width) / 25) solid white";
    } else {
        boardSquare.style.outline = "calc(var(--board-square-width) / 25) solid white";
    }
    if (document.querySelector(`#${square}.ring`)) {
        const moveIndicator = document.querySelector(`#${square}.ring`).style;
        moveIndicator.width = moveIndicator.height = "70%";
        moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-colour)";
    }
}
function mouseLeavesPiece(square) {
    const boardSquare = document.querySelector(`#${square}.board-square`);
    if (document.querySelector(`#${square}.highlight-square`)) {
        document.querySelector(`#${square}.highlight-square`).style.outline = null;
    }
    boardSquare.style.outline = null;
    if (document.querySelector(`#${square}.ring`)) {
        const moveIndicator = document.querySelector(`#${square}.ring`).style;
        moveIndicator.width = moveIndicator.height = null;
        moveIndicator.boxShadow = null;
    }
}
setUpBoard();
const parameters = location.search.replace(/%20/g, " ").split("?");
if (parameters != "") {
    const firstParameter = parameters[1];
    switch (firstParameter.slice(0, 4)) {
        case "fen=":
            document.getElementById("fen-input").value = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2].includes("flip")) isBoardFlipped = true;
            break;
        case "pgn=":
            document.getElementById("pgn-input").value = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2] === "flip") isBoardFlipped = true;
            break;
        case "flip":
            isBoardFlipped = true;
    }
}
setUpBoard();
document.addEventListener("click", (event) => {
    if (!event.target.classList.contains("chess-piece")) {
        document.querySelectorAll(".move-indicator").forEach(indicator => {
            indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
            setTimeout(() => indicator.remove(), 200);
        });
        activePiece = null;
    }
});
