class AminoAcid {
    constructor(sequence, x, y) {
        this.sequence = sequence;
        this.x = x;
        this.y = y;
        this.radius = 35;
        this.color = this.getAminoAcidColor(sequence);
        this.targetY = y;
        this.letter = this.getAminoAcidLetter(sequence);
        this.name = this.getAminoAcidName(sequence);
    }

    getAminoAcidColor(sequence) {
        const colorMap = {
            'M': '#FF5733', // Methionine (Start) - Orange
            'F': '#33FF57', // Phenylalanine - Green
            'L': '#3357FF', // Leucine - Blue
            'S': '#F3FF33', // Serine - Yellow
            '*': '#FF33F1', // Stop codon - Pink
            'X': '#CCCCCC'  // Unknown - Gray
        };
        return colorMap[this.getAminoAcidLetter(sequence)] || '#CCCCCC';
    }

    getAminoAcidLetter(sequence) {
        const codonTable = {
            'AUG': 'M', // Start codon - Methionine
            'UUU': 'F', 'UUC': 'F', // Phenylalanine
            'UUA': 'L', 'UUG': 'L', // Leucine
            'UCU': 'S', 'UCC': 'S', // Serine
            'UAA': '*', 'UAG': '*', 'UGA': '*' // Stop codons
        };
        return codonTable[sequence] || 'X';
    }

    getAminoAcidName(sequence) {
        const nameMap = {
            'M': 'Methionine',
            'F': 'Phenylalanine',
            'L': 'Leucine',
            'S': 'Serine',
            '*': 'STOP',
            'X': 'Unknown'
        };
        return nameMap[this.getAminoAcidLetter(sequence)] || 'Unknown';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.letter, this.x, this.y + 8);

        ctx.fillStyle = 'white';
        ctx.font = '14px Orbitron';
        ctx.fillText(this.name, this.x, this.y + this.radius + 20);
    }

    update() {
        this.y += (this.targetY - this.y) * 0.1;
    }
}

class TRNA {
    constructor(anticodon, x, y) {
        this.anticodon = anticodon;
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 100;
        this.color = '#FFD700';
        this.aminoAcid = this.getMatchingAminoAcid(anticodon);
    }

    getMatchingAminoAcid(anticodon) {
        const codon = anticodon.split('').map(base => {
            switch(base) {
                case 'A': return 'U';
                case 'U': return 'A';
                case 'C': return 'G';
                case 'G': return 'C';
                default: return 'X';
            }
        }).join('');
        return new AminoAcid(codon, this.x + this.width/2, this.y - 30);
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = '18px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`Anticodon: ${this.anticodon}`, this.x + this.width/2, this.y - 60);

        this.aminoAcid.draw(ctx);
    }
}

class Ribosome {
    constructor() {
        this.x = 800;
        this.y = 150;
        this.size = 100;
        this.speed = -0.5;
        this.state = 'waiting';
        this.stateTimer = 0;
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + 40, this.size/3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '20px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('Ribosome', this.x, this.y - 60);

        ctx.font = '16px Orbitron';
        ctx.fillText(this.state.toUpperCase(), this.x, this.y - 40);
    }
}

class Translation {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mRNASequence = 'AUGUCUUUUUAA';
        this.spacing = 100;
        this.ribosome = new Ribosome();
        this.aminoAcids = [];
        this.currentTRNA = null;
        this.translationProgress = 0;
        this.stepTimer = 0;
        this.stepDuration = 120;
        this.state = 'start';
        this.currentCodonIndex = 0;
        this.animate();
    }

    update() {
        this.stepTimer++;
        if (this.stepTimer >= this.stepDuration) {
            this.stepTimer = 0;
            this.nextStep();
        }
    }

    nextStep() {
        if (this.translationProgress >= this.mRNASequence.length - 2) {
            this.reset();
            return;
        }

        switch(this.state) {
            case 'start':
                this.ribosome.state = 'reading';
                this.state = 'tRNA_entering';
                break;

            case 'tRNA_entering':
                let codon = this.mRNASequence.substr(this.translationProgress, 3);
                if (codon && codon.length === 3) {
                    this.currentTRNA = new TRNA(
                        this.getAnticodon(codon),
                        this.ribosome.x - 40,
                        180
                    );
                    this.currentCodonIndex = this.translationProgress;
                }
                this.state = 'adding_amino_acid';
                break;

            case 'adding_amino_acid':
                if (this.currentTRNA) {
                    this.aminoAcids.push(new AminoAcid(
                        this.mRNASequence.substr(this.translationProgress, 3),
                        this.ribosome.x,
                        300
                    ));
                }
                this.state = 'moving';
                this.ribosome.state = 'moving';
                break;

            case 'moving':
                this.translationProgress += 3;
                this.ribosome.x -= this.spacing;
                this.currentTRNA = null;
                this.state = 'start';
                this.ribosome.state = 'waiting';
                break;
        }
    }

    getAnticodon(codon) {
        return codon.split('').map(base => {
            switch(base) {
                case 'A': return 'U';
                case 'U': return 'A';
                case 'C': return 'G';
                case 'G': return 'C';
                default: return 'X';
            }
        }).join('');
    }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMRNA();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Current Step: ${this.state.replace(/_/g, ' ').toUpperCase()}`, 20, 50);

        this.ribosome.draw(this.ctx);

        if (this.currentTRNA) {
            this.currentTRNA.draw(this.ctx);
        }

        this.aminoAcids.forEach((aa, index) => {
            aa.x = 800 - (index * this.spacing);
            aa.draw(this.ctx);
        });
    }

    drawMRNA() {
        for (let i = 0; i < this.mRNASequence.length; i += 3) {
            const codon = this.mRNASequence.substr(i, 3);
            const x = 50 + (i/3) * this.spacing;
            
            const isCurrentCodon = (i === this.translationProgress);
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = isCurrentCodon ? 3 : 1;
            
            if (isCurrentCodon && this.state === 'tRNA_entering') {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                this.ctx.fillRect(x - 40, 130, 80, 40);
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 14px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Current Codon', x, 120);
            }
            
            this.ctx.strokeRect(x - 40, 130, 80, 40);

            for (let j = 0; j < 3 && i + j < this.mRNASequence.length; j++) {
                this.ctx.fillStyle = '#FF9933';
                this.ctx.beginPath();
                this.ctx.arc(x - 20 + (j * 20), 150, 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.mRNASequence[i + j], x - 20 + (j * 20), 155);
            }

            this.ctx.fillStyle = isCurrentCodon ? '#FFD700' : 'white';
            this.ctx.font = isCurrentCodon ? 'bold 12px Orbitron' : '12px Orbitron';
            this.ctx.fillText(`Codon ${i/3 + 1}`, x, 185);
        }
    }

    reset() {
        this.translationProgress = 0;
        this.ribosome.x = 800;
        this.aminoAcids = [];
        this.currentTRNA = null;
        this.state = 'start';
        this.stepTimer = 0;
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

window.onload = () => {
    window.simulation = new Translation();
};
