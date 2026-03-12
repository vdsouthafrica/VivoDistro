// global-fullscreen.js - WORKS ON EVERY PAGE NO MATTER WHAT
(function() {
    // Run immediately and also after DOM loads
    ensureFullscreenButton();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureFullscreenButton);
    }
    
    // Also run after a delay to catch any late-loading content
    setTimeout(ensureFullscreenButton, 500);
    setTimeout(ensureFullscreenButton, 1000);
    setTimeout(ensureFullscreenButton, 2000);
    
    function ensureFullscreenButton() {
        // Check if button already exists
        if (document.getElementById('globalFullscreenBtn')) {
            console.log('✅ Fullscreen button exists');
            setupFullscreenButton();
            return;
        }
        
        console.log('Creating fullscreen button...');
        
        // Create button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'globalFullscreenBtn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Enter Fullscreen';
        fullscreenBtn.setAttribute('aria-label', 'Toggle Fullscreen');
        
        // Force styles directly on the element as backup
        fullscreenBtn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 45px !important;
            height: 45px !important;
            border-radius: 50% !important;
            background: #6C63FF !important;
            border: 2px solid white !important;
            color: white !important;
            font-size: 1.3rem !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Add to page
        document.body.appendChild(fullscreenBtn);
        console.log('✅ Fullscreen button added to page');
        
        setupFullscreenButton();
    }
    
    function setupFullscreenButton() {
        const fullscreenBtn = document.getElementById('globalFullscreenBtn');
        if (!fullscreenBtn) return;
        
        // Check if we were in fullscreen mode before
        if (localStorage.getItem('fullscreenMode') === 'true') {
            setTimeout(() => {
                if (!document.fullscreenElement) {
                    enterFullscreen();
                    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                    fullscreenBtn.title = 'Exit Fullscreen';
                }
            }, 500);
        }
        
        // Set initial icon
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            fullscreenBtn.title = 'Exit Fullscreen';
        }
        
        // Remove any existing listeners and add new one
        fullscreenBtn.replaceWith(fullscreenBtn.cloneNode(true));
        const newBtn = document.getElementById('globalFullscreenBtn');
        newBtn.addEventListener('click', toggleFullscreen);
        
        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }
    
    function enterFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        
        localStorage.setItem('fullscreenMode', 'true');
        updateButtonIcon('compress');
    }
    
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        localStorage.removeItem('fullscreenMode');
        updateButtonIcon('expand');
    }
    
    function updateFullscreenButton() {
        if (document.fullscreenElement) {
            updateButtonIcon('compress');
            localStorage.setItem('fullscreenMode', 'true');
        } else {
            updateButtonIcon('expand');
            localStorage.removeItem('fullscreenMode');
        }
    }
    
    function updateButtonIcon(mode) {
        const btn = document.getElementById('globalFullscreenBtn');
        if (!btn) return;
        
        if (mode === 'compress') {
            btn.innerHTML = '<i class="fas fa-compress"></i>';
            btn.title = 'Exit Fullscreen';
        } else {
            btn.innerHTML = '<i class="fas fa-expand"></i>';
            btn.title = 'Enter Fullscreen';
        }
    }
})();