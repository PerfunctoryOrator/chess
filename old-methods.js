const PieceMoveMethods = {
    dragDrop: {
        mousemove: (event) => {
            event.preventDefault();
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
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "";
                piece.removeEventListener("mousedown", this.mousedown);
                piece.removeEventListener("touchstart", this.touchstart);
            });
        },
        add: function () {
            this.remove();
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "grab";
                piece.addEventListener("mousedown", this.mousedown);
                piece.addEventListener("touchstart", this.touchstart, { passive: false });
            });
        },
    },
    clickDragDrop: {
        mousemove: (event) => {
            event.preventDefault();
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
        document: (event) => {
            if (!event.target.classList.contains("chess-piece")) {
                removeLegalMoveIndicators();
                removeSquareHighlight();
                activePiece = null;
                hideLegal = true;
            }
        },
        remove: function () {
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "";
                piece.removeEventListener("mousedown", this.mousedown);
                piece.removeEventListener("touchstart", this.touchstart);
            });
            document.removeEventListener("click", this.document);
        },
        add: function () {
            this.remove();
            chessBoard.querySelectorAll(".chess-piece").forEach(piece => {
                piece.style.cursor = "grab";
                piece.addEventListener("mousedown", this.mousedown);
                piece.addEventListener("touchstart", this.touchstart, { passive: false });
            });
            document.addEventListener("click", this.document);
        },
    },
}
