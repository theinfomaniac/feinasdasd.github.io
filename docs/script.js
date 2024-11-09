// Theme handling
function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.className;
    const newTheme = currentTheme === 'light-mode' ? '' : 'light-mode';
    setTheme(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || '';
    setTheme(savedTheme);
});
