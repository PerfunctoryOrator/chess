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
// let hideLegal = true;
let draggedPiece = null;
function highlightSquareUnderPoint(x, y, touch = false) {
    // Get square
    const target = document.elementFromPoint(x, y);
    if (!target) return;
    let newSquare = target.dataset.square;
    if (!target.classList.contains("board-square")) {
        newSquare = getSquareFromClassList(target);
    }
    if (!target) return;

    // Get `drag-effect` element
    const dragEffectElement = document.getElementById("drag-effect");
    const oldSquare = getSquareFromClassList(dragEffectElement);

    // Do not change anything if the mouse is inside the previous square or the user has dragged outside the board
    if (oldSquare === newSquare || !newSquare) {
        return;
    }

    // Add drag effect
    dragEffectElement.style.visibility = "visible";
    dragEffectElement.classList.remove("square-" + oldSquare);
    dragEffectElement.classList.add("square-" + newSquare);

    // Handle touch effect
    if (touch) {
        dragEffectElement.classList.add("touch-drag");
    } else {
        dragEffectElement.classList.remove("touch-drag");
    }

    // Handle `hover` effect on legal move indicators
    const oldMoveIndicator = chessBoard.querySelector(`.move-indicator.square-${oldSquare}`);
    if (oldMoveIndicator) {
        oldMoveIndicator.classList.remove("hovered");
    }
    const newMoveIndicator = chessBoard.querySelector(`.move-indicator.square-${newSquare}`);
    if (newMoveIndicator) {
        newMoveIndicator.classList.add("hovered");
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
    dragDrop: {
        click: (event) => {
            if (!event.target.classList.contains("chess-piece")) {
                removeSquareHighlight();
            }
        },
        mousedown: (event) => {
            if (event.button !== 0) return;
            const target = event.target;
            if (target.classList.contains("chess-piece")) {
                activePiece = null;
                removeSquareHighlight();
                selectPiece(target, true);
                if (!activePiece) return;
                draggedPiece = event.target;
                target.classList.add("dragged");
                PieceMoveMethods.dragDrop.mousemove(event);
            }
        },
        mousemove: (event) => {
            if (!draggedPiece) return;
            event.preventDefault();
            draggedPiece.style.left = event.clientX + "px";
            draggedPiece.style.top = event.clientY + "px";
            activePiece.style.pointerEvents = "none";
            highlightSquareUnderPoint(event.clientX, event.clientY, event.touch);
            activePiece.style.pointerEvents = "";
        },
        mouseup: (event) => {
            if (!draggedPiece) return;

            const dragEffectElement = document.getElementById("drag-effect");
            dragEffectElement.style.visibility = "";
            dragEffectElement.classList.remove("square-" + getSquareFromClassList(dragEffectElement));

            draggedPiece.style.pointerEvents = "none";
            const target = document.elementFromPoint(event.clientX, event.clientY);
            const toSquare = getSquareFromClassList(target);
            if (legalMoves.includes(toSquare)) {
                movePiece(toSquare, true);
                createRipple(toSquare);
            } else {
                createRipple(getSquareFromClassList(draggedPiece));
            }
            removeLegalMoveIndicators();
            removeSquareHighlight();
            activePiece = null;
            draggedPiece.style.pointerEvents = "";
            draggedPiece.style.cursor = "grab";
            draggedPiece.classList.remove("dragged");
            draggedPiece.style.top = "";
            draggedPiece.style.left = "";
            draggedPiece = null;
        },
        touchstart: (event) => {
            const touch = event.touches[0];
            const touchEvent = {
                button: 0,
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                touch: true,
                preventDefault: () => event.preventDefault(),
            };
            PieceMoveMethods.dragDrop.mousedown(touchEvent);
        },
        touchmove: (event) => {
            const touch = event.touches[0];
            const touchEvent = {
                button: 0,
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                touch: true,
                preventDefault: () => event.preventDefault(),
            };
            PieceMoveMethods.dragDrop.mousemove(touchEvent);
        },
        touchend: (event) => {
            const touch = event.changedTouches[0];
            const touchEvent = {
                button: 0,
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                touch: true,
                preventDefault: () => event.preventDefault(),
            };
            PieceMoveMethods.dragDrop.mouseup(touchEvent);
        },
        remove: function () {
            chessBoard.removeEventListener("click", this.click);
            chessBoard.removeEventListener("mousedown", this.mousedown);
            document.removeEventListener("mousemove", this.mousemove);
            document.removeEventListener("mouseup", this.mouseup);
            chessBoard.removeEventListener("touchstart", this.touchstart);
            document.removeEventListener("touchmove", this.touchmove);
            document.removeEventListener("touchend", this.touchend);
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "";
            });
        },
        add: function () {
            this.remove();
            chessBoard.addEventListener("click", this.click);
            chessBoard.addEventListener("mousedown", this.mousedown);
            document.addEventListener("mousemove", this.mousemove);
            document.addEventListener("mouseup", this.mouseup);
            chessBoard.addEventListener("touchstart", this.touchstart, { passive: false });
            document.addEventListener("touchmove", this.touchmove, { passive: false });
            document.addEventListener("touchend", this.touchend, { passive: false });
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "grab";
            });
        },
    },
    clickDragDrop: {

    },
};
function convertSquareToIndex(square) {
    return 8 * (8 - square[1]) + (square[0] - 1);
}
function convertIndexToSquare(index) {
    return `${1 + (index % 8)}${8 - Math.floor(index / 8)}`;
}
function getSquareFromClassList(element) {
    if (!element) return;
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
    const dragEffectElement = document.createElement("div");
    dragEffectElement.id = "drag-effect";
    chessBoard.appendChild(dragEffectElement);
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
function createRipple(square) {
    // Create ripple element
    const ripple = document.createElement("div");
    ripple.className = `ripple square-${square}`;

    // Add ripple to the board
    chessBoard.appendChild(ripple);

    // Remove ripple
    setTimeout(() => ripple.remove(), 450);
}
function selectPiece(piece, dragged = false) {
    if (piece.classList.contains("removed")) return;

    // Get square
    const pieceSquare = getSquareFromClassList(piece);

    // Create ripple effect if the piece is not being dragged
    if (!dragged) {
        createRipple(pieceSquare);
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
    const prevHighlight = chessBoard.querySelector(`.square-highlight.square-${pieceSquare}:not(.removed)`);
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
    const backupActivePiece = activePiece;
    if (!dropped) {
        backupActivePiece.classList.add("sliding");
        // activePieceStyle.outline = "none";
        // activePieceStyle.transition = "transform 0.3s ease-out";
    }
    activePiece.classList.remove(`square-${pieceSquare}`);
    activePiece.classList.add(`square-${targetSquare}`);
    if (!dropped) {
        setTimeout(() => {
            backupActivePiece.classList.remove("sliding");
            // activePieceStyle.outline = "";
            // activePieceStyle.transition = "";
        }, 300);
    }

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
                <div style="background-color: white;">
                    <div style="background-color: black;"></div>
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
                <div style="background-color: black;">
                    <div style="background-color: white;"></div>
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

    const evaluation = evaluatePosition();
    document.documentElement.style.setProperty("--evaluation", evaluation);

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
            "k": Infinity,
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
        chessBoard.querySelectorAll(`.square-highlight${permanent ? "" : ":not(.permanent):not(.removed)"}`).forEach(highlight => {
            highlight.classList.add("removed");
            setTimeout(() => highlight.remove(), 200);
        });
        return;
    }
    const highlight = chessBoard.querySelector(`.square-highlight.square-${square}${permanent ? "" : ":not(.permanent):not(.removed)"}`);
    if (highlight) {
        highlight.classList.add("removed");
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
    let square = "";
    const target = event.target;
    if (target.classList.contains("board-square")) {
        square = target.dataset.square;
    } else {
        square = getSquareFromClassList(target);
    }
    const captureIndicator = chessBoard.querySelector(`.move-indicator.square-${square}`);
    if (captureIndicator) captureIndicator.classList.add("hovered");
};
function mouseLeavesPiece(event) {
    let square = "";
    const target = event.target;
    if (event.target.classList.contains("board-square")) {
        square = target.dataset.square;
    } else {
        square = getSquareFromClassList(event.target);
    }
    const captureIndicator = chessBoard.querySelector(`.move-indicator.square-${square}`);
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
PieceMoveMethods.dragDrop.add();

let arrowStartSquare = null;
let arrowSVG = null;
let activeArrow = null;
const arrows = new Set();
const defaultArrowColor = "rgba(255, 170, 0, 0.8)";
const arrowColors = {
    default: "rgba(255, 170, 0, 0.8)",
    alt: "rgba(82, 176, 220, 0.8)",
    ctrl: "rgba(235, 97, 80, 0.8)",
    shift: "rgba(172, 206, 89, 0.8)"
};

function calculateArrowPoints(startSquare, endSquare) {
    const startElement = document.querySelector(`[data-square="${startSquare}"]`);
    const endElement = document.querySelector(`[data-square="${endSquare}"]`);
    if (!startElement || !endElement) return null;

    const boardRect = chessBoard.getBoundingClientRect();
    const squareWidth = boardRect.width / 8;
    const arrowWidth = Math.max(squareWidth / 6, 8);
    const headWidth = arrowWidth * 3;
    const headLength = squareWidth / 3;

    const start = {
        x: startElement.offsetLeft + squareWidth / 2,
        y: startElement.offsetTop + squareWidth / 2
    };
    const end = {
        x: endElement.offsetLeft + squareWidth / 2,
        y: endElement.offsetTop + squareWidth / 2
    };

    // Vector math
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;

    // Adjust start and end points to square edges
    const startOffset = squareWidth * 0.15;
    const endOffset = squareWidth * 0.15;

    return {
        start: {
            x: start.x + unitX * startOffset,
            y: start.y + unitY * startOffset
        },
        end: {
            x: end.x,
            y: end.y
        },
        width: arrowWidth,
        headWidth,
        headLength
    };
}

function createArrowElement(startSquare, endSquare, color = defaultArrowColor) {
    const points = calculateArrowPoints(startSquare, endSquare);
    if (!points) return null;

    const { start, end, width, headWidth, headLength } = points;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "chess-arrow");
    g.setAttribute("data-start", startSquare);
    g.setAttribute("data-end", endSquare);

    // Create arrow shaft
    // Create arrow shaft with round start cap
    const startCap = document.createElementNS("http://www.w3.org/2000/svg", "line");
    startCap.setAttribute("x1", start.x);
    startCap.setAttribute("y1", start.y);
    startCap.setAttribute("x2", start.x + width/2 * Math.cos(angle * Math.PI / 180));
    startCap.setAttribute("y2", start.y + width/2 * Math.sin(angle * Math.PI / 180));
    startCap.setAttribute("stroke", color);
    startCap.setAttribute("stroke-width", width);
    startCap.setAttribute("stroke-linecap", "round");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x - headLength * Math.cos(angle * Math.PI / 180));
    line.setAttribute("y2", end.y - headLength * Math.sin(angle * Math.PI / 180));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", width);
    line.setAttribute("stroke-linecap", "butt");

    // Create arrow head
    const head = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const headBase = {
        x: end.x - headLength * Math.cos(angle * Math.PI / 180),
        y: end.y - headLength * Math.sin(angle * Math.PI / 180)
    };
    const headPath = `M ${end.x},${end.y} L ${headBase.x - headWidth/2 * Math.sin(angle * Math.PI / 180)},${headBase.y + headWidth/2 * Math.cos(angle * Math.PI / 180)} L ${headBase.x + headWidth/2 * Math.sin(angle * Math.PI / 180)},${headBase.y - headWidth/2 * Math.cos(angle * Math.PI / 180)} Z`;
    head.setAttribute("d", headPath);
    head.setAttribute("fill", color);

    g.appendChild(line);
    g.appendChild(startCap);
    g.appendChild(head);
    return g;
}

chessBoard.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const target = event.target;
    let square = "";
    if (target.classList.contains("board-square")) {
        square = target.dataset.square;
    } else {
        square = getSquareFromClassList(target);
    }

    // Add the highlight
    const color = event.altKey ? "blue"
        : (event.ctrlKey || event.metaKey) ? "yellow"
        : event.shiftKey ? "green"
        : "red";

    const oldHighlight = chessBoard.querySelector(`.square-highlight.square-${square}:not(.permanent):not(.removed)`);
    if (oldHighlight) {
        removeSquareHighlight(false, square);
        if (!oldHighlight.classList.contains(color)) {
            highlightSquare(square, false, color);
        }
    } else {
        highlightSquare(square, false, color);
    }
});

chessBoard.addEventListener("contextmenu", (event) => {
    const target = event.target;
    if (target.classList.contains("board-square")) {
        arrowStartSquare = target.dataset.square;
    } else {
        arrowStartSquare = getSquareFromClassList(target);
    }

    if (!arrowSVG) {
        arrowSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrowSVG.setAttribute("class", "arrow-layer");
        arrowSVG.style.position = "absolute";
        arrowSVG.style.top = "0";
        arrowSVG.style.left = "0";
        arrowSVG.style.width = "100%";
        arrowSVG.style.height = "100%";
        arrowSVG.style.pointerEvents = "none";
        arrowSVG.style.zIndex = "7";
        chessBoard.appendChild(arrowSVG);
    }
});

chessBoard.addEventListener("mousemove", (event) => {
    if (arrowStartSquare && event.buttons === 2) {
        const target = event.target;
        let arrowEndSquare = "";
        if (target.classList.contains("board-square")) {
            arrowEndSquare = target.dataset.square;
        } else {
            arrowEndSquare = getSquareFromClassList(target);
        }

        if (arrowEndSquare && arrowStartSquare !== arrowEndSquare) {
            // Remove active arrow if it exists
            if (activeArrow) {
                activeArrow.remove();
                activeArrow = null;
            }

            // Create and add new active arrow
            const arrow = createArrowElement(arrowStartSquare, arrowEndSquare);
            if (arrow) {
                // Preview state
                arrow.style.opacity = "0.6";

                // Set color based on modifier keys
                const color = event.altKey ? arrowColors.alt
                    : (event.ctrlKey || event.metaKey) ? arrowColors.ctrl
                    : event.shiftKey ? arrowColors.shift
                    : arrowColors.default;
                arrow.querySelector("line").setAttribute("stroke", color);
                arrow.querySelector("path").setAttribute("fill", color);

                arrowSVG.appendChild(arrow);
                activeArrow = arrow;
            }
        }
    }
});

chessBoard.addEventListener("click", (event) => {
    // Clear all non-permanent arrows
    arrows.forEach(arrow => {
        if (!arrow.classList.contains("permanent")) {
            arrow.remove();
            arrows.delete(arrow);
        }
    });
});

chessBoard.addEventListener("mouseup", (event) => {
    if (event.button === 2 && arrowStartSquare && activeArrow) {
        const endSquare = activeArrow.getAttribute("data-end");
        const color = event.altKey ? arrowColors.alt
            : (event.ctrlKey || event.metaKey) ? arrowColors.ctrl
            : event.shiftKey ? arrowColors.shift
            : arrowColors.default;

        // Check if this exact arrow already exists
        const existingArrow = Array.from(arrows).find(arr =>
            arr.getAttribute("data-start") === arrowStartSquare &&
            arr.getAttribute("data-end") === endSquare &&
            (!arr.classList.contains("permanent") &&
             arr.querySelector("line").getAttribute("stroke") === color)
        );

        if (existingArrow) {
            existingArrow.remove();
            arrows.delete(existingArrow);
        } else {
            // Remove non-permanent arrow with same squares but different color
            const sameSquaresArrow = Array.from(arrows).find(arr =>
                !arr.classList.contains("permanent") &&
                arr.getAttribute("data-start") === arrowStartSquare &&
                arr.getAttribute("data-end") === endSquare
            );
            if (sameSquaresArrow) {
                sameSquaresArrow.remove();
                arrows.delete(sameSquaresArrow);
            }

            const finalArrow = activeArrow.cloneNode(true);
            finalArrow.style.opacity = "0.8";
            arrowSVG.appendChild(finalArrow);
            arrows.add(finalArrow);
        }

        activeArrow.remove();
        activeArrow = null;
        arrowStartSquare = null;
        event.preventDefault();
    } else if (event.button === 2) {
        arrowStartSquare = null;
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



/****
    * Evaluates the current board position stored in the global variable `piecePositions`.
    * Positive scores favor White, negative scores favor Black.
    *
    * The evaluation considers:
    *  1. Piece mobility
    *  2. King safety
    *  3. Center control (squares: "44", "45", "54", "55")
    *  4. Pawn chains
    *  5. King mobility (only in endgame when there are fewer than 10 non-king pieces)
    *
    * This implementation leverages helper functions from board-manager.js such as:
    *    - convertSquareToIndex() / convertIndexToSquare()
    *    - getCandidateMoves()
    *    - isKingInCheck()
    *
    * Adjust the weights of the factors below if desired.
    *
    * @returns {number} Evaluation score (positive: White advantage, negative: Black advantage)
    */
function evaluatePosition() {
    // Compute weighted scores:
    const mobilityScore = evaluatePieceMobility();
    const kingSafetyScore = evaluateKingSafety();
    const centerControlScore = evaluateCenterControl();
    const pawnChainScore = evaluatePawnChains();
    const kingMobilityScore = isEndgamePhase() ? evaluateKingMobility() : 0;

    // Weights (tweak as needed)
    const weights = {
        mobility: 0.3,
        kingSafety: 0.3,
        center: 0.2,
        pawnChain: 0.1,
        kingMobility: 0.1,
    };

    // Total evaluation: positive score favors white; negative favors black.
    const totalScore =
        weights.mobility * mobilityScore +
        weights.kingSafety * kingSafetyScore +
        weights.center * centerControlScore +
        weights.pawnChain * pawnChainScore +
        weights.kingMobility * kingMobilityScore;
    return totalScore;
}

/****
    * Returns the total mobility score computed by summing the number of legal moves
    * for each piece on the board. This function re-implements legal move calculation
    * for a piece without relying on the global activeColor.
    */
function evaluatePieceMobility() {
    let score = 0;
    // Iterate over all 64 squares.
    for (let index = 0; index < piecePositions.length; index++) {
        const piece = piecePositions[index];
        if (!piece) continue;
        const square = convertIndexToSquare(index);
        const legalMoves = computeLegalMovesForPiece(square, piecePositions);
        // White pieces (uppercase) add to white’s mobility; black subtract.
        if (isUpperCase(piece)) score += legalMoves.length;
        else score -= legalMoves.length;
    }
    return score;
}


/****
    * Computes the king safety score.
    * For each king, looks at the eight surrounding squares and evaluates how many are safe.
    * The final king safety score is the difference: (White king safety - Black king safety).
    */
function evaluateKingSafety() {
    const whiteSafety = computeKingSafetyForColor("w");
    const blackSafety = computeKingSafetyForColor("b");
    return whiteSafety - blackSafety;
}

/****
    * Computes a simple safety score for the king of the given color.
    * It checks the eight adjacent squares and counts how many are not attacked.
    * (Here, a higher count indicates greater safety.)
    */
function computeKingSafetyForColor(color) {
    const kingPiece = color === "w" ? "K" : "k";
    let kingSquare = "";
    // Find king square
    for (let i = 0; i < piecePositions.length; i++) {
        if (piecePositions[i] === kingPiece) {
        kingSquare = convertIndexToSquare(i);
        break;
        }
    }
    if (!kingSquare) return 0;
    // Directions: up, down, left, right and the four diagonals
    const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
    ];
    let safeCount = 0;
    const kingFile = parseInt(kingSquare[0], 10);
    const kingRank = parseInt(kingSquare[1], 10);
    directions.forEach(([df, dr]) => {
        const newFile = kingFile + df;
        const newRank = kingRank + dr;
        if (newFile >= 1 && newFile <= 8 && newRank >= 1 && newRank <= 8) {
        const sq = "" + newFile + newRank;
        // Use the isSquareAttacked function from board-manager.js to determine if the square is attacked
        // Enemy color is the opposite of the king's color.
        const enemyColor = color === "w" ? "b" : "w";
        if (!isSquareAttacked(piecePositions, sq, enemyColor)) {
            safeCount++;
        }
        }
    });
    return safeCount;
}

/****
    * Evaluates center control.
    * The center is defined as the squares: "44", "45", "54", and "55".
    * For every piece, if one of its candidate moves (even if not strictly legal)
    * lands on a center square, add one to that side's control.
    */
function evaluateCenterControl() {
    const centerSquares = ["44", "45", "54", "55"];
    let whiteControl = 0;
    let blackControl = 0;
    // Iterate over all squares and check candidate moves of pieces.
    for (let index = 0; index < piecePositions.length; index++) {
        const piece = piecePositions[index];
        if (!piece) continue;
        const square = convertIndexToSquare(index);
        const candidates = getCandidateMoves(square, piecePositions);
        candidates.forEach(move => {
        if (centerSquares.includes(move)) {
            if (isUpperCase(piece)) whiteControl++;
            else blackControl++;
        }
        });
    }
    // Control is more valuable; return difference.
    return whiteControl - blackControl;
}

/****
    * Evaluates pawn chains.
    * For every pawn, if it is supported by another pawn of the same color (on a diagonal behind it),
    * then a bonus is added. Returns the difference:
    *    (White pawn chain count - Black pawn chain count)
    */
function evaluatePawnChains() {
    let whiteChain = 0;
    let blackChain = 0;
    for (let index = 0; index < piecePositions.length; index++) {
        const piece = piecePositions[index];
        if (!piece) continue;
        // Check for pawn (using lowercase for black, uppercase for white)
        if (piece.toLowerCase() !== "p") continue;
        const square = convertIndexToSquare(index);
        const file = parseInt(square[0], 10);
        const rank = parseInt(square[1], 10);
        // For white, supported pawn is one row behind (smaller rank); for black, one row ahead.
        let supportSquares = [];
        if (isUpperCase(piece)) {
        supportSquares = [(file - 1) + "" + (rank - 1), (file + 1) + "" + (rank - 1)];
        } else {
        supportSquares = [(file - 1) + "" + (rank + 1), (file + 1) + "" + (rank + 1)];
        }
        let supported = false;
        supportSquares.forEach(sq => {
        // Verify square is on board (files 1-8 and ranks 1-8)
        if (sq.length === 2) {
            const f = parseInt(sq[0], 10);
            const r = parseInt(sq[1], 10);
            if (f >= 1 && f <= 8 && r >= 1 && r <= 8) {
            const pieceIndex = convertSquareToIndex(sq);
            const supportingPiece = piecePositions[pieceIndex];
            if (supportingPiece && supportingPiece.toLowerCase() === "p" &&
                ((isUpperCase(piece) && isUpperCase(supportingPiece)) ||
                (!isUpperCase(piece) && !isUpperCase(supportingPiece)))) {
                supported = true;
            }
            }
        }
        });
        if (supported) {
        if (isUpperCase(piece)) whiteChain++;
        else blackChain++;
        }
    }
    return whiteChain - blackChain;
}

/****
    * Evaluates king mobility in the endgame.
    * The function counts the number of legal moves available for both kings.
    * Returns the difference: (White king moves - Black king moves)
    */
function evaluateKingMobility() {
    const whiteKingMoves = computeLegalMovesForKing("w");
    const blackKingMoves = computeLegalMovesForKing("b");
    return whiteKingMoves - blackKingMoves;
}

/****
    * Helper: Computes the number of legal moves for the king of a given color.
    */
function computeLegalMovesForKing(color) {
    const kingPiece = color === "w" ? "K" : "k";
    let kingSquare = "";
    for (let i = 0; i < piecePositions.length; i++) {
        if (piecePositions[i] === kingPiece) {
        kingSquare = convertIndexToSquare(i);
        break;
        }
    }
    if (!kingSquare) return 0;
    const legalMoves = computeLegalMovesForPiece(kingSquare, piecePositions);
    return legalMoves.length;
}

/****
    * Determines if the current position is in the endgame.
    * For this purpose, endgame is defined as having fewer than 10 non-king pieces on the board.
    */
function isEndgamePhase() {
    let countNonKings = 0;
    piecePositions.forEach(piece => {
        if (piece && piece.toLowerCase() !== "k") countNonKings++;
    });
    return countNonKings < 10;
}

/****
    * Computes the legal move list for a given piece at a specified square on the board.
    * This function emulates the logic from getLegalMoves but works for any given piece,
    * independent of the current global activeColor.
    *
    * @param {string} square - The square from which to compute moves (e.g., "18", "44")
    * @param {Array} board  - The board array (piecePositions)
    * @returns {Array}      - Array of squares the piece can legally move to.
    */
function computeLegalMovesForPiece(square, board) {
    const index = convertSquareToIndex(square);
    const piece = board[index];
    if (!piece) return [];
    const color = isUpperCase(piece) ? "w" : "b";
    const candidateMoves = getCandidateMoves(square, board); // from board-manager.js
    const legalMoves = [];
    candidateMoves.forEach(move => {
        const newBoard = board.slice();
        newBoard[convertSquareToIndex(move)] = piece;
        newBoard[index] = "";
        // Check if the king is in check after this move.
        if (!isKingInCheck(newBoard, color)) {
        legalMoves.push(move);
        }
    });
    return legalMoves;
}

/****
    * Helper function to check if a character is uppercase.
    * Assumes the character is an alphabet letter.
    */
function isUpperCase(char) {
    return char === char.toUpperCase();
}
