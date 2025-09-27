document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selection ---
    const boardElement = document.getElementById('sudoku-board');
    const numpadElement = document.getElementById('numpad');
    const messageArea = document.getElementById('message-area');
    const themeToggle = document.getElementById('theme-toggle');

    // --- State Variables ---
    let selectedCell = null;
    let moveHistory = [];
    let lastFocusedValue = '';

    // --- Function Definitions ---

    // Create the 9x9 grid
    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = '1';
            input.addEventListener('input', handleCellInput);
            input.addEventListener('focus', (e) => {
                lastFocusedValue = e.target.value;
                handleCellClick(cell);
            });
            cell.appendChild(input);
            boardElement.appendChild(cell);
        }
    }

    // Create the number pad
    function createNumpad() {
        numpadElement.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.addEventListener('click', () => {
                if (selectedCell && !selectedCell.querySelector('input').classList.contains('fixed')) {
                    const input = selectedCell.querySelector('input');
                    lastFocusedValue = input.value;
                    input.value = i;
                    handleCellInput({ target: input });
                }
            });
            numpadElement.appendChild(button);
        }
    }

    // Handle clicking on a cell for highlighting
    function handleCellClick(cell) {
        selectedCell = cell;
        const allCells = document.querySelectorAll('.cell');
        allCells.forEach(c => c.classList.remove('selected', 'highlighted'));
        cell.classList.add('selected');
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxStartRow = row - row % 3;
        const boxStartCol = col - col % 3;
        for (let i = 0; i < 9; i++) {
            document.querySelector(`[data-index='${row * 9 + i}']`).classList.add('highlighted');
            document.querySelector(`[data-index='${i * 9 + col}']`).classList.add('highlighted');
        }
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const boxIndex = (boxStartRow + r) * 9 + (boxStartCol + c);
                document.querySelector(`[data-index='${boxIndex}']`).classList.add('highlighted');
            }
        }
    }

    // Handle user input and record move for undo
    function handleCellInput(e) {
        const input = e.target;
        const cell = input.parentElement;
        const newValue = input.value;
        if (lastFocusedValue !== newValue) {
            moveHistory.push({ index: parseInt(cell.dataset.index), oldValue: lastFocusedValue });
            lastFocusedValue = newValue;
        }
        if (!/^[1-9]$/.test(newValue) && newValue !== '') {
            input.value = '';
            return;
        }
        const grid = getBoardValues();
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        input.classList.remove('error');
        if (newValue !== '' && !isSafeForValidation(grid, row, col, parseInt(newValue))) {
            input.classList.add('error');
        }
    }

    // Generate a board based on difficulty
    window.generateBoard = function(level) {
        resetBoard();
        const puzzles = {
            easy: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
            medium: '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
            hard: '300000000000905000040000506008000060000070000020000800607000030000102000000000009'
        };
        const puzzle = puzzles[level].split('');
        const inputs = document.querySelectorAll('.cell input');
        inputs.forEach((input, i) => {
            if (puzzle[i] !== '0') {
                input.value = puzzle[i];
                input.classList.add('fixed');
                input.readOnly = true;
            }
        });
        messageArea.textContent = `Generated ${level} puzzle. Good luck!`;
    };

    // Reset the board to empty state
    window.resetBoard = function() {
        document.getElementById('sudoku-board').classList.remove('board-solved');
        const inputs = document.querySelectorAll('.cell input');
        inputs.forEach(input => {
            input.value = '';
            input.readOnly = false;
            input.classList.remove('fixed', 'error');
        });
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected', 'highlighted'));
        messageArea.textContent = '';
        selectedCell = null;
        moveHistory = [];
    };

    // Undo the last move
    window.undoMove = function() {
        if (moveHistory.length === 0) {
            messageArea.textContent = 'Nothing to undo!';
            setTimeout(() => { if (messageArea.textContent === 'Nothing to undo!') messageArea.textContent = '' }, 2000);
            return;
        }
        const lastMove = moveHistory.pop();
        const { index, oldValue } = lastMove;
        const targetInput = document.querySelectorAll('.cell input')[index];
        targetInput.value = oldValue;
        handleCellInput({ target: targetInput });
    };

    // --- Solver Logic ---
    function getBoardValues() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        document.querySelectorAll('.cell input').forEach((input, i) => {
            grid[Math.floor(i / 9)][i % 9] = input.value ? parseInt(input.value) : 0;
        });
        return grid;
    }

    function setBoardValues(grid) {
        document.querySelectorAll('.cell input').forEach((input, i) => {
            const value = grid[Math.floor(i / 9)][i % 9];
            input.value = value === 0 ? '' : value;
        });
    }

    function isSafe(grid, row, col, num) {
        for (let x = 0; x < 9; x++) if (grid[row][x] === num || grid[x][col] === num) return false;
        const startRow = row - row % 3, startCol = col - col % 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[i + startRow][j + startCol] === num) return false;
        return true;
    }

    function isSafeForValidation(grid, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if ((x !== col && grid[row][x] === num) || (x !== row && grid[x][col] === num)) return false;
        }
        const startRow = row - row % 3, startCol = col - col % 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            if ((i + startRow !== row || j + startCol !== col) && grid[i + startRow][j + startCol] === num) return false;
        }
        return true;
    }

    function sudokuSolver(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isSafe(grid, row, col, num)) {
                            grid[row][col] = num;
                            if (sudokuSolver(grid)) return true;
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    function triggerWinAnimation() {
        boardElement.classList.add('board-solved');
        setTimeout(() => boardElement.classList.remove('board-solved'), 4000);
    }

    window.solveSudoku = function() {
        moveHistory = [];
        let grid = getBoardValues();
        if (sudokuSolver(grid)) {
            setBoardValues(grid);
            messageArea.textContent = 'Solved!';
            triggerWinAnimation();
        } else {
            messageArea.textContent = 'No solution exists for this board!';
            messageArea.style.color = 'var(--error-color)';
        }
    };

    // --- Theme Toggle Logic ---
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark-mode');
        } else {
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light-mode');
        }
    });

    // --- Initial Setup ---
    if (localStorage.getItem('theme') === 'dark-mode') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    createBoard();
    createNumpad();
});