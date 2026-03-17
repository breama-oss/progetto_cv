/* Handles all Windows 95-style desktop UI interactions:
window management, taskbar, clock, Start menu, dropdown menus */

// CLOCK 

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hh}:${mm}`;
}
setInterval(updateClock, 1000);
updateClock();

// Z-INDEX MANAGEMENT 

let highestZ = 10;

function bringToFront(windowEl) {
  highestZ++;
  windowEl.style.zIndex = highestZ;
}

// GENERIC WINDOW MANAGER 
/**
 * Wires up a standard Win95-style window with drag, minimize, maximize, close,
 * taskbar button toggling, and desktop icon double-click to open.
 *
 * @param {HTMLElement} windowEl   - The .window element
 * @param {HTMLElement} taskbarBtn - The corresponding taskbar button
 * @param {HTMLElement} iconEl     - The desktop icon that opens the window
 * @param {Function}    [extraInit] - Optional hook called after setup
 */

function setupWindow(windowEl, taskbarBtn, iconEl, extraInit) {
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Saved just before maximizing so restore brings the window back exactly.
  let savedLeft = null;
  let savedTop  = null;

  const titleBar    = windowEl.querySelector('.title-bar');
  const minimizeBtn = windowEl.querySelector('[aria-label="Minimize"]');
  const maximizeBtn = windowEl.querySelector('[aria-label="Maximize"]');
  const closeBtn    = windowEl.querySelector('.closeBtn');

  // Drag
  titleBar.addEventListener('mousedown', (e) => {
    if (windowEl.classList.contains('maximized')) return;

    // Anchor left/top from the real painted position before clearing
    // right/bottom — prevents the one-frame "jump" on first mousemove.
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left   = `${rect.left}px`;
    windowEl.style.top    = `${rect.top}px`;
    windowEl.style.right  = 'auto';
    windowEl.style.bottom = 'auto';

    isDragging  = true;
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    bringToFront(windowEl);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    windowEl.style.left = `${e.clientX - dragOffsetX}px`;
    windowEl.style.top  = `${e.clientY - dragOffsetY}px`;
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // Double-click title bar toggles maximize
  titleBar.addEventListener('dblclick', () => toggleMaximize());

  // Prevent title-bar control clicks from starting a drag
  titleBar.querySelectorAll('.title-bar-controls button').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
  });

  // Maximize / Restore
  function toggleMaximize() {
    if (windowEl.classList.contains('maximized')) {
      // Restore
      windowEl.classList.remove('maximized');
      maximizeBtn?.setAttribute('aria-label', 'Maximize');
      windowEl.style.left   = savedLeft ?? '';
      windowEl.style.top    = savedTop  ?? '';
      windowEl.style.right  = 'auto';
      windowEl.style.bottom = 'auto';
    } else {
      // Save current painted position then maximize
      const rect = windowEl.getBoundingClientRect();
      savedLeft = `${rect.left}px`;
      savedTop  = `${rect.top}px`;

      windowEl.classList.add('maximized');
      maximizeBtn?.setAttribute('aria-label', 'Restore');
      windowEl.style.left = '';
      windowEl.style.top  = '';
    }
  }

  // Minimize
  minimizeBtn?.addEventListener('click', () => {
    windowEl.classList.add('hidden');
    taskbarBtn.classList.remove('active');
  });

  maximizeBtn?.addEventListener('click', () => toggleMaximize());

  // Close
  closeBtn?.addEventListener('click', () => {
    windowEl.classList.add('hidden');
    windowEl.classList.remove('maximized');
    taskbarBtn.classList.add('hidden');
    taskbarBtn.classList.remove('active');
    savedLeft = null;
    savedTop  = null;
  });

  // Taskbar button
  taskbarBtn?.addEventListener('click', () => {
    if (windowEl.classList.contains('hidden')) {
      windowEl.classList.remove('hidden');
      taskbarBtn.classList.add('active');
      bringToFront(windowEl);
    } else {
      windowEl.classList.add('hidden');
      taskbarBtn.classList.remove('active');
    }
  });

  // Desktop icon (double-click to open) 
  iconEl?.addEventListener('dblclick', () => {
    windowEl.classList.remove('hidden');
    windowEl.classList.remove('maximized');
    taskbarBtn.classList.remove('hidden');
    taskbarBtn.classList.add('active');
    bringToFront(windowEl);
  });

  // Bring to front on any click inside the window
  windowEl.addEventListener('mousedown', () => bringToFront(windowEl));

  if (extraInit) extraInit(windowEl);
}

// DRAGGABLE DESKTOP ICONS

/**
 * Makes a desktop icon draggable within the desktop area.
 * Distinguishes between a drag and a click/dblclick:
 * if the mouse moves less than 5px it's treated as a click, not a drag.
 *
 * @param {HTMLElement} iconEl - The .desktop-icon element
 */
function makeDraggableIcon(iconEl) {
  let isDragging  = false;
  let hasMoved    = false;
  let startX      = 0;
  let startY      = 0;
  let offsetX     = 0;
  let offsetY     = 0;

  const DRAG_THRESHOLD = 5; // px

  iconEl.addEventListener('mousedown', (e) => {
    // Only primary button
    if (e.button !== 0) return;
    e.preventDefault(); // prevent text selection while dragging

    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const iconRect    = iconEl.getBoundingClientRect();

    startX  = e.clientX;
    startY  = e.clientY;
    hasMoved = false;

    // Switch icon to absolute positioning if it isn't already
    if (iconEl.style.position !== 'absolute') {
      iconEl.style.position = 'absolute';
      iconEl.style.left = `${iconRect.left - desktopRect.left}px`;
      iconEl.style.top  = `${iconRect.top  - desktopRect.top}px`;
      iconEl.style.margin = '0';
    }

    offsetX = e.clientX - iconEl.getBoundingClientRect().left;
    offsetY = e.clientY - iconEl.getBoundingClientRect().top;

    isDragging = true;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasMoved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
    hasMoved = true;

    iconEl.classList.add('dragging');

    const desktop     = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const iconRect    = iconEl.getBoundingClientRect();
    const taskbarH    = 28; // keep icon above taskbar

    let newLeft = e.clientX - desktopRect.left - offsetX;
    let newTop  = e.clientY - desktopRect.top  - offsetY;

    // Clamp within desktop bounds (above taskbar)
    newLeft = Math.max(0, Math.min(newLeft, desktopRect.width  - iconRect.width));
    newTop  = Math.max(0, Math.min(newTop,  desktopRect.height - iconRect.height - taskbarH));

    iconEl.style.left = `${newLeft}px`;
    iconEl.style.top  = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    iconEl.classList.remove('dragging');
  });
}

// Apply to all desktop icons
document.querySelectorAll('.desktop-icon').forEach(makeDraggableIcon);

// WIRE UP WINDOWS

setupWindow(
  document.getElementById('cvWindow'),
  document.getElementById('cvTaskbarBtn'),
  document.getElementById('cvIcon')
);

setupWindow(
  document.getElementById('githubWindow'),
  document.getElementById('githubTaskbarBtn'),
  document.getElementById('githubIcon'),
  () => {
    document.getElementById('openGithubBtn')?.addEventListener('click', () => {
      window.open('https://github.com/breama-oss', '_blank', 'noopener');
    });
  }
);

// FILE MENU (CV WINDOW)

const fileBtn    = document.getElementById('fileBtn');
const fileMenu   = document.getElementById('fileMenu');
const downloadBtn = document.getElementById('downloadBtn');

fileBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  fileMenu.classList.toggle('hidden');
});

// Close menu on outside click
document.addEventListener('click', () => {
  fileMenu?.classList.add('hidden');
});

// Prevent clicks inside menu from closing it
fileMenu?.addEventListener('click', (e) => e.stopPropagation());

downloadBtn?.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href     = './assets/Eldar_Dedic_cv_dev.pdf';
  link.download = 'Eldar_Dedic_cv_dev.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  fileMenu.classList.add('hidden');
});

// START MENU 

const startButton = document.getElementById('startButton');
const startMenu   = document.getElementById('startMenu');
const logoutBtn   = document.getElementById('logoutBtn');

startButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  startMenu?.classList.add('hidden');
});

logoutBtn?.addEventListener('click', () => {
  startMenu.classList.add('hidden');
  if (typeof window.logoutToScene === 'function') {
    window.logoutToScene();
  }
});