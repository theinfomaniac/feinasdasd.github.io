// Fetch vocabulary data
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

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const searchInput = document.getElementById('searchInput');
const dropdownList = document.getElementById('dropdownList');
const flipButton = document.getElementById('flipButton');

const cardWidth = 600;
const cardHeight = 400;
const cardX = (canvas.width - cardWidth) / 2;
const cardY = (canvas.height - cardHeight) / 2;

let isFlipped = false;
let flipProgress = 0;

const drawCard = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw card background
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Draw card content
    if (currentCard) {
        ctx.font = '24px Orbitron';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = isFlipped ? currentCard.Back : currentCard.Front;
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
    currentCard = vocabularyData.find(item => item.Front.toLowerCase() === term.toLowerCase());
    isFlipped = false;
    drawCard();
};

const updateDropdown = (searchTerm) => {
    const matchingTerms = vocabularyData.filter(item => 
        item.Front.toLowerCase().includes(searchTerm.toLowerCase())
    );

    dropdownList.innerHTML = '';
    matchingTerms.forEach(item => {
        const option = document.createElement('option');
        option.value = item.Front;
        option.textContent = item.Front;
        dropdownList.appendChild(option);
    });

    if (matchingTerms.length === 1) {
        updateCard(matchingTerms[0].Front);
    } else {
        currentCard = null;
        drawCard();
    }
};

searchInput.addEventListener('input', (e) => {
    updateDropdown(e.target.value);
});

dropdownList.addEventListener('change', (e) => {
    searchInput.value = e.target.value;
    updateCard(e.target.value);
});

flipButton.addEventListener('click', flipCard);

// Initialize the game
(async () => {
    vocabularyData = await fetchVocabularyData();
    updateDropdown('');
    drawCard();
})();
