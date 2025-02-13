const chessBoard = document.getElementById("chess-board");
const pieceArea = document.getElementById("piece-area");
let isBoardFlipped = false;
let piecePositions, activeColour, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber;

function parseFen(fen) {
    piecePositions = [];
    activeColour = castlingRights = enPassantSquare = halfmoveClock = fullmoveNumber = "";
    let isFenValid = true, reasonsForInvalidFen = [];
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
        isFenValid = false;
        reasonsForInvalidFen.push("The provided FEN is empty.");
        return reasonsForInvalidFen;
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
            isFenValid = false;
            reasonsForInvalidFen.push("The provided FEN doesn’t include all necessary fields.");
            break;
        }
    }
    if (isFenValid) {
        if (piecePositions.length != 64) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “piece placement” of the provided FEN is incorrect.");
        }
        activeColour = readValueFromFen();
        if (!activeColour == true || !(activeColour == "w" || activeColour == "b")) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “active colour” field of the provided FEN is incorrect.");
        }
        castlingRights = readValueFromFen();
        if (!castlingRights == true || castlingRights.length > 4) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “castling rights” field of the provided FEN is incorrect.");
        }
        enPassantSquare = readValueFromFen();
        if (!enPassantSquare == true || enPassantSquare.length > 2 || (enPassantSquare != "-" && (enPassantSquare[1] != "3" && enPassantSquare[1] != "6"))) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “possible en passant target” field of the provided FEN is incorrect.");
        }
        halfmoveClock = Number(readValueFromFen());
        if (!halfmoveClock == true && halfmoveClock != 0) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “halfmove clock” field of the provided FEN is incorrect.");
        }
        fullmoveNumber = Number(readValueFromFen());
        if (!fullmoveNumber == true) {
            isFenValid = false;
            reasonsForInvalidFen.push("The “fullmove number” field of the provided FEN is incorrect.");
        }
        if (!(piecePositions.includes("K") && piecePositions.includes("k"))) {
            isFenValid = false;
            reasonsForInvalidFen.push("The provided FEN doesn’t include the position(s) of one or both king(s).");
        } else if(piecePositions.filter(x => x === "K").length > 1 || piecePositions.filter(x => x === "k").length > 1) {
            isFenValid = false;
            reasonsForInvalidFen.push("The provided FEN specifies the position of one or both king(s) more than once.");
        }
    }
    if (isFenValid == false) {
        piecePositions = [];
        activeColour = castlingRights = enPassantSquare = halfmoveClock = fullmoveNumber = "";
        return reasonsForInvalidFen;
    } else {
        return false;
    }
}
function updateChessBoard() {
    const fen = document.getElementById("fen-input").value.trim();
    const fenParseResult = parseFen(fen);
    if (fenParseResult) {
        let errors = "";
        for (i in fenParseResult) {
            i++;
            errors += i + ". " + fenParseResult[i - 1] + "<br />";
            i--;
        }
        document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "red">
                <path d = "m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>
            <div>
                The provided FEN is incorrect because of the following reason(s): <br /> <br /> ${errors}
                <br /> Please enter a correct FEN in the field.
            </div>`;
        return;
    }
    document.getElementById("fen-validity-indicator").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "var(--colour)" opacity = "0.6">
            <path d = "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
    const prevBoardRanks = document.querySelectorAll(".board-rank");
    for (let i = 0; i < prevBoardRanks.length; i++) {
        prevBoardRanks[i].remove();
    }
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
                pieceArea.appendChild(piece);
            }
            chessBoard.appendChild(square);
            squareNumber = isBoardFlipped ? squareNumber-1 : squareNumber+1;
        }
    }
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
        setTimeout(() => el.remove(), 300);
    });
}

updateChessBoard();
document.querySelectorAll(".chess-piece").forEach(piece => {
    piece.setAttribute("onclick", "highlightLegalMoves(this)");
});
document.addEventListener("click", function(event) {
    if (!event.target.classList.contains("chess-piece")) {
        removeMoveIndicators();
    }
});
