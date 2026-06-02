/**
 * Vivo Distro - Onboarding Tips/Tour System
 * Premium guided tour for first-time users.
 */

class VivoTipsTour {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.role = '';
        this.overlay = null;
        this.bubble = null;
        this.initialized = false;
        
        // Configuration for different roles
        // Note: Tool IDs are generated as #navItem[ToolName] or #navItem[ToolName]Standalone
        this.roleConfigs = {
            'performer': [
                {
                    target: '#profileCard',
                    title: 'Welcome to Your Dashboard!',
                    content: "This is your main command center. Here you can see a summary of the profile you've built, including your ratings, location, bio, and connected social platforms. It's how the world sees you on Vivo Distro!",
                    position: 'bottom'
                },
                {
                    target: '.hub-sidebar',
                    title: 'Your Navigation Hub',
                    content: "Use the sidebar to move around the platform. It gives you quick access to all the features you need to manage your career.",
                    position: 'right'
                },
                {
                    target: '#navItemDashboard',
                    title: 'Quick Home',
                    content: "The Dashboard icon brings you right back here whenever you need a quick overview of your profile.",
                    position: 'right'
                },
                {
                    target: '#navItemBrowse',
                    title: 'Explore the Industry',
                    content: "Ready to connect? Use Browse to discover other performers, find agents, or see what bookers are looking for.",
                    position: 'right'
                },
                {
                    target: '#navItemEditProfile',
                    title: 'Keep it Fresh',
                    content: "Want to change your bio or update your contact info? The Edit Profile section lets you keep your presence up to date.",
                    position: 'right'
                },
                {
                    target: '#navItemInbox',
                    title: 'Opportunities Await',
                    content: "Check your Inbox for messages, booking requests, and collaborative opportunities.",
                    position: 'right'
                },
                {
                    target: '#navItemComments',
                    title: 'Audience Feedback',
                    content: "See what the fans and professionals are saying about your work in the Comments section.",
                    position: 'right'
                },
                {
                    target: '#navItemVivoCalculator',
                    title: 'Vivo Calculator',
                    content: "Calculate your potential earnings, expenses, and booking rates to stay on top of your finances.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemVivoCalendar',
                    title: 'Vivo Calendar',
                    content: "Keep track of your gigs, rehearsals, and important milestones in one centralized place.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemTechList',
                    title: 'TechList',
                    content: "Manage your technical requirements and equipment lists so every venue knows exactly what you need.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemCheckList',
                    title: 'CheckList',
                    content: "Stay organized with customizable checklists for show prep, travel, and more.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#settingsBtn',
                    title: 'Make it Yours',
                    content: "Personalize your experience! You can switch to Dark/Light mode, toggle a compact sidebar, choose which tools appear in your menu, and pick from several premium themes.",
                    position: 'right'
                }
            ],
            'agent': [
                {
                    target: '#profileCard',
                    title: 'Agency Dashboard',
                    content: "Welcome to your command center! Overview your agency details, location, and connections at a glance. This represents your professional brand on the platform.",
                    position: 'bottom'
                },
                {
                    target: '.hub-sidebar',
                    title: 'Agency Navigation',
                    content: "The sidebar allows you to efficiently manage your operations and navigate through your agency's portal.",
                    position: 'right'
                },
                {
                    target: '#navItemDashboard',
                    title: 'Agency Home',
                    content: "Quickly return to your agency overview and roster stats from any page.",
                    position: 'right'
                },
                {
                    target: '#navItemBrowse',
                    title: 'Talent Scouting',
                    content: "Use the Artists section to browse and discover new talent for your roster across the Vivo Distro network.",
                    position: 'right'
                },
                {
                    target: '#navItemEditProfile',
                    title: 'Update Your Agency',
                    content: "Keep your agency profile, contact info, and specialties up to date to attract more talent and venues.",
                    position: 'right'
                },
                {
                    target: '#navItemInbox',
                    title: 'Manage Your Roster Requests',
                    content: "Track communications between your artists and potential bookers in your unified inbox.",
                    position: 'right'
                },
                {
                    target: '#navItemMyArtists',
                    title: 'Roster Management',
                    content: "The 'My Artists' section is where you manage the talent you represent, update their status, and track their progress.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemVivoCalculator',
                    title: 'Vivo Calculator',
                    content: "Use our tailored calculator to handle commissions, artist payouts, and booking projections.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemVivoCalendar',
                    title: 'Agency Calendar',
                    content: "Manage the complex schedules of your entire roster in one unified view.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemTechList',
                    title: 'Tech Management',
                    content: "Review and manage the technical riders and equipment needs for all your represented talent.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemCheckList',
                    title: 'Agency CheckList',
                    content: "Keep track of administrative tasks, artist onboarding, and tour preparation.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#settingsBtn',
                    title: 'Professional Setup',
                    content: "Tailor the portal to your workflow. Change themes, enable compact mode for more space, and hide or show tools based on your agency's needs.",
                    position: 'right'
                }
            ],
            'booker': [
                {
                    target: '#profileCard',
                    title: 'Venue/Company Dashboard',
                    content: "Welcome to your hub! This is where you overview your company profile. Keep your location and bio updated to attract the best talent.",
                    position: 'bottom'
                },
                {
                    target: '.hub-sidebar',
                    title: 'Booking Navigation',
                    content: "Your sidebar is organized for efficient talent discovery and event management.",
                    position: 'right'
                },
                {
                    target: '#navItemDashboard',
                    title: 'Venue Home',
                    content: "Access your dashboard to see upcoming bookings and your venue's profile summary.",
                    position: 'right'
                },
                {
                    target: '#navItemBrowse',
                    title: 'Find Your Next Star',
                    content: "The Find Talent section is where you discover performers and artists for your upcoming events.",
                    position: 'right'
                },
                {
                    target: '#navItemEditProfile',
                    title: 'Edit Venue Info',
                    content: "Ensure your venue details, capacity, and amenities are correct so artists can find and book you.",
                    position: 'right'
                },
                {
                    target: '#navItemInbox',
                    title: 'Booking Inquiries',
                    content: "Manage your communications with artists and agents. This is where you finalize bookings and deals.",
                    position: 'right'
                },
                {
                    target: '#navItemComments',
                    title: 'Venue Feedback',
                    content: "See what artists and attendees have to say about your events and venue.",
                    position: 'right'
                },
                {
                    target: '#navItemAddEvents',
                    title: 'Event Creation',
                    content: "Plan and publish new events, set dates, and manage booking openings directly from here.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemVivoCalculator',
                    title: 'Profitability Calculator',
                    content: "Forecast event costs, ticket sales, and potential returns with our built-in calculator.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemVivoCalendar',
                    title: 'Venue Calendar',
                    content: "Manage your event calendar, blackout dates, and show schedules effortlessly.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemTechList',
                    title: 'Venue Tech Specs',
                    content: "Maintain your venue's technical specifications so artists know exactly what to expect when they arrive.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#navItemCheckList',
                    title: 'Event Checklists',
                    content: "Ensure every detail is covered with specialized checklists for venue prep and event execution.",
                    position: 'right',
                    isTool: true
                },
                {
                    target: '#settingsBtn',
                    title: 'Personalize Your Hub',
                    content: "Make the hub work for you. Choose themes that fit your brand, toggle the compact view, and manage which tools are displayed in your sidebar.",
                    position: 'right'
                }
            ]
        };

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.initialized) return;
        
        const roleEl = document.getElementById('userRole');
        if (roleEl) {
            this.role = roleEl.textContent.toLowerCase().trim();
        }

        if (!this.role || !this.roleConfigs[this.role]) {
            // Fallback for role detection
            if (window.location.pathname.includes('performer')) this.role = 'performer';
            else if (window.location.pathname.includes('agent')) this.role = 'agent';
            else if (window.location.pathname.includes('booker')) this.role = 'booker';
        }

        if (!this.role || !this.roleConfigs[this.role]) return;

        // Check if user has already completed the tour
        const tourCompleted = localStorage.getItem(`vivo_tour_completed_${this.role}`);
        if (tourCompleted) return;

        this.steps = this.roleConfigs[this.role];
        this.createUI();
        
        setTimeout(() => this.startTour(), 3000);
        
        this.initialized = true;
    }

    createUI() {
        if (this.overlay || this.bubble) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'vivo-tip-overlay';
        document.body.appendChild(this.overlay);

        this.bubble = document.createElement('div');
        this.bubble.className = 'vivo-tip-bubble';
        document.body.appendChild(this.bubble);

        window.addEventListener('resize', () => {
            if (this.bubble && this.bubble.classList.contains('active')) {
                this.updatePosition();
            }
        });
    }

    startTour() {
        this.currentStep = 0;
        this.overlay.classList.add('active');
        this.showStep();
    }

    getTarget(step) {
        let target = document.querySelector(step.target);
        
        // Strategy: If direct target is not found OR it's hidden (dropdown mode)
        // look for the Standalone version if it's a tool
        if (step.isTool) {
            const compactMode = document.body.classList.contains('sidebar-compact');
            if (!compactMode) {
                // Not in compact mode -> tools are standalone
                target = document.querySelector(step.target + 'Standalone');
            } else {
                // In compact mode -> tools are in dropdown
                // Ensure dropdown is open
                const trigger = document.querySelector('#toolsDropdownToggle');
                if (trigger && !trigger.classList.contains('open')) {
                    trigger.click();
                }
                target = document.querySelector(step.target);
            }
        }

        return target;
    }

    showStep() {
        if (!this.bubble) return;

        const step = this.steps[this.currentStep];
        const target = this.getTarget(step);

        console.log(`Tour Step ${this.currentStep + 1}: Targeting ${step.target}`, target);

        if (!target) {
            console.warn(`Tips target ${step.target} not found/visible, skipping...`);
            this.nextStep();
            return;
        }

        // Delay slightly for dropdown animations if we just clicked it
        const delay = step.isTool && document.body.classList.contains('sidebar-compact') ? 300 : 0;

        setTimeout(() => {
            if (!this.bubble) return;
            this.bubble.innerHTML = `
                <div class="vivo-tip-header">
                    <div class="vivo-tip-title">
                        <i class="fas fa-lightbulb"></i>
                        ${step.title}
                    </div>
                    <button class="vivo-tip-close" onclick="window.vivoTips.endTour()">&times;</button>
                </div>
                <div class="vivo-tip-body">
                    ${step.content}
                </div>
                <div class="vivo-tip-footer">
                    <div class="vivo-tip-progress">Step ${this.currentStep + 1} of ${this.steps.length}</div>
                    <button class="vivo-tip-next" onclick="window.vivoTips.nextStep()">
                        ${this.currentStep === this.steps.length - 1 ? 'Get Started!' : 'Next Step'}
                    </button>
                </div>
            `;

            this.updatePosition();
            this.bubble.classList.add('active');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, delay);
    }

    updatePosition() {
        if (!this.bubble) return;

        const step = this.steps[this.currentStep];
        const target = this.getTarget(step);
        if (!target) return;

        const targetRect = target.getBoundingClientRect();
        const bubbleRect = this.bubble.getBoundingClientRect();
        const padding = 20;

        let top, left;
        let arrowClass = '';

        this.bubble.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
                arrowClass = 'arrow-top';
                break;
            case 'top':
                top = targetRect.top - bubbleRect.height - padding;
                left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
                arrowClass = 'arrow-bottom';
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
                left = targetRect.right + padding;
                arrowClass = 'arrow-left';
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
                left = targetRect.left - bubbleRect.width - padding;
                arrowClass = 'arrow-right';
                break;
            default:
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
                arrowClass = 'arrow-top';
        }

        if (left < padding) left = padding;
        if (left + bubbleRect.width > window.innerWidth - padding) {
            left = window.innerWidth - bubbleRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + bubbleRect.height > window.innerHeight - padding) {
            top = window.innerHeight - bubbleRect.height - padding;
        }

        this.bubble.style.top = `${top + window.scrollY}px`;
        this.bubble.style.left = `${left + window.scrollX}px`;
        this.bubble.classList.add(arrowClass);
    }

    nextStep() {
        if (!this.bubble) return;
        this.bubble.classList.remove('active');
        setTimeout(() => {
            this.currentStep++;
            if (this.currentStep < this.steps.length) {
                this.showStep();
            } else {
                this.endTour();
            }
        }, 300);
    }

    endTour() {
        if (!this.bubble || !this.overlay) return;
        this.bubble.classList.remove('active');
        this.overlay.classList.remove('active');
        localStorage.setItem(`vivo_tour_completed_${this.role}`, 'true');
        setTimeout(() => {
            if (this.overlay) { this.overlay.remove(); this.overlay = null; }
            if (this.bubble) { this.bubble.remove(); this.bubble = null; }
        }, 500);
    }
}

window.vivoTips = new VivoTipsTour();
