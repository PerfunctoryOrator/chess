const Notation = {
    read: {
        san: (san) => {

        },
        fen: (fen) => {
            let ranksParsed = 0;
            let piecePositions = [];
            let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
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
                    switch (fenChar.toLowerCase()) {
                        case "r": break;
                        case "n": break;
                        case "b": break;
                        case "q": break;
                        case "k": break;
                        case "p": break;
                        default: return false;
                    }
                    piecePositions.push(fenChar);
                } else if (fenChar === "/") {
                    ranksParsed++;
                    if (piecePositions.length !== 8 * ranksParsed) return false;
                } else {
                    for (let j = parseInt(fenChar); j > 0; j--) piecePositions.push("");
                }
                i++;
                if (i < fen.length) fenChar = fen[i];
                else return false;
            }
            if (piecePositions.length !== 64 || ranksParsed !== 7) return false;
            activeColor = readValueFromFen();
            if (!activeColor == true || !(activeColor === "w" || activeColor === "b")) return false;
            castlingRights = readValueFromFen();
            if (!castlingRights == true || castlingRights.length > 4) return false;
            if (castlingRights !== "-") {
                for (const char of castlingRights) {
                    switch (char) {
                        case "K": break;
                        case "Q": break;
                        case "k": break;
                        case "q": break;
                        default: return false;
                    }
                }
            }
            enPassantSquare = readValueFromFen();
            if (!enPassantSquare == true || enPassantSquare.length > 2 || (enPassantSquare !== "-" && (enPassantSquare[1] !== "3" && enPassantSquare[1] !== "6"))) return false;
            if (enPassantSquare === "-") enPassantSquare = "";
            else enPassantSquare = (enPassantSquare[0].charCodeAt(0) - "a".charCodeAt(0) + 1) + enPassantSquare[1];
            halfmoveClock = parseInt(readValueFromFen());
            if (!halfmoveClock == true && halfmoveClock !== 0) return false;
            fullmoveNumber = parseInt(readValueFromFen());
            if (!fullmoveNumber == true) return false;
            if (piecePositions.filter(x => x === "K").length !== 1 || piecePositions.filter(x => x === "k").length !== 1) return false;
            if (isKingInCheck(piecePositions, activeColor === "w" ? "b" : "w")) return false;
            return [
                piecePositions,
                activeColor,
                castlingRights,
                enPassantSquare,
                halfmoveClock,
                fullmoveNumber,
            ];
        },
        pgn: (pgn) => {

        },
    },
    write: {
        san: (fromSquare, toSquare, promotedTo, enPassantSquare, board = piecePositions) => {
            const pieceType = board[convertSquareToIndex(fromSquare)];
            const pieceIsPawn = pieceType.toLowerCase() === "p";
            let moveNotation = pieceIsPawn ? "" : pieceType.toUpperCase();
            if (board[convertSquareToIndex(toSquare)] !== "" || toSquare === enPassantSquare && pieceIsPawn) {
                if (pieceIsPawn) moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(fromSquare[0]) - 1);
                moveNotation += "x";
            }
            moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(toSquare[0]) - 1) + toSquare[1];
            if (pieceIsPawn && promotedTo) moveNotation += "=" + promotedTo.toUpperCase();
            const newBoard = board.slice();
            newBoard[convertSquareToIndex(fromSquare)] = "";
            newBoard[convertSquareToIndex(toSquare)] = promotedTo ? promotedTo : pieceType;
            if (isKingInCheck(newBoard, activeColor)) moveNotation += isCheckmate(activeColor, newBoard) ? "#" : "+";
            return moveNotation;
        },
        fen: () => {

        },
        pgn: () => {

        },
    },
    assign: {
        parsedFen: (parsedFen) => {
            piecePositions = parsedFen[0];
            activeColor = parsedFen[1];
            castlingRights = parsedFen[2];
            enPassantSquare = parsedFen[3];
            halfmoveClock = parsedFen[4];
            fullmoveNumber = parsedFen[5];
        },
    },
};
let hideLegal = true;
let draggedPieceId = "";
function highlightSquareUnderPoint(x, y, previousTarget = null) {
    let target = document.elementFromPoint(x, y);
    if (previousTarget !== target) {
        if (previousTarget) {
            previousTarget.classList.remove("under-dragged-piece", "touch-drag");
            // mouseLeavesSquare(previousTarget);
        }
        if (target.classList.contains("board-square") || target.classList.contains("chess-piece")) {
            if (target.classList.contains("chess-piece")) {
                target = chessBoard.querySelector(`.board-square[data-square="${target.getAttribute("data-square")}"]`);
            }
            target.classList.add("under-dragged-piece");
            // mouseEntersSquare(target);
        }
    }
};
const PieceMoveMethods = {
    click: {
        click: (event) => {
            const target = event.target;
            if (target.classList.contains("move-indicator")) {
                movePiece(getSquareFromClassList(target));
            }
            if (target.classList.contains("chess-piece")) {
                selectPiece(target);
            } else {
                removeLegalMoveIndicators();
                removeSquareHighlight();
                activePiece = null;
            }
        },
        remove: function () {
            chessBoard.removeEventListener("click", this.click);
        },
        add: function () {
            this.remove();
            chessBoard.addEventListener("click", this.click);
        },
    },
};
function convertSquareToIndex(square) {
    return 8 * (8 - square[1]) + (square[0] - 1);
}
function convertIndexToSquare(index) {
    return `${1 + (index % 8)}${8 - Math.floor(index / 8)}`;
}
function getSquareFromClassList(element) {
    const squareClass = Array.from(element.classList).find(className => className.startsWith("square-"));
    if (squareClass) {
        return squareClass.substring(7);
    }
};
function setUpEmptyBoard() {
    const background = chessBoard.querySelector(".background");
    for (let rank = 8; rank > 0; rank--) {
        for (let file = 1; file < 9; file++) {
            const square = document.createElement("div");
            square.classList.add("board-square");
            square.dataset.square = `${file}${rank}`;
            if ((file + rank) % 2 === 1) {
                square.classList.add("light-square");
            }
            background.appendChild(square);
        }
    }
    const filesContainer = document.createElement("div");
    filesContainer.className = "files-container";
    for (let i = 0; i < 8; i++) {
        const fileIndicator = document.createElement("div");
        fileIndicator.innerText = String.fromCharCode("a".charCodeAt(0) + i);
        filesContainer.appendChild(fileIndicator);
    }
    chessBoard.appendChild(filesContainer);
    const ranksContainer = document.createElement("div");
    ranksContainer.className = "ranks-container";
    for (let i = 1; i < 9; i++) {
        const rankIndicator = document.createElement("div");
        rankIndicator.innerText = i;
        ranksContainer.appendChild(rankIndicator);
    }
    chessBoard.appendChild(ranksContainer);
};
function setUpPieces() {
    let squareNumber = 0;
    for (let rank = 8; rank > 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                const square = `${(file + 1)}${rank}`;
                piece.className = `chess-piece ${pieceAtSquare} square-${square}`;
                piece.addEventListener("mouseenter", mouseEntersPiece);
                piece.addEventListener("mouseleave", mouseLeavesPiece);
                chessBoard.appendChild(piece);
            }
            squareNumber++;
        }
    }
};
function getCandidateMoves(pieceSquare, board) {
    let candidateMoves = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const pieceFile = parseInt(pieceSquare[0]);
    const pieceRank = parseInt(pieceSquare[1]);
    const boardFiles = [1, 2, 3, 4, 5, 6, 7, 8];
    const boardRanks = [1, 2, 3, 4, 5, 6, 7, 8];
    let friendlyPieces = ["R", "N", "B", "Q", "K", "P"];
    if (!friendlyPieces.includes(piece)) friendlyPieces = ["r", "n", "b", "q", "k", "p"];

    const isValidMove = (file, rank) => {
        if (boardFiles.includes(file) && boardRanks.includes(rank)) {
            const targetSquare = `${file}${rank}`;
            const targetPiece = board[convertSquareToIndex(targetSquare)];
            return !friendlyPieces.includes(targetPiece);
        }
        return false;
    }
    const addDirectionalMoves = (directions) => {
        directions.forEach(([fileStep, rankStep]) => {
            let f = pieceFile, r = pieceRank;
            while (true) {
                f += fileStep;
                r += rankStep;
                if (!isValidMove(f, r)) break;
                candidateMoves.push(`${f}${r}`);
                if (board[convertSquareToIndex(`${f}${r}`)]) break;
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
                let f = pieceFile + df;
                let r = pieceRank + dr;
                if (isValidMove(f, r)) candidateMoves.push(`${f}${r}`);
            });
            break;
        case "n":
            [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([df, dr]) => {
                let f = pieceFile + df;
                let r = pieceRank + dr;
                if (isValidMove(f, r)) candidateMoves.push(`${f}${r}`);
            });
            break;
        case "p":
            let forward = piece === "P" ? 1 : -1;
            let startRank = piece === "P" ? 2 : 7;
            let frontSquare = `${pieceFile}${pieceRank + forward}`;
            if (!board[convertSquareToIndex(frontSquare)]) {
                candidateMoves.push(frontSquare);
                if (pieceRank === startRank) {
                    let doubleFront = `${pieceFile}${pieceRank + 2 * forward}`;
                    if (!board[convertSquareToIndex(doubleFront)]) candidateMoves.push(doubleFront);
                }
            }
            [[-1, forward], [1, forward]].forEach(([df, dr]) => {
                let f = pieceFile + df;
                let r = pieceRank + dr;
                let captureSquare = `${f}${r}`;
                if (isValidMove(f, r) && board[convertSquareToIndex(captureSquare)]) candidateMoves.push(captureSquare);
            });
            if (enPassantSquare && Math.abs(pieceFile - enPassantSquare[0]) === 1 && pieceRank + forward === parseInt(enPassantSquare[1])) {
                candidateMoves.push(enPassantSquare);
            }
            break;
    }
    return candidateMoves;
};
function isSquareAttacked(board, square, attackerColor) {
    for (let i = 0; i < board.length; i++) {
        const attacker = board[i];
        if (!attacker) continue;
        const isWhite = attacker === attacker.toUpperCase();
        if ((attackerColor === "w" && isWhite) ||
            (attackerColor === "b" && !isWhite)) {
            const attackerSquare = convertIndexToSquare(i);
            const moves = getCandidateMoves(attackerSquare, board);
            if (moves.includes(square)) return true;
        }
    }
    return false;
};
function isKingInCheck(board, kingColor) {
    const kingPiece = kingColor === "w" ? "K" : "k";
    let kingSquare = "";
    for (let i = 0; i < board.length; i++) {
        if (board[i] === kingPiece) {
            kingSquare = convertIndexToSquare(i);
            break;
        }
    }
    if (kingSquare === "") return false;
    return isSquareAttacked(board, kingSquare, kingColor === "w" ? "b" : "w");
};
function getLegalMoves (pieceSquare, board = piecePositions) {
    const candidateMoves = getCandidateMoves(pieceSquare, board);
    let legalMovesForPiece = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const movingColor = piece === piece.toUpperCase() ? "w" : "b";
    if (movingColor !== activeColor) return [];
    candidateMoves.forEach(move => {
        let newBoard = board.slice();
        newBoard[convertSquareToIndex(move)] = newBoard[convertSquareToIndex(pieceSquare)];
        newBoard[convertSquareToIndex(pieceSquare)] = "";
        if (!isKingInCheck(newBoard, movingColor)) {
            legalMovesForPiece.push(move);
        }
    });
    return legalMovesForPiece;
};
function isCheckmate(activeColor, board = piecePositions) {
    if (!isKingInCheck(board, activeColor)) return false;
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if (activeColor === "w" === isWhite) {
            const pieceSquare = convertIndexToSquare(i);
            const legalMoves = getLegalMoves(pieceSquare, board);
            if (legalMoves.length > 0) return false;
        }
    }
    return true;
};
function isStalemate(activeColor, board = piecePositions) {
    if (isKingInCheck(board, activeColor)) return false;
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if ((activeColor === "w" && isWhite) || (activeColor === "b" && !isWhite)) {
            const pieceSquare = convertIndexToSquare(i);
            const legalMoves = getLegalMoves(pieceSquare, board);
            if (legalMoves.length > 0) return false;
        }
    }
    return true;
};
function removeLegalMoveIndicators() {
    chessBoard.querySelectorAll(".move-indicator").forEach(indicator => {
        indicator.classList.add("fade-out");
        setTimeout(() => indicator.remove(), 200);
    });
};
function selectPiece(piece, dragged = false) {
    if (piece.classList.contains("removed")) return;

    // Get square
    const pieceSquare = getSquareFromClassList(piece);

    // Create ripple effect if the piece is not being dragged
    if (!dragged) {
        const ripple = document.createElement("div");
        ripple.className = `ripple square-${pieceSquare}`;
        chessBoard.appendChild(ripple);
        setTimeout(() => ripple.remove(), 450);
    }

    // Remove all previous legal move indicators
    removeLegalMoveIndicators();

    // Handle piece capture
    if (activePiece && legalMoves.includes(pieceSquare)) {
        movePiece(pieceSquare);
        halfmoveClock = 0;
        activePiece = null;
        return;
    }

    // If the piece to be selected is already selected, deselect it
    if (piece === activePiece) {
        activePiece = null;
        removeSquareHighlight();
        return;
    }

    // Highlight the selected square
    const prevHighlight = chessBoard.querySelector(`.square-highlight.square-${pieceSquare}`);
    if (!prevHighlight) highlightSquare(pieceSquare);

    // Select the piece and highlight legal moves
    activePiece = piece;
    legalMoves = getLegalMoves(pieceSquare);
    legalMoves.forEach(square => {
        const moveIndicator = document.createElement("div");
        moveIndicator.className = `move-indicator square-${square}`;
        if (piecePositions[convertSquareToIndex(square)] || (square === enPassantSquare && piecePositions[convertSquareToIndex(pieceSquare)].toLowerCase() === "p")) {
            moveIndicator.classList.add("capture-indicator");
        } else {
            moveIndicator.classList.add("empty-move-indicator");
        }
        chessBoard.appendChild(moveIndicator);
    });
};
function showPromotionBox(targetSquare) {
    return new Promise(resolve => {
        const pieceToPromote = activePiece;
        const promotionBox = document.createElement("div");
        const promotionChoices = activeColor === "w" ? ["Q", "N", "R", "B"] : ["q", "n", "r", "b"];

        promotionBox.className = `promotion-box square-${targetSquare} ${activeColor === "w" ? "" : "black"}`;
        for (let i = 0; i < 4; i++) {
            const pieceButton = document.createElement("button");
            pieceButton.value = pieceButton.className = promotionChoices[i];
            pieceButton.addEventListener("click", function () {
                promotionBox.remove();
                resolve([pieceToPromote, this.value]);
            });
            promotionBox.appendChild(pieceButton);
        }
        chessBoard.appendChild(promotionBox);
    });
}
async function movePiece(targetSquare, dropped = false, recurse = false) {
    // Basic variables
    const pieceSquare = getSquareFromClassList(activePiece);
    const toFile = parseInt(targetSquare[0]);
    const toRank = parseInt(targetSquare[1]);
    const pieceType = piecePositions[convertSquareToIndex(pieceSquare)];
    const previousRank = parseInt(pieceSquare[1]);

    // Handle piece capture
    const capturedPieceType = piecePositions[convertSquareToIndex(targetSquare)];
    if (capturedPieceType) {
        const capturedPiece = chessBoard.querySelector(`.chess-piece.square-${targetSquare}:not(.removed)`);
        capturedPiece.classList.add("removed");
        setTimeout(() => capturedPiece.remove(), 250);
    }

    // Change the position of piece
    const activePieceStyle = activePiece.style;
    if (!dropped) activePieceStyle.outline = "none";
    activePiece.classList.remove(`square-${pieceSquare}`);
    activePiece.classList.add(`square-${targetSquare}`);
    if (!dropped) setTimeout(() => activePieceStyle.outline = "", 300);

    // Handle pawn promotion
    let promotedTo = "";
    if (pieceType.toLowerCase() === "p") {
        if (pieceType.toLowerCase() === "p" && toRank === (pieceType === "p" ? 1 : 8)) {
            promotedTo = await showPromotionBox(targetSquare);
            activePiece = promotedTo[0];
            promotedTo = promotedTo[1];
            activePiece.classList.remove("P", "p");
            activePiece.classList.add(promotedTo);
        }
    }

    // Set active color
    activeColor = activeColor === "w" ? "b" : "w";

    // Handle en passant
    if (pieceType.toLowerCase() === "p" && enPassantSquare === targetSquare) {
        const enemyPawnSquare = `${toFile}${previousRank}`;
        const enemyPawn = chessBoard.querySelector(`.chess-piece.square-${enemyPawnSquare}:not(.removed)`);
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = "";
        enemyPawn.classList.add("removed");
        setTimeout(() => enemyPawn.remove(), 250);
    }

    // Set new en passant square
    let prevEnPassantSquare = enPassantSquare;
    if (pieceType.toLowerCase() === "p" && Math.abs(toRank - previousRank) === 2) {
        enPassantSquare = pieceType === "P" ? `${toFile}3` : `${toFile}6`;
    } else enPassantSquare = "";

    // Get move notation
    const moveNotation = Notation.write.san(pieceSquare, targetSquare, promotedTo, prevEnPassantSquare);

    // Update `piecePositions` and highlight move squares
    piecePositions[convertSquareToIndex(pieceSquare)] = "";
    removeSquareHighlight(true);
    highlightSquare(pieceSquare, true);
    highlightSquare(targetSquare, true);
    if (promotedTo) piecePositions[convertSquareToIndex(targetSquare)] = promotedTo;
    else piecePositions[convertSquareToIndex(targetSquare)] = pieceType;

    // Write move notation to `#move-grid` and update the `#to-move` indicator
    if (activeColor === "b") {
        const newMoveRow = document.createElement("div");
        newMoveRow.innerHTML = `
            <div>${fullmoveNumber}.</div>
            <div>${moveNotation}</div>
            <div>&nbsp;</div>
            `;
        document.getElementById("move-grid").appendChild(newMoveRow);
        if (moveNotation[moveNotation.length - 1] === "#") {
            gameStatus = "1–0";
            document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;wins by checkmate!`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">1–0</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else if (isStalemate(activeColor)) {
            gameStatus = "½–½";
            document.getElementById("to-move").innerHTML = `
                <div style="background-color: black;">
                    <div style="background-color: white;"></div>
                </div>
                <b>Draw</b>&nbsp; by stalemate`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">½–½</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else {
            document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
        }
    } else {
        const moveGrid = document.getElementById("move-grid");
        if (moveGrid.lastChild) {
            moveGrid.lastChild.children[2].innerText = moveNotation;
        } else {
            const newMoveRow = document.createElement("div");
            newMoveRow.innerHTML = `
                <div>${fullmoveNumber}.</div>
                <div>…</div>
                <div>${moveNotation}</div>
                `;
            moveGrid.appendChild(newMoveRow);
        }
        fullmoveNumber++;
        if (moveNotation[moveNotation.length - 1] === "#") {
            gameStatus = "0–1";
            document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;wins by checkmate!`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">0–1</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else if (isStalemate(activeColor)) {
            gameStatus = "½–½";
            document.getElementById("to-move").innerHTML = `
                <div style="background-color: white;">
                    <div style="background-color: black;"></div>
                </div>
                <b>Draw</b>&nbsp; by stalemate`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">½–½</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else {
            document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;to move`;
        }
    }

    // Handle halfmove clock
    if (pieceType.toLowerCase() === "p") halfmoveClock = 0;
    else halfmoveClock++; // If a capture takes place, then the `selectPiece` function takes care of it.

    // Find next move
    if (recurse || gameStatus !== "*") return;
    const allLegalMoves = [];
    for (i in piecePositions) {
        const piece = piecePositions[i];
        if (piece.toLowerCase() === piece === (activeColor === "b")) {
            const currentSquare = convertIndexToSquare(i);
            allLegalMoves.push(...getLegalMoves(currentSquare).map(move => `${currentSquare}-${move}`));
        }
    }
    const randomItem = (() => {
        const points = {
            "r": 5,
            "n": 3,
            "b": 3,
            "q": 9,
            "p": 1,
            "": 0,
        };
        let takeAblePiece = ["", 0];
        allLegalMoves.forEach(move => {
            const pieceOnTargetSquare = piecePositions[convertSquareToIndex(move.slice(3, 5))].toLowerCase();
            takeAblePiece[1] = points[piecePositions[convertSquareToIndex(move.slice(0, 2))].toLowerCase()];
            if (points[pieceOnTargetSquare] >= takeAblePiece[1]) {
                takeAblePiece[0] = move;
                takeAblePiece[1] = pieceOnTargetSquare;
            }
        });
        if (takeAblePiece[0]) {
            return takeAblePiece[0];
        }
        return allLegalMoves[Math.floor(Math.random() * allLegalMoves.length)];
    })();
    activePiece = chessBoard.querySelector(`.chess-piece.square-${randomItem.slice(0, 2)}:not(.removed)`);
    movePiece(randomItem.slice(3, 5), false, true);
}
function removeSquareHighlight(permanent = false, square = "") {
    if (square === "") {
        chessBoard.querySelectorAll(`.square-highlight${permanent ? "" : ":not(.permanent)"}`).forEach(highlight => {
            highlight.style.opacity = "0";
            setTimeout(() => highlight.remove(), 200);
        });
        return;
    }
    const highlight = chessBoard.querySelector(`.square-highlight.square-${square}${permanent ? "" : ":not(.permanent)"}`);
    if (highlight) {
        highlight.style.opacity = "0";
        setTimeout(() => highlight.remove(), 200);
    }
};
function highlightSquare(square, permanent = false, color = "") {
    const highlight = document.createElement("div");
    highlight.className = `square-highlight square-${square}`;
    if (color === "") {
        removeSquareHighlight();
    } else {
        highlight.classList.add(color);
    }
    if (permanent === true) highlight.classList.add("permanent");
    chessBoard.appendChild(highlight);
};
function mouseEntersPiece(event) {
    const square = getSquareFromClassList(event.target);
    const captureIndicator = chessBoard.querySelector(`.capture-indicator.square-${square}`);
    if (captureIndicator) captureIndicator.classList.add("hovered");
};
function mouseLeavesPiece(event) {
    const square = getSquareFromClassList(event.target);
    const captureIndicator = chessBoard.querySelector(`.capture-indicator.square-${square}`);
    if (captureIndicator) captureIndicator.classList.remove("hovered");
};
function checkFenValidity(fen) {
    const parsedFen = Notation.read.fen(fen.trim());
    if (parsedFen) {
        positionInputBox.style.border = "";
        return parsedFen;
    }
    positionInputBox.style.border = "2px solid var(--danger-color)";
    return false;
};
function flipBoard() {
    isBoardFlipped = !isBoardFlipped;
    const allChessPieces = chessBoard.querySelectorAll(".chess-piece");
    document.getElementById("flip-svg").style.transform = `rotate(${isBoardFlipped ? "" : "-"}90deg)`;
    if (isBoardFlipped) {
        chessBoard.classList.add("flipped");
    } else {
        chessBoard.classList.remove("flipped");
    }
    chessBoard.querySelectorAll(".background > div").forEach(square => {
        const oldSquare = square.dataset.square;
        square.dataset.square = `${9 - oldSquare[0]}${9 - oldSquare[1]}`;
    });
    allChessPieces.forEach(piece => {
        piece.style.transition = "none";
    });
    setTimeout(() => {
        allChessPieces.forEach(piece => {
            piece.style.transition = "";
        });
    }, 0);
};

let isBoardFlipped = false;
let piecePositions = [];
let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
let activePiece = null, legalMoves = [];
let pieceMoveAnimation = "ease-in-out";
let gameStatus = "*";
let chessBoard = document.querySelector(".chess-board");
if (!chessBoard) {
    const newBoard = document.createElement("div");
    newBoard.className = "chess-board";
    newBoard.innerHTML = "<div class='background'></div>";
    document.getElementById("game-area").appendChild(newBoard);
    chessBoard = document.querySelector(".chess-board");
}
const positionInputBox = document.getElementById("position-input");
let fenOnBoard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const parameters = location.search.replace(/%20/g, " ").split("?");
if (parameters != "") {
    const firstParameter = parameters[1];
    switch (firstParameter.slice(0, 4)) {
        case "fen=":
            fenOnBoard = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2].includes("flip")) isBoardFlipped = true;
            break;
        case "pgn=":
            document.getElementById("pgn-input").value = firstParameter.slice(4, firstParameter.length);
            if (parameters[2] && parameters[2] === "flip") isBoardFlipped = true;
            break;
        case "flip":
            isBoardFlipped = true;
            break;
    }
}
const parsedFen = checkFenValidity(fenOnBoard);
if (parsedFen) {
    Notation.assign.parsedFen(parsedFen);
    positionInputBox.value = fenOnBoard;
} else {
    alert("The FEN specified by the URL is not valid.\nEnter a valid FEN.");
    fenOnBoard = positionInputBox.value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    Notation.assign.parsedFen(Notation.read.fen(fenOnBoard));
    document.getElementById("fen-validity-indicator").innerHTML = `
        <!-- Icon sourced from Google Fonts (Material Icons) — Apache license 2.0 -->
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--color)" opacity="0.6">
            <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
}
const startingPositionRow = document.createElement("div");
if (fenOnBoard === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    startingPositionRow.innerHTML = "<div class='info'>Starting position</div>";
} else {
    startingPositionRow.innerHTML = "<div class='info'>Custom position</div>";
}
document.getElementById("move-grid").appendChild(startingPositionRow);
setUpEmptyBoard();
setUpPieces();
PieceMoveMethods.click.add();
chessBoard.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const target = event.target;
    let square = "";
    if (target.classList.contains("board-square")) {
        square = target.dataset.square;
    } else {
        square = getSquareFromClassList(target);
    }
    const color = event.altKey ? "blue"
        : (event.ctrlKey || event.metaKey) ? "yellow"
        : event.shiftKey ? "green"
        : "red";
    const oldHighlight = chessBoard.querySelector(`.square-highlight.square-${square}`);
    if (oldHighlight) {
        removeSquareHighlight(false, square);
        if (!oldHighlight.classList.contains(color)) {
            highlightSquare(square, false, color);
        }
    } else {
        highlightSquare(square, false, color);
    }

});
if (isBoardFlipped) {
    isBoardFlipped = !isBoardFlipped;
    flipBoard();
}
if (activeColor === "b") {
    document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
} else {
    document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;to move`;
}
