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
        san: (fromSquare, toSquare, promotedTo, board = piecePositions) => {
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
            if (isKingInCheck(newBoard, activeColor)) {
                moveNotation += isCheckmate(activeColor, newBoard) ? "#" : "+";
            }
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
const PieceMoveMethods = {
    click: {
        piece: (event) => {
            highlightLegalMoves(event.currentTarget);
        },
        square: (event) => {
            if (activePiece && legalMoves.includes(event.target.id)) movePiece(event.target.id);
        },
        document: (event) => {
            if (!event.target.classList.contains("chess-piece")) {
                document.querySelectorAll(".move-indicator").forEach(indicator => {
                    indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                    setTimeout(() => indicator.remove(), 200);
                });
                highlightSelectedSquare();
                activePiece = null;
            }
        },
        remove: function() {
            document.querySelectorAll(".chess-piece").forEach(piece => {
                piece.removeEventListener("click", this.piece);
            });
            document.querySelectorAll(".board-square").forEach(square => {
                square.removeEventListener("click", this.square);
            });
            document.removeEventListener("click", this.document);
        },
        add: function() {
            this.remove();
            document.querySelectorAll(".chess-piece").forEach(piece => {
                piece.addEventListener("click", this.piece);
            });
            document.querySelectorAll(".board-square").forEach(square => {
                square.addEventListener("click", this.square);
            });
            document.addEventListener("click", this.document);
        },
    },
    dragDrop: {
        piece: {
            dragstart: (event) => {
                draggedPieceId = event.target.id;
                if (document.querySelector(`#${event.target.id}.highlight-square`)) {
                    document.querySelector(`#${event.target.id}.highlight-square`).style.outline = "none";
                }
                document.querySelector(`#${event.target.id}.board-square`).style.outline = "none";
                if (document.querySelector(`#${event.target.id}.file-name`)) {
                    document.querySelector(`#${event.target.id}.file-name`).style.opacity = "0";
                }
                if (document.querySelector(`#${event.target.id}.rank-name`)) {
                    document.querySelector(`#${event.target.id}.rank-name`).style.opacity = "0";
                }
                activePiece = null;
                highlightSelectedSquare();
                highlightLegalMoves(event.target, true);
                event.dataTransfer.effectAllowed = "move";
                event.target.style.transition = "";
                event.target.style.transform = "scale(1.2)";
                setTimeout(() => {
                    event.target.style.opacity = "0.5";
                    event.target.style.transform = "";
                    if (document.querySelector(`#${draggedPieceId}.file-name`)) {
                        document.querySelector(`#${draggedPieceId}.file-name`).style.opacity = "";
                    }
                    if (document.querySelector(`#${draggedPieceId}.rank-name`)) {
                        document.querySelector(`#${draggedPieceId}.rank-name`).style.opacity = "";
                    }
                }, 0);
            },
            dragend: (event) => {
                if (draggedPieceId !== event.target.id) {
                    const ripple = document.createElement("div");
                    ripple.className = "ripple";
                    document.querySelector(`#${event.target.id}.board-square`).appendChild(ripple);
                    setTimeout(() => ripple.remove(), 500);
                }
                highlightSelectedSquare(event.target.id);
                document.querySelectorAll(".move-indicator").forEach(indicator => {
                    indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                    setTimeout(() => indicator.remove(), 200);
                });
                draggedPieceId = "";
                activePiece = null;
                legalMoves = [];
                event.target.style.opacity = "";
                event.target.style.transition = "opacity 0.3s ease-out";
            },
            dragover: (event) => {
                event.preventDefault();
            },
            dragenter: (event) => {
                const square = document.querySelector(`#${event.target.id}.board-square`);
                if (document.querySelector(`#${square.id}.highlight-square`)) {
                    document.querySelector(`#${square.id}.highlight-square`).style.outline = "calc(var(--board-square-width) / 25) solid white";
                } else {
                    square.style.outline = "calc(var(--board-square-width) / 25) solid white";
                }
                square.style.zIndex = "2";
                square.style.boxShadow = "0 0 calc(var(--board-square-width) * 3/50) calc(var(--board-square-width) / 100) rgba(0, 0, 0, 0.6)";
                if (document.querySelector(`#${square.id}.capture-indicator`)) {
                    const moveIndicator = document.querySelector(`#${square.id}.capture-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "70%";
                    moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-color)";
                }
            },
            dragleave: (event) => {
                const square = document.querySelector(`#${event.target.id}.board-square`);
                if (document.querySelector(`#${square.id}.highlight-square`)) {
                    document.querySelector(`#${square.id}.highlight-square`).style.outline = "";
                }
                square.style.outline = "";
                square.style.zIndex = "";
                square.style.boxShadow = "";
                if (document.querySelector(`#${square.id}.capture-indicator`)) {
                    const moveIndicator = document.querySelector(`#${square.id}.capture-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "";
                    moveIndicator.boxShadow = "";
                }
            },
            drop: (event) => {
                event.preventDefault();
                const square = document.querySelector(`#${event.target.id}.board-square`);
                if (document.querySelector(`#${square.id}.highlight-square`)) {
                    document.querySelector(`#${square.id}.highlight-square`).style.outline = "";
                }
                square.style.outline = "";
                square.style.zIndex = "";
                square.style.boxShadow = "";
                if (legalMoves.includes(square.id)) {
                    event.target.style.opacity = "0";
                    setTimeout(() => event.target.remove(), 300);
                    movePiece(square.id, true);
                    halfmoveClock = 0;
                }
            },
        },
        square: {
            dragover: (event) => {
                event.preventDefault();
            },
            dragenter: (event) => {
                event.target.style.outline = "calc(var(--board-square-width) / 25) solid white";
                event.target.style.zIndex = "2";
                event.target.style.boxShadow = "0 0 calc(var(--board-square-width) * 3/50) calc(var(--board-square-width) / 100) rgba(0, 0, 0, 0.6)";
                if (document.querySelector(`#${event.target.id}.empty-move-indicator`)) {
                    const moveIndicator = document.querySelector(`#${event.target.id}.empty-move-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "50%";
                } else if (document.querySelector(`#${event.target.id}.capture-indicator`)) {
                    const moveIndicator = document.querySelector(`#${event.target.id}.capture-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "70%";
                    moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-color)";
                }
            },
            dragleave: (event) => {
                event.target.style.outline = "";
                event.target.style.zIndex = "";
                event.target.style.boxShadow = "";
                if (document.querySelector(`#${event.target.id}.empty-move-indicator`)) {
                    const moveIndicator = document.querySelector(`#${event.target.id}.empty-move-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "";
                } else if (document.querySelector(`#${event.target.id}.capture-indicator`)) {
                    const moveIndicator = document.querySelector(`#${event.target.id}.capture-indicator`).style;
                    moveIndicator.width = moveIndicator.height = "";
                    moveIndicator.boxShadow = "";
                }
            },
            drop: (event) => {
                event.preventDefault();
                event.target.style.outline = "";
                event.target.style.zIndex = "";
                event.target.style.boxShadow = "";
                if (legalMoves.includes(event.target.id)) movePiece(event.target.id, true);
            },
        },
        document: {
            dragover: (event) => {
                event.preventDefault();
            },
            drop: (event) => {
                event.preventDefault();
                if (!event.target.classList.contains("board-square")) {
                    document.querySelectorAll(".move-indicator").forEach(indicator => {
                        indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                        setTimeout(() => indicator.remove(), 200);
                    });
                }
            }
        },
        remove: function() {
            document.querySelectorAll(".chess-piece").forEach(piece => {
                piece.draggable = false;
                piece.removeEventListener("dragstart", this.piece.dragstart);
                piece.removeEventListener("dragend", this.piece.dragend);
                piece.removeEventListener("dragover", this.piece.dragover);
                piece.removeEventListener("dragenter", this.piece.dragenter);
                piece.removeEventListener("dragleave", this.piece.dragleave);
                piece.removeEventListener("drop", this.piece.drop);
            });
            document.querySelectorAll(".board-square").forEach(square => {
                square.removeEventListener("dragover", this.square.dragover);
                square.removeEventListener("dragenter", this.square.dragenter);
                square.removeEventListener("dragleave", this.square.dragleave);
                square.removeEventListener("drop", this.square.drop);
            });
            document.removeEventListener("dragover", this.document.dragover);
            document.removeEventListener("drop", this.document.drop);
        },
        add: function() {
            this.remove();
            document.querySelectorAll(".chess-piece").forEach(piece => {
                piece.draggable = true;
                piece.addEventListener("dragstart", this.piece.dragstart);
                piece.addEventListener("dragend", this.piece.dragend);
                piece.addEventListener("dragover", this.piece.dragover);
                piece.addEventListener("dragenter", this.piece.dragenter);
                piece.addEventListener("dragleave", this.piece.dragleave);
                piece.addEventListener("drop", this.piece.drop);
            });
            document.querySelectorAll(".board-square").forEach(square => {
                square.addEventListener("dragover", this.square.dragover);
                square.addEventListener("dragenter", this.square.dragenter);
                square.addEventListener("dragleave", this.square.dragleave);
                square.addEventListener("drop", this.square.drop);
            });
            document.addEventListener("dragover", this.document.dragover);
            document.addEventListener("drop", this.document.drop);
        },
    },
};
const convertSquareToIndex = (square) => 8 * (8 - square[1]) + square.charCodeAt(0) - "a".charCodeAt(0);
function setUpEmptyBoard() {
    const chessBoard = document.createElement("div");
    let isLightSquare;
    for (let rank = 8; rank > 0; rank--) {
        isLightSquare = rank%2 > 0;
        for (let file = 0; file < 8; file++) {
            isLightSquare = !isLightSquare;
            const square = document.createElement("div");
            square.className = "board-square";
            if (isLightSquare) square.classList.add("light-board-square");
            square.id = `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`;
            square.style.gridRow = `${9 - rank} / ${10 - rank}`;
            square.style.gridColumn = `${file + 1} / ${file + 2}`;
            chessBoard.appendChild(square);
        }
    }
    const fileList = document.createElement("div");
    fileList.id = "file-indicator";
    fileList.style.right = "calc(var(--board-square-width) / 20)";
    for (let file = 0; file < 8; file++) {
        isLightSquare = !isLightSquare;
        const fileName = document.createElement("div");
        fileName.className = "file-name";
        fileName.innerText = String.fromCharCode("a".charCodeAt(0) + file);
        fileName.id = fileName.innerText + "1";
        fileName.style.textAlign = "right";
        if (!isLightSquare) fileName.classList.add("light-text-color");
        fileList.appendChild(fileName);
    }
    chessBoard.appendChild(fileList);
    const rankList = document.createElement("div");
    rankList.id = "rank-indicator";
    rankList.style.left = "2px";
    for (let rank = 1; rank < 9; rank++) {
        isLightSquare = !isLightSquare;
        const rankName = document.createElement("div");
        rankName.className = "rank-name";
        rankName.innerText = 9 - rank;
        rankName.id = "a" + rankName.innerText;
        if (isLightSquare) rankName.classList.add("light-text-color");
        rankList.appendChild(rankName);
    }
    chessBoard.appendChild(rankList);
    document.getElementById("chess-board").remove();
    chessBoard.id = "chess-board";
    document.getElementById("game-area").appendChild(chessBoard);
}
function setUpPieces() {
    const chessBoard = document.getElementById("chess-board");
    const pieceArea = document.createElement("div");
    let squareNumber = 0;
    for (let rank = 8; rank > 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const pieceAtSquare = piecePositions[squareNumber];
            if (pieceAtSquare) {
                const piece = document.createElement("div");
                piece.className = `chess-piece ${pieceAtSquare}`;
                piece.id = `${String.fromCharCode("a".charCodeAt(0) + file)}${rank}`;
                piece.style.top = `calc(${8 - rank} * var(--board-square-width))`;
                piece.style.left = `calc(${file} * var(--board-square-width))`;
                piece.style.transition = "opacity 0.3s ease-out";
                piece.addEventListener("mouseenter", () => mouseEntersPiece(piece.id));
                piece.addEventListener("mouseleave", () => mouseLeavesPiece(piece.id));
                pieceArea.appendChild(piece);
            }
            squareNumber++;
        }
    }
    if (document.getElementById("piece-area")) document.getElementById("piece-area").remove();
    pieceArea.id = "piece-area";
    chessBoard.appendChild(pieceArea);
    PieceMoveMethods.click.add();
    PieceMoveMethods.dragDrop.add();
}
function getCandidateMoves(pieceSquare, board) {
    let candidateMoves = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const pieceFile = pieceSquare[0];
    const pieceRank = parseInt(pieceSquare[1]);
    const boardFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const boardRanks = [1, 2, 3, 4, 5, 6, 7, 8];
    let friendlyPieces = ["R", "N", "B", "Q", "K", "P"];
    if (!friendlyPieces.includes(piece)) friendlyPieces = ["r", "n", "b", "q", "k", "p"];

    function isValidMove(file, rank) {
        if (boardFiles.includes(file) && boardRanks.includes(rank)) {
            const targetSquare = `${file}${rank}`;
            const targetPiece = board[convertSquareToIndex(targetSquare)];
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
                if (isValidMove(f, r) && board[convertSquareToIndex(captureSquare)])
                    candidateMoves.push(captureSquare);
            });
            if (enPassantSquare &&
                Math.abs(pieceFile.charCodeAt(0) - enPassantSquare[0].charCodeAt(0)) === 1 &&
                pieceRank + forward === parseInt(enPassantSquare[1])) {
                candidateMoves.push(enPassantSquare);
            }
    }
    return candidateMoves;
}
function isSquareAttacked(board, square, attackerColor) {
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
}
function isKingInCheck(board, kingColor) {
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
}
function getLegalMoves(pieceSquare, board = piecePositions) {
    const candidateMoves = getCandidateMoves(pieceSquare, board);
    let legalMovesForPiece = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const movingColor = (piece === piece.toUpperCase()) ? "w" : "b";
    candidateMoves.forEach(move => {
        let newBoard = board.slice();
        newBoard[convertSquareToIndex(move)] = newBoard[convertSquareToIndex(pieceSquare)];
        newBoard[convertSquareToIndex(pieceSquare)] = "";
        if (!isKingInCheck(newBoard, movingColor)) {
            legalMovesForPiece.push(move);
        }
    });
    return legalMovesForPiece;
}
function isCheckmate(activeColor, board = piecePositions) {
    if (!isKingInCheck(board, activeColor)) return false;
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
}
function isStalemate(activeColor, board = piecePositions) {
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
}
function highlightLegalMoves(chessPiece, dragged = false) {
    if (!dragged) {
        const ripple = document.createElement("div");
        ripple.className = "ripple";
        document.querySelector(`#${chessPiece.id}.board-square`).appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
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
    if (chessPiece === activePiece || (activeColor === "w" ? pieceType.toLowerCase() === pieceType : pieceType.toUpperCase() === pieceType)) {
        activePiece = null;
        return;
    }
    activePiece = chessPiece;
    legalMoves = getLegalMoves(chessPiece.id);
    legalMoves.forEach(square => {
        const boardSquare = document.querySelector(`#${square}.board-square`);
        const moveIndicator = document.createElement("div");
        moveIndicator.className = "move-indicator";
        moveIndicator.id = square;
        if (piecePositions[convertSquareToIndex(square)] || (square === enPassantSquare && piecePositions[convertSquareToIndex(activePiece.id)].toLowerCase() === "p")) {
            moveIndicator.classList.add("capture-indicator");
        } else {
            moveIndicator.classList.add("empty-move-indicator");
        }
        boardSquare.appendChild(moveIndicator);
    });
}
function showPromotionDialog(targetSquare) {
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
        document.getElementById("piece-area").appendChild(promotionBox);
        promotionBox.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", function() {
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
    const pieceType = piecePositions[convertSquareToIndex(activePiece.id)];
    const previousRank = parseInt(activePiece.id[1]);

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

    // Get move notation
    const moveNotation = Notation.write.san(activePiece.id, targetSquare, promotedTo);

    // Handle en passant
    if (pieceType.toLowerCase() === "p" && enPassantSquare === targetSquare) {
        const enemyPawnSquare = `${String.fromCharCode("a".charCodeAt(0) + toFile)}${previousRank}`;
        const enemyPawn = document.querySelector(`#${enemyPawnSquare}.chess-piece`);
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = "";
        enemyPawn.style.opacity = "0";
        setTimeout(() => enemyPawn.remove(), 300);
    }

    // Set new en passant square
    if (pieceType.toLowerCase() === "p" && Math.abs(toRank - previousRank) === 2) {
        enPassantSquare = pieceType === "P" ? `${String.fromCharCode("a".charCodeAt(0) + toFile)}3` : `${String.fromCharCode("a".charCodeAt(0) + toFile)}6`;
    } else enPassantSquare = "";

    // Update `piecePositions` and highlight move squares
    piecePositions[convertSquareToIndex(activePiece.id)] = "";
    document.querySelector(`#${activePiece.id}.board-square`).style.outline = "";
    highlightMoveSquares(activePiece.id, targetSquare);
    activePiece.id = targetSquare;
    if (promotedTo) piecePositions[convertSquareToIndex(targetSquare)] = promotedTo;
    else piecePositions[convertSquareToIndex(targetSquare)] = pieceType;

    // Write move notation to `#move-grid` and update the `#to-move` indicator
    if (activeColor === "b") {
        if (moveNotation.includes("#")) {
            document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;wins by checkmate!`;
        } else if (isStalemate(activeColor)) {
            document.getElementById("to-move").innerHTML = `
                <div style="background-color: black;">
                    <div style="background-color: white;"></div>
                </div>
                <b>Draw</b>&nbsp; by stalemate`;
        } else {
            document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
        }
        const newMoveRow = document.createElement("div");
        newMoveRow.innerHTML = `
            <div>${fullmoveNumber}.</div>
            <div>${moveNotation}</div>
            <div>&nbsp;</div>
            `;
        document.getElementById("move-grid").appendChild(newMoveRow);
    } else {
        if (isCheckmate(activeColor)) {
            document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;wins by checkmate!`;
        } else if (isStalemate(activeColor)) {
            document.getElementById("to-move").innerHTML = `
                <div style="background-color: white;">
                    <div style="background-color: black;"></div>
                </div>
                <b>Draw</b>&nbsp; by stalemate`;
        } else {
            document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;to move`;
        }
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
    }

    // Handle halfmove clock
    if (pieceType.toLowerCase() === "p") halfmoveClock = 0;
    else halfmoveClock++; // If a capture takes place, then `highlightLegalMoves()` takes care of it.
}
function highlightSelectedSquare(square = "") {
    if (square && !lastMoveSquares.includes(square)) {
        if (selectedSquare !== "") {
            const highlightSquare = document.querySelector(`#${selectedSquare}.highlight-square`);
            highlightSquare.remove();
            if (document.querySelector(`#${selectedSquare}.file-name`)) {
                document.querySelector(`#${selectedSquare}.file-name`).style.color = "";
            }
            if (document.querySelector(`#${selectedSquare}.rank-name`)) {
                document.querySelector(`#${selectedSquare}.rank-name`).style.color = "";
            }
            if (square === selectedSquare) {
                selectedSquare = "";
                return;
            }
        }
        selectedSquare = square;
        const newHighlightSquare = document.createElement("div");
        newHighlightSquare.id = square;
        newHighlightSquare.className = "highlight-square";
        document.querySelector(`#${square}.board-square`).appendChild(newHighlightSquare);
        if (document.querySelector(`#${square}.file-name`)) {
            const fileIndicator = document.querySelector(`#${square}.file-name`);
            if (fileIndicator.classList.contains("light-text-color")) fileIndicator.style.color = "var(--board-color)";
        }
        if (document.querySelector(`#${square}.rank-name`)) {
            const rankIndicator = document.querySelector(`#${square}.rank-name`);
            if (rankIndicator.classList.contains("light-text-color")) rankIndicator.style.color = "var(--board-color)";
        }
    } else {
        if (selectedSquare !== "") {
            const highlightSquare = document.querySelector(`#${selectedSquare}.highlight-square`);
            highlightSquare.remove();
            if (document.querySelector(`#${selectedSquare}.file-name`)) {
                document.querySelector(`#${selectedSquare}.file-name`).style.color = "";
            }
            if (document.querySelector(`#${selectedSquare}.rank-name`)) {
                document.querySelector(`#${selectedSquare}.rank-name`).style.color = "";
            }
        }
        selectedSquare = "";
    }
}
function highlightMoveSquares(fromSquare, toSquare) {
    highlightSelectedSquare();
    lastMoveSquares.forEach(square => {
        const highlightSquare = document.querySelector(`#${square}.highlight-square`);
        highlightSquare.remove();
        if (document.querySelector(`#${square}.file-name`)) {
            document.querySelector(`#${square}.file-name`).style.color = "";
        }
        if (document.querySelector(`#${square}.rank-name`)) {
            document.querySelector(`#${square}.rank-name`).style.color = "";
        }
    });
    lastMoveSquares = [fromSquare, toSquare];
    lastMoveSquares.forEach(square => {
        const highlightSquare = document.createElement("div");
        highlightSquare.id = square;
        highlightSquare.className = "highlight-square";
        if (document.querySelector(`#${square}.file-name`)) {
            const fileIndicator = document.querySelector(`#${square}.file-name`);
            if (fileIndicator.classList.contains("light-text-color")) fileIndicator.style.color = "var(--board-color)";
        }
        if (document.querySelector(`#${square}.rank-name`)) {
            const rankIndicator = document.querySelector(`#${square}.rank-name`);
            if (rankIndicator.classList.contains("light-text-color")) rankIndicator.style.color = "var(--board-color)";
        }
        document.querySelector(`#${square}.board-square`).appendChild(highlightSquare);
    });
}
function mouseEntersPiece(square) {
    const boardSquare = document.querySelector(`#${square}.board-square`);
    if (document.querySelector(`#${square}.highlight-square`)) {
        document.querySelector(`#${square}.highlight-square`).style.outline = "round(down, calc(var(--board-square-width) / 25), 1px) solid white";
    } else {
        boardSquare.style.outline = "round(down, calc(var(--board-square-width) / 25), 1px) solid white";
    }
    if (document.querySelector(`#${square}.capture-indicator`)) {
        const moveIndicator = document.querySelector(`#${square}.capture-indicator`).style;
        moveIndicator.width = moveIndicator.height = "70%";
        moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-color)";
    }
}
function mouseLeavesPiece(square) {
    const boardSquare = document.querySelector(`#${square}.board-square`);
    if (document.querySelector(`#${square}.highlight-square`)) {
        document.querySelector(`#${square}.highlight-square`).style.outline = "";
    }
    boardSquare.style.outline = "";
    if (document.querySelector(`#${square}.capture-indicator`)) {
        const moveIndicator = document.querySelector(`#${square}.capture-indicator`).style;
        moveIndicator.width = moveIndicator.height = "";
        moveIndicator.boxShadow = "";
    }
}
function checkFenValidity(fen) {
    const parsedFen = Notation.read.fen(fen.trim());
    if (parsedFen) {
        document.getElementById("fen-validity-indicator").innerHTML = `
            <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--color)" opacity="0.6">
                <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>`;
        return parsedFen;
    }
    document.getElementById("fen-validity-indicator").innerHTML = `
        <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--danger-color)">
            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
    return false;
}
function flipBoard() {
    isBoardFlipped = !isBoardFlipped;
    document.getElementById("flipSvg").style.transform = `rotate(${isBoardFlipped ? "" : "-"}90deg)`;
    document.getElementById("white-player").style.gridRow = isBoardFlipped ? "1 / 2" : "";
    document.getElementById("black-player").style.gridRow = isBoardFlipped ? "3 / 4" : "";
    document.querySelectorAll(".board-square").forEach(square => {
        const file = square.id[0].charCodeAt(0) - "a".charCodeAt(0);
        const rank = parseInt(square.id[1]);
        square.style.gridRow = isBoardFlipped ? `${rank} / ${rank + 1}` : `${9 - rank} / ${10 - rank}`;
        square.style.gridColumn = isBoardFlipped ? `${8 - file} / ${9 - file}` : `${file + 1} / ${file + 2}`;
    });
    document.getElementById("file-indicator").style.flexDirection = isBoardFlipped ? "row-reverse" : "";
    document.querySelectorAll(".file-name").forEach(fileIndicator => {
        fileIndicator.id = fileIndicator.id[0] + (isBoardFlipped ? "8" : "1");
        if (fileIndicator.classList.contains("light-text-color")) {
            fileIndicator.classList.remove("light-text-color");
        } else {
            fileIndicator.classList.add("light-text-color");
        }
    });
    document.getElementById("rank-indicator").style.flexDirection = isBoardFlipped ? "column-reverse" : "";
    document.querySelectorAll(".rank-name").forEach(rankIndicator => {
        rankIndicator.id = (isBoardFlipped ? "h" : "a") + rankIndicator.id[1];
        if (rankIndicator.classList.contains("light-text-color")) {
            rankIndicator.classList.remove("light-text-color");
        } else {
            rankIndicator.classList.add("light-text-color");
        }
    });
    document.querySelectorAll(".chess-piece").forEach(piece => {
        const file = piece.id[0].charCodeAt(0) - "a".charCodeAt(0);
        const rank = parseInt(piece.id[1]);
        piece.style.top = isBoardFlipped ? `calc(${rank - 1} * var(--board-square-width))` : `calc(${8 - rank} * var(--board-square-width))`;
        piece.style.left = isBoardFlipped ? `calc(${7 - file} * var(--board-square-width))` : `calc(${file} * var(--board-square-width))`;
    });
}

let isBoardFlipped = false;
let piecePositions = [];
let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
let activePiece = null, legalMoves = [];
let pieceMoveAnimation = "ease-in-out";
let lastMoveSquares = [], selectedSquare = "";
const fenInputBox = document.getElementById("fen-input");
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
    }
}
const parsedFen = checkFenValidity(fenOnBoard);
if (parsedFen) {
    Notation.assign.parsedFen(parsedFen);
    fenInputBox.value = fenOnBoard;
} else {
    alert("The FEN specified by the URL is not valid.\nEnter a valid FEN.");
    fenOnBoard = fenInputBox.value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    Notation.assign.parsedFen(Notation.read.fen(fenOnBoard));
    document.getElementById("fen-validity-indicator").innerHTML = `
        <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--color)" opacity="0.6">
            <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
        </svg>`;
}
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
