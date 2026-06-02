// ============================================
// GLOBAL FULLSCREEN BUTTON - APPEARS ON EVERY PAGE
// ============================================
(function() {
    // ===== FIX SCROLLING ON NON-CHAT PAGES =====
    function fixPageScrolling() {
        // Check if this is a chat page
        const isChatPage = window.location.pathname.includes('chat') || 
            document.querySelector('.chat-app') || 
            document.querySelector('.chat-page') ||
            document.querySelector('[class*="chat-"]') ||
            document.querySelector('.message-input-area');
        
        if (isChatPage) {
            console.log('📱 Chat page detected - keeping overflow hidden');
            // Chat pages keep overflow hidden
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            // All other pages should scroll normally
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.overflow = 'auto';
            document.body.style.overflowX = 'hidden';
            document.body.style.height = 'auto';
            document.documentElement.style.height = 'auto';
            
            // Force scroll on main containers
            const mainContainers = document.querySelectorAll(
                '.hub-main, .browse-page, .calculator-page, .calendar-page, ' +
                '.dashboard-content, .cards-grid, .profile-content, ' +
                '.calc-container, .calendar-container, .main-content, ' +
                '.setup-container, .edit-container, ' +
                '[class*="hub-"], [class*="browse"], [class*="calculator"], [class*="calendar"]'
            );
            
            mainContainers.forEach(container => {
                if (container) {
                    container.style.overflowY = 'auto';
                    container.style.maxHeight = 'none';
                    container.style.height = 'auto';
                    container.style.minHeight = '100vh';
                }
            });
            
            console.log('✅ Page scrolling enabled');
        }
    }

    // Run scrolling fix immediately and repeatedly
    fixPageScrolling();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixPageScrolling);
    }
    setTimeout(fixPageScrolling, 500);
    setTimeout(fixPageScrolling, 1000);
    window.addEventListener('popstate', fixPageScrolling);

    // ===== FULLSCREEN BUTTON FUNCTIONALITY =====
    function ensureFullscreenButton() {
        // Don't create duplicate buttons
        if (document.getElementById('globalFullscreenBtn')) {
            setupFullscreenButton();
            return;
        }
        
        // Create the button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'globalFullscreenBtn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Enter Fullscreen';
        fullscreenBtn.setAttribute('aria-label', 'Toggle Fullscreen');
        
        // Add to page
        document.body.appendChild(fullscreenBtn);
        console.log('✅ Fullscreen button added');
        
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

    // Initialize fullscreen button
    ensureFullscreenButton();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureFullscreenButton);
    }
    setTimeout(ensureFullscreenButton, 500);
    setTimeout(ensureFullscreenButton, 1000);
})();

// ============================================
// PAGE NAVIGATION SYSTEM
// ============================================

class PageNavigator {
    constructor() {
        this.currentPage = 'home-section';
        this.isAnimating = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFooterLinks();
        this.updateActiveNav();
    }

    setupEventListeners() {
        const navLinks = {
            'main-link': { page: 'home-section', direction: 'right' },
            'about-link': { page: 'about-section', direction: 'left' },
            'features-link': { page: 'features-section', direction: 'left' },
            'contact-link': { page: 'contact-section', direction: 'left' }
        };

        Object.entries(navLinks).forEach(([id, config]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(config.page, config.direction);
                });
            }
        });

        const logo = document.getElementById('main-logo');
        if (logo) {
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('home-section', 'right');
            });
        }
    }

    setupFooterLinks() {
        const footerContact = document.getElementById('footer-contact-link');
        if (footerContact) {
            footerContact.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('contact-section', 'left');
            });
        }

        const footerPrivacy = document.getElementById('footer-privacy');
        if (footerPrivacy) {
            footerPrivacy.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Privacy Policy page coming soon!');
            });
        }

        const footerTerms = document.getElementById('footer-terms');
        if (footerTerms) {
            footerTerms.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Terms of Service page coming soon!');
            });
        }
    }

    navigateTo(targetPageId, direction) {
        if (this.isAnimating || this.currentPage === targetPageId) return;

        this.isAnimating = true;
        
        const currentSection = document.getElementById(this.currentPage);
        const targetSection = document.getElementById(targetPageId);
        
        if (direction === 'left') {
            currentSection.classList.add('slide-out-left');
            targetSection.classList.add('slide-out-left');
        } else {
            currentSection.classList.add('slide-out-right');
            targetSection.classList.add('slide-out-right');
        }
        
        currentSection.classList.remove('active');
        
        setTimeout(() => {
            currentSection.classList.remove('slide-out-left', 'slide-out-right');
            targetSection.classList.remove('slide-out-left', 'slide-out-right');
            targetSection.classList.add('active');
            this.currentPage = targetPageId;
            this.updateActiveNav();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.isAnimating = false;
        }, 600);
    }

    updateActiveNav() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        let activeLink;
        switch (this.currentPage) {
            case 'home-section':
                activeLink = document.getElementById('main-link');
                break;
            case 'about-section':
                activeLink = document.getElementById('about-link');
                break;
            case 'features-section':
                activeLink = document.getElementById('features-link');
                break;
            case 'contact-section':
                activeLink = document.getElementById('contact-link');
                break;
        }

        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function animateCountUp() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const increment = target / 100;
        let current = 0;
        
        const updateCount = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCount, 20);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCount();
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

function updateProgressBar(step) {
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.step');
    
    if (progressFill) {
        const percentage = (step / 3) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    steps.forEach((stepElement, index) => {
        if (index < step) {
            stepElement.classList.add('active');
        } else {
            stepElement.classList.remove('active');
        }
    });
}

function navigateToStep(currentStep, nextStep) {
    const currentStepElement = document.querySelector(`[data-step="${currentStep}"]`);
    const nextStepElement = document.querySelector(`[data-step="${nextStep}"]`);
    
    if (currentStepElement && nextStepElement) {
        currentStepElement.classList.remove('active');
        setTimeout(() => {
            nextStepElement.classList.add('active');
            updateProgressBar(nextStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }
}

function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input && preview) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (preview.querySelector('img')) {
                        preview.querySelector('img').src = e.target.result;
                    } else {
                        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#48BB78' : '#F56565'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadUserProfile() {
    const profile = getFromLocalStorage('performerProfile');
    
    if (profile) {
        const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar, #profilePreview, #reviewPic');
        avatarElements.forEach(element => {
            if (profile.image) {
                if (element.querySelector('img')) {
                    element.querySelector('img').src = profile.image;
                } else {
                    element.innerHTML = `<img src="${profile.image}" alt="Profile">`;
                }
            }
        });
        
        const nameElements = document.querySelectorAll('#userName, #profileName, #reviewName, #welcomeName');
        nameElements.forEach(element => {
            if (element) element.textContent = profile.name;
        });
        
        const locationElements = document.querySelectorAll('#profileLocation, #reviewLocation');
        locationElements.forEach(element => {
            if (element) element.textContent = profile.location;
        });
        
        const typeElements = document.querySelectorAll('#profileTypes, #reviewTypes');
        typeElements.forEach(element => {
            if (element && profile.types) {
                element.innerHTML = profile.types.map(type => 
                    `<span class="type-badge">${type}</span>`
                ).join('');
            }
        });
    }
}

// ========== GLOBAL MOBILE MENU TOGGLE ==========
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.hub-sidebar, .chat-sidebar, .calendar-sidebar');
    if (!sidebar) return;
    
    if (!document.querySelector('.menu-toggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Toggle menu');
        document.body.appendChild(menuToggle);
        
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
            }
        });
    }
});

// Fix for iOS input zoom
document.addEventListener('touchstart', function(e) {
    if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'SELECT' || e.target.nodeName === 'TEXTAREA') {
        e.target.style.fontSize = '16px';
    }
}, { passive: false });

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.hero-stats')) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCountUp();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(document.querySelector('.hero-stats'));
    }
    
    if (document.querySelector('.hub-main')) {
        loadUserProfile();
    }
    
    setupImagePreview('profileImage', 'profilePreview');
    
    // Add CSS for animations if not exists
    if (!document.querySelector('#animationStyles')) {
        const style = document.createElement('style');
        style.id = 'animationStyles';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .slide-out-left {
                animation: slideOutLeft 0.6s ease forwards;
            }
            .slide-out-right {
                animation: slideOutRight 0.6s ease forwards;
            }
            @keyframes slideOutLeft {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(-100%); opacity: 0; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize Page Navigator if on main page
    if (document.querySelector('.nav-link')) {
        new PageNavigator();
    }
    // ============================================
// CENTRALIZED NAVIGATION SYSTEM - FIXES ALL NAVBAR LINKS
// ============================================

class NavbarManager {
    constructor() {
        this.supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
        this.supabaseClient = null;
        this.userRole = null;
        this.userId = null;
    }

    async init() {
        // Initialize Supabase
        this.supabaseClient = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        
        // Get current user
        const { data: { user } } = await this.supabaseClient.auth.getUser();
        if (!user) {
            console.log('No user logged in');
            return;
        }
        
        this.userId = user.id;
        await this.determineUserRole();
        await this.updateAllNavbarLinks();
        await this.loadUserProfile();
        
        console.log(`✅ Navbar updated for role: ${this.userRole}`);
    }

    async determineUserRole() {
        // Check performers table
        const { data: performer } = await this.supabaseClient
            .from('performers')
            .select('id')
            .eq('auth_id', this.userId)
            .single();
        
        if (performer) {
            this.userRole = 'performer';
            return;
        }
        
        // Check agents table
        const { data: agent } = await this.supabaseClient
            .from('agents')
            .select('id')
            .eq('auth_id', this.userId)
            .single();
        
        if (agent) {
            this.userRole = 'agent';
            return;
        }
        
        // Check bookers table
        const { data: booker } = await this.supabaseClient
            .from('bookers')
            .select('id')
            .eq('auth_id', this.userId)
            .single();
        
        if (booker) {
            this.userRole = 'booker';
            return;
        }
        
        this.userRole = 'performer'; // Default fallback
    }

    async loadUserProfile() {
        let profile = null;
        
        if (this.userRole === 'performer') {
            const { data } = await this.supabaseClient
                .from('performers')
                .select('name, image_url')
                .eq('auth_id', this.userId)
                .single();
            profile = data;
        } else if (this.userRole === 'agent') {
            const { data } = await this.supabaseClient
                .from('agents')
                .select('name, logo_url')
                .eq('auth_id', this.userId)
                .single();
            if (data) profile = { name: data.name, image_url: data.logo_url };
        } else if (this.userRole === 'booker') {
            const { data } = await this.supabaseClient
                .from('bookers')
                .select('name, logo_url')
                .eq('auth_id', this.userId)
                .single();
            if (data) profile = { name: data.name, image_url: data.logo_url };
        }
        
        // Update sidebar user info
        const userNameEl = document.getElementById('userName');
        if (userNameEl && profile) {
            userNameEl.textContent = profile.name || (this.userRole === 'performer' ? 'Stage Name' : this.userRole === 'agent' ? 'Agency Name' : 'Venue Name');
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && profile?.image_url) {
            userAvatar.innerHTML = `<img src="${profile.image_url}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) {
            if (this.userRole === 'performer') userRoleEl.textContent = 'Performer';
            else if (this.userRole === 'agent') userRoleEl.textContent = 'Agent';
            else if (this.userRole === 'booker') userRoleEl.textContent = 'Booker';
        }
    }

    updateAllNavbarLinks() {
        // Update Dashboard link (first nav-item with home icon)
        const dashboardLink = document.querySelector('.sidebar-nav a[href*="hub"], .sidebar-nav a[href*="dashboard"]');
        if (dashboardLink) {
            if (this.userRole === 'performer') dashboardLink.href = 'performer-hub.html';
            else if (this.userRole === 'agent') dashboardLink.href = 'agent-hub.html';
            else if (this.userRole === 'booker') dashboardLink.href = 'booker-hub.html';
        }
        
        // Update Edit Profile link
        const editLink = document.querySelector('.sidebar-nav a[href*="edit"]');
        if (editLink) {
            if (this.userRole === 'performer') editLink.href = 'performer-edit.html';
            else if (this.userRole === 'agent') editLink.href = 'agent-edit.html';
            else if (this.userRole === 'booker') editLink.href = 'booker-edit.html';
        }
        
        // Update Browse link (always stays browse.html)
        const browseLink = document.querySelector('.sidebar-nav a[href*="browse"]');
        if (browseLink) browseLink.href = 'browse.html';
        
        // Update Bookings link (always stays bookings.html)
        const bookingsLink = document.querySelector('.sidebar-nav a[href*="bookings"]');
        if (bookingsLink) bookingsLink.href = 'bookings.html';
        
        // ========== TOOLS DROPDOWN - ROLE SPECIFIC ==========
        const toolsDropdown = document.querySelector('.dropdown-container');
        const toolsMenu = document.querySelector('#toolsDropdownMenu, .dropdown-menu');
        
        if (toolsDropdown && toolsMenu) {
            // Clear existing menu items but keep the structure
            const originalToggle = toolsMenu.querySelector('.dropdown-toggle');
            const parentContainer = toolsDropdown;
            
            // Define role-specific tools
            let tools = [];
            
            if (this.userRole === 'performer') {
                tools = [
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' }
                ];
            } else if (this.userRole === 'agent') {
                tools = [
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' },
                    { icon: 'fas fa-users', name: 'My Artists', href: 'agent-artists.html' }
                ];
            } else if (this.userRole === 'booker') {
                tools = [
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' },
                    { icon: 'fas fa-calendar-plus', name: 'Add Events', href: 'events.html' }
                ];
            }
            
            // Rebuild tools menu
            const currentMenuItems = toolsMenu.querySelectorAll('.dropdown-item');
            currentMenuItems.forEach(item => item.remove());
            
            tools.forEach(tool => {
                const link = document.createElement('a');
                link.className = 'nav-item dropdown-item';
                link.href = tool.href;
                link.innerHTML = `<i class="${tool.icon}"></i><span>${tool.name}</span>`;
                toolsMenu.appendChild(link);
            });
        }
    }
}

// ============================================
// FIX FOR BROWSER BACK BUTTON - REMOVES FULLSCREEN BUTTON CONFLICT
// ============================================
(function() {
    // Remove the fullscreen button functionality that was causing issues
    // Only keep it if it's actually needed for specific pages
    
    // Fix scrolling issues
    function fixPageScrolling() {
        const isChatPage = window.location.pathname.includes('chat');
        
        if (isChatPage) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = 'auto';
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.overflow = 'auto';
            document.body.style.overflowX = 'hidden';
            document.body.style.height = 'auto';
            document.documentElement.style.height = 'auto';
        }
    }
    
    fixPageScrolling();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixPageScrolling);
    }
    setTimeout(fixPageScrolling, 100);
})();

// ============================================
// INITIALIZE NAVBAR ON EVERY PAGE
// ============================================

// Wait for DOM and Supabase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    // Wait a tiny bit for Supabase to be loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize navbar manager
    if (typeof supabase !== 'undefined') {
        const navbarManager = new NavbarManager();
        await navbarManager.init();
        
        // Also update on hash change
        window.addEventListener('hashchange', () => navbarManager.init());
        window.addEventListener('popstate', () => navbarManager.init());
    }
});
});