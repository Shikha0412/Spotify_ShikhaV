// --- Global State ---
let activeView = 'welcome';
let activeGenerator = null;

// ** NEW: Automation State **
let isPaused = true;
let animationSpeed = 500; // Default speed (ms)
let animationTimer = null; // To hold the setTimeout reference
let activePlayPauseButton = null; // To hold the current view's play button
let maxProfit = 0; // Global for Knapsack

// ** NEW: Fullscreen State **
let isFullscreen = false;
let fullscreenBackdrop = null;


// --- Navigation ---
function showView(viewId) {
    // 1. Hide all views
    document.querySelectorAll('.paradigm-view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // 2. Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-brand', 'text-white');
        link.classList.add('text-gray-300');
    });

    // 3. Show the target view
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    
    // 4. Activate the target nav link
    const targetLink = document.getElementById(`nav-${viewId}`);
    if (targetLink) {
        targetLink.classList.add('bg-brand', 'text-white');
        targetLink.classList.remove('text-gray-300');
    }

    // 5. Reset any running algorithm
    if (animationTimer) clearTimeout(animationTimer);
    isPaused = true;

    // 5b. Exit fullscreen if active
    if (isFullscreen) {
        // Find the active fullscreen container and toggle it to exit
        const activeFsContainer = document.querySelector('[data-is-fullscreen="true"]');
        if (activeFsContainer) {
            const activeViewId = activeFsContainer.id.split('-')[0];
            toggleTreeFullscreen(activeViewId); // This will toggle isFullscreen back to false
        }
    }
    
    activeGenerator = null;
    activeView = viewId;
    
    // 6. Set the new play/pause button
    activePlayPauseButton = document.getElementById(`${viewId}-play-pause`);
    if (activePlayPauseButton) {
        activePlayPauseButton.disabled = true;
        activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
    }
}

// --- NEW: Animation Controls ---

function updateSpeed(value) {
    // max 100 -> 2050 - 2000 = 50ms (fast)
    // min 5   -> 2050 - 100 = 1950ms (slow)
    animationSpeed = 2050 - (parseInt(value) * 20);
    // Sync all sliders
    document.querySelectorAll('.speed-slider').forEach(slider => {
        slider.value = value;
    });
}

function togglePlayPause() {
    if (!activeGenerator) return; // Do nothing if no generator
    
    isPaused = !isPaused;
    
    if (isPaused) {
        // We just paused
        if (activePlayPauseButton) {
            activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
        }
        if (animationTimer) {
            clearTimeout(animationTimer); // Stop the next scheduled step
        }
    } else {
        // We just un-paused
        if (activePlayPauseButton) {
            activePlayPauseButton.innerHTML = '<i class="fa-solid fa-pause mr-2"></i>Pause';
        }
        runAnimation(); // Start the loop
    }
}

async function runAnimation() {
    if (isPaused || !activeGenerator) {
        return; // Stop the loop
    }

    // Add a small delay for CSS transitions to catch up
    await new Promise(r => setTimeout(r, 50)); 
    
    const result = activeGenerator.next();
    
    if (result.done) {
        activeGenerator = null;
        isPaused = true;
        if (activePlayPauseButton) {
            activePlayPauseButton.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Finished';
            activePlayPauseButton.disabled = true;
        }
        // Special case for Knapsack log
        if (activeView === 'branch') {
             logMessage('branch-log-container', `Finished! Max Profit: ${maxProfit}`, 'success');
        }
    } else {
        // Schedule the next step
        animationTimer = setTimeout(runAnimation, animationSpeed);
    }
}

// --- NEW: Fullscreen Toggle ---
function toggleTreeFullscreen(viewId) {
    const vizContainer = document.getElementById(`${viewId}-viz-container`);
    const button = document.getElementById(`${viewId}-fullscreen-btn`);
    const icon = button ? button.querySelector('i') : null;

    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        // --- ENTER FULLSCREEN ---
        if (!vizContainer || !icon) return; 

        vizContainer.classList.add('viz-fullscreen');
        
        // Create and show backdrop
        if (!fullscreenBackdrop) {
            fullscreenBackdrop = document.createElement('div');
            fullscreenBackdrop.className = 'fullscreen-backdrop';
            // Add click listener to exit fullscreen
            fullscreenBackdrop.onclick = () => {
                const activeFsContainer = document.querySelector('[data-is-fullscreen="true"]');
                if (activeFsContainer) {
                    const activeViewId = activeFsContainer.id.split('-')[0];
                    toggleTreeFullscreen(activeViewId); // Re-toggle to exit
                }
            };
            document.body.appendChild(fullscreenBackdrop);
        }
        fullscreenBackdrop.style.display = 'block';

        // Change icon
        icon.classList.remove('fa-expand');
        icon.classList.add('fa-compress');

        // Store which container is fullscreen
        vizContainer.dataset.isFullscreen = 'true';

    } else {
        // --- EXIT FULLSCREEN ---
        const activeFsContainer = document.querySelector('[data-is-fullscreen="true"]');
        
        if (activeFsContainer) {
            activeFsContainer.classList.remove('viz-fullscreen');
            delete activeFsContainer.dataset.isFullscreen;

            // Find its button to reset the icon
            const activeViewId = activeFsContainer.id.split('-')[0]; // 'dnc' or 'branch'
            const activeButton = document.getElementById(`${activeViewId}-fullscreen-btn`);
            if (activeButton) {
                const activeIcon = activeButton.querySelector('i');
                activeIcon.classList.remove('fa-compress');
                activeIcon.classList.add('fa-expand');
            }
        }
        
        // Hide backdrop
        if (fullscreenBackdrop) {
            fullscreenBackdrop.style.display = 'none';
        }
    }
}


// --- Logging Helper ---
function logMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML += `<p class="log-entry log-${type}">${message}</p>`;
    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// ===============================================
// --- 1. Divide & Conquer (Merge Sort) ---
// ===============================================

function startDNC() {
    if (animationTimer) clearTimeout(animationTimer);
    isPaused = true;

    const logContainer = document.getElementById('dnc-log-container');
    const vizContainer = document.getElementById('dnc-viz-container');
    logContainer.innerHTML = '';
    vizContainer.innerHTML = '';
    
    const inputString = document.getElementById('dnc-array-input').value;
    const arr = inputString.split(',')
                           .map(s => parseInt(s.trim()))
                           .filter(n => !isNaN(n)); 

    if (arr.length === 0) {
        logMessage('dnc-log-container', 'Invalid input. Please enter numbers separated by commas (e.g., 5, 2, 8).', 'backtrack');
        return;
    }
    if (arr.length > 16) {
        logMessage('dnc-log-container', 'Error: Array is too large. Please use 16 numbers or less for a good visualization.', 'backtrack');
        return;
    }

    logMessage('dnc-log-container', `Starting Merge Sort on: [${arr.join(', ')}]`, 'info');
    
    const rootNode = createDncNode(arr);
    vizContainer.appendChild(rootNode);

    activeGenerator = dncGenerator(arr, rootNode, 'dnc-log-container');
    
    activePlayPauseButton = document.getElementById('dnc-play-pause');
    if (activePlayPauseButton) {
        activePlayPauseButton.disabled = false;
        activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
    }
}

// Helper to create an array visualization
function createArrayViz(arr) {
    const container = document.createElement('div');
    container.className = 'array-container';
    container.innerHTML = arr.map(val => `<div class="array-cell">${val}</div>`).join('');
    return container;
}

// Helper to create a DOM node for the recursion tree
function createDncNode(arr) {
    const node = document.createElement('div');
    node.className = 'dnc-node';
    
    const status = document.createElement('div');
    status.className = 'array-label text-xs text-yellow-400';
    status.textContent = 'Unsorted';
    node.appendChild(status);
    
    node.appendChild(createArrayViz(arr));
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'dnc-node-children hidden';
    node.appendChild(childrenContainer);

    const mergeContainer = document.createElement('div');
    mergeContainer.className = 'dnc-merge-area hidden';
    node.appendChild(mergeContainer);
    
    return node;
}

// The recursive generator for Merge Sort
function* dncGenerator(arr, node, logId) {
    const status = node.querySelector('.array-label');
    node.classList.add('state-active');
    
    // Base case
    if (arr.length <= 1) {
        logMessage(logId, `Base case: Array [${arr.join(', ')}] is sorted.`, 'success');
        status.textContent = 'Sorted (Base Case)';
        node.classList.remove('state-active');
        node.classList.add('state-sorted');
        node.querySelector('.array-container').classList.add('state-sorted');
        yield;
        return arr;
    }

    // Divide
    const mid = Math.floor(arr.length / 2);
    const leftArr = arr.slice(0, mid);
    const rightArr = arr.slice(mid);
    
    logMessage(logId, `Divide: [${arr.join(', ')}] -> [${leftArr.join(', ')}] and [${rightArr.join(', ')}]`, 'info');
    
    const childrenContainer = node.querySelector('.dnc-node-children');
    const leftNode = createDncNode(leftArr);
    const rightNode = createDncNode(rightArr);
    childrenContainer.appendChild(leftNode);
    childrenContainer.appendChild(rightNode);
    childrenContainer.classList.remove('hidden');
    status.textContent = 'Dividing...';
    yield;

    // Recurse Left
    logMessage(logId, 'Recurse left...', 'info');
    node.classList.remove('state-active');
    const sortedLeft = yield* dncGenerator(leftArr, leftNode, logId);
    node.classList.add('state-active');
    logMessage(logId, `Left complete. Result: [${sortedLeft.join(', ')}]`, 'info');
    yield;

    // Recurse Right
    logMessage(logId, 'Recurse right...', 'info');
    node.classList.remove('state-active');
    const sortedRight = yield* dncGenerator(rightArr, rightNode, logId);
    node.classList.add('state-active');
    logMessage(logId, `Right complete. Result: [${sortedRight.join(', ')}]`, 'info');
    yield;
    
    // Merge
    logMessage(logId, `Merge: [${sortedLeft.join(', ')}] and [${sortedRight.join(', ')}]`, 'place');
    status.textContent = 'Merging...';
    const mergeArea = node.querySelector('.dnc-merge-area');
    mergeArea.classList.remove('hidden');
    
    const sortedResult = yield* mergeHelper(sortedLeft, sortedRight, mergeArea, logId);
    
    // Update node with sorted array
    const finalArrayViz = createArrayViz(sortedResult);
    finalArrayViz.querySelectorAll('.array-cell').forEach(cell => cell.classList.add('state-sorted'));
    node.replaceChild(finalArrayViz, node.querySelector('.array-container'));
    
    status.textContent = 'Sorted';
    node.classList.remove('state-active');
    node.classList.add('state-sorted');
    logMessage(logId, `Merge complete. Result: [${sortedResult.join(', ')}]`, 'success');
    yield;
    
    return sortedResult;
}

// The generator for the merge step
function* mergeHelper(left, right, mergeArea, logId) {
    // Setup merge visualization
    mergeArea.innerHTML = `
        <div class="array-label" id="merge-left-label">Left</div>
        <div class="array-container" id="merge-left">
            ${left.map(val => `<div class="array-cell">${val}</div>`).join('')}
        </div>
        <div class="array-label mt-2" id="merge-right-label">Right</div>
        <div class="array-container" id="merge-right">
            ${right.map(val => `<div class="array-cell">${val}</div>`).join('')}
        </div>
        <div class="array-label mt-2">Result</div>
        <div class="array-container" id="merge-result"></div>
    `;
    yield;

    const leftCells = Array.from(mergeArea.querySelectorAll('#merge-left .array-cell'));
    const rightCells = Array.from(mergeArea.querySelectorAll('#merge-right .array-cell'));
    const resultContainer = mergeArea.querySelector('#merge-result');
    
    let result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
        // Highlight cells being compared
        leftCells[i].classList.add('state-comparing');
        rightCells[j].classList.add('state-comparing');
        logMessage(logId, `Compare: ${left[i]} (left) and ${right[j]} (right)`, 'try');
        yield;

        if (left[i] <= right[j]) {
            logMessage(logId, `Take ${left[i]} from left.`, 'place');
            result.push(left[i]);
            leftCells[i].classList.remove('state-comparing');
            resultContainer.appendChild(leftCells[i]); // Move the cell
            i++;
        } else {
            logMessage(logId, `Take ${right[j]} from right.`, 'place');
            result.push(right[j]);
            rightCells[j].classList.remove('state-comparing');
            resultContainer.appendChild(rightCells[j]); // Move the cell
            j++;
        }
        yield;
    }

    // Add remaining elements from left
    while (i < left.length) {
        logMessage(logId, `Take remaining ${left[i]} from left.`, 'place');
        result.push(left[i]);
        resultContainer.appendChild(leftCells[i]);
        i++;
        yield;
    }

    // Add remaining elements from right
    while (j < right.length) {
        logMessage(logId, `Take remaining ${right[j]} from right.`, 'place');
        result.push(right[j]);
        resultContainer.appendChild(rightCells[j]);
        j++;
        yield;
    }
    
    // Mark all moved cells as sorted
    resultContainer.querySelectorAll('.array-cell').forEach(cell => cell.classList.add('state-sorted'));
    yield;

    // Hide the now-empty Left and Right containers
    logMessage(logId, 'Cleaning up merge area...', 'info');
    mergeArea.querySelector('#merge-left-label').classList.add('hidden');
    mergeArea.querySelector('#merge-left').classList.add('hidden');
    mergeArea.querySelector('#merge-right-label').classList.add('hidden');
    mergeArea.querySelector('#merge-right').classList.add('hidden');
    yield;
    
    return result;
}


// ===============================================
// --- 2. Greedy (Coin Change) ---
// ===============================================

function startGreedy() {
    if (animationTimer) clearTimeout(animationTimer);
    isPaused = true;
    
    const amount = parseInt(document.getElementById('greedy-amount').value);
    const coins = [100, 50, 20, 10, 5, 2, 1];
    const logContainer = document.getElementById('greedy-log-container');
    
    // Reset UI
    logContainer.innerHTML = '';
    document.getElementById('greedy-total-amount').textContent = amount;
    document.getElementById('greedy-remaining-amount').textContent = amount;
    
    const coinsContainer = document.getElementById('greedy-coins-container');
    coinsContainer.innerHTML = '';
    coins.forEach(coin => {
        coinsContainer.innerHTML += `
            <div class="text-center p-3 bg-gray-700 rounded-lg w-20">
                <div class="text-2xl font-bold text-brand-light">₹${coin}</div>
                <div id="greedy-coin-count-${coin}" class="text-3xl font-bold text-white">0</div>
            </div>
        `;
    });
    
    activeGenerator = greedyGenerator(amount, coins, logContainer);
    
    activePlayPauseButton = document.getElementById('greedy-play-pause');
    if (activePlayPauseButton) {
        activePlayPauseButton.disabled = false;
        activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
    }
}

function* greedyGenerator(amount, coins, logEl) {
    logMessage('greedy-log-container', `Starting with amount: ₹${amount}`, 'info');
    yield;
    
    let remaining = amount;
    let coinCounts = {};
    
    for (const coin of coins) {
        coinCounts[coin] = 0;
        const coinCountEl = document.getElementById(`greedy-coin-count-${coin}`);
        const coinEl = coinCountEl.parentElement;
        
        coinEl.classList.add('ring-2', 'ring-yellow-400');
        logMessage('greedy-log-container', `Checking coin: ₹${coin}. Remaining: ₹${remaining}`, 'try');
        yield;
        
        while (remaining >= coin) {
            remaining -= coin;
            coinCounts[coin]++;
            
            document.getElementById('greedy-remaining-amount').textContent = remaining;
            coinCountEl.textContent = coinCounts[coin];
            logMessage('greedy-log-container', `Took ₹${coin}. Remaining: ₹${remaining}`, 'place');
            yield;
        }
        
        logMessage('greedy-log-container', `Done with ₹${coin}.`, 'info');
        coinEl.classList.remove('ring-2', 'ring-yellow-400');
        coinEl.classList.add('ring-2', 'ring-brand'); 
        yield;
    }
    
    logMessage('greedy-log-container', 'Finished!', 'success');
}

// ===============================================
// --- 3. Backtracking (N-Queens) ---
// ===============================================

function startNQueens() {
    if (animationTimer) clearTimeout(animationTimer);
    isPaused = true;
    
    const N = parseInt(document.getElementById('nqueens-n').value);
    const boardContainer = document.getElementById('nqueens-board-container');
    const logContainer = document.getElementById('nqueens-log-container');
    
    logContainer.innerHTML = '';
    logMessage('nqueens-log-container', `Starting N-Queens for N=${N}`, 'info');

    let board = Array(N).fill(0).map(() => Array(N).fill(0));

    boardContainer.innerHTML = '';
    boardContainer.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    boardContainer.classList.add('grid', 'border', 'border-gray-600', 'rounded-lg', 'overflow-hidden');
    
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement('div');
            cell.className = `queen-cell cell-${r}-${c}`;
            if ((r + c) % 2 === 0) {
                cell.style.backgroundColor = '#4b5563';
            } else {
                cell.style.backgroundColor = '#374151';
            }
            boardContainer.appendChild(cell);
        }
    }
    
    activeGenerator = nQueensGenerator(board, 0, N, logContainer, boardContainer);
    
    activePlayPauseButton = document.getElementById('backtracking-play-pause');
    if (activePlayPauseButton) {
        activePlayPauseButton.disabled = false;
        activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
    }
}

function isSafe(board, row, col, N) {
    for (let i = 0; i < col; i++)
        if (board[row][i]) return false;

    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--)
        if (board[i][j]) return false;

    for (let i = row, j = col; j >= 0 && i < N; i++, j--)
        if (board[i][j]) return false;

    return true;
}

function* nQueensGenerator(board, col, N, logEl, boardEl) {
    if (col >= N) {
        logMessage('nqueens-log-container', 'SOLUTION FOUND!', 'success');
        yield { solution: true }; 
        return true;
    }

    for (let row = 0; row < N; row++) {
        const cell = boardEl.querySelector(`.cell-${row}-${col}`);
        
        logMessage('nqueens-log-container', `Trying queen at [${row}, ${col}]`, 'try');
        cell.classList.add('trying');
        yield; 
        
        if (isSafe(board, row, col, N)) {
            board[row][col] = 1;
            cell.innerHTML = `<i class="fa-solid fa-chess-queen queen-icon"></i>`;
            yield; 
            cell.querySelector('.queen-icon').classList.add('placed');
            logMessage('nqueens-log-container', `Placed queen at [${row}, ${col}]`, 'place');
            cell.classList.remove('trying');
            yield; 
            
            const result = yield* nQueensGenerator(board, col + 1, N, logEl, boardEl);
            if (result && result.solution) {
                return true; 
            }

            logMessage('nqueens-log-container', `Backtracking from [${row}, ${col}]`, 'backtrack');
            cell.classList.add('unsafe');
            yield; 
            
            board[row][col] = 0; 
            const icon = cell.querySelector('.queen-icon');
            if (icon) icon.classList.remove('placed');
            
            yield new Promise(r => setTimeout(r, 300)); 
            cell.innerHTML = ''; 
            cell.classList.remove('unsafe');
            yield; 

        } else {
            logMessage('nqueens-log-container', `[${row}, ${col}] is not safe.`, 'backtrack');
            cell.classList.add('unsafe');
            yield; 
            cell.classList.remove('trying');
            cell.classList.remove('unsafe');
            yield; 
        }
    }

    logMessage('nqueens-log-container', `No solution in column ${col}. Backtracking...`, 'backtrack');
    return false;
}


// ===============================================
// --- 4. Branch & Bound (0/1 Knapsack) ---
// ===============================================

// ** NEW: Knapsack Item class (object) **
class KnapsackItem {
    constructor(weight, value) {
        this.weight = weight;
        this.value = value;
        this.ratio = value / weight;
    }
}

// ** NEW: Knapsack Node class (object) **
class KnapsackNode {
    constructor(level, profit, weight, domNode) {
        this.level = level; // Level in the decision tree
        this.profit = profit; // Profit so far
        this.weight = weight; // Weight so far
        this.domNode = domNode; // Corresponding DOM element
        this.bound = 0; // Optimistic bound
    }
}

// ** NEW: Helper to create a DOM node for the Knapsack tree **
function createBranchNode(data) {
    const node = document.createElement('div');
    node.className = 'dnc-node'; // Re-use dnc-node style
    
    node.innerHTML = `
        <div class="array-label text-xs ${data.type === 'with' ? 'text-green-400' : 'text-red-400'}">${data.type === 'with' ? 'With' : 'Without'} Item ${data.level}</div>
        <p>Profit: ${data.p}</p>
        <p>Weight: ${data.w}</p>
        <p>Bound: ${data.b.toFixed(2)}</p>
    `;
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'dnc-node-children hidden';
    node.appendChild(childrenContainer);
    
    return node;
}

// ** NEW: Helper to calculate the optimistic bound **
function calculateBound(node, capacity, items) {
    let { level, profit, weight } = node;
    let bound = profit;
    let totalWeight = weight;

    // Start from the next item
    for (let i = level; i < items.length; i++) {
        if (totalWeight + items[i].weight <= capacity) {
            // Take the whole item
            totalWeight += items[i].weight;
            bound += items[i].value;
        } else {
            // Take a fraction of the item
            let remainingWeight = capacity - totalWeight;
            bound += remainingWeight * items[i].ratio;
            break; // We can't take any more
        }
    }
    return bound;
}

// ** UPDATED: Renamed startTSP to startBranch **
function startBranch() {
    if (animationTimer) clearTimeout(animationTimer);
    isPaused = true;
    
    const logContainer = document.getElementById('branch-log-container');
    const vizContainer = document.getElementById('branch-viz-container');
    logContainer.innerHTML = '';
    vizContainer.innerHTML = '';
    
    // 1. Parse Inputs
    const capacity = parseInt(document.getElementById('knapsack-capacity').value);
    const itemsInput = document.getElementById('knapsack-items').value.trim();
    
    let items;
    try {
        items = itemsInput.split('\n').map(line => {
            const parts = line.split(',').map(s => parseInt(s.trim()));
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
                throw new Error(`Invalid line: "${line}"`);
            }
            return new KnapsackItem(parts[0], parts[1]);
        });
    } catch (e) {
        logMessage('branch-log-container', `Invalid items format. Use 'weight, value' per line. ${e.message}`, 'backtrack');
        return;
    }
    
    if (isNaN(capacity) || items.length === 0) {
        logMessage('branch-log-container', 'Invalid capacity or no items provided.', 'backtrack');
        return;
    }

    // 2. Sort items by value/weight ratio (descending)
    items.sort((a, b) => b.ratio - a.ratio);
    
    logMessage('branch-log-container', `Starting Knapsack. Capacity=${capacity}`, 'info');
    logMessage('branch-log-container', `Sorted Items (by v/w): ${items.map(i => `[w:${i.weight}, v:${i.value}]`).join(', ')}`, 'info');

    // 3. Reset UI
    maxProfit = 0;
    document.getElementById('knapsack-max-profit').textContent = '0';
    
    // 4. Create Generator
    activeGenerator = knapsackGenerator(capacity, items, logContainer, vizContainer);
    
    activePlayPauseButton = document.getElementById('branch-play-pause');
    if (activePlayPauseButton) {
        activePlayPauseButton.disabled = false;
        activePlayPauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play';
    }
}

// ** NEW: Knapsack Generator Function (Best-First Search B&B) **
function* knapsackGenerator(capacity, items, logId, vizContainer) {
    // Priority queue, stores nodes to visit
    let queue = [];

    // Create root node
    const rootDomNode = createBranchNode({ type: 'Root', level: 0, p: 0, w: 0, b: 0 });
    const root = new KnapsackNode(0, 0, 0, rootDomNode);
    root.bound = calculateBound(root, capacity, items);
    
    rootDomNode.querySelector('p:nth-child(4)').textContent = `Bound: ${root.bound.toFixed(2)}`;
    rootDomNode.querySelector('div').textContent = 'Root Node';
    vizContainer.innerHTML = '';
    vizContainer.appendChild(rootDomNode);
    
    queue.push(root);
    logMessage(logId, `Root node bound = ${root.bound.toFixed(2)}`, 'info');
    yield;

    while (queue.length > 0) {
        // Sort queue to get the node with the highest bound (Best-First)
        queue.sort((a, b) => a.bound - b.bound); // We want to pop the highest
        let currentNode = queue.pop();

        currentNode.domNode.classList.add('state-active');
        logMessage(logId, `Visiting node (Lvl ${currentNode.level}, P: ${currentNode.profit}, W: ${currentNode.weight})`, 'try');
        yield;

        // Pruning
        if (currentNode.bound <= maxProfit) {
            logMessage(logId, `PRUNING: Bound (${currentNode.bound.toFixed(2)}) is not > Max Profit (${maxProfit})`, 'backtrack');
            currentNode.domNode.classList.remove('state-active');
            currentNode.domNode.classList.add('state-pruned'); // Add a style for this
            yield;
            continue;
        }

        // Reached a leaf node (all items considered)
        if (currentNode.level === items.length) {
            currentNode.domNode.classList.remove('state-active');
            continue;
        }

        let item = items[currentNode.level];

        // --- 1. 'With Item' Child ---
        let withWeight = currentNode.weight + item.weight;
        if (withWeight <= capacity) {
            let withProfit = currentNode.profit + item.value;
            
            // Check for new max profit
            if (withProfit > maxProfit) {
                maxProfit = withProfit;
                document.getElementById('knapsack-max-profit').textContent = maxProfit;
                logMessage(logId, `NEW MAX PROFIT FOUND: ${maxProfit}`, 'success');
                yield;
            }
            
            // Create 'with' node
            const withDomNode = createBranchNode({ type: 'with', level: currentNode.level + 1, p: withProfit, w: withWeight, b: 0 });
            const withNode = new KnapsackNode(currentNode.level + 1, withProfit, withWeight, withDomNode);
            withNode.bound = calculateBound(withNode, capacity, items);
            withDomNode.querySelector('p:nth-child(4)').textContent = `Bound: ${withNode.bound.toFixed(2)}`;
            
            // Add to tree viz
            currentNode.domNode.querySelector('.dnc-node-children').classList.remove('hidden');
            currentNode.domNode.querySelector('.dnc-node-children').appendChild(withDomNode);
            
            if (withNode.bound > maxProfit) {
                queue.push(withNode);
                logMessage(logId, `Queue 'With' (Lvl ${withNode.level}): Bound ${withNode.bound.toFixed(2)}`, 'place');
            } else {
                logMessage(logId, `Prune 'With' (Lvl ${withNode.level}): Bound ${withNode.bound.toFixed(2)} <= ${maxProfit}`, 'backtrack');
                withDomNode.classList.add('state-pruned');
            }
            yield;
        } else {
             logMessage(logId, `Cannot take item ${currentNode.level + 1}: Over capacity (${withWeight} > ${capacity})`, 'backtrack');
             yield;
        }

        // --- 2. 'Without Item' Child ---
        let withoutProfit = currentNode.profit;
        let withoutWeight = currentNode.weight;
        
        // Create 'without' node
        const withoutDomNode = createBranchNode({ type: 'without', level: currentNode.level + 1, p: withoutProfit, w: withoutWeight, b: 0 });
        const withoutNode = new KnapsackNode(currentNode.level + 1, withoutProfit, withoutWeight, withoutDomNode);
        withoutNode.bound = calculateBound(withoutNode, capacity, items);
        withoutDomNode.querySelector('p:nth-child(4)').textContent = `Bound: ${withoutNode.bound.toFixed(2)}`;

        // Add to tree viz
        currentNode.domNode.querySelector('.dnc-node-children').classList.remove('hidden');
        currentNode.domNode.querySelector('.dnc-node-children').appendChild(withoutDomNode);
        
        if (withoutNode.bound > maxProfit) {
            queue.push(withoutNode);
            logMessage(logId, `Queue 'Without' (Lvl ${withoutNode.level}): Bound ${withoutNode.bound.toFixed(2)}`, 'place');
        } else {
            logMessage(logId, `Prune 'Without' (Lvl ${withoutNode.level}): Bound ${withoutNode.bound.toFixed(2)} <= ${maxProfit}`, 'backtrack');
            withoutDomNode.classList.add('state-pruned');
        }
        yield;

        currentNode.domNode.classList.remove('state-active');
    }
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    showView('welcome'); // Show welcome screen by default
    
    const dncNav = document.getElementById('nav-dnc');
    if (dncNav) {
        dncNav.classList.remove('bg-brand', 'text-white');
        dncNav.classList.add('text-gray-300');
    }
});

