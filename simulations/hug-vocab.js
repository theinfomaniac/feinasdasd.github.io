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
let currentTermIndex = -1;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const searchInput = document.getElementById('searchInput');
const dropdownList = document.getElementById('dropdownList');
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

// Remove previous navigation container and arrow elements

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

    // Draw keybindings in small text
    ctx.font = '14px Orbitron';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE: Flip Card | ←→: Navigate Terms', canvas.width / 2, canvas.height - 20);

    if (currentCard) {
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cleanFront = currentCard.Front.replace(/!R?/g, '');
        const cleanBack = currentCard.Back.replace(/!R?/g, '');

        const text = isFlipped 
            ? cleanBack 
            : cleanFront;
        
        const isRepeat = currentCard.Front.includes('!R');
        const isWeekly = currentCard.Front.includes('!');

        if (isRepeatsMode && isRepeat) {
            ctx.fillStyle = '#FF6B6B';
            ctx.font = 'bold 24px Orbitron';
        } else if (isWeekly) {
            ctx.fillStyle = '#2196F3';
            ctx.font = 'bold 24px Orbitron';
        }

        let lines = getWrappedText(text, cardWidth - 40);
        if (isRepeat && isRepeatsMode) {
            lines[lines.length - 1] += ' (REPEAT)';
        }
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * 30);
        });

        if (filteredTerms.length > 1) {
            ctx.font = '16px Orbitron';
            ctx.fillStyle = '#888888';
            ctx.fillText(`${currentTermIndex + 1} / ${filteredTerms.length}`, canvas.width / 2, canvas.height - 40);
        }
    }
};

const navigateTerms = (direction) => {
    if (filteredTerms.length === 0) return;

    if (direction === 'forward') {
        currentTermIndex = (currentTermIndex + 1) % filteredTerms.length;
    } else {
        currentTermIndex = (currentTermIndex - 1 + filteredTerms.length) % filteredTerms.length;
    }

    dropdownList.selectedIndex = currentTermIndex;
    updateCard(filteredTerms[currentTermIndex]);
};

// Keyboard event listener
document.addEventListener('keydown', (e) => {
    if (currentCard) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                flipCard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateTerms('forward');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                navigateTerms('backward');
                break;
        }
    }
});

// Canvas click event to handle flip
canvas.addEventListener('click', () => {
    if (currentCard) {
        flipCard();
    }
});

// Rest of the existing code remains the same (updateDropdown, updateCard, etc.)
const updateDropdown = (searchTerm) => {
    const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

    let matchingTerms = vocabularyData.filter(item => 
        item.Front.replace(/!R?/g, '').toLowerCase().includes(cleanSearchTerm.toLowerCase())
    );

    const weeklyCount = vocabularyData.filter(item => 
        item.Front.includes('!')
    ).length;

    const repeatsCount = vocabularyData.filter(item => 
        item.Front.includes('!R')
    ).length;

    weeklyLabel.innerHTML = `This Week's Flashcards <span style="color: #2196F3; font-weight: bold;">(${weeklyCount})</span>`;
    repeatsLabel.innerHTML = `Mark Repeats <span style="color: #FF6B6B; font-weight: bold;">(${repeatsCount})</span>`;

    if (isWeeklyMode) {
        matchingTerms = matchingTerms.filter(item => 
            item.Front.includes('!')
        );
    }

    filteredTerms = matchingTerms;
    currentTermIndex = filteredTerms.length > 0 ? 0 : -1;

    dropdownList.innerHTML = '';
    matchingTerms.forEach(item => {
        const option = document.createElement('option');
        
        const cleanTerm = item.Front.replace(/!R?/g, '');
        const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

        const isRepeat = item.Front.includes('!R');

        const lowerCleanTerm = cleanTerm.toLowerCase();
        const lowerSearchTerm = cleanSearchTerm.toLowerCase();
        const matchIndex = lowerCleanTerm.indexOf(lowerSearchTerm);

        if (matchIndex !== -1 && cleanSearchTerm) {
            const beforeMatch = cleanTerm.slice(0, matchIndex);
            const matchedPart = cleanTerm.slice(matchIndex, matchIndex + cleanSearchTerm.length);
            const afterMatch = cleanTerm.slice(matchIndex + cleanSearchTerm.length);
            
            option.innerHTML = `${beforeMatch}<strong>${matchedPart}</strong>${afterMatch}`;
        } else {
            option.textContent = cleanTerm;
        }

        if (isRepeatsMode && isRepeat) {
            option.innerHTML += ' <span style="color: #FF6B6B; font-style: italic;">(REPEAT)</span>';
        }

        option.value = item.Front;
        
        dropdownList.appendChild(option);
    });

    if (matchingTerms.length === 1) {
        updateCard(matchingTerms[0].Front);
    } else if (matchingTerms.length > 1) {
        updateCard(matchingTerms[0].Front);
    } else {
        currentCard = null;
        drawCard();
    }
};

const updateCard = (term) => {
    const cleanTerm = term.replace(/!R?/g, '');
    currentCard = vocabularyData.find(item => 
        item.Front.replace(/!R?/g, '').toLowerCase() === cleanTerm.toLowerCase()
    );
    
    searchInput.value = cleanTerm;
    
    isFlipped = false;
    drawCard();
};

// Remaining event listeners and initialization
weeklyToggle.addEventListener('change', (e) => {
    isWeeklyMode = e.target.checked;
    
    if (!isWeeklyMode) {
        repeatsToggle.checked = false;
        isRepeatsMode = false;
    }
    
    updateDropdown(searchInput.value);
});

repeatsToggle.addEventListener('change', (e) => {
    isRepeatsMode = e.target.checked;
    
    if (isRepeatsMode) {
        weeklyToggle.checked = true;
        isWeeklyMode = true;
    }
    
    updateDropdown(searchInput.value);
});

searchInput.addEventListener('input', (e) => {
    updateDropdown(e.target.value);
});

dropdownList.addEventListener('change', (e) => {
    updateCard(e.target.value);
});

(async () => {
    vocabularyData = await fetchVocabularyData();
    updateDropdown('');
    drawCard();
})();
