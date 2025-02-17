let isBoardFlipped = false;
let piecePositions, activeColour, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber = null;
let activePiece = null, legalMoves = [];

function parseFen(fen) {
    let ranksParsed = 0;
    piecePositions = [];
    activeColour = castlingRights = enPassantSquare = halfmoveClock = fullmoveNumber = "";
    function readValueFromFen() {
        let value = "";
        i++;
        if (i < fen.length) {
            fenChar = fen[i];
        } else {
            return;
        }
        while (fenChar != " ") {
            value += fenChar;
            i++;
            if (i < fen.length) {
                fenChar = fen[i];
            } else {
                break;
            }
        }
        return value;
    }
    let i = 0, fenChar = "";
    if (i < fen.length) {
        fenChar = fen[i];
    } else {
        return false;
    }
    while (fenChar != " ") {
        if (!(parseInt(fenChar) || fenChar == "/")) {
            piecePositions.push(fenChar);
        } else if (fenChar == "/") {
            ranksParsed++;
            if (piecePositions.length != 8 * ranksParsed) {
                return false;
            }
        } else {
            for (let j = parseInt(fenChar); j > 0; j--) {
                piecePositions.push(null);
            }
        }
        i++;
        if (i < fen.length) {
            fenChar = fen[i];
        } else {
            return false;
        }
    }
    if (piecePositions.length != 64 || ranksParsed != 7) {
        return false;
    }
    activeColour = readValueFromFen();
    if (!activeColour == true || !(activeColour == "w" || activeColour == "b")) {
        return false;
    }
    castlingRights = readValueFromFen();
    if (!castlingRights == true || castlingRights.length > 4) {
        return false;
    }
    enPassantSquare = readValueFromFen();
    if (!enPassantSquare == true || enPassantSquare.length > 2 || (enPassantSquare != "-" && (enPassantSquare[1] != "3" && enPassantSquare[1] != "6"))) {
        return false;
    }
    if (enPassantSquare === "-") {
        enPassantSquare = null;
    }
    halfmoveClock = Number(readValueFromFen());
    if (!halfmoveClock == true && halfmoveClock != 0) {
        return false;
    }
    fullmoveNumber = parseInt(readValueFromFen());
    if (!fullmoveNumber == true) {
        return false;
    }
    if (!(piecePositions.includes("K") && piecePositions.includes("k"))) {
        return false;
    } else if (piecePositions.filter(x => x === "K").length > 1 || piecePositions.filter(x => x === "k").length > 1) {
        return false;
    }
    return true;
}
function updateChessBoard() {
    const fen = document.getElementById("fen-input").value.trim();
    const isFenValid = parseFen(fen);
    if (!isFenValid) {
        document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "red">
                <path d = "m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>`;
        return;
    }
    document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "var(--colour)" opacity = "0.6">
            <path d = "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
    const chessBoard = document.createElement("div");
    const pieceArea = document.createElement("div");
    let squareNumber = 0;
    if (isBoardFlipped) {
        squareNumber = 63;
    }
    for (let rank = isBoardFlipped ? 1 : 8; rank > 0 && rank < 9; rank = isBoardFlipped ? rank+1 : rank-1) {
        let isLightSquare = isBoardFlipped ? rank%2 < 1 : rank%2 > 0;
        for (let file = 0; file < 8; file++) {
            isLightSquare = !isLightSquare;
            const square = document.createElement("div");
            square.className = "board-square";
            if (isLightSquare) {
                square.classList.add("light-board-square");
            }
            const squareId = square.innerText = square.id = isBoardFlipped ? `${String.fromCharCode("h".charCodeAt(0) - file)}${rank}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`;
            square.style.gridRow = isBoardFlipped ? `${rank} / ${rank + 1}` : `${9 - rank} / ${10 - rank}`;
            square.style.gridColumn = `${file + 1} / ${file + 2}`;
            square.addEventListener("click", () => {
                if (activePiece && legalMoves.includes(squareId)) {
                    movePiece(squareId);
                }
            });
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                piece.className = `chess-piece ${pieceAtSquare}`;
                piece.id = square.id;
                piece.style.gridRow = square.style.gridRow;
                piece.style.gridColumn = square.style.gridColumn;
                piece.addEventListener("click", () => highlightLegalMoves(piece));
                pieceArea.appendChild(piece);
            }
            chessBoard.appendChild(square);
            squareNumber = isBoardFlipped ? squareNumber-1 : squareNumber+1;
        }
    }
    document.getElementById("chess-board").remove();
    chessBoard.id = "chess-board";
    chessBoard.title = "Chess Board";
    pieceArea.id = "piece-area";
    chessBoard.appendChild(pieceArea);
    document.getElementById("board-container").appendChild(chessBoard);
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
    if (!friendlyPieces.includes(piece)) {
        friendlyPieces = ["r", "n", "b", "q", "k", "p"];
    }
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
            if (!piecePositions[convertSquareToIndex(frontSquare)]) legalMoves.push(frontSquare);
            if (pieceRank === startRank) {
                let doubleFront = `${pieceFile}${pieceRank + 2 * forward}`;
                if (!piecePositions[convertSquareToIndex(doubleFront)]) legalMoves.push(doubleFront);
            }
            [[-1, forward], [1, forward]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                let captureSquare = `${f}${r}`;
                if (isValidMove(f, r) && piecePositions[convertSquareToIndex(captureSquare)]) legalMoves.push(captureSquare);
            });
            if (enPassantSquare && Math.abs(pieceFile.charCodeAt(0) - enPassantSquare[0].charCodeAt(0)) === 1 && pieceRank + forward === parseInt(enPassantSquare[1]) && (piece === "P" && enPassantSquare[1] == 6 || piece === "p" && enPassantSquare[1] == 3)) {
                legalMoves.push(enPassantSquare);
            }
    }
}
function highlightLegalMoves(chessPiece) {
    document.querySelectorAll(".move-indicator").forEach(indicator => {
        indicator.style.animation = "fadeOut 0.2s var(--emphasis-animation)";
        setTimeout(() => indicator.remove(), 200);
    });
    if (chessPiece == activePiece) {
        activePiece = null;
        return;
    }
    if (activePiece && legalMoves.includes(chessPiece.id)) {
        chessPiece.remove();
        movePiece(chessPiece.id);
        activePiece = null;
        return;
    }
    activePiece = chessPiece;
    getLegalMoves(chessPiece.id);
    legalMoves.forEach(square => {
        const boardSquare = document.querySelector(`#${square}.board-square`);
        const moveIndicator = document.createElement("div");
        moveIndicator.className = "move-indicator";
        moveIndicator.classList.add(piecePositions[convertSquareToIndex(square)] ? "ring" : "filled-circle");
        boardSquare.appendChild(moveIndicator);
    });
}
function movePiece(targetSquare) {
    const file = targetSquare[0].charCodeAt(0) - "a".charCodeAt(0);
    const rank = parseInt(targetSquare[1]);
    const pieceType = piecePositions[convertSquareToIndex(activePiece.id)];
    piecePositions[convertSquareToIndex(activePiece.id)] = null;
    const previousRank = parseInt(activePiece.id[1]);
    activePiece.id = targetSquare;
    activePiece.style.gridRow = isBoardFlipped ? `${rank} / ${rank + 1}` : `${9 - rank} / ${10 - rank}`;
    activePiece.style.gridColumn = isBoardFlipped ? `${8 - file} / ${9 - file}` : `${file + 1} / ${file + 2}`;
    if (enPassantSquare == targetSquare) {
        const enemyPawnSquare = `${String.fromCharCode("a".charCodeAt(0) + file)}${previousRank}`;
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = null;
        document.querySelector(`#${enemyPawnSquare}.chess-piece`).remove();
    }
    piecePositions[convertSquareToIndex(targetSquare)] = pieceType;
    enPassantSquare = null;
    if (pieceType.toLowerCase() == "p" && Math.abs(rank - previousRank) == 2) {
        enPassantSquare = pieceType === "P" ? `${String.fromCharCode("a".charCodeAt(0) + file)}${3}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${6}`;
    }
}

const parameters = location.search.replace(/%20/g, " ").split("?");
if (parameters != "") {
    const firstParameter = parameters[1];
    switch (firstParameter.slice(0, 4)) {
        case "fen=":
            document.getElementById("fen-input").value = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2].includes("flip")) {
                isBoardFlipped = true;
            }
            break;
        case "pgn=":
            document.getElementById("pgn-input").value = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2] == "flip") {
                isBoardFlipped = true;
            }
            break;
        case "flip":
            isBoardFlipped = true;
    }
}

updateChessBoard();
document.addEventListener("click", (event) => {
    if (!event.target.classList.contains("chess-piece")) {
        document.querySelectorAll(".move-indicator").forEach(indicator => {
            indicator.style.animation = "fadeOut 0.2s var(--emphasis-animation)";
            setTimeout(() => indicator.remove(), 200);
        });
        activePiece = null;
    }
});
