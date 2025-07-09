document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('sudoku-grid');
    let selectedCell = null; // To keep track of the currently selected cell
    let currentPuzzle = [];
    let currentSolution = [];
    let timerStarted = false;
    let hintsRemaining = 5;
    let paused = false;
    let elapsedTime = 0;
    let inactivityTimer;

    // Get button references
    const newGameBtn = document.getElementById('new-game-btn');
    const timerDisplay = document.getElementById('timer');
    const hintBtn = document.getElementById('hint-btn');
    let startTime;
    let timerInterval;

    function resetInactivityTimer() {
        if (timerStarted && !paused) {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(pauseTimer, 60000);
        }
    }

    function setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetInactivityTimer);
        });
    }

    function pauseTimer() {
        if (timerStarted && !paused) {
            clearInterval(timerInterval);
            elapsedTime += Date.now() - startTime;
            paused = true;
        }
    }

    function resumeTimer() {
        if (timerStarted && paused) {
            startTime = Date.now();
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimerDisplay, 1000);
            paused = false;
        }
    }

    function startTimer() {
        if (!timerStarted) {
            startTime = Date.now();
            elapsedTime = 0;
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimerDisplay, 1000);
            timerStarted = true;
            paused = false;
            resetInactivityTimer(); // Start the first inactivity timer
        }
    }

    function stopTimer() {
        clearInterval(timerInterval);
        clearTimeout(inactivityTimer);
        timerStarted = false;
        paused = false;
        elapsedTime = 0;
    }

    function updateTimerDisplay() {
        const currentElapsedTime = elapsedTime + (paused ? 0 : Date.now() - startTime);
        const minutes = Math.floor(currentElapsedTime / 60000);
        const seconds = Math.floor((currentElapsedTime % 60000) / 1000);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function giveHint() {
        if (hintsRemaining <= 0) {
            return; // Or show a message
        }

        const emptyCells = [];
        grid.querySelectorAll('.cell input').forEach(input => {
            if (input.value === '') {
                emptyCells.push(input.parentNode);
            }
        });

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const row = parseInt(randomCell.dataset.row);
            const col = parseInt(randomCell.dataset.col);
            const solution = currentSolution[row][col];

            const input = randomCell.querySelector('input');
            input.value = solution;
            randomCell.classList.add('hint-cell'); // for styling
            input.readOnly = true;

            hintsRemaining--;
            updateHintDisplay();
        } else {
            alert("The board is full!");
        }
    }

    function updateHintDisplay() {
        hintBtn.textContent = `Hint (${hintsRemaining})`;
        if (hintsRemaining === 0) {
            hintBtn.disabled = true;
        } else {
            hintBtn.disabled = false;
        }
    }

    function createGrid(puzzleData) {
        grid.innerHTML = ''; // Clear existing grid
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;

                cell.addEventListener('click', () => {
                    if (paused) resumeTimer();
                    else startTimer();
                    // Deselect previous cell
                    if (selectedCell) {
                        selectedCell.classList.remove('selected');
                        // Optional: animate deselection
                        anime({
                            targets: selectedCell,
                            backgroundColor: '#fff', // Or whatever default background is
                            duration: 200
                        });
                    }

                    // Select current cell
                    selectedCell = cell;
                    selectedCell.classList.add('selected');

                    // Animate selection
                    anime({
                        targets: selectedCell,
                        backgroundColor: '#e0e0e0', // Highlight color
                        duration: 200
                    });

                    // If it's an input cell, focus the input
                    const inputElement = cell.querySelector('input');
                    if (inputElement) {
                        inputElement.focus();
                    }
                });

                if (puzzleData[i][j] !== 0) {
                    cell.textContent = puzzleData[i][j];
                    cell.classList.add('given');
                } else {
                    const input = document.createElement('input');
                    input.type = 'text'; // Use text to avoid number spinners
                    input.maxLength = 1;
                    input.addEventListener('input', (e) => {
                        if (paused) resumeTimer();
                        else startTimer();
                        // Allow only numbers 1-9
                        e.target.value = e.target.value.replace(/[^1-9]/g, '');

                        const row = parseInt(e.target.parentNode.dataset.row);
                        const col = parseInt(e.target.parentNode.dataset.col);
                        const enteredValue = parseInt(e.target.value);
                        const correctValue = currentSolution[row][col]; // Use currentSolution
                        const cellElement = e.target.parentNode;

                        // Animation for number input
                        if (e.target.value !== '') { // Only animate if a number is entered
                            anime({
                                targets: e.target,
                                scale: [
                                    {value: 1.2, easing: 'easeOutSine', duration: 100},
                                    {value: 1, easing: 'easeInOutQuad', duration: 200}
                                ],
                                duration: 300
                            });

                            // Error feedback
                            if (enteredValue !== correctValue) {
                                cellElement.classList.add('error');
                                anime({
                                    targets: cellElement,
                                    translateX: [
                                        {value: -5, duration: 50, easing: 'easeInOutQuad'},
                                        {value: 5, duration: 50, easing: 'easeInOutQuad'},
                                        {value: -5, duration: 50, easing: 'easeInOutQuad'},
                                        {value: 5, duration: 50, easing: 'easeInOutQuad'},
                                        {value: 0, duration: 50, easing: 'easeInOutQuad'}
                                    ],
                                    duration: 250,
                                    complete: () => {
                                        // Optionally remove error class after animation, or keep it until corrected
                                        // cellElement.classList.remove('error');
                                    }
                                });
                            } else {
                                cellElement.classList.remove('error'); // Remove error if corrected
                            }
                        } else {
                            cellElement.classList.remove('error'); // Remove error if input is cleared
                        }
                    });
                    cell.appendChild(input);
                }
                grid.appendChild(cell);
            }
        }
    }

    async function fetchNewPuzzle(difficulty = 'easy') {
        let apiDifficulty = 'EASY'; // Default GraphQL difficulty
        switch (difficulty) {
            case 'easy':
                apiDifficulty = 'EASY';
                break;
            case 'medium':
                apiDifficulty = 'MEDIUM';
                break;
            case 'hard':
                apiDifficulty = 'HARD';
                break;
            case 'challenge': // Map challenge to a very hard difficulty if available, or just HARD
                apiDifficulty = 'HARD'; // Assuming HARD for challenge, or we can try a different value if API supports
                break;
        }

        // GraphQL query to request a puzzle (without specific difficulty filtering for now)
        const graphqlQuery = `{
            newboard(limit:1) {
                grids {
                    value
                    solution
                    difficulty
                }
            }
        }`;

        try {
            const response = await fetch(`https://sudoku-api.vercel.app/api/dosuku?query=${encodeURIComponent(graphqlQuery)}`);
            const data = await response.json();

            if (data.newboard && data.newboard.grids && data.newboard.grids.length > 0) {
                currentPuzzle = data.newboard.grids[0].value;
                currentSolution = data.newboard.grids[0].solution;
                stopTimer();
                timerDisplay.textContent = '00:00';
                createGrid(currentPuzzle);
                hintsRemaining = 5;
                updateHintDisplay();

                // Re-run grid loading animation
                anime({
                    targets: '.cell',
                    scale: [
                        {value: .1, easing: 'easeOutSine', duration: 500},
                        {value: 1, easing: 'easeInOutQuad', duration: 1200}
                    ],
                    delay: anime.stagger(20, {grid: [9, 9], from: 'center'})
                });
            } else {
                console.error('API response did not contain puzzle data:', data);
                alert('Failed to load new puzzle. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching puzzle:', error);
            alert('Error fetching puzzle. Please check your internet connection.');
        } finally {
            // Re-enable buttons, hide loading indicator
            // ... (add later if needed)
        }
    }

    // Initial load
    fetchNewPuzzle();
    setupActivityListeners();

    // Event listener for New Game button
    newGameBtn.addEventListener('click', () => {
        fetchNewPuzzle().then(() => {
            startTimer();
        });
    });

    // Event listener for Hint button
    hintBtn.addEventListener('click', giveHint);

    // Theme switcher logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    // Apply saved theme on load
    if (currentTheme) {
        document.body.classList.add(currentTheme);
    } else {
        // Default to light theme if no preference is saved
        document.body.classList.add('light-theme'); // Add a default class for clarity
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
    });
});
