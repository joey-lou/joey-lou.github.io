function setTheme(theme) {
  document.body.setAttribute('data-bs-theme', theme);
  const codeTheme = theme === 'light' ? 'solarized-light' : 'solarized-dark';
  const iconElement = document.getElementById('theme-toggle');
  const newIcon =
    theme === 'light'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brightness-high-fill" viewBox="0 0 16 16"><path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon" viewBox="0 0 16 16"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>';
  iconElement.innerHTML = newIcon;

  // Update pypigment style (only valid for blogs)
  const ppyStyle = document.getElementById('pypigment-style');
  if (ppyStyle != null) {
    ppyStyle.href = `/static/css/pypigments/${codeTheme}.css`;
  }
}

function setGameOfLifeColors(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--cell-dead-color', '#000');
    root.style.setProperty('--cell-alive-color', '#fff');
    root.style.setProperty('--cell-border-color', '#555');
    root.style.setProperty('--cell-hover-color', '#aaa');
  } else {
    root.style.setProperty('--cell-dead-color', '#fff');
    root.style.setProperty('--cell-alive-color', '#000');
    root.style.setProperty('--cell-border-color', '#ccc');
    root.style.setProperty('--cell-hover-color', '#e0e0e0');
  }
}

// Function to apply theme with transition
function applyThemeWithTransition(theme) {
  document.body.style.transition = 'background-color 0.3s ease';
  setTheme(theme);
  setGameOfLifeColors(theme);
  setTimeout(() => {
    document.body.style.transition = '';
  }, 300);
}

function initializePage() {
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-bs-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyThemeWithTransition(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
  console.log('initialized page');
}

window.addEventListener('DOMContentLoaded', () => {
  initializePage();
  setTheme(localStorage.getItem('theme') || 'light');
  setGameOfLifeColors(localStorage.getItem('theme') || 'light');
  console.log('DOM loaded');
});
