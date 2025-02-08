const chessBoard = document.getElementById("chessBoard");
let isBoardFlipped = false;
let boardPieces, activeColour, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber;

function parseFen(fen) {
    boardPieces = [];
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
            boardPieces.push(fenChar);
        } else if (fenChar != "/") {
            for (let j = Number(fenChar); j > 0; j--) {
                boardPieces.push("");
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
        if (boardPieces.length != 64) {
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
        if (!(boardPieces.includes("K") && boardPieces.includes("k"))) {
            isFenValid = false;
            reasonsForInvalidFen.push("The piece placement described by the provided FEN doesn’t include the position(s) of one or both king(s).");
        }
    }
    if (isFenValid == false) {
        boardPieces = [];
        activeColour = castlingRights = enPassantSquare = halfmoveClock = fullmoveNumber = "";
        return reasonsForInvalidFen;
    } else {
        return false;
    }
}
function updateChessBoard(isFlipped, fen) {
    const fenParseResult = parseFen(fen);
    if (fenParseResult) {
        let errors = "";
        for (i in fenParseResult) {
            i++;
            errors += i + ". " + fenParseResult[i - 1] + "<br />";
            i--;
        }
        document.getElementById("fenVerifier").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "red">
                <path d = "m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>
            <div>
                The provided FEN is incorrect because of the following reason(s): <br /> <br /> ${errors}
                <br /> Please enter a correct FEN in the field.
            </div>`;
        return;
    }
    document.getElementById("fenVerifier").innerHTML = `<svg height = "24px" viewBox = "0 -960 960 960" width = "24px" fill = "#5f6368">
            <path d = "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
    const prevBoardRanks = document.querySelectorAll(".boardRank");
    for (let i = 0; i < prevBoardRanks.length; i++) {
        prevBoardRanks[i].remove();
    }
    let boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
    let squareNumber = 0, pieceOnSquare = "";
    if (isFlipped) {
        boardFiles.reverse();
        squareNumber = 63;
    }
    for (let rank = isFlipped ? 1 : 8; [1, 2, 3, 4, 5, 6, 7, 8].includes(rank); rank = isFlipped ? rank+1 : rank-1) {
        const rankElement = document.createElement("div");
        rankElement.className = "boardRank";
        let isLightSquare = rank%2 > 0 ? true : false;
        if (isFlipped) {
            isLightSquare = !isLightSquare;
        }
        for (i in boardFiles) {
            isLightSquare = !isLightSquare;
            const square = document.createElement("div");
            square.className = "boardSquare";
            if (isLightSquare) {
                square.className += " lightBoardSquare";
            }
            square.id = `${boardFiles[i]}${rank}`;
            pieceOnSquare = boardPieces[squareNumber];
            if (pieceOnSquare != "") {
                square.className += " containsPiece";
                square.style.backgroundImage = `var(--${pieceOnSquare})`;
            }
            rankElement.appendChild(square);
            squareNumber = isFlipped ? squareNumber-1 : squareNumber+1;
        }
        chessBoard.appendChild(rankElement);
    }
}

document.getElementById("fenInput").value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
updateChessBoard(false, document.getElementById("fenInput").value);
