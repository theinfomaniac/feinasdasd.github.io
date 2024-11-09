class Nucleotide {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.color = this.getColor();
        this.targetY = y;
    }

    getColor() {
        switch (this.type) {
            case 'A': return '#FF5733'; // Red
            case 'T': return '#33FF57'; // Green
            case 'C': return '#3357FF'; // Blue
            case 'G': return '#F3FF33'; // Yellow
            case 'U': return '#FF33F1'; // Pink
            default: return '#FFFFFF'; // White for unknown
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '24px Orbitron';
        ctx.fillText(this.type, this.x - 8, this.y + 8);
    }

    update() {
        this.y += (this.targetY - this.y) * 0.1;
    }
}

class DNAStrand {
    constructor(sequence, startX, startY) {
        this.sequence = sequence;
        this.nucleotides = [];
        this.complementary = [];
        this.startX = startX;
        this.startY = startY;
        this.spacing = 80;
        this.initializeStrand();
    }

    initializeStrand() {
        for (let i = 0; i < this.sequence.length; i++) {
            this.nucleotides.push(new Nucleotide(this.sequence[i], this.startX + i * this.spacing, this.startY));
            this.complementary.push(new Nucleotide(this.getComplementary(this.sequence[i]), this.startX + i * this.spacing, this.startY + 80));
        }
    }

    getComplementary(base) {
        switch (base) {
            case 'A': return 'T';
            case 'T': return 'A';
            case 'C': return 'G';
            case 'G': return 'C';
            default: return '';
        }
    }

    draw(ctx) {
        this.nucleotides.forEach(n => n.draw(ctx));
        this.complementary.forEach(n => n.draw(ctx));

        ctx.strokeStyle = '#FFFFFF';
        for (let i = 0; i < this.nucleotides.length; i++) {
            ctx.beginPath();
            ctx.moveTo(this.nucleotides[i].x, this.nucleotides[i].y + this.nucleotides[i].radius);
            ctx.lineTo(this.complementary[i].x, this.complementary[i].y - this.complementary[i].radius);
            ctx.stroke();
        }
    }

    unwind(index) {
        if (index < this.nucleotides.length) {
            this.nucleotides[index].targetY -= 50;
            this.complementary[index].targetY += 50;
        }
    }

    update() {
        this.nucleotides.forEach(n => n.update());
        this.complementary.forEach(n => n.update());
    }
}

class RNAPolymerase {
    constructor() {
        this.x = 0;
        this.y = 110; // Position lowered between the bases
        this.size = 100; // Smaller size
        this.speed = 1; // Slower speed
    }

    draw(ctx) {
        ctx.fillStyle = '#FFA500'; // Fill color for RNA Polymerase triangle
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size); // Pointing downwards
        ctx.lineTo(this.x - this.size / 2, this.y + this.size); // Pointing downwards
        ctx.closePath();
        ctx.fill();

        // Neon effect for the labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Bright color for text
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; // Glow color
        ctx.shadowBlur = 20;

        ctx.font = '20px Orbitron'; // Slightly smaller font size
        // Center text in the triangle
        ctx.fillText('RNA', this.x - 12, this.y + 30); // Adjusted for centering
        ctx.fillText('Pol', this.x - 12, this.y + 45); // Adjusted for centering

        // Reset shadow to avoid affecting other drawings
        ctx.shadowBlur = 0;
    }

    move() {
        this.x += this.speed;
    }
}

class Transcription {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dnaSequence = 'ATCGATTGCAGCTAGCTAGCTAGCTAGC';
        this.dna = new DNAStrand(this.dnaSequence, 50, 150);
        this.rnaPolymerase = new RNAPolymerase();
        this.mRNA = [];
        this.transcriptionProgress = 0;
        this.animate();
    }

    update() {
        this.dna.update();
        if (this.transcriptionProgress < this.dnaSequence.length * this.dna.spacing) {
            this.rnaPolymerase.move();

            if (this.transcriptionProgress % this.dna.spacing === 0) {
                let index = this.transcriptionProgress / this.dna.spacing;
                this.dna.unwind(index);
                let base = this.dnaSequence[index];
                let complementaryRNA = base === 'T' ? 'U' : this.dna.getComplementary(base);

                // Check for existing mRNA nucleotide to avoid duplicates
                if (!this.mRNA.some(n => n.type === complementaryRNA && n.x === (50 + index * this.dna.spacing))) {
                    let newNucleotide = new Nucleotide(complementaryRNA, 50 + index * this.dna.spacing, 300);
                    newNucleotide.targetY = 300;
                    this.mRNA.push(newNucleotide);
                }
            }
            this.transcriptionProgress++;
        } else {
            // Reset the simulation
            this.transcriptionProgress = 0;
            this.rnaPolymerase.x = 0;
            this.mRNA = [];
            this.dna = new DNAStrand(this.dnaSequence, 50, 150);
        }
        this.mRNA.forEach(n => n.update());
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw DNA
        this.dna.draw(this.ctx);

        // Draw RNA Polymerase
        this.rnaPolymerase.draw(this.ctx);

        // Draw mRNA
        this.mRNA.forEach(n => n.draw(this.ctx));

        // Draw labels with glow effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Glowing effect
        this.ctx.font = '24px Orbitron';
        this.ctx.fillText('DNA', 10, 30); // Moved up
        this.ctx.fillText('mRNA', 10, 400); // Moved down

        // Draw codons below mRNA strand, moved down a bit
        if (this.mRNA.length >= 3) {
            for (let i = 0; i < Math.floor(this.mRNA.length / 3); i++) {
                this.ctx.strokeStyle = 'white';
                this.ctx.strokeRect(50 + i * this.dna.spacing * 3, 360, this.dna.spacing * 3, 60); // Moved down
                this.ctx.fillText(`Codon: ${this.mRNA[i * 3].type}${this.mRNA[i * 3 + 1].type}${this.mRNA[i * 3 + 2].type}`, 50 + i * this.dna.spacing * 3 + 10, 390);
            }
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

window.onload = () => {
    window.simulation = new Transcription();
};
