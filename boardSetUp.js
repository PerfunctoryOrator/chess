const chessBoard = document.getElementById("chessBoard");

let isBoardFlipped = false;
let boardPieces, toMove, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber;

function parseFen(fen) {
    boardPieces = [];
    toMove = castlingRights = enPassantSquare = halfmoveClock = fullmoveNumber = "";

    let i = 0, fenChar = fen[i];
    while (fenChar != " ") {
        if (! (Number(fenChar) || fenChar == "/")) {
            boardPieces.push(fenChar);
        } else if (fenChar != "/") {
            for (let j = Number(fenChar); j > 0; j--) {
                boardPieces.push("");
            }
        }
        i++; fenChar = fen[i];
    }

    toMove = fen[i + 1];

    i += 3; fenChar = fen[i];
    while (fenChar != " ") {
        castlingRights += fenChar;
        i++; fenChar = fen[i];
    }

    i++; fenChar = fen[i];
    while (fenChar != " ") {
        enPassantSquare += fenChar;
        i++; fenChar = fen[i];
    }

    i++; fenChar = fen[i];
    while (fenChar != " ") {
        halfmoveClock += fenChar;
        i++; fenChar = fen[i];
    }
    halfmoveClock = Number(halfmoveClock);

    i++; fenChar = fen[i];
    while (fenChar != " ") {
        fullmoveNumber += fenChar;
        i++;
        if (i < fen.length) { // Since i (index) starts from 0, but length starts from 1.
            fenChar = fen[i];
        } else {
            break;
        }
    }
    fullmoveNumber = Number(fullmoveNumber);
}
function setUpChessBoard(isFlipped, fen) {
    parseFen(fen);
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

setUpChessBoard(false, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
const rootCSS = getComputedStyle(document.querySelector(":root"))
let boardSquareWidth = rootCSS.getPropertyValue("--board-square-width");
boardSquareWidth = boardSquareWidth.slice(0, boardSquareWidth.length-2);
let elementPadding = rootCSS.getPropertyValue("--padding");
elementPadding = elementPadding.slice(0, elementPadding.length-2);
document.getElementById("evalBar").style.height = (8 * boardSquareWidth - 2 * elementPadding) + "px";
document.getElementById("fenInput").style.width = document.getElementById("pgnInput").style.width = getComputedStyle(chessBoard).getPropertyValue("width");
