function parseFen(fen) {
    isFenValid = false;
    let ranksParsed = 0;
    let evalPiecePositions = [];
    let evalActiveColor = "", evalCastlingRights = "", evalEnPassantSquare = "", evalHalfmoveClock = "", evalFullmoveNumber = "";
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
            evalPiecePositions.push(fenChar);
        } else if (fenChar === "/") {
            ranksParsed++;
            if (evalPiecePositions.length !== 8 * ranksParsed) return false;
        } else {
            for (let j = parseInt(fenChar); j > 0; j--) evalPiecePositions.push("");
        }
        i++;
        if (i < fen.length) fenChar = fen[i];
        else return false;
    }
    if (evalPiecePositions.length !== 64 || ranksParsed !== 7) return false;
    evalActiveColor = readValueFromFen();
    if (!evalActiveColor == true || !(evalActiveColor === "w" || evalActiveColor === "b")) return false;
    evalCastlingRights = readValueFromFen();
    if (!evalCastlingRights == true || evalCastlingRights.length > 4) return false;
    if (evalCastlingRights !== "-") {
        for (const char of evalCastlingRights) {
            switch (char) {
                case "K": break;
                case "Q": break;
                case "k": break;
                case "q": break;
                default: return false;
            }
        }
    }
    evalEnPassantSquare = readValueFromFen();
    if (!evalEnPassantSquare == true || evalEnPassantSquare.length > 2 || (evalEnPassantSquare !== "-" && (evalEnPassantSquare[1] !== "3" && evalEnPassantSquare[1] !== "6"))) return false;
    if (evalEnPassantSquare === "-") evalEnPassantSquare = "";
    evalHalfmoveClock = Number(readValueFromFen());
    if (!evalHalfmoveClock == true && evalHalfmoveClock !== 0) return false;
    evalFullmoveNumber = parseInt(readValueFromFen());
    if (!evalFullmoveNumber == true) return false;
    if (evalPiecePositions.filter(x => x === "K").length !== 1 || evalPiecePositions.filter(x => x === "k").length !== 1) return false;
    isFenValid = true;
    piecePositions = evalPiecePositions;
    activeColor = evalActiveColor;
    castlingRights = evalCastlingRights;
    enPassantSquare = evalEnPassantSquare;
    halfmoveClock = evalHalfmoveClock;
    fullmoveNumber = evalFullmoveNumber;
    return true;
}
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
    rankList.style.left = "calc(var(--board-square-width) / 20)";
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
    document.getElementById("game-container").appendChild(chessBoard);
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
    addClickToMove();
    addDragDropToMove();
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
    if (!friendlyPieces.includes(piece)) friendlyPieces = ["r", "n", "b", "q", "k", "p"];
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
            let frontSquare = `${pieceFile}${pieceRank + forward}`;
            if (!piecePositions[convertSquareToIndex(frontSquare)]) {
                legalMoves.push(frontSquare);
                if (pieceRank === startRank) {
                    let doubleFront = `${pieceFile}${pieceRank + 2 * forward}`;
                    if (!piecePositions[convertSquareToIndex(doubleFront)]) legalMoves.push(doubleFront);
                }
            }
            [[-1, forward], [1, forward]].forEach(([df, dr]) => {
                let f = String.fromCharCode(pieceFile.charCodeAt(0) + df);
                let r = pieceRank + dr;
                let captureSquare = `${f}${r}`;
                if (isValidMove(f, r) && piecePositions[convertSquareToIndex(captureSquare)]) legalMoves.push(captureSquare);
            });
            if (enPassantSquare &&
                Math.abs(pieceFile.charCodeAt(0) - enPassantSquare[0].charCodeAt(0)) === 1 &&
                pieceRank + forward === parseInt(enPassantSquare[1])) {
                legalMoves.push(enPassantSquare);
            }
    }
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
    getLegalMoves(chessPiece.id);
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
function movePiece(targetSquare, dropped = false) {
    const file = targetSquare[0].charCodeAt(0) - "a".charCodeAt(0);
    const rank = parseInt(targetSquare[1]);
    const pieceType = piecePositions[convertSquareToIndex(activePiece.id)];
    piecePositions[convertSquareToIndex(activePiece.id)] = "";
    const previousRank = parseInt(activePiece.id[1]);
    document.querySelector(`#${activePiece.id}.board-square`).style.outline = "";
    highlightMoveSquares(activePiece.id, targetSquare);
    activePiece.id = targetSquare;
    const activePieceStyle = activePiece.style;
    if (!dropped) activePieceStyle.transition = `top 0.3s ${pieceMoveAnimation}, left 0.3s ${pieceMoveAnimation}, opacity 0.3s ease-out`;
    activePieceStyle.top = `calc(${isBoardFlipped ? rank - 1 : 8 - rank} * var(--board-square-width))`;
    activePieceStyle.left = `calc(${isBoardFlipped ? 7 - file : file} * var(--board-square-width))`;
    if (!dropped) setTimeout(() => activePieceStyle.transition = "opacity 0.3s ease-out", 300);
    if (pieceType.toLowerCase() === "p" && enPassantSquare === targetSquare) {
        const enemyPawnSquare = `${String.fromCharCode("a".charCodeAt(0) + file)}${previousRank}`;
        const enemyPawn = document.querySelector(`#${enemyPawnSquare}.chess-piece`);
        piecePositions[convertSquareToIndex(enemyPawnSquare)] = "";
        enemyPawn.style.opacity = "0";
        setTimeout(() => enemyPawn.remove(), 300);
    }
    piecePositions[convertSquareToIndex(targetSquare)] = pieceType;
    enPassantSquare = "";
    if (pieceType.toLowerCase() === "p") {
        if (Math.abs(rank - previousRank) === 2) {
            enPassantSquare = pieceType === "P" ? `${String.fromCharCode("a".charCodeAt(0) + file)}${3}` : `${String.fromCharCode("a".charCodeAt(0) + file)}${6}`;
        } else if (rank === (pieceType === "p" ? 1 : 8)) {
            activePiece.classList.remove("P", "p");
            const promotedTo = pieceType === "p" ? "q" : "Q";
            activePiece.classList.add(promotedTo);
            piecePositions[convertSquareToIndex(activePiece.id)] = promotedTo;
        }
    }
    if (activeColor === "w") {
        activeColor = "b";
        document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
    } else {
        activeColor = "w";
        document.getElementById("to-move").innerHTML = `<div></div><b>White</b>&nbsp;to move`;
    }
    if (pieceType.toLowerCase() === "p") halfmoveClock = 0;
    else halfmoveClock++;
    if (activeColor === "w") fullmoveNumber++;
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
    if (parseFen(fen.trim())) {
        document.getElementById("fen-validity-indicator").innerHTML = `
            <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--color)" opacity="0.6">
                <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>`;
        if (activeColor === "w") document.getElementById("to-move").innerHTML = `<div></div><b>White</b>&nbsp;to move`;
        else document.getElementById("to-move").innerHTML = `<div style="background-color: black;"></div><b>Black</b>&nbsp;to move`;
    } else {
        document.getElementById("fen-validity-indicator").innerHTML = `
            <!-- Icon sourced from Google Fonts (Material Icons) — Apache licence 2.0 -->
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="red">
                <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
            </svg>`;
    }
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
function addClickToMove() {
    document.querySelectorAll(".chess-piece").forEach(piece => {
        piece.addEventListener("click", () => highlightLegalMoves(piece));
    });
    document.querySelectorAll(".board-square").forEach(square => {
        square.addEventListener("click", () => {
            if (activePiece && legalMoves.includes(square.id)) movePiece(square.id);
        });
    });
    document.addEventListener("click", (event) => {
        if (!event.target.classList.contains("chess-piece")) {
            document.querySelectorAll(".move-indicator").forEach(indicator => {
                indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                setTimeout(() => indicator.remove(), 200);
            });
            highlightSelectedSquare();
            activePiece = null;
        }
    });
}
function addDragDropToMove() {
    let draggedPieceId = "";
    document.querySelectorAll(".chess-piece").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", (event) => {
            draggedPieceId = piece.id;
            if (document.querySelector(`#${piece.id}.highlight-square`)) {
                document.querySelector(`#${piece.id}.highlight-square`).style.outline = "none";
            }
            document.querySelector(`#${piece.id}.board-square`).style.outline = "none";
            if (document.querySelector(`#${piece.id}.file-name`)) {
                document.querySelector(`#${piece.id}.file-name`).style.opacity = "0";
            }
            if (document.querySelector(`#${piece.id}.rank-name`)) {
                document.querySelector(`#${piece.id}.rank-name`).style.opacity = "0";
            }
            activePiece = null;
            highlightSelectedSquare();
            highlightLegalMoves(piece, true);
            event.dataTransfer.effectAllowed = "move";
            piece.style.transition = "";
            setTimeout(() => piece.style.opacity = "0.5", 0);
        });
        piece.addEventListener("dragend", () => {
            if (document.querySelector(`#${draggedPieceId}.file-name`)) {
                document.querySelector(`#${draggedPieceId}.file-name`).style.opacity = "";
            }
            if (document.querySelector(`#${draggedPieceId}.rank-name`)) {
                document.querySelector(`#${draggedPieceId}.rank-name`).style.opacity = "";
            }
            if (draggedPieceId !== piece.id) {
                const ripple = document.createElement("div");
                ripple.className = "ripple";
                document.querySelector(`#${piece.id}.board-square`).appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
            }
            highlightSelectedSquare(piece.id);
            document.querySelectorAll(".move-indicator").forEach(indicator => {
                indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                setTimeout(() => indicator.remove(), 200);
            });
            draggedPieceId = "";
            activePiece = null;
            legalMoves = [];
            piece.style.opacity = "";
            piece.style.transition = "opacity 0.3s ease-out";
        });
        piece.addEventListener("dragover", (event) => {
            event.preventDefault();
        });
        piece.addEventListener("dragenter", () => {
            const square = document.querySelector(`#${piece.id}.board-square`);
            if (document.querySelector(`#${square.id}.highlight-square`)) {
                document.querySelector(`#${square.id}.highlight-square`).style.outline = "calc(var(--board-square-width) / 25) solid white";
            } else {
                square.style.outline = "calc(var(--board-square-width) / 25) solid white";
            }
            square.style.zIndex = "1";
            square.style.boxShadow = "0 0 calc(var(--board-square-width) * 3/50) calc(var(--board-square-width) / 100) rgba(0, 0, 0, 0.6)";
            if (document.querySelector(`#${square.id}.capture-indicator`)) {
                const moveIndicator = document.querySelector(`#${square.id}.capture-indicator`).style;
                moveIndicator.width = moveIndicator.height = "70%";
                moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-color)";
            }
        });
        piece.addEventListener("dragleave", () => {
            const square = document.querySelector(`#${piece.id}.board-square`);
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
        });
        piece.addEventListener("drop", (event) => {
            event.preventDefault();
            const square = document.querySelector(`#${piece.id}.board-square`);
            if (document.querySelector(`#${square.id}.highlight-square`)) {
                document.querySelector(`#${square.id}.highlight-square`).style.outline = "";
            }
            square.style.outline = "";
            square.style.zIndex = "";
            square.style.boxShadow = "";
            if (legalMoves.includes(square.id)) {
                piece.style.opacity = "0";
                setTimeout(() => piece.remove(), 300);
                movePiece(square.id, true);
                halfmoveClock = 0;
            }
        });
    });
    document.querySelectorAll(".board-square").forEach(square => {
        square.addEventListener("dragover", (event) => {
            event.preventDefault();
        });
        square.addEventListener("dragenter", () => {
            square.style.outline = "calc(var(--board-square-width) / 25) solid white";
            square.style.zIndex = "1";
            square.style.boxShadow = "0 0 calc(var(--board-square-width) * 3/50) calc(var(--board-square-width) / 100) rgba(0, 0, 0, 0.6)";
            if (document.querySelector(`#${square.id}.empty-move-indicator`)) {
                const moveIndicator = document.querySelector(`#${square.id}.empty-move-indicator`).style;
                moveIndicator.width = moveIndicator.height = "50%";
            } else if (document.querySelector(`#${square.id}.capture-indicator`)) {
                const moveIndicator = document.querySelector(`#${square.id}.capture-indicator`).style;
                moveIndicator.width = moveIndicator.height = "70%";
                moveIndicator.boxShadow = "inset 0 0 0 calc(var(--board-square-width) / 2) var(--move-indicator-color)";
            }
        });
        square.addEventListener("dragleave", () => {
            square.style.outline = "";
            square.style.zIndex = "";
            square.style.boxShadow = "";
            if (document.querySelector(`#${square.id}.empty-move-indicator`)) {
                const moveIndicator = document.querySelector(`#${square.id}.empty-move-indicator`).style;
                moveIndicator.width = moveIndicator.height = "";
            } else if (document.querySelector(`#${square.id}.capture-indicator`)) {
                const moveIndicator = document.querySelector(`#${square.id}.capture-indicator`).style;
                moveIndicator.width = moveIndicator.height = "";
                moveIndicator.boxShadow = "";
            }
        });
        square.addEventListener("drop", (event) => {
            event.preventDefault();
            square.style.outline = "";
            square.style.zIndex = "";
            square.style.boxShadow = "";
            if (legalMoves.includes(square.id)) movePiece(square.id, true);
        });
    });
    document.addEventListener("dragover", (event) => {
        event.preventDefault();
    });
    document.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!event.target.classList.contains("board-square")) {
            document.querySelectorAll(".move-indicator").forEach(indicator => {
                indicator.style.animation = "fade-out 0.2s var(--emphasis-animation)";
                setTimeout(() => indicator.remove(), 200);
            });
        }
    });
}
let isBoardFlipped = false;
let piecePositions = [];
let activeColor = "", castlingRights = "", enPassantSquare = "", halfmoveClock = "", fullmoveNumber = "";
let activePiece = null, legalMoves = [];
let pieceMoveAnimation = "ease-in-out";
let lastMoveSquares = [], selectedSquare = "";
let prevFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let isFenValid = true;
const fenInputBox = document.getElementById("fen-input");
fenInputBox.value = prevFen;
const parameters = location.search.replace(/%20/g, " ").split("?");
if (parameters != "") {
    const firstParameter = parameters[1];
    switch (firstParameter.slice(0, 4)) {
        case "fen=":
            prevFen = fenInputBox.value = firstParameter.slice(4, firstParameter.length);
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
checkFenValidity(fenInputBox.value);
if (!isFenValid) {
    alert("The FEN specified by the URL is not valid.\nEnter a valid FEN.");
    parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
}
setUpEmptyBoard();
setUpPieces();
if (isBoardFlipped) {
    isBoardFlipped = !isBoardFlipped;
    flipBoard();
}

function showFeedbackContainer() {
    document.getElementById("feedback-input-container").appendChild(feedbackInputBox);
    document.getElementById("feedback-input-container").style.display = "block";
}
