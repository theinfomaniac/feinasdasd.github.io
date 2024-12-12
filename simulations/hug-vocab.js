const fetchVocabularyData = async () => {
    try {
        const response = await fetch('https://sheets.livepolls.app/api/spreadsheets/e20fc709-853b-45be-aa86-8fd4ea90ef8a/Sheet1');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching vocabulary data:', error);
        return [];
    }
};

let vocabularyData = [];
let currentCard = null;
let isWeeklyMode = false;
let isRepeatsMode = false;
let filteredTerms = [];
let currentTermIndex = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const backNavigation = document.getElementById('backNavigation');
const forwardNavigation = document.getElementById('forwardNavigation');

const searchInput = document.getElementById('searchInput');
const dropdownList = document.getElementById('dropdownList');
const flipButton = document.getElementById('flipButton');
const weeklyToggle = document.getElementById('weeklyToggle');
const weeklyLabel = document.getElementById('weeklyLabel');
const repeatsToggle = document.getElementById('repeatsToggle');
const repeatsLabel = document.getElementById('repeatsLabel');

const cardWidth = 600;
const cardHeight = 400;
const cardX = (canvas.width - cardWidth) / 2;
const cardY = (canvas.height - cardHeight) / 2;

let isFlipped = false;
let flipProgress = 0;

const getWrappedText = (text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });

    lines.push(currentLine.trim());
    return lines;
};

const updateSliderColor = () => {
    const weeklySlider = document.querySelector('#weeklyToggle + .slider');
    const repeatsSlider = document.querySelector('#repeatsToggle + .slider');

    // Default gray color
    const defaultColor = '#808080';
    const weeklyBlue = '#2196F3';
    const repeatsRed = '#FF6B6B';

    // Weekly slider color
    weeklySlider.style.backgroundColor = isWeeklyMode ? weeklyBlue : defaultColor;

    // Repeats slider color
    repeatsSlider.style.backgroundColor = isRepeatsMode ? repeatsRed : defaultColor;
};

const navigateCards = (direction) => {
    // Get the current list of terms based on filters
    filteredTerms = vocabularyData.filter(item => {
        if (isWeeklyMode) {
            return item.Front.includes('!');
        }
        return true;
    });

    // Sort alphabetically only if both toggles are off
    if (!isWeeklyMode && !isRepeatsMode) {
        filteredTerms.sort((a, b) => {
            const termA = a.Front.replace(/!R?/g, '').toLowerCase();
            const termB = b.Front.replace(/!R?/g, '').toLowerCase();
            return termA.localeCompare(termB);
        });
    }

    if (filteredTerms.length === 0) return;

    // If there's no current card, start from beginning
    if (!currentCard) {
        currentTermIndex = direction > 0 ? 0 : filteredTerms.length - 1;
    } else {
        currentTermIndex += direction;
        
        // Wrap around
        if (currentTermIndex < 0) {
            currentTermIndex = filteredTerms.length - 1;
        } else if (currentTermIndex >= filteredTerms.length) {
            currentTermIndex = 0;
        }
    }

    // Update current card and redraw
    currentCard = filteredTerms[currentTermIndex];
    isFlipped = false;
    drawCard();
};

const flipCard = () => {
    if (!currentCard) return;

    isFlipped = !isFlipped;
    flipProgress = 0;
    animateFlip();
};

const animateFlip = () => {
    flipProgress += 0.1;

    if (flipProgress < 1) {
        const scale = Math.cos(flipProgress * Math.PI);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, 1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawCard();
        ctx.restore();
        requestAnimationFrame(animateFlip);
    } else {
        drawCard();
    }
};

const drawCard = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    if (currentCard) {
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Completely remove '!' and '!R'
        const cleanFront = currentCard.Front.replace(/!R?/g, '');
        const cleanBack = currentCard.Back.replace(/!R?/g, '');

        const text = isFlipped 
            ? cleanBack 
            : cleanFront;
        
        // Check if it's a repeat or weekly term
        const isRepeat = currentCard.Front.includes('!R');
        const isWeekly = currentCard.Front.includes('!');

        // Modify text color and styling
        if (isRepeatsMode && isRepeat) {
            ctx.fillStyle = '#FF6B6B';  // Red color for repeat terms
            ctx.font = 'bold 24px Orbitron';
        } else if (isWeekly) {
            ctx.fillStyle = '#2196F3';  // Blue color for weekly terms
            ctx.font = 'bold 24px Orbitron';
        }

        const lines = getWrappedText(text, cardWidth - 40);

        // Add (REPEAT) if applicable and repeats mode is on
        if (isRepeat && isRepeatsMode) {
            lines.push('(REPEAT)');
        }
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * 30);
        });
    } else {
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Search for a term...', canvas.width / 2, canvas.height / 2);
    }
};

const updateDropdown = (searchTerm) => {
    // Remove '!' and '!R' from search term for matching
    const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

    let matchingTerms = vocabularyData.filter(item => 
        // Remove '!' and '!R' before filtering
        item.Front.replace(/!R?/g, '').toLowerCase().includes(cleanSearchTerm.toLowerCase())
    );

    // Sort alphabetically only if both toggles are off
    if (!isWeeklyMode && !isRepeatsMode) {
        matchingTerms.sort((a, b) => {
            const termA = a.Front.replace(/!R?/g, '').toLowerCase();
            const termB = b.Front.replace(/!R?/g, '').toLowerCase();
            return termA.localeCompare(termB);
        });
    }

    // Calculate total weekly flashcards (with '!')
    const weeklyCount = vocabularyData.filter(item => 
        item.Front.includes('!')
    ).length;

    // Calculate total repeat flashcards (with '!R')
    const repeatsCount = vocabularyData.filter(item => 
        item.Front.includes('!R')
    ).length;

    // Update labels with total numbers
    weeklyLabel.innerHTML = `This Week's Flashcards <span style="color: #2196F3; font-weight: bold;">(${weeklyCount})</span>`;
    repeatsLabel.innerHTML = `Mark Repeats <span style="color: #FF6B6B; font-weight: bold;">(${repeatsCount})</span>`;

    // Filter logic for weekly mode
    if (isWeeklyMode) {
        // Only show terms with '!' when weekly mode is on
        matchingTerms = matchingTerms.filter(item => 
            item.Front.includes('!')
        );
    }

    dropdownList.innerHTML = '';
    matchingTerms.forEach(item => {
        const option = document.createElement('option');
        
        // Completely remove '!' and '!R' for display
        const cleanTerm = item.Front.replace(/!R?/g, '');
        const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

        // Check if it's a repeat or weekly term
        const isRepeat = item.Front.includes('!R');

        // Find the matching part of the term
        const lowerCleanTerm = cleanTerm.toLowerCase();
        const lowerSearchTerm = cleanSearchTerm.toLowerCase();
        const matchIndex = lowerCleanTerm.indexOf(lowerSearchTerm);

        if (matchIndex !== -1 && cleanSearchTerm) {
            // Create highlighted term with bold matching part
            const beforeMatch = cleanTerm.slice(0, matchIndex);
            const matchedPart = cleanTerm.slice(matchIndex, matchIndex + cleanSearchTerm.length);
            const afterMatch = cleanTerm.slice(matchIndex + cleanSearchTerm.length);
            
            option.innerHTML = `${beforeMatch}<strong>${matchedPart}</strong>${afterMatch}`;
        } else {
            // If no match, display normally
            option.textContent = cleanTerm;
        }

        // Add (REPEAT) if repeats mode is on and term is a repeat
        if (isRepeatsMode && isRepeat) {
            option.innerHTML += ' <span style="color: #FF6B6B; font-style: italic;">(REPEAT)</span>';
        }

        // Store the original term as value
        option.value = item.Front;
        
        dropdownList.appendChild(option);
    });

    if (matchingTerms.length === 1) {
        updateCard(matchingTerms[0].Front);
    } else {
        currentCard = null;
        drawCard();
    }
};

const updateCard = (term) => {
    // Completely remove '!' and '!R' for matching
    const cleanTerm = term.replace(/!R?/g, '');
    currentCard = vocabularyData.find(item => 
        item.Front.replace(/!R?/g, '').toLowerCase() === cleanTerm.toLowerCase()
    );
    
    // Update search input to clean term
    searchInput.value = cleanTerm;
    
    isFlipped = false;
    drawCard();
};

document.addEventListener('keydown', (e) => {
    // Skip if focused on input elements
    if (e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'textarea' || 
        e.target.tagName.toLowerCase() === 'select') {
        return;
    }

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            navigateCards(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            navigateCards(1);
            break;
        case ' ':
            e.preventDefault();
            flipCard();
            break;
    }
});

const setupNavigation = () => {
    const backNav = document.getElementById('backNavigation');
    const forwardNav = document.getElementById('forwardNavigation');

    // Click handlers
    backNav.addEventListener('click', () => navigateCards(-1));
    forwardNav.addEventListener('click', () => navigateCards(1));

    // Hover effects
    backNav.addEventListener('mouseover', () => {
        backNav.src = 'https://interlinkcvhs.org/qotdBackwardHover.png';
    });
    
    backNav.addEventListener('mouseout', () => {
        backNav.src = 'https://interlinkcvhs.org/qotdBackward.png';
    });

    forwardNav.addEventListener('mouseover', () => {
        forwardNav.src = 'https://interlinkcvhs.org/qotdForwardHover.png';
    });
    
    forwardNav.addEventListener('mouseout', () => {
        forwardNav.src = 'https://interlinkcvhs.org/qotdForward.png';
    });
};

weeklyToggle.addEventListener('change', (e) => {
    isWeeklyMode = e.target.checked;
    
    // If weekly mode is turned off, also turn off repeats mode
    if (!isWeeklyMode) {
        repeatsToggle.checked = false;
        isRepeatsMode = false;
    }
    
    // Update slider colors
    updateSliderColor();
    
    // Trigger dropdown update with current search term
    updateDropdown(searchInput.value);
});

repeatsToggle.addEventListener('change', (e) => {
    isRepeatsMode = e.target.checked;
    
    // Automatically activate weekly mode when repeats is on
    if (isRepeatsMode) {
        weeklyToggle.checked = true;
        isWeeklyMode = true;
    }
    
    // Update slider colors
    updateSliderColor();
    
    // Trigger dropdown update with current search term
    updateDropdown(searchInput.value);
});

searchInput.addEventListener('input', (e) => {
    updateDropdown(e.target.value);
});

dropdownList.addEventListener('change', (e) => {
    // Update card with the selected term, which will automatically clean the term
    updateCard(e.target.value);
});

flipButton.textContent = 'FLIP CARD (SPACE)';
flipButton.addEventListener('click', flipCard);

// Canvas click to flip
canvas.addEventListener('click', flipCard);

// Call setup navigation after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    updateSliderColor();
});

// Ensure setupNavigation is called after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    updateSliderColor();
});

// Initial call to fetch and setup
(async () => {
    vocabularyData = await fetchVocabularyData();
    updateDropdown('');
    drawCard();
})();
