let isBoardFlipped = false;
let piecePositions, activeColour, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber;

function parseFen(fen) {
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
        if (!(Number(fenChar) || fenChar == "/")) {
            piecePositions.push(fenChar);
        } else if (fenChar != "/") {
            for (let j = Number(fenChar); j > 0; j--) {
                piecePositions.push("");
            }
        }
        i++;
        if (i < fen.length) {
            fenChar = fen[i];
        } else {
            return false;
        }
    }
    if (piecePositions.length != 64) {
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
    halfmoveClock = Number(readValueFromFen());
    if (!halfmoveClock == true && halfmoveClock != 0) {
        return false;
    }
    fullmoveNumber = Number(readValueFromFen());
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
    const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
    let squareNumber = 0;
    if (isBoardFlipped) {
        boardFiles.reverse();
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
            square.innerText = square.id = `${boardFiles[file]}${rank}`;
            square.style.gridRow = isBoardFlipped ? `${rank} / ${rank + 1}` : `${9 - rank} / ${10 - rank}`;
            square.style.gridColumn = `${file + 1} / ${file + 2}`;
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                piece.className = `chess-piece ${pieceAtSquare}`;
                piece.id = square.id;
                piece.style.gridRow = square.style.gridRow;
                piece.style.gridColumn = square.style.gridColumn;
                piece.setAttribute("onclick", "highlightLegalMoves(this)");
                pieceArea.appendChild(piece);
            }
            chessBoard.appendChild(square);
            squareNumber = isBoardFlipped ? squareNumber-1 : squareNumber+1;
        }
    }
    document.getElementById("chess-board").remove();
    chessBoard.id = "chess-board";
    pieceArea.id = "piece-area";
    chessBoard.appendChild(pieceArea);
    document.getElementById("board-container").appendChild(chessBoard);
}

function convertSquareToIndex(square) {
    return 8 * (8 - square[1]) + square.charCodeAt(0) - "a".charCodeAt(0);
}

function getLegalMoves(square) {
    return ["e5", "d6", "c3", "f2"];
}

function highlightLegalMoves(chessPiece) {
    document.querySelectorAll(".move-indicator").forEach(el => el.remove());
    const pieceSquare = chessPiece.id;
    const legalMoves = getLegalMoves(pieceSquare);
    legalMoves.forEach(square => {
        const boardSquare = document.querySelector(`#${square}.board-square`);
        const moveIndicator = document.createElement("div");
        moveIndicator.className = "move-indicator";
        moveIndicator.classList.add(piecePositions[convertSquareToIndex(square)] != "" ? "ring" : "filled-circle");
        boardSquare.appendChild(moveIndicator);
    });
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
function removeMoveIndicators() {
    document.querySelectorAll(".move-indicator").forEach(indicator => {
        indicator.style.animation = "fadeOut 0.2s var(--emphasis-animation)";
        setTimeout(() => indicator.remove(), 200);
    });
}

updateChessBoard();
document.addEventListener("click", function(event) {
    if (!event.target.classList.contains("chess-piece")) {
        removeMoveIndicators();
    }
});
