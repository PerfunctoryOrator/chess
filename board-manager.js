const Notation = {
    read: {
        san: (san) => {
            // TODO: Implement SAN parsing
            throw new Error("SAN parsing not yet implemented");
        },
        fen: (fen) => {
            if (!fen || typeof fen !== 'string') return false;

            const fenParts = fen.trim().split(/\s+/);
            if (fenParts.length !== 6) return false;

            const [position, activeColor, castlingRights, enPassantSquare, halfmoveClock, fullmoveNumber] = fenParts;

            // Parse piece positions
            const piecePositions = [];
            const ranks = position.split('/');

            if (ranks.length !== 8) return false;

            for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
                const rank = ranks[rankIndex];
                let fileIndex = 0;

                for (let i = 0; i < rank.length; i++) {
                    const char = rank[i];

                    if (char >= '1' && char <= '8') {
                        const emptySquares = parseInt(char);
                        if (fileIndex + emptySquares > 8) return false;
                        for (let j = 0; j < emptySquares; j++) {
                            piecePositions.push("");
                            fileIndex++;
                        }
                    } else if (/[prnbqkPRNBQK]/.test(char)) {
                        if (fileIndex >= 8) return false;
                        piecePositions.push(char);
                        fileIndex++;
                    } else {
                        return false;
                    }
                }

                if (fileIndex !== 8) return false;
            }

            // Validate active color
            if (activeColor !== 'w' && activeColor !== 'b') return false;

            // Validate castling rights
            if (castlingRights !== '-') {
                if (castlingRights.length > 4) return false;
                const validCastlingChars = new Set(['K', 'Q', 'k', 'q']);
                const seenChars = new Set();

                for (const char of castlingRights) {
                    if (!validCastlingChars.has(char) || seenChars.has(char)) return false;
                    seenChars.add(char);
                }
            }

            // Validate en passant square
            let enPassantIndex = "";
            if (enPassantSquare !== '-') {
                if (enPassantSquare.length !== 2) return false;
                const file = enPassantSquare[0];
                const rank = enPassantSquare[1];

                if (file < 'a' || file > 'h') return false;
                if (rank !== '3' && rank !== '6') return false;

                // Convert to internal format
                enPassantIndex = (file.charCodeAt(0) - 'a'.charCodeAt(0) + 1) + rank;
            }

            // Validate halfmove clock
            const halfmoveClockNum = parseInt(halfmoveClock);
            if (isNaN(halfmoveClockNum) || halfmoveClockNum < 0 || halfmoveClockNum > 50) return false;

            // Validate fullmove number
            const fullmoveNum = parseInt(fullmoveNumber);
            if (isNaN(fullmoveNum) || fullmoveNum < 1) return false;

            // Validate kings
            const whiteKings = piecePositions.filter(p => p === 'K').length;
            const blackKings = piecePositions.filter(p => p === 'k').length;
            if (whiteKings !== 1 || blackKings !== 1) return false;

            // Validate that the side not to move is not in check
            const opponentColor = activeColor === 'w' ? 'b' : 'w';
            if (isKingInCheck(piecePositions, opponentColor)) return false;

            // Validate pawn positions (no pawns on 1st or 8th rank)
            for (let i = 0; i < 8; i++) {
                if (piecePositions[i].toLowerCase() === 'p') return false; // 8th rank
                if (piecePositions[i + 56].toLowerCase() === 'p') return false; // 1st rank
            }

            return [
                piecePositions,
                activeColor,
                castlingRights,
                enPassantIndex,
                halfmoveClockNum,
                fullmoveNum,
            ];
        },
        pgn: (pgn) => {
            // TODO: Implement PGN parsing
            throw new Error("PGN parsing not yet implemented");
        },
    },
    write: {
        san: (fromSquare, toSquare, promotedTo, enPassantSquare, board = piecePositions) => {
            try {
                const pieceType = board[convertSquareToIndex(fromSquare)];
                const pieceIsPawn = pieceType.toLowerCase() === "p";
                const targetSquare = board[convertSquareToIndex(toSquare)];
                const isCapture = targetSquare !== "" || (toSquare === enPassantSquare && pieceIsPawn);

                // Castling detection
                let isCastling = false;
                let castlingNotation = "";
                if (pieceType.toLowerCase() === "k") {
                    const isWhite = pieceType === "K";
                    const backRank = isWhite ? 1 : 8;
                    const fromRank = parseInt(fromSquare[1]);
                    if (fromRank === backRank) {
                        if (toSquare === `7${backRank}`) {
                            isCastling = true;
                            castlingNotation = "O–O";
                        } else if (toSquare === `3${backRank}`) {
                            isCastling = true;
                            castlingNotation = "O–O–O";
                        }
                    }
                }

                // Build notation
                let moveNotation = "";
                if (isCastling) {
                    moveNotation = castlingNotation;
                } else {
                    if (!pieceIsPawn) {
                        moveNotation += pieceType.toUpperCase();
                        // Disambiguation
                        const ambiguousPieces = [];
                        for (let square = 0; square < 64; square++) {
                            const piece = board[square];
                            if (piece === pieceType && square !== convertSquareToIndex(fromSquare)) {
                                const squareNotation = convertIndexToSquare(square);
                                const candidateMoves = getCandidateMoves(squareNotation, board);
                                if (candidateMoves && candidateMoves.includes(toSquare)) {
                                    // Only add if move doesn’t leave own king in check
                                    const testBoard = board.slice();
                                    const testFromIndex = convertSquareToIndex(squareNotation);
                                    const testToIndex = convertSquareToIndex(toSquare);
                                    testBoard[testFromIndex] = "";
                                    testBoard[testToIndex] = piece;
                                    const movingColor = piece === piece.toUpperCase() ? "w" : "b";
                                    if (!isKingInCheck(testBoard, movingColor)) {
                                        ambiguousPieces.push(squareNotation);
                                    }
                                }
                            }
                        }
                        if (ambiguousPieces.length > 0) {
                            const sameFile = ambiguousPieces.some(piece => piece[0] === fromSquare[0]);
                            const sameRank = ambiguousPieces.some(piece => piece[1] === fromSquare[1]);
                            if (!sameFile) {
                                moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(fromSquare[0]) - 1);
                            } else if (!sameRank) {
                                moveNotation += fromSquare[1];
                            } else {
                                moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(fromSquare[0]) - 1) + fromSquare[1];
                            }
                        }
                    }
                    if (isCapture) {
                        if (pieceIsPawn) {
                            moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(fromSquare[0]) - 1);
                        }
                        moveNotation += "x";
                    }
                    moveNotation += String.fromCharCode("a".charCodeAt(0) + parseInt(toSquare[0]) - 1) + toSquare[1];
                    if (pieceIsPawn && promotedTo) {
                        moveNotation += "=" + promotedTo.toUpperCase();
                    }
                }

                // Simulate move
                const newBoard = board.slice();
                // Support both algebraic notation and index for fromSquare/toSquare
                const fromIdx = typeof fromSquare === "string" && fromSquare.length === 2
                    ? convertSquareToIndex(fromSquare)
                    : parseInt(fromSquare);
                const toIdx = typeof toSquare === "string" && toSquare.length === 2
                    ? convertSquareToIndex(toSquare)
                    : parseInt(toSquare);

                newBoard[toIdx] = promotedTo || newBoard[fromIdx];
                newBoard[fromIdx] = "";

                // En passant
                if (pieceIsPawn && toSquare === enPassantSquare) {
                    const capturedPawnRank = activeColor === 'w' ? '5' : '4';
                    const capturedPawnSquare = enPassantSquare[0] + capturedPawnRank;
                    const capturedPawnIndex = convertSquareToIndex(capturedPawnSquare);
                    newBoard[capturedPawnIndex] = "";
                }

                // Castling rook move
                if (pieceType.toLowerCase() === "k") {
                    const isWhite = pieceType === "K";
                    const backRank = isWhite ? 1 : 8;
                    const fromRank = parseInt(fromSquare[1]);
                    if (fromRank === backRank) {
                        if (toSquare === `7${backRank}`) {
                            newBoard[convertSquareToIndex(`8${backRank}`)] = "";
                            newBoard[convertSquareToIndex(`6${backRank}`)] = isWhite ? "R" : "r";
                        } else if (toSquare === `3${backRank}`) {
                            newBoard[convertSquareToIndex(`1${backRank}`)] = "";
                            newBoard[convertSquareToIndex(`4${backRank}`)] = isWhite ? "R" : "r";
                        }
                    }
                }

                // Check/checkmate detection (always run, even for castling)
                const opponentColor = activeColor === 'w' ? 'b' : 'w';



                if (isKingInCheck(newBoard, opponentColor)) {
                    if (isCheckmate(opponentColor, newBoard)) {
                        moveNotation += "#";
                    } else {
                        moveNotation += "+";
                    }
                }

                return moveNotation;
            } catch (error) {
                return "";
            }
        },
        fen: (board = piecePositions, color = activeColor, castling = castlingRights, enPassant = enPassantSquare, halfmove = halfmoveClock, fullmove = fullmoveNumber) => {
            try {
                // Build position string
                let position = "";
                for (let rank = 7; rank >= 0; rank--) {
                    let emptyCount = 0;

                    for (let file = 0; file < 8; file++) {
                        const square = board[rank * 8 + file];

                        if (square === "") {
                            emptyCount++;
                        } else {
                            if (emptyCount > 0) {
                                position += emptyCount;
                                emptyCount = 0;
                            }
                            position += square;
                        }
                    }

                    if (emptyCount > 0) position += emptyCount;
                    if (rank > 0) position += "/";
                }

                // Convert en passant from internal format
                let enPassantSquareNotation = "-";
                if (enPassant && enPassant.length === 2) {
                    const file = String.fromCharCode("a".charCodeAt(0) + parseInt(enPassant[0]) - 1);
                    const rank = enPassant[1];
                    enPassantSquareNotation = file + rank;
                }

                return `${position} ${color} ${castling || "-"} ${enPassantSquareNotation} ${halfmove || 0} ${fullmove || 1}`;
            } catch (error) {
                console.error("Error generating FEN:", error);
                return "";
            }
        },
        pgn: () => {
            // TODO: Implement PGN writing
            throw new Error("PGN writing not yet implemented");
        },
    },
    assign: {
        parsedFen: (parsedFen) => {
            if (!parsedFen || !Array.isArray(parsedFen) || parsedFen.length !== 6) {
                throw new Error("Invalid parsed FEN data");
            }

            piecePositions = parsedFen[0];
            activeColor = parsedFen[1];
            castlingRights = parsedFen[2];
            enPassantSquare = parsedFen[3];
            halfmoveClock = parsedFen[4];
            fullmoveNumber = parsedFen[5];
        },
    },

    // Utility functions
    validate: {
        fen: (fen) => {
            const result = Notation.read.fen(fen);
            return result !== false;
        },
        square: (square) => {
            if (typeof square !== 'string' || square.length !== 2) return false;
            const file = square[0];
            const rank = square[1];
            return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
        },
        piece: (piece) => {
            return typeof piece === 'string' && /^[prnbqkPRNBQK]$/.test(piece);
        }
    }
};
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
                PieceMoveMethods.clickDragDrop.mousemove(event);
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
            PieceMoveMethods.clickDragDrop.mousedown(touchEvent);
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
            PieceMoveMethods.clickDragDrop.mousemove(touchEvent);
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
            PieceMoveMethods.clickDragDrop.mouseup(touchEvent);
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
function getBasicCandidateMoves(pieceSquare, board) {
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

function getCandidateMoves(pieceSquare, board) {
    let candidateMoves = getBasicCandidateMoves(pieceSquare, board);
    const piece = board[convertSquareToIndex(pieceSquare)];

    // Add castling moves for kings
    if (piece.toLowerCase() === "k") {
        const isWhite = piece === "K";
        const backRank = isWhite ? 1 : 8;
        const kingFile = parseInt(pieceSquare[0]);
        const kingRank = parseInt(pieceSquare[1]);

        // Only allow castling if king is on the back rank
        if (kingRank === backRank) {
            // Find rooks on the back rank
            const rooks = [];
            for (let file = 1; file <= 8; file++) {
                const square = `${file}${backRank}`;
                const pieceOnSquare = board[convertSquareToIndex(square)];
                if (pieceOnSquare === (isWhite ? "R" : "r")) {
                    rooks.push(file);
                }
            }

            // Kingside castling (uses rightmost rook)
            if ((isWhite && castlingRights.includes("K")) || (!isWhite && castlingRights.includes("k"))) {
                const kingsideRook = Math.max(...rooks.filter(rookFile => rookFile > kingFile));
                if (kingsideRook > kingFile) {
                    const kingDestination = `7${backRank}`; // g1 for white, g8 for black
                    const rookDestination = `6${backRank}`; // f1 for white, f8 for black

                    // Check if squares between king and rook are empty (excluding king and rook squares)
                    const squaresBetween = [];
                    for (let file = Math.min(kingFile, kingsideRook) + 1; file < Math.max(kingFile, kingsideRook); file++) {
                        squaresBetween.push(`${file}${backRank}`);
                    }

                    // Check if king destination and rook destination are empty (if different from current positions)
                    const destinationSquares = [];
                    if (kingDestination !== pieceSquare) destinationSquares.push(kingDestination);
                    if (rookDestination !== `${kingsideRook}${backRank}`) destinationSquares.push(rookDestination);

                    const squaresEmpty = [...squaresBetween, ...destinationSquares].every(sq =>
                        board[convertSquareToIndex(sq)] === "");

                    if (squaresEmpty) {
                        // Check that king doesn’t pass through attacked squares
                        const kingPath = [];
                        const startFile = kingFile;
                        const endFile = 7; // g-file
                        const step = startFile < endFile ? 1 : -1;
                        for (let file = startFile; file !== endFile + step; file += step) {
                            kingPath.push(`${file}${backRank}`);
                        }

                        const notAttacked = kingPath.every(sq => !isSquareAttacked(board, sq, isWhite ? "b" : "w"));
                        if (notAttacked && kingDestination !== pieceSquare) {
                            candidateMoves.push(kingDestination);
                        }
                    }
                }
            }

            // Queenside castling (uses leftmost rook)
            if ((isWhite && castlingRights.includes("Q")) || (!isWhite && castlingRights.includes("q"))) {
                const queensideRook = Math.min(...rooks.filter(rookFile => rookFile < kingFile));
                if (queensideRook < kingFile) {
                    const kingDestination = `3${backRank}`; // c1 for white, c8 for black
                    const rookDestination = `4${backRank}`; // d1 for white, d8 for black

                    // Check if squares between king and rook are empty (excluding king and rook squares)
                    const squaresBetween = [];
                    for (let file = Math.min(kingFile, queensideRook) + 1; file < Math.max(kingFile, queensideRook); file++) {
                        squaresBetween.push(`${file}${backRank}`);
                    }

                    // Check if king destination and rook destination are empty (if different from current positions)
                    const destinationSquares = [];
                    if (kingDestination !== pieceSquare) destinationSquares.push(kingDestination);
                    if (rookDestination !== `${queensideRook}${backRank}`) destinationSquares.push(rookDestination);

                    const squaresEmpty = [...squaresBetween, ...destinationSquares].every(sq =>
                        board[convertSquareToIndex(sq)] === "");

                    if (squaresEmpty) {
                        // Check that king doesn’t pass through attacked squares
                        const kingPath = [];
                        const startFile = kingFile;
                        const endFile = 3; // c-file
                        const step = startFile < endFile ? 1 : -1;
                        for (let file = startFile; file !== endFile + step; file += step) {
                            kingPath.push(`${file}${backRank}`);
                        }

                        const notAttacked = kingPath.every(sq => !isSquareAttacked(board, sq, isWhite ? "b" : "w"));
                        if (notAttacked && kingDestination !== pieceSquare) {
                            candidateMoves.push(kingDestination);
                        }
                    }
                }
            }
        }
    }

    return candidateMoves;
};

function getCastlingTargets(pieceSquare, board) {
    const piece = board[convertSquareToIndex(pieceSquare)];
    let castlingTargets = [];

    // Only for kings
    if (piece.toLowerCase() === "k") {
        const isWhite = piece === "K";
        const backRank = isWhite ? 1 : 8;
        const kingFile = parseInt(pieceSquare[0]);
        const kingRank = parseInt(pieceSquare[1]);

        // Only allow castling if king is on the back rank
        if (kingRank === backRank) {
            // Find rooks on the back rank
            const rooks = [];
            for (let file = 1; file <= 8; file++) {
                const square = `${file}${backRank}`;
                const pieceOnSquare = board[convertSquareToIndex(square)];
                if (pieceOnSquare === (isWhite ? "R" : "r")) {
                    rooks.push(file);
                }
            }

            // Check kingside castling
            if ((isWhite && castlingRights.includes("K")) || (!isWhite && castlingRights.includes("k"))) {
                const kingsideRook = Math.max(...rooks.filter(rookFile => rookFile > kingFile));
                if (kingsideRook > kingFile) {
                    const kingDestination = `7${backRank}`;
                    const rookDestination = `6${backRank}`;

                    // Check if squares between king and rook are empty
                    const squaresBetween = [];
                    for (let file = Math.min(kingFile, kingsideRook) + 1; file < Math.max(kingFile, kingsideRook); file++) {
                        squaresBetween.push(`${file}${backRank}`);
                    }

                    // Check if destinations are empty (if different from current positions)
                    const destinationSquares = [];
                    if (kingDestination !== pieceSquare) destinationSquares.push(kingDestination);
                    if (rookDestination !== `${kingsideRook}${backRank}`) destinationSquares.push(rookDestination);

                    // For Chess960: exclude occupied destination squares from the empty check
                    const squaresToCheck = [...squaresBetween, ...destinationSquares];
                    const squaresEmpty = squaresToCheck.every(sq => {
                        const piece = board[convertSquareToIndex(sq)];
                        // Square is empty, or contains the king/rook that will move away
                        return piece === "" || sq === pieceSquare || sq === `${kingsideRook}${backRank}`;
                    });

                    if (squaresEmpty) {
                        // Check that king doesn’t pass through attacked squares
                        const kingPath = [];
                        const startFile = kingFile;
                        const endFile = 7;
                        const step = startFile < endFile ? 1 : -1;
                        for (let file = startFile; file !== endFile + step; file += step) {
                            kingPath.push(`${file}${backRank}`);
                        }

                        const notAttacked = kingPath.every(sq => !isSquareAttacked(board, sq, isWhite ? "b" : "w"));
                        if (notAttacked) {
                            castlingTargets.push(`${kingsideRook}${backRank}`); // Rook as target
                        }
                    }
                }
            }

            // Check queenside castling
            if ((isWhite && castlingRights.includes("Q")) || (!isWhite && castlingRights.includes("q"))) {
                const queensideRook = Math.min(...rooks.filter(rookFile => rookFile < kingFile));
                if (queensideRook < kingFile) {
                    const kingDestination = `3${backRank}`;
                    const rookDestination = `4${backRank}`;

                    // Check if squares between king and rook are empty
                    const squaresBetween = [];
                    for (let file = Math.min(kingFile, queensideRook) + 1; file < Math.max(kingFile, queensideRook); file++) {
                        squaresBetween.push(`${file}${backRank}`);
                    }

                    // Check if destinations are empty (if different from current positions)
                    const destinationSquares = [];
                    if (kingDestination !== pieceSquare) destinationSquares.push(kingDestination);
                    if (rookDestination !== `${queensideRook}${backRank}`) destinationSquares.push(rookDestination);

                    // For Chess960: exclude occupied destination squares from the empty check
                    const squaresToCheck = [...squaresBetween, ...destinationSquares];
                    const squaresEmpty = squaresToCheck.every(sq => {
                        const piece = board[convertSquareToIndex(sq)];
                        // Square is empty, or contains the king/rook that will move away
                        return piece === "" || sq === pieceSquare || sq === `${queensideRook}${backRank}`;
                    });

                    if (squaresEmpty) {
                        // Check that king doesn’t pass through attacked squares
                        const kingPath = [];
                        const startFile = kingFile;
                        const endFile = 3;
                        const step = startFile < endFile ? 1 : -1;
                        for (let file = startFile; file !== endFile + step; file += step) {
                            kingPath.push(`${file}${backRank}`);
                        }

                        const notAttacked = kingPath.every(sq => !isSquareAttacked(board, sq, isWhite ? "b" : "w"));
                        if (notAttacked) {
                            castlingTargets.push(`${queensideRook}${backRank}`); // Rook as target
                        }
                    }
                }
            }
        }
    }

    return castlingTargets;
};

function isSquareAttacked(board, square, attackerColor) {
    for (let i = 0; i < board.length; i++) {
        const attacker = board[i];
        if (!attacker) continue;
        const isWhite = attacker === attacker.toUpperCase();
        if ((attackerColor === "w" && isWhite) ||
            (attackerColor === "b" && !isWhite)) {
            const attackerSquare = convertIndexToSquare(i);
            const moves = getBasicCandidateMoves(attackerSquare, board);
            if (moves.includes(square)) return true;
        }
    }
    return false;
}

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
function getLegalMoves(pieceSquare, board = piecePositions, color = activeColor) {
    const candidateMoves = getCandidateMoves(pieceSquare, board);
    let legalMovesForPiece = [];
    const piece = board[convertSquareToIndex(pieceSquare)];
    const movingColor = piece === piece.toUpperCase() ? "w" : "b";
    if (movingColor !== color) return [];
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
    // If king is not in check, it can’t be checkmate
    if (!isKingInCheck(board, activeColor)) return false;

    // Try every piece of the active color
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;

        // Check if this piece belongs to the active color
        const isWhite = piece === piece.toUpperCase();
        if ((activeColor === "w") === isWhite) {
            const pieceSquare = convertIndexToSquare(i);
            const legalMoves = getLegalMoves(pieceSquare, board, activeColor);
            if (legalMoves.length > 0) return false;
        }
    }
    // If we’ve tried all pieces and moves and found nothing, it’s checkmate
    return true;
};
function isStalemate(activeColor, board = piecePositions) {
    // If king is in check, it’s not stalemate
    if (isKingInCheck(board, activeColor)) return false;

    // Try every piece of the active color
    for (let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (!piece) continue;

        // Check if this piece belongs to the active color
        const isWhite = piece === piece.toUpperCase();
        if ((activeColor === "w") === isWhite) {
            const pieceSquare = convertIndexToSquare(i);

            // Get all possible moves for this piece
            const candidateMoves = getCandidateMoves(pieceSquare, board);

            // Try each move to see if it gets out of stalemate
            for (const move of candidateMoves) {
                const testBoard = board.slice();
                testBoard[convertSquareToIndex(move)] = testBoard[i];
                testBoard[i] = "";

                // If this move doesn’t put king in check, it’s not stalemate
                if (!isKingInCheck(testBoard, activeColor)) {
                    return false;
                }
            }
        }
    }
    // If we’ve tried all pieces and moves and found nothing, it’s stalemate
    return true;
}
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

    // Handle piece capture or castling target
    if (activePiece && legalMoves.includes(pieceSquare)) {
        // Check if this is a castling target (rook clicked for castling)
        const activeSquare = getSquareFromClassList(activePiece);
        const activePieceType = piecePositions[convertSquareToIndex(activeSquare)];

        if (activePieceType.toLowerCase() === "k") {
            const castlingTargets = getCastlingTargets(activeSquare, piecePositions);
            if (castlingTargets.includes(pieceSquare)) {
                // This is a rook being clicked for castling, pass the rook’s square as target
                movePiece(pieceSquare);
                halfmoveClock = 0;
                activePiece = null;
                return;
            }
        }

        // Regular piece capture
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
    const allMoves = getLegalMoves(pieceSquare);
    const piece_type = piecePositions[convertSquareToIndex(pieceSquare)];

    // Handle king castling logic
    let castlingTargets = [];
    let normalMoves = [];
    let castlingMoves = [];

    if (piece_type.toLowerCase() === "k") {
        // Get castling targets (rooks that can be clicked for castling)
        castlingTargets = getCastlingTargets(pieceSquare, piecePositions);

        // Separate normal moves from castling moves
        const isWhite = piece_type === "K";
        const backRank = isWhite ? 1 : 8;

        // Get basic candidate moves (normal moves only)
        const basicMoves = [];
        const candidateMoves = getBasicCandidateMoves(pieceSquare, piecePositions);
        candidateMoves.forEach(move => {
            let newBoard = piecePositions.slice();
            newBoard[convertSquareToIndex(move)] = newBoard[convertSquareToIndex(pieceSquare)];
            newBoard[convertSquareToIndex(pieceSquare)] = "";
            if (!isKingInCheck(newBoard, piece_type === piece_type.toUpperCase() ? "w" : "b")) {
                basicMoves.push(move);
            }
        });

        allMoves.forEach(move => {
            const isCastlingMove = move === `7${backRank}` || move === `3${backRank}`;

            if (isCastlingMove) {
                // Don’t show castling destination if king is already there
                if (pieceSquare !== move) {
                    castlingMoves.push(move);
                }
            } else {
                normalMoves.push(move);
            }
        });
    } else {
        normalMoves = allMoves;
    }

    legalMoves = allMoves.concat(castlingTargets);

    // Show move indicators for normal moves
    normalMoves.forEach(square => {
        const moveIndicator = document.createElement("div");
        moveIndicator.className = `move-indicator square-${square}`;
        if (piecePositions[convertSquareToIndex(square)] || (square === enPassantSquare && piecePositions[convertSquareToIndex(pieceSquare)].toLowerCase() === "p")) {
            moveIndicator.classList.add("capture-indicator");
        } else {
            moveIndicator.classList.add("empty-move-indicator");
        }
        chessBoard.appendChild(moveIndicator);
    });

    // Show indicators for castling moves that don’t conflict with normal moves
    if (piece_type.toLowerCase() === "k") {
        castlingMoves.forEach(square => {
            if (!normalMoves.includes(square)) {
                const moveIndicator = document.createElement("div");
                moveIndicator.className = `move-indicator square-${square}`;
                moveIndicator.classList.add("empty-move-indicator");
                moveIndicator.dataset.castlingDestination = "true";
                chessBoard.appendChild(moveIndicator);
            }
        });
    }

    // Show rook targets for castling
    castlingTargets.forEach(square => {
        const moveIndicator = document.createElement("div");
        moveIndicator.className = `move-indicator square-${square}`;
        moveIndicator.classList.add("capture-indicator"); // Rook targets look like captures
        moveIndicator.dataset.castlingTarget = "true";
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
    let pieceSquare = getSquareFromClassList(activePiece);
    let actualTargetSquare = targetSquare;
    let pieceType = piecePositions[convertSquareToIndex(pieceSquare)];
    const previousRank = parseInt(pieceSquare[1]);

    // Check if this is a normal move first (priority over castling)
    let isNormalMove = false;
    const basicMoves = getBasicCandidateMoves(pieceSquare, piecePositions);
    basicMoves.forEach(move => {
        let newBoard = piecePositions.slice();
        newBoard[convertSquareToIndex(move)] = newBoard[convertSquareToIndex(pieceSquare)];
        newBoard[convertSquareToIndex(pieceSquare)] = "";
        if (!isKingInCheck(newBoard, pieceType === pieceType.toUpperCase() ? "w" : "b")) {
            if (move === targetSquare) {
                isNormalMove = true;
            }
        }
    });

    // Castling move detection (Chess960 compatible) - only if not a normal move
    let isCastlingMove = false;
    let rookFrom = null, rookTo = null;

    if (!isNormalMove && pieceType.toLowerCase() === "k") {
        const isWhite = pieceType === "K";
        const backRank = isWhite ? 1 : 8;
        const kingFile = parseInt(pieceSquare[0]);
        const kingRank = parseInt(pieceSquare[1]);

        // Check if this is a castling move (king moving to g-file or c-file on back rank)
        // But only if those squares are actually valid destinations (not occupied by other pieces)
        if (kingRank === backRank && (targetSquare === `7${backRank}` || targetSquare === `3${backRank}`)) {
            const isKingside = targetSquare === `7${backRank}`;

            // Check if castling is legal by verifying castling rights and path
            const castlingRightChar = isWhite ? (isKingside ? "K" : "Q") : (isKingside ? "k" : "q");
            if (castlingRights.includes(castlingRightChar)) {
                // Find the appropriate rook (rightmost for kingside, leftmost for queenside)
                const candidateRooks = [];
                for (let file = 1; file <= 8; file++) {
                    const square = `${file}${backRank}`;
                    const piece = piecePositions[convertSquareToIndex(square)];
                    if (piece === (isWhite ? "R" : "r")) {
                        candidateRooks.push(file);
                    }
                }

                let rookFile;
                if (isKingside) {
                    rookFile = Math.max(...candidateRooks.filter(file => file > kingFile));
                } else {
                    rookFile = Math.min(...candidateRooks.filter(file => file < kingFile));
                }

                if (rookFile && ((isKingside && rookFile > kingFile) || (!isKingside && rookFile < kingFile))) {
                    // Check if path is clear and king doesn’t move through check
                    const kingPath = [];
                    const startFile = kingFile;
                    const endFile = parseInt(targetSquare[0]);
                    const step = startFile < endFile ? 1 : -1;
                    for (let file = startFile; file !== endFile + step; file += step) {
                        kingPath.push(`${file}${backRank}`);
                    }

                    // Check squares between king and rook are empty (excluding king and rook positions)
                    const squaresBetween = [];
                    for (let file = Math.min(kingFile, rookFile) + 1; file < Math.max(kingFile, rookFile); file++) {
                        squaresBetween.push(`${file}${backRank}`);
                    }

                    // Check if target square is empty or contains the king itself
                    const targetEmpty = piecePositions[convertSquareToIndex(targetSquare)] === "" ||
                                       targetSquare === pieceSquare;

                    const pathClear = squaresBetween.every(sq =>
                        piecePositions[convertSquareToIndex(sq)] === "" ||
                        sq === pieceSquare ||
                        sq === `${rookFile}${backRank}`
                    );

                    const notAttacked = kingPath.every(sq => !isSquareAttacked(piecePositions, sq, isWhite ? "b" : "w"));

                    if (targetEmpty && pathClear && notAttacked) {
                        rookFrom = `${rookFile}${backRank}`;
                        rookTo = isKingside ? `6${backRank}` : `4${backRank}`; // f-file or d-file
                        isCastlingMove = true;
                    }
                }
            }
        }
    }

    // Check if this is a rook target for castling (king selected, rook clicked)
    if (!isNormalMove && activePiece && !isCastlingMove) {
        const activeSquare = getSquareFromClassList(activePiece);
        const activePieceType = piecePositions[convertSquareToIndex(activeSquare)];

        if (activePieceType.toLowerCase() === "k") {
            const castlingTargets = getCastlingTargets(activeSquare, piecePositions);
            if (castlingTargets.includes(targetSquare)) {
                const isWhite = activePieceType === "K";
                const backRank = isWhite ? 1 : 8;
                const kingFile = parseInt(activeSquare[0]);
                const rookFile = parseInt(targetSquare[0]);

                const isKingside = rookFile > kingFile;
                isCastlingMove = true;
                rookFrom = targetSquare;
                rookTo = isKingside ? `6${backRank}` : `4${backRank}`;

                // Set king move for castling
                pieceSquare = activeSquare;
                actualTargetSquare = isKingside ? `7${backRank}` : `3${backRank}`;
                pieceType = activePieceType;
            }
        }
    }

    // Calculate final target file and rank after castling logic
    const toFile = parseInt(actualTargetSquare[0]);
    const toRank = parseInt(actualTargetSquare[1]);

    // Handle piece capture (but not for castling moves where king might be on destination)
    const capturedPieceType = piecePositions[convertSquareToIndex(actualTargetSquare)];
    if (capturedPieceType && !isCastlingMove) {
        const capturedPiece = chessBoard.querySelector(`.chess-piece.square-${actualTargetSquare}:not(.removed)`);
        capturedPiece.classList.add("removed");
        setTimeout(() => capturedPiece.remove(), 250);
    }

    // Change the position of piece
    const backupActivePiece = activePiece;
    if (!dropped) {
        backupActivePiece.classList.add("sliding");
        // const activePieceStyle = backupActivePiece.style;
        // activePieceStyle.outline = "none";
        // activePieceStyle.transition = "transform 0.3s ease-out";
    }

    // Only move the piece if it’s not already on the target square (prevents self-capture in castling)
    if (pieceSquare !== actualTargetSquare) {
        backupActivePiece.classList.remove(`square-${pieceSquare}`);
        backupActivePiece.classList.add(`square-${actualTargetSquare}`);
    }

    if (!dropped) {
        setTimeout(() => {
            backupActivePiece.classList.remove("sliding");
            // activePieceStyle.outline = "";
            // activePieceStyle.transition = "";
        }, 300);
    }

    // Handle castling rook move
    if (isCastlingMove && rookFrom && rookTo) {
        const rookPiece = chessBoard.querySelector(`.chess-piece.square-${rookFrom}:not(.removed)`);
        if (rookPiece) {
            rookPiece.classList.add("sliding");
            rookPiece.classList.remove(`square-${rookFrom}`);
            rookPiece.classList.add(`square-${rookTo}`);
            setTimeout(() => {
                rookPiece.classList.remove("sliding");
            }, 300); // Match king’s animation duration
            piecePositions[convertSquareToIndex(rookFrom)] = "";
            piecePositions[convertSquareToIndex(rookTo)] = pieceType === "K" ? "R" : "r";
        }
        // Remove castling rights for this side
        if (pieceType === "K") {
            castlingRights = castlingRights.replace("K", "").replace("Q", "");
        } else {
            castlingRights = castlingRights.replace("k", "").replace("q", "");
        }
    }

    // Handle pawn promotion
    let promotedTo = "";
    if (pieceType.toLowerCase() === "p") {
        if (pieceType.toLowerCase() === "p" && toRank === (pieceType === "p" ? 1 : 8)) {
            promotedTo = await showPromotionBox(actualTargetSquare);
            activePiece = promotedTo[0];
            promotedTo = promotedTo[1];
            activePiece.classList.remove("P", "p");
            activePiece.classList.add(promotedTo);
        }
    }

    // Set active color
    activeColor = activeColor === "w" ? "b" : "w";

    // Handle en passant
    if (pieceType.toLowerCase() === "p" && enPassantSquare === actualTargetSquare) {
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
    const moveNotation = Notation.write.san(pieceSquare, actualTargetSquare, promotedTo, prevEnPassantSquare);

    // Update `piecePositions` and highlight move squares
    // Only clear the source square if it’s different from the target (prevents erasing king in castling)
    if (pieceSquare !== actualTargetSquare) {
        piecePositions[convertSquareToIndex(pieceSquare)] = "";
    }
    removeSquareHighlight(true);
    highlightSquare(pieceSquare, true);
    highlightSquare(actualTargetSquare, true);
    if (promotedTo) piecePositions[convertSquareToIndex(actualTargetSquare)] = promotedTo;
    else piecePositions[convertSquareToIndex(actualTargetSquare)] = pieceType;

    // Remove castling rights if king or rook moves (non-castling)
    if (!isCastlingMove) {
        if (pieceType === "K") {
            castlingRights = castlingRights.replace("K", "").replace("Q", "");
        } else if (pieceType === "k") {
            castlingRights = castlingRights.replace("k", "").replace("q", "");
        }
        // If rook moves, remove its castling right (Chess960 compatible)
        if (pieceType === "R" || pieceType === "r") {
            const isWhite = pieceType === "R";
            const backRank = isWhite ? 1 : 8;
            const rookFile = parseInt(pieceSquare[0]);
            const rookRank = parseInt(pieceSquare[1]);

            if (rookRank === backRank) {
                // Find king position to determine which rook this is
                let kingFile = null;
                for (let file = 1; file <= 8; file++) {
                    const square = `${file}${backRank}`;
                    const piece = piecePositions[convertSquareToIndex(square)];
                    if (piece === (isWhite ? "K" : "k")) {
                        kingFile = file;
                        break;
                    }
                }

                if (kingFile !== null) {
                    // If rook is to the right of king, it’s kingside
                    // If rook is to the left of king, it’s queenside
                    if (rookFile > kingFile) {
                        castlingRights = castlingRights.replace(isWhite ? "K" : "k", "");
                    } else if (rookFile < kingFile) {
                        castlingRights = castlingRights.replace(isWhite ? "Q" : "q", "");
                    }
                }
            }
        }
    }

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

    if (!computer) return;

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
}
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
}
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
}
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
}
function checkFenValidity(fen) {
    if (!fen || typeof fen !== 'string') {
        positionInputBox.style.border = "2px solid var(--danger-color)";
        return false;
    }

    const trimmedFen = fen.trim();
    if (!trimmedFen) {
        positionInputBox.style.border = "2px solid var(--danger-color)";
        return false;
    }

    try {
        const parsedFen = Notation.read.fen(trimmedFen);
        if (parsedFen) {
            positionInputBox.style.border = "";
            return parsedFen;
        }
    } catch (error) {
        console.warn("FEN validation error:", error.message);
    }

    positionInputBox.style.border = "2px solid var(--danger-color)";
    return false;
}
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
}

let isBoardFlipped = false;
let piecePositions = [];
let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
let activePiece = null, legalMoves = [];
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
    activePiece = null;
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

    // Add the highlight
    const color = event.button !== 2 ? "red"
        : event.altKey ? "blue"
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

if (isBoardFlipped) {
    isBoardFlipped = !isBoardFlipped;
    flipBoard();
}
if (activeColor === "b") {
    document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
} else {
    document.getElementById("to-move").innerHTML = `<div style="background-color: white;"></div><b>White</b>&nbsp;to move`;
}

computer = true;
