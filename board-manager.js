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
            halfmoveClock = parseInt(readValueFromFen());
            if (!halfmoveClock == true && halfmoveClock !== 0) return false;
            fullmoveNumber = parseInt(readValueFromFen());
            if (!fullmoveNumber == true) return false;
            if (piecePositions.filter(x => x === "K").length !== 1 || piecePositions.filter(x => x === "k").length !== 1) return false;
            if (isKingInCheck(piecePositions, "w") || isKingInCheck(piecePositions, "b")) return false;
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
            moveNotation += "";
            if (board[convertSquareToIndex(toSquare)] !== "" || toSquare === enPassantSquare && pieceIsPawn) {
                if (pieceIsPawn) moveNotation += fromSquare[0];
                moveNotation += "x";
            }
            moveNotation += toSquare;
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
const highlightSquareUnderPoint = (x, y, previousTarget = null) => {
    let target = document.elementFromPoint(x, y);
    if (previousTarget !== target) {
        if (previousTarget) {
            previousTarget.classList.remove("under-dragged-piece", "touch-drag");
            mouseLeavesSquare(previousTarget);
        }
        if (target.classList.contains("board-square") || target.classList.contains("chess-piece")) {
            if (target.classList.contains("chess-piece")) {
                target = chessBoard.querySelector(`.board-square[data-square="${target.getAttribute("data-square")}"]`);
            }
            target.classList.add("under-dragged-piece");
            mouseEntersSquare(target);
        }
    }
};
const PieceMoveMethods = {
    click: {
        piece: (event) => {
            selectPiece(event.target);
        },
        square: (event) => {
            if (activePiece && legalMoves.includes(event.target.getAttribute("data-square"))) movePiece(event.target.getAttribute("data-square"));
        },
        document: (event) => {
            if (!event.target.classList.contains("chess-piece")) {
                removeLegalMoveIndicators();
                removeSquareHighlight();
                activePiece = null;
            }
        },
        remove: function () {
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.removeEventListener("click", this.piece);
            });
            chessBoard.querySelectorAll(".board-square").forEach(square => {
                square.removeEventListener("click", this.square);
            });
            document.removeEventListener("click", this.document);
        },
        add: function () {
            this.remove();
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.addEventListener("click", this.piece);
            });
            chessBoard.querySelectorAll(".board-square").forEach(square => {
                square.addEventListener("click", this.square);
            });
            document.addEventListener("click", this.document);
        },
    },
    dragDrop: {
        mousemove: (event) => {
            activePiece.style.top = event.clientY + "px";
            activePiece.style.left = event.clientX + "px";
            activePiece.style.pointerEvents = "none";
            highlightSquareUnderPoint(event.clientX, event.clientY, document.querySelector(".under-dragged-piece"));
            activePiece.style.pointerEvents = "";
        },
        mousedown: (event) => {
            activePiece = null;
            selectPiece(event.target, true);
            if (!activePiece) return;
            draggedPieceId = activePiece.getAttribute("data-square");
            activePiece.classList.add("dragged");
            PieceMoveMethods.dragDrop.mousemove(event);
            document.addEventListener("mousemove", PieceMoveMethods.dragDrop.mousemove);
            activePiece.addEventListener("mouseup", PieceMoveMethods.dragDrop.mouseup);
        },
        mouseup: (event) => {
            document.removeEventListener("mousemove", PieceMoveMethods.dragDrop.mousemove);
            activePiece.removeEventListener("mouseup", PieceMoveMethods.dragDrop.mouseup);
            const draggedOverSquare = chessBoard.querySelector(".under-dragged-piece");
            if (draggedOverSquare) draggedOverSquare.classList.remove("under-dragged-piece", "touch-drag");
            activePiece.style.pointerEvents = "none";
            const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (legalMoves.includes(dropTarget.getAttribute("data-square"))) {
                if (dropTarget.classList.contains("chess-piece")) dropTarget.remove();
                movePiece(dropTarget.getAttribute("data-square"), true);
            } else {
                const file = draggedPieceId[0].charCodeAt(0) - "a".charCodeAt(0);
                const rank = parseInt(draggedPieceId[1]);
                activePiece.style.top = isBoardFlipped ? `calc(${rank - 1} * var(--board-square-width))` : `calc(${8 - rank} * var(--board-square-width))`;
                activePiece.style.left = isBoardFlipped ? `calc(${7 - file} * var(--board-square-width))` : `calc(${file} * var(--board-square-width))`;
            }
            activePiece.style.pointerEvents = "";
            activePiece.style.cursor = "grab";
            activePiece.classList.remove("dragged");
            activePiece = null;
            legalMoves = [];
            removeLegalMoveIndicators();
            draggedPieceId = "";
        },
        touchstart: (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const touchEvent = {
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.dragDrop.mousedown(touchEvent);
            const squareUnderPiece = chessBoard.querySelector(".under-dragged-piece");
            if (squareUnderPiece) squareUnderPiece.classList.add("touch-drag");
            document.addEventListener("touchmove", PieceMoveMethods.dragDrop.touchmove, { passive: false });
            activePiece.addEventListener("touchend", PieceMoveMethods.dragDrop.touchend, { passive: false });
        },
        touchmove: (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const touchEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.dragDrop.mousemove(touchEvent);
            const squareUnderPiece = chessBoard.querySelector(".under-dragged-piece");
            if (squareUnderPiece) squareUnderPiece.classList.add("touch-drag");
        },
        touchend: (event) => {
            event.preventDefault();
            document.removeEventListener("touchmove", PieceMoveMethods.dragDrop.touchmove);
            activePiece.removeEventListener("touchend", PieceMoveMethods.dragDrop.touchend);
            const touch = event.changedTouches[0];
            const touchEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.dragDrop.mouseup(touchEvent);
        },
        remove: function () {
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "";
                piece.removeEventListener("mousedown", this.mousedown);
                piece.removeEventListener("touchstart", this.touchstart);
            });
        },
        add: function () {
            this.remove();
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "grab";
                piece.addEventListener("mousedown", this.mousedown);
                piece.addEventListener("touchstart", this.touchstart, { passive: false });
            });
        },
    },
    clickDragDrop: {
        mousemove: (event) => {
            activePiece.style.top = event.clientY + "px";
            activePiece.style.left = event.clientX + "px";
            activePiece.style.pointerEvents = "none";
            highlightSquareUnderPoint(event.clientX, event.clientY, document.querySelector(".under-dragged-piece"));
            activePiece.style.pointerEvents = "";
        },
        mousedown: (event) => {
            if (activePiece !== event.target) {
                hideLegal = true;
                selectPiece(event.target, true);
            }
            if (!activePiece) return;
            draggedPieceId = activePiece.getAttribute("data-square");
            activePiece.classList.add("dragged");
            PieceMoveMethods.clickDragDrop.mousemove(event);
            document.addEventListener("mousemove", PieceMoveMethods.clickDragDrop.mousemove);
            activePiece.addEventListener("mouseup", PieceMoveMethods.clickDragDrop.mouseup);
        },
        mouseup: (event) => {
            document.removeEventListener("mousemove", PieceMoveMethods.clickDragDrop.mousemove);
            activePiece.removeEventListener("mouseup", PieceMoveMethods.clickDragDrop.mouseup);
            const draggedOverSquare = chessBoard.querySelector(".under-dragged-piece");
            if (draggedOverSquare) draggedOverSquare.classList.remove("under-dragged-piece", "touch-drag");
            activePiece.style.pointerEvents = "none";
            const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (legalMoves.includes(dropTarget.getAttribute("data-square"))) {
                if (dropTarget.classList.contains("chess-piece")) dropTarget.remove();
                movePiece(dropTarget.getAttribute("data-square"), true);
                removeLegalMoveIndicators();
                hideLegal = false;
            } else {
                const file = draggedPieceId[0].charCodeAt(0) - "a".charCodeAt(0);
                const rank = parseInt(draggedPieceId[1]);
                activePiece.style.top = isBoardFlipped ? `calc(${rank - 1} * var(--board-square-width))` : `calc(${8 - rank} * var(--board-square-width))`;
                activePiece.style.left = isBoardFlipped ? `calc(${7 - file} * var(--board-square-width))` : `calc(${file} * var(--board-square-width))`;
            }
            activePiece.style.pointerEvents = "";
            activePiece.style.cursor = "grab";
            activePiece.classList.remove("dragged");
            hideLegal = !hideLegal;
            if (hideLegal) {
                activePiece = null;
                legalMoves = [];
                removeLegalMoveIndicators();
            }
            draggedPieceId = "";
        },
        touchstart: (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const touchEvent = {
                target: event.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.clickDragDrop.mousedown(touchEvent);
            const squareUnderPiece = chessBoard.querySelector(".under-dragged-piece");
            if (squareUnderPiece) squareUnderPiece.classList.add("touch-drag");
            document.addEventListener("touchmove", PieceMoveMethods.clickDragDrop.touchmove, { passive: false });
            activePiece.addEventListener("touchend", PieceMoveMethods.clickDragDrop.touchend, { passive: false });
        },
        touchmove: (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const touchEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.clickDragDrop.mousemove(touchEvent);
            const squareUnderPiece = chessBoard.querySelector(".under-dragged-piece");
            if (squareUnderPiece) squareUnderPiece.classList.add("touch-drag");
        },
        touchend: (event) => {
            event.preventDefault();
            document.removeEventListener("touchmove", PieceMoveMethods.clickDragDrop.touchmove);
            activePiece.removeEventListener("touchend", PieceMoveMethods.clickDragDrop.touchend);
            const touch = event.changedTouches[0];
            const touchEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
            };
            PieceMoveMethods.clickDragDrop.mouseup(touchEvent);
        },
        square: (event) => {
            if (activePiece && legalMoves.includes(event.target.getAttribute("data-square"))) movePiece(event.target.getAttribute("data-square"));
        },
        document: (event) => {
            if (!event.target.classList.contains("chess-piece")) {
                removeLegalMoveIndicators();
                removeSquareHighlight();
                activePiece = null;
                hideLegal = true;
            }
        },
        remove: function () {
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "";
                piece.removeEventListener("mousedown", this.mousedown);
                piece.removeEventListener("touchstart", this.touchstart);
            });
            chessBoard.querySelectorAll(".board-square").forEach(square => {
                square.removeEventListener("click", this.square);
            });
            document.removeEventListener("click", this.document);
        },
        add: function () {
            this.remove();
            pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "grab";
                piece.addEventListener("mousedown", this.mousedown);
                piece.addEventListener("touchstart", this.touchstart, { passive: false });
            });
            chessBoard.querySelectorAll(".board-square").forEach(square => {
                square.addEventListener("click", this.square);
            });
            document.addEventListener("click", this.document);
        },
    },
};
const convertSquareToIndex = (square) => 8 * (8 - square[1]) + square.charCodeAt(0) - "a".charCodeAt(0);
const setUpEmptyBoard = () => {
    const newChessBoard = document.createElement("div");
    let isLightSquare;
    for (let rank = 8; rank > 0; rank--) {
        isLightSquare = rank % 2 > 0;
        for (let file = 0; file < 8; file++) {
            isLightSquare = !isLightSquare;
            const square = document.createElement("div");
            square.className = "board-square";
            if (isLightSquare) square.classList.add("light-board-square");
            square.setAttribute("data-square", `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`);
            square.style.gridRow = `${9 - rank} / ${10 - rank}`;
            square.style.gridColumn = `${file + 1} / ${file + 2}`;
            square.addEventListener("mouseenter", () => mouseEntersSquare(square));
            square.addEventListener("mouseleave", () => mouseLeavesSquare(square));
            newChessBoard.appendChild(square);
        }
    }
    const fileList = document.createElement("div");
    fileList.className = "file-indicator";
    fileList.style.right = "calc(var(--board-square-width) / 20)";
    for (let file = 0; file < 8; file++) {
        isLightSquare = !isLightSquare;
        const fileName = document.createElement("div");
        fileName.innerText = String.fromCharCode("a".charCodeAt(0) + file);
        fileName.style.textAlign = "right";
        if (!isLightSquare) fileName.classList.add("light-text-color");
        fileList.appendChild(fileName);
    }
    newChessBoard.appendChild(fileList);
    const rankList = document.createElement("div");
    rankList.className = "rank-indicator";
    rankList.style.left = "2px";
    for (let rank = 1; rank < 9; rank++) {
        isLightSquare = !isLightSquare;
        const rankName = document.createElement("div");
        rankName.innerText = 9 - rank;
        if (isLightSquare) rankName.classList.add("light-text-color");
        rankList.appendChild(rankName);
    }
    newChessBoard.appendChild(rankList);
    newChessBoard.className = "chess-board";
    boardContainer.appendChild(newChessBoard);
    chessBoard = boardContainer.querySelector(".chess-board");
};
const setUpPieces = () => {
    const newPieceArea = document.createElement("div");
    let squareNumber = 0;
    for (let rank = 8; rank > 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                piece.className = `chess-piece ${pieceAtSquare}`;
                piece.setAttribute("data-square", `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`);
                piece.style.top = `calc(${8 - rank} * var(--board-square-width))`;
                piece.style.left = `calc(${file} * var(--board-square-width))`;
                piece.style.transition = "opacity 0.3s ease-out";
                piece.addEventListener("mouseenter", () => mouseEntersPiece(piece.getAttribute("data-square")));
                piece.addEventListener("mouseleave", () => mouseLeavesPiece(piece.getAttribute("data-square")));
                newPieceArea.appendChild(piece);
            }
            squareNumber++;
        }
    }
    newPieceArea.className = "piece-area";
    chessBoard.appendChild(newPieceArea);
    pieceArea = chessBoard.querySelector(".piece-area");
    PieceMoveMethods.clickDragDrop.add();
};
const getCandidateMoves = (pieceSquare, board) => {
    let candidateMoves = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const pieceFile = pieceSquare[0];
    const pieceRank = parseInt(pieceSquare[1]);
    const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
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
                f = String.fromCharCode(f.charCodeAt(0) + fileStep);
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
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                if (isValidMove(f, r)) candidateMoves.push(`${f}${r}`);
            });
            break;
        case "n":
            [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
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
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                let captureSquare = `${f}${r}`;
                if (isValidMove(f, r) && board[convertSquareToIndex(captureSquare)]) candidateMoves.push(captureSquare);
            });
            if (enPassantSquare && Math.abs(pieceFile.charCodeAt(0) - enPassantSquare[0].charCodeAt(0)) === 1 && pieceRank + forward === parseInt(enPassantSquare[1])) {
                candidateMoves.push(enPassantSquare);
            }
            break;
    }
    return candidateMoves;
};
const isSquareAttacked = (board, square, attackerColor) => {
    for (let i = 0; i < board.length; i++) {
        const attacker = board[i];
        if (!attacker) continue;
        const isWhite = attacker === attacker.toUpperCase();
        if ((attackerColor === "w" && isWhite) ||
            (attackerColor === "b" && !isWhite)) {
            const file = String.fromCharCode("a".charCodeAt(0) + (i % 8));
            const rank = 8 - Math.floor(i / 8);
            const attackerSquare = `${file}${rank}`;
            const moves = getCandidateMoves(attackerSquare, board);
            if (moves.includes(square)) {
                return true;
            }
        }
    }
    return false;
};
const isKingInCheck = (board, kingColor) => {
    const kingPiece = kingColor === "w" ? "K" : "k";
    let kingSquare = "";
    for (let i = 0; i < board.length; i++) {
        if (board[i] === kingPiece) {
            const file = String.fromCharCode("a".charCodeAt(0) + (i % 8));
            const rank = 8 - Math.floor(i / 8);
            kingSquare = `${file}${rank}`;
            break;
        }
    }
    if (kingSquare === "") return false;
    return isSquareAttacked(board, kingSquare, kingColor === "w" ? "b" : "w");
};
const getLegalMoves = (pieceSquare, board = piecePositions) => {
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
const isCheckmate = (activeColor, board = piecePositions) => {
    if (!isKingInCheck(board, activeColor)) return false;
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if (activeColor === "w" === isWhite) {
            const file = String.fromCharCode("a".charCodeAt(0) + (i % 8));
            const rank = 8 - Math.floor(i / 8);
            const pieceSquare = `${file}${rank}`;
            const legalMoves = getLegalMoves(pieceSquare, board);
            if (legalMoves.length > 0) return false;
        }
    }
    return true;
};
const isStalemate = (activeColor, board = piecePositions) => {
    if (isKingInCheck(board, activeColor)) return false;
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if ((activeColor === "w" && isWhite) || (activeColor === "b" && !isWhite)) {
            const file = String.fromCharCode("a".charCodeAt(0) + (i % 8));
            const rank = 8 - Math.floor(i / 8);
            const pieceSquare = `${file}${rank}`;

            const legalMoves = getLegalMoves(pieceSquare, board);
            if (legalMoves.length > 0) return false;
        }
    }
    return true;
};
const removeLegalMoveIndicators = () => {
    chessBoard.querySelectorAll(".move-indicator").forEach(indicator => {
        indicator.style.animation = "fade-out 0.25s var(--emphasis-animation)";
        setTimeout(() => indicator.remove(), 200);
    });
};
const selectPiece = (piece, dragged = false) => {
    // Create ripple effect if the piece is not being dragged
    if (!dragged) {
        const ripple = document.createElement("div");
        ripple.className = "ripple";
        chessBoard.querySelector(`.board-square[data-square="${piece.getAttribute("data-square")}"]`).appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }

    // Highlight the selected square
    highlightSquare(piece.getAttribute("data-square"));

    // Remove all previous legal move indicators
    removeLegalMoveIndicators();

    // Handle piece captures
    if (activePiece && legalMoves.includes(piece.getAttribute("data-square"))) {
        piece.style.opacity = "0";
        setTimeout(() => piece.remove(), 300);
        movePiece(piece.getAttribute("data-square"));
        halfmoveClock = 0;
        activePiece = null;
        return;
    }

    // If the piece to be selected is already selected, deselect it
    if (piece === activePiece) {
        activePiece = null;
        return;
    }

    // Select the piece and highlight legal moves
    activePiece = piece;
    legalMoves = getLegalMoves(piece.getAttribute("data-square"));
    legalMoves.forEach(square => {
        const moveIndicator = document.createElement("div");
        moveIndicator.className = "move-indicator";
        if (piecePositions[convertSquareToIndex(square)] || (square === enPassantSquare && piecePositions[convertSquareToIndex(piece.getAttribute("data-square"))].toLowerCase() === "p")) {
            moveIndicator.classList.add("capture-indicator");
        } else {
            moveIndicator.classList.add("empty-move-indicator");
        }
        chessBoard.querySelector(`.board-square[data-square="${square}"]`).appendChild(moveIndicator);
    });
};
const showPromotionDialog = (targetSquare) => {
    return new Promise(resolve => {
        const pieceToPromote = activePiece;
        const promotionBox = document.createElement("div");
        const promotionChoices = activeColor === "w" ? ["Q", "N", "R", "B"] : ["q", "n", "r", "b"];
        if (activeColor === "w" === isBoardFlipped) promotionChoices.reverse();
        promotionBox.className = "promotion-box";
        if (isBoardFlipped) {
            promotionBox.style.top = `calc(${parseInt(targetSquare[1]) - (activeColor === "w" ? 4 : 1)}*var(--board-square-width) - 2px)`;
            promotionBox.style.left = `calc(${"h".charCodeAt(0) - targetSquare[0].charCodeAt(0)}*var(--board-square-width) - 2px)`;
        } else {
            promotionBox.style.top = `calc(${(activeColor === "w" ? 8 : 5) - parseInt(targetSquare[1])}*var(--board-square-width) - 2px)`;
            promotionBox.style.left = `calc(${targetSquare[0].charCodeAt(0) - "a".charCodeAt(0)}*var(--board-square-width) - 2px)`;
        }
        promotionBox.innerHTML = `
            <button class="chess-piece ${promotionChoices[0]}" value="${promotionChoices[0]}"></button>
            <button class="chess-piece ${promotionChoices[1]}" value="${promotionChoices[1]}" style="top: var(--board-square-width);"></button>
            <button class="chess-piece ${promotionChoices[2]}" value="${promotionChoices[2]}" style="top: calc(2 * var(--board-square-width));"></button>
            <button class="chess-piece ${promotionChoices[3]}" value="${promotionChoices[3]}" style="top: calc(3 * var(--board-square-width));"></button>
        `;
        chessBoard.querySelector(".piece-area").appendChild(promotionBox);
        promotionBox.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", function () {
                const selectedPiece = this.value;
                promotionBox.remove();
                resolve([pieceToPromote, selectedPiece]);
            });
        });
    });
}
async function movePiece(targetSquare, dropped = false) {
    // Basic variables
    const toFile = targetSquare[0].charCodeAt(0) - "a".charCodeAt(0);
    const toRank = parseInt(targetSquare[1]);
    const pieceType = piecePositions[convertSquareToIndex(activePiece.getAttribute("data-square"))];
    const previousRank = parseInt(activePiece.getAttribute("data-square")[1]);

    // Change the position of piece
    const activePieceStyle = activePiece.style;
    if (!dropped) {
        activePieceStyle.outline = "none";
        activePieceStyle.transition = `top 0.3s ${pieceMoveAnimation}, left 0.3s ${pieceMoveAnimation}, opacity 0.3s ease-out`;
    }
    activePieceStyle.top = `calc(${isBoardFlipped ? toRank - 1 : 8 - toRank} * var(--board-square-width))`;
    activePieceStyle.left = `calc(${isBoardFlipped ? 7 - toFile : toFile} * var(--board-square-width))`;
    if (!dropped) setTimeout(() => {
        activePieceStyle.outline = "";
        activePieceStyle.transition = "opacity 0.3s ease-out";
    }, 300);

    // Handle pawn promotion
    let promotedTo = "";
    if (pieceType.toLowerCase() === "p") {
        if (pieceType.toLowerCase() === "p" && toRank === (pieceType === "p" ? 1 : 8)) {
            promotedTo = await showPromotionDialog(targetSquare);
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
        const enemyPawnSquare = `${String.fromCharCode("a".charCodeAt(0) + toFile)}${previousRank}`;
        const enemyPawn = pieceArea.querySelector(`.chess-piece[data-square="${enemyPawnSquare}"]`);
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = "";
        enemyPawn.style.opacity = "0";
        setTimeout(() => enemyPawn.remove(), 300);
    }

    // Set new en passant square
    let prevEnPassantSquare = enPassantSquare;
    if (pieceType.toLowerCase() === "p" && Math.abs(toRank - previousRank) === 2) {
        enPassantSquare = pieceType === "P" ? `${String.fromCharCode("a".charCodeAt(0) + toFile)}3` : `${String.fromCharCode("a".charCodeAt(0) + toFile)}6`;
    } else enPassantSquare = "";

    // Get move notation
    const moveNotation = Notation.write.san(activePiece.getAttribute("data-square"), targetSquare, promotedTo, prevEnPassantSquare);

    // Update `piecePositions` and highlight move squares
    piecePositions[convertSquareToIndex(activePiece.getAttribute("data-square"))] = "";
    removeSquareHighlight(true);
    highlightSquare(activePiece.getAttribute("data-square"), true);
    highlightSquare(targetSquare, true);
    activePiece.setAttribute("data-square", targetSquare);
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
            document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;wins by checkmate!`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">1–0</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else if (isStalemate(activeColor)) {
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
            document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;wins by checkmate!`;
            const newResultRow = document.createElement("div");
            newResultRow.innerHTML = `<div class="info">0–1</div>`;
            document.getElementById("move-grid").appendChild(newResultRow);
        } else if (isStalemate(activeColor)) {
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
}
const removeSquareHighlight = (permanent = false, square = "") => {
    if (square === "") {
        chessBoard.querySelectorAll(`.square-highlight${permanent ? "" : ":not(.permanent)"}`).forEach(highlight => highlight.remove());
        return;
    }
    const highlight = chessBoard.querySelector(`.board-square[data-square="${square}"]`).querySelector(".square-highlight:not(.permanent)");
    if (highlight) highlight.remove();
};
const highlightSquare = (square = "", permanent = false, color = "yellow") => {
    const highlight = document.createElement("div");
    highlight.className = "square-highlight";
    if (color === "yellow") {
        removeSquareHighlight();
    } else {
        highlight.classList.add(color);
    }
    if (permanent === true) highlight.classList.add("permanent");
    chessBoard.querySelector(`.board-square[data-square="${square}"]`).appendChild(highlight);
};
const mouseEntersSquare = (squareElement) => {
    const moveIndicator = squareElement.querySelector(".move-indicator");
    if (moveIndicator) moveIndicator.classList.add("hovered");
};
const mouseLeavesSquare = (squareElement) => {
    const moveIndicator = squareElement.querySelector(".move-indicator");
    if (moveIndicator) moveIndicator.classList.remove("hovered");
};
const mouseEntersPiece = (square) => {
    const captureIndicator = chessBoard.querySelector(`.board-square[data-square="${square}"]`).querySelector(".capture-indicator");
    if (captureIndicator) captureIndicator.classList.add("hovered");
};
const mouseLeavesPiece = (square) => {
    const captureIndicator = chessBoard.querySelector(`.board-square[data-square="${square}"]`).querySelector(".capture-indicator");
    if (captureIndicator) captureIndicator.classList.remove("hovered");
};
const checkFenValidity = (fen) => {
    const parsedFen = Notation.read.fen(fen.trim());
    if (parsedFen) {
        positionInputBox.style.border = "";
        return parsedFen;
    }
    positionInputBox.style.border = "2px solid var(--danger-color)";
    return false;
};
const flipBoard = () => {
    isBoardFlipped = !isBoardFlipped;
    document.getElementById("flipSvg").style.transform = `rotate(${isBoardFlipped ? "" : "-"}90deg)`;
    document.getElementById("game-area").querySelector(".white-player").style.gridRow = isBoardFlipped ? "1 / 2" : "";
    document.getElementById("game-area").querySelector(".black-player").style.gridRow = isBoardFlipped ? "3 / 4" : "";
    chessBoard.querySelectorAll(".board-square").forEach(square => {
        const file = square.getAttribute("data-square")[0].charCodeAt(0) - "a".charCodeAt(0);
        const rank = parseInt(square.getAttribute("data-square")[1]);
        square.style.gridRow = isBoardFlipped ? `${rank} / ${rank + 1}` : `${9 - rank} / ${10 - rank}`;
        square.style.gridColumn = isBoardFlipped ? `${8 - file} / ${9 - file}` : `${file + 1} / ${file + 2}`;
    });
    const fileIndicator = chessBoard.querySelector(".file-indicator");
    fileIndicator.style.flexDirection = isBoardFlipped ? "row-reverse" : "";
    fileIndicator.querySelectorAll("div").forEach(fileIndicator => {
        if (fileIndicator.classList.contains("light-text-color")) {
            fileIndicator.classList.remove("light-text-color");
        } else {
            fileIndicator.classList.add("light-text-color");
        }
    });
    const rankIndicator = chessBoard.querySelector(".rank-indicator");
    rankIndicator.style.flexDirection = isBoardFlipped ? "column-reverse" : "";
    rankIndicator.querySelectorAll("div").forEach(rankIndicator => {
        if (rankIndicator.classList.contains("light-text-color")) {
            rankIndicator.classList.remove("light-text-color");
        } else {
            rankIndicator.classList.add("light-text-color");
        }
    });
    pieceArea.querySelectorAll(".chess-piece").forEach(piece => {
        const file = piece.getAttribute("data-square")[0].charCodeAt(0) - "a".charCodeAt(0);
        const rank = parseInt(piece.getAttribute("data-square")[1]);
        piece.style.top = isBoardFlipped ? `calc(${rank - 1} * var(--board-square-width))` : `calc(${8 - rank} * var(--board-square-width))`;
        piece.style.left = isBoardFlipped ? `calc(${7 - file} * var(--board-square-width))` : `calc(${file} * var(--board-square-width))`;
    });
    pieceArea.querySelector("[data-square='h1']").style.borderRadius = isBoardFlipped ? "var(--box-radius) 0 0 0" : "";
    pieceArea.querySelector("[data-square='a1']").style.borderRadius = isBoardFlipped ? "0 var(--box-radius) 0 0" : "";
    pieceArea.querySelector("[data-square='a8']").style.borderRadius = isBoardFlipped ? "0 0 var(--box-radius) 0" : "";
    pieceArea.querySelector("[data-square='h8']").style.borderRadius = isBoardFlipped ? "0 0 0 var(--box-radius)" : "";
};

let isBoardFlipped = false;
let piecePositions = [];
let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
let activePiece = null, legalMoves = [];
let pieceMoveAnimation = "ease-in-out";
let boardContainer = document.querySelector(".board-container.one");
let chessBoard, pieceArea;
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
    startingPositionRow.innerHTML = `<div class="info">Starting position</div>`;
} else {
    startingPositionRow.innerHTML = `<div class="info">Custom position</div>`;
}
document.getElementById("move-grid").appendChild(startingPositionRow);
setUpEmptyBoard();
setUpPieces();
if (isBoardFlipped) {
    isBoardFlipped = !isBoardFlipped;
    flipBoard();
}
if (activeColor === "b") {
    document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
} else {
    document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;to move`;
}
