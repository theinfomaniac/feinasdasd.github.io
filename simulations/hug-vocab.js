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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

        // Remove '!' and '!R' for display
        const cleanFront = currentCard.Front.replace('!', '').replace('!R', '');
        const cleanBack = currentCard.Back.replace('!', '').replace('!R', '');

        const text = isFlipped 
            ? cleanBack 
            : cleanFront;
        
        // Check if it's a repeat
        const isRepeat = currentCard.Front.includes('!R');

        // Modify text color and add (REPEAT) for repeat terms, but only if repeats mode is on
        if (isRepeat && isRepeatsMode) {
            ctx.fillStyle = '#FF6B6B';  // Blue color for repeat terms
            ctx.font = 'bold 24px Orbitron';
            text += ' (REPEAT)';
        }

        const lines = getWrappedText(text, cardWidth - 40);

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

const updateCard = (term) => {
    // Remove '!' and '!R' for matching
    const cleanTerm = term.replace('!', '').replace('!R', '');
    currentCard = vocabularyData.find(item => 
        item.Front.replace('!', '').replace('!R', '').toLowerCase() === cleanTerm.toLowerCase()
    );
    isFlipped = false;
    drawCard();
};

const updateDropdown = (searchTerm) => {
    let matchingTerms = vocabularyData.filter(item => 
        item.Front.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // Filter logic for weekly and repeats modes
    if (isWeeklyMode) {
        matchingTerms = matchingTerms.filter(item => 
            item.Front.includes('!')
        );
    }

    if (isRepeatsMode) {
        matchingTerms = matchingTerms.filter(item => 
            item.Front.includes('!R')
        );
    }

    dropdownList.innerHTML = '';
    matchingTerms.forEach(item => {
        const option = document.createElement('option');
        
        // Remove '!' and '!R' for display and matching
        const cleanTerm = item.Front.replace('!', '').replace('!R', '');
        const cleanSearchTerm = searchTerm.replace('!', '').replace('!R', '');

        // Check if it's a repeat
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

        // Add (REPEAT) for repeat terms, but only if repeats mode is on
        if (isRepeat && isRepeatsMode) {
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

// Weekly toggle functionality
weeklyToggle.addEventListener('change', (e) => {
    isWeeklyMode = e.target.checked;
    
    // Trigger dropdown update with current search term
    updateDropdown(searchInput.value);
});

repeatsToggle.addEventListener('change', (e) => {
    isRepeatsMode = e.target.checked;
    
    // Trigger dropdown update with current search term
    updateDropdown(searchInput.value);
});

searchInput.addEventListener('input', (e) => {
    updateDropdown(e.target.value);
});

dropdownList.addEventListener('change', (e) => {
    // Set both the search input and update the card
    searchInput.value = e.target.value.replace('!', '');
    updateCard(e.target.value);
});

flipButton.addEventListener('click', flipCard);

(async () => {
    vocabularyData = await fetchVocabularyData();
    updateDropdown('');
    drawCard();
})();
