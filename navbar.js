// navbar.js - Smart role-aware sidebar + shared account footer behavior
// Load after Supabase and, when available, after settings-manager.js.

class NavbarManager {
    constructor() {
        this.supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
        this.supabaseClient = null;
        this.userRole = null;
        this.userId = null;
        this.userProfile = null;
        this.initialized = false;
    }

    async init() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase not loaded. navbar.js requires the Supabase browser client.');
            return;
        }

        this.ensureSidebarStyles();
        this.ensureSidebarShell();
        this.ensureSettingsModal();

        this.supabaseClient = window.supabaseClient || supabase.createClient(this.supabaseUrl, this.supabaseKey);
        window.supabaseClient = this.supabaseClient;

        const { data: { user } } = await this.supabaseClient.auth.getUser();

        this.ensureSupportLink();

        if (!user) {
            this.userRole = this.inferRoleFromPath() || 'performer';
            this.updateAllNavbarLinks();
            this.bindSidebarUi();
            this.initialized = true;
            return;
        }

        this.userId = user.id;
        await this.determineUserRole();
        this.updateAllNavbarLinks();
        await this.loadUserProfileForSidebar();
        this.bindSidebarUi();
        await this.ensureSettingsManager();

        await this.updateNotifications();
        // Periodically refresh notifications
        setInterval(() => this.updateNotifications(), 60000);

        this.initialized = true;
        console.log(`Sidebar ready for role: ${this.userRole}`);
    }

    async updateNotifications() {
        if (!this.userId || !this.supabaseClient) return;

        const path = window.location.pathname.toLowerCase();
        const isInboxPage = path.includes('inbox.html');
        const isCalendarPage = (path.includes('calendar.html') && !path.includes('agent-calendar.html')) || 
                               (path.includes('agent-calendar.html') && this.userRole === 'agent');

        // 1. Inbox Notifications
        const { count: unreadCount, error: inboxError } = await this.supabaseClient
            .from('inbox_items')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', this.userId)
            .eq('status', 'pending');

        if (!inboxError) {
            this.applyNotificationBadge('navItemInbox', isInboxPage ? 0 : (unreadCount || 0));
        }

        // 2. Calendar Notifications (The day before an event)
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        
        const todayStr = now.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (isCalendarPage) {
            localStorage.setItem('vivo_lastCalendarVisit', todayStr);
        }

        const lastVisitDate = localStorage.getItem('vivo_lastCalendarVisit');
        const hasVisitedToday = (lastVisitDate === todayStr);

        // Check local events first
        const localEvents = JSON.parse(localStorage.getItem('vivoCalendarEvents') || '[]');
        let hasEventSoon = localEvents.some(event => {
            const evDateStr = typeof event.date === 'string' ? event.date.split('T')[0] : new Date(event.date).toISOString().split('T')[0];
            // Show notification if an event is today or tomorrow (the day before)
            return evDateStr === todayStr || evDateStr === tomorrowStr;
        });

        // If not found locally, check Supabase
        if (!hasEventSoon) {
            const { data: dbEvents } = await this.supabaseClient
                .from('calendar_events')
                .select('event_date')
                .eq('user_id', this.userId)
                .or(`event_date.eq.${todayStr},event_date.eq.${tomorrowStr}`)
                .limit(1);
            
            if (dbEvents && dbEvents.length > 0) hasEventSoon = true;
        }

        // Calendar indicator disabled by request.
    }

    applyNotificationBadge(id, count) {
        const el = document.getElementById(id);
        if (!el) return;

        let badge = el.querySelector('.notification-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                this.getNotificationAnchor(el).appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    }

    applyNotificationDot(hrefSnippet, show) {
        // Find all links that point to this page
        const links = document.querySelectorAll(`.nav-item[href*="${hrefSnippet}"]`);
        links.forEach(link => {
            let dot = link.querySelector('.notification-dot');
            if (show) {
                if (!dot) {
                    dot = document.createElement('span');
                    dot.className = 'notification-dot';
                    this.getNotificationAnchor(link).appendChild(dot);
                }
            } else if (dot) {
                dot.remove();
            }
        });

        // Also update the "Tools" label if any of its children have a dot
        const toolsToggle = document.getElementById('toolsDropdownToggle');
        const toolsMenu = document.getElementById('toolsDropdownMenu');
        if (toolsToggle && toolsMenu) {
            const hasAnyDotInside = !!toolsMenu.querySelector('.notification-dot');
            let globalDot = toolsToggle.querySelector('.notification-dot');
            
            if (hasAnyDotInside) {
                if (!globalDot) {
                    globalDot = document.createElement('span');
                    globalDot.className = 'notification-dot';
                    this.getNotificationAnchor(toolsToggle).appendChild(globalDot);
                }
            } else if (globalDot) {
                globalDot.remove();
            }
        }
    }

    getNotificationAnchor(el) {
        const labelContainer = el.querySelector('.dropdown-label') || el;
        let anchor = labelContainer.querySelector('.notification-anchor');
        if (!anchor) {
            anchor = document.createElement('span');
            anchor.className = 'notification-anchor';
            labelContainer.appendChild(anchor);
        }
        return anchor;
    }

    ensureSidebarStyles() {
        if (document.getElementById('sidebarSystemStyles')) return;
        const link = document.createElement('link');
        link.id = 'sidebarSystemStyles';
        link.rel = 'stylesheet';
        link.href = 'sidebar-system.css';
        document.head.appendChild(link);
    }

    ensureSidebarShell() {
        if (document.querySelector('.hub-sidebar')) return;

        // Apply compact mode immediately if saved to prevent "flash"
        if (localStorage.getItem('vivo_sidebar_compact') === 'true') {
            document.body.classList.add('sidebar-compact');
        }

        document.body.classList.add('has-app-sidebar');

        const shell = document.createElement('aside');
        shell.className = 'hub-sidebar injected-sidebar';
        shell.innerHTML = `
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fas fa-music"></i>
                    <span>VIVO <span class="logo-highlight">DISTRO</span></span>
                </div>
                <button class="sidebar-mobile-toggle" id="sidebarCompactToggle" type="button" aria-label="Toggle sidebar">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item" id="navItemDashboard"><i class="fas fa-home"></i><span>Dashboard</span></a>
                <a href="#" class="nav-item" id="navItemBrowse"><i class="fas fa-search"></i><span>Browse</span></a>
                <a href="#" class="nav-item" id="navItemEditProfile"><i class="fas fa-edit"></i><span>Edit Profile</span></a>
                <a href="inbox.html" class="nav-item" id="navItemInbox"><i class="fas fa-calendar-check"></i><span>Inbox</span></a>
                <a href="comments.html" class="nav-item" id="navItemComments"><i class="fas fa-star"></i><span>Comments</span></a>
                <div id="standaloneToolsMount"></div>
                <div class="dropdown-container" id="navItemTools">
                    <a href="#" class="nav-item dropdown-toggle" id="toolsDropdownToggle">
                        <span class="dropdown-label"><i class="fas fa-tools"></i><span>Tools</span></span>
                        <i class="fas fa-chevron-down chevron"></i>
                    </a>
                    <div class="dropdown-menu" id="toolsDropdownMenu"></div>
                </div>
                <a href="support.html" class="nav-item" id="navItemSupport"><i class="fas fa-question-circle"></i><span>Support</span></a>
                <a href="#" class="nav-item" id="settingsBtn"><i class="fas fa-cog"></i><span>Settings</span></a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-profile">
                    <button class="user-avatar sidebar-clickable" id="userAvatar" type="button" title="Open profile">
                        <i class="fas fa-user"></i>
                    </button>
                    <div class="user-info">
                        <div class="user-name-row">
                            <button class="user-name-button" id="userNameButton" type="button" title="Switch account">
                                <h4 id="userName">Stage Name</h4>
                            </button>
                            <button class="logout-btn" id="sidebarSignOutBtn" type="button" title="Sign out">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                        <p id="userRole">Performer</p>
                    </div>
                </div>
            </div>
        `;

        const main = document.querySelector('.hub-main');
        if (main) {
            document.body.insertBefore(shell, main);
        } else {
            document.body.classList.add('sidebar-body-offset');
            document.body.insertBefore(shell, document.body.firstChild);
        }

        this.ensureSupportLink();
    }

    ensureSupportLink() {
        const nav = document.querySelector('.sidebar-nav');
        if (!nav || document.getElementById('navItemSupport')) return;

        const supportLink = document.createElement('a');
        supportLink.href = 'support.html';
        supportLink.className = 'nav-item';
        supportLink.id = 'navItemSupport';
        supportLink.innerHTML = '<i class="fas fa-question-circle"></i><span>Support</span>';

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            nav.insertBefore(supportLink, settingsBtn);
        } else {
            nav.appendChild(supportLink);
        }
    }

    ensureSettingsModal() {
        if (document.getElementById('settingsModalOverlay')) return;

        const modal = document.createElement('div');
        modal.className = 'settings-modal-overlay';
        modal.id = 'settingsModalOverlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="settings-modal">
                <div class="settings-header">
                    <h2><i class="fas fa-cog"></i> Settings</h2>
                    <button class="close-settings" type="button" onclick="window.settingsManager?.closeModal()">&times;</button>
                </div>
                <div class="settings-section">
                    <h3><i class="fas fa-palette"></i> THEME</h3>
                    <div class="theme-grid">
                        <div class="theme-option" data-theme="default" onclick="window.settingsManager?.setTheme('default')"><div class="theme-preview" style="background:#0A0E1A;border-color:#6C63FF;"></div><span>Default</span></div>
                        <div class="theme-option" data-theme="blosm" onclick="window.settingsManager?.setTheme('blosm')"><div class="theme-preview" style="background:#1A0B15;border-color:#FF8FB1;"></div><span>Blossom</span></div>
                        <div class="theme-option" data-theme="forest" onclick="window.settingsManager?.setTheme('forest')"><div class="theme-preview" style="background:#0B1A12;border-color:#48BB78;"></div><span>Forest</span></div>
                        <div class="theme-option" data-theme="blackout" onclick="window.settingsManager?.setTheme('blackout')"><div class="theme-preview" style="background:#000000;border-color:#FFFFFF;"></div><span>Blackout</span></div>
                        <div class="theme-option" data-theme="light" onclick="window.settingsManager?.setTheme('light')"><div class="theme-preview" style="background:#F7FAFC;border-color:#6C63FF;"></div><span>Light</span></div>
                        <div class="theme-option" data-theme="ocean" onclick="window.settingsManager?.setTheme('ocean')"><div class="theme-preview" style="background:#001F3F;border-color:#00B4D8;"></div><span>Ocean</span></div>
                        <div class="theme-option" data-theme="desert" onclick="window.settingsManager?.setTheme('desert')"><div class="theme-preview" style="background:#3E3E3E;border-color:#D4A373;"></div><span>Desert</span></div>
                        <div class="theme-option" data-theme="neon" onclick="window.settingsManager?.setTheme('neon')"><div class="theme-preview" style="background:#050510;border-color:#FF00FF;"></div><span>Neon</span></div>
                    </div>
                </div>
                <div class="settings-section">
                    <h3><i class="fas fa-bars"></i> CUSTOMIZE SIDEBAR</h3>
                    <div class="switches-list" id="sidebarCustomizeList"></div>
                </div>
                <div class="settings-actions">
                    <button class="btn-save" type="button" onclick="window.settingsManager?.saveSettings(); window.settingsManager?.closeModal();">Save Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async determineUserRole() {
        const roleTables = [
            { table: 'performers', role: 'performer' },
            { table: 'agents', role: 'agent' },
            { table: 'bookers', role: 'booker' }
        ];

        for (const entry of roleTables) {
            const { data } = await this.supabaseClient
                .from(entry.table)
                .select('id')
                .eq('auth_id', this.userId)
                .maybeSingle();
            if (data) {
                this.userRole = entry.role;
                return;
            }
        }

        this.userRole = this.inferRoleFromPath() || 'performer';
    }

    inferRoleFromPath() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('agent-')) return 'agent';
        if (path.includes('booker-') || path.includes('event')) return 'booker';
        if (path.includes('performer-') || path.includes('profile')) return 'performer';
        return null;
    }

    getRoleConfig() {
        const configs = {
            performer: {
                logoIcon: 'fa-music',
                links: [
                    { id: 'navItemDashboard', icon: 'fas fa-home', label: 'Dashboard', href: 'performer-hub.html' },
                    { id: 'navItemBrowse', icon: 'fas fa-search', label: 'Browse', href: 'browse.html' },
                    { id: 'navItemEditProfile', icon: 'fas fa-edit', label: 'Edit Profile', href: 'performer-edit.html' },
                    { id: 'navItemInbox', icon: 'fas fa-calendar-check', label: 'Inbox', href: 'inbox.html' },
                    { id: 'navItemComments', icon: 'fas fa-star', label: 'Comments', href: 'comments.html' },
                    { id: 'navItemSupport', icon: 'fas fa-question-circle', label: 'Support', href: 'support.html' }
                ],
                tools: [
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' }
                ]
            },
            agent: {
                logoIcon: 'fa-user-tie',
                links: [
                    { id: 'navItemDashboard', icon: 'fas fa-home', label: 'Dashboard', href: 'agent-hub.html' },
                    { id: 'navItemBrowse', icon: 'fas fa-search', label: 'Artists', href: 'browse.html' },
                    { id: 'navItemEditProfile', icon: 'fas fa-edit', label: 'Edit Profile', href: 'agent-edit.html' },
                    { id: 'navItemInbox', icon: 'fas fa-calendar-check', label: 'Inbox', href: 'inbox.html' },
                    { id: 'navItemSupport', icon: 'fas fa-question-circle', label: 'Support', href: 'support.html' }
                ],
                tools: [
                    { icon: 'fas fa-users', name: 'My Artists', href: 'agent-artists.html' },
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' }
                ]
            },
            booker: {
                logoIcon: 'fa-calendar-check',
                links: [
                    { id: 'navItemDashboard', icon: 'fas fa-home', label: 'Dashboard', href: 'booker-hub.html' },
                    { id: 'navItemBrowse', icon: 'fas fa-search', label: 'Find Talent', href: 'browse.html' },
                    { id: 'navItemEditProfile', icon: 'fas fa-edit', label: 'Edit Profile', href: 'booker-edit.html' },
                    { id: 'navItemInbox', icon: 'fas fa-calendar-check', label: 'Inbox', href: 'inbox.html' },
                    { id: 'navItemComments', icon: 'fas fa-star', label: 'Comments', href: 'comments.html' },
                    { id: 'navItemSupport', icon: 'fas fa-question-circle', label: 'Support', href: 'support.html' }
                ],
                tools: [
                    { icon: 'fas fa-calculator', name: 'Vivo Calculator', href: 'calculator.html' },
                    { icon: 'fas fa-calendar-alt', name: 'Vivo Calendar', href: 'calendar.html' },
                    { icon: 'fas fa-microchip', name: 'TechList', href: 'techlist.html' },
                    { icon: 'fas fa-check-square', name: 'CheckList', href: 'checklist.html' },
                    { icon: 'fas fa-calendar-plus', name: 'Add Events', href: 'events.html' }
                ]
            }
        };

        return configs[this.userRole] || configs.performer;
    }

    async loadUserProfileForSidebar() {
        let profile = null;
        if (!this.userId) return;

        if (this.userRole === 'performer') {
            const { data } = await this.supabaseClient
                .from('performers')
                .select('name, image_url')
                .eq('auth_id', this.userId)
                .maybeSingle();
            profile = data;
        } else if (this.userRole === 'agent') {
            const { data } = await this.supabaseClient
                .from('agents')
                .select('name, logo_url')
                .eq('auth_id', this.userId)
                .maybeSingle();
            if (data) profile = { name: data.name, image_url: data.logo_url };
        } else if (this.userRole === 'booker') {
            const { data } = await this.supabaseClient
                .from('bookers')
                .select('name, logo_url')
                .eq('auth_id', this.userId)
                .maybeSingle();
            if (data) profile = { name: data.name, image_url: data.logo_url };
        }

        this.userProfile = profile;

        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = profile?.name || this.getDefaultName();

        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) userRoleEl.textContent = this.getRoleDisplayName();

        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (profile?.image_url) {
                userAvatar.innerHTML = `<img src="${profile.image_url}" alt="${profile?.name || 'Profile'}">`;
            } else {
                userAvatar.innerHTML = `<i class="fas ${this.getDefaultIcon()}"></i>`;
            }
        }
    }

    getDefaultIcon() {
        if (this.userRole === 'performer') return 'fa-user';
        if (this.userRole === 'agent') return 'fa-user-tie';
        return 'fa-building';
    }

    getDefaultName() {
        if (this.userRole === 'performer') return 'Stage Name';
        if (this.userRole === 'agent') return 'Agency Name';
        return 'Venue Name';
    }

    getRoleDisplayName() {
        if (this.userRole === 'performer') return 'Performer';
        if (this.userRole === 'agent') return 'Agent';
        return 'Booker';
    }

    updateAllNavbarLinks() {
        const config = this.getRoleConfig();
        const sidebar = document.querySelector('.hub-sidebar');
        if (!sidebar) return;

        this.ensureStandaloneToolsMount();

        const logoIcon = sidebar.querySelector('.logo i');
        if (logoIcon) logoIcon.className = `fas ${config.logoIcon}`;

        const allTopLevelIds = ['navItemDashboard', 'navItemBrowse', 'navItemEditProfile', 'navItemInbox', 'navItemComments', 'navItemSupport'];
        allTopLevelIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;

            const link = config.links.find(item => item.id === id);
            if (!link) {
                element.style.display = 'none';
                return;
            }

            element.style.display = '';
            element.href = link.href;
            const icon = element.querySelector('i');
            const text = element.querySelector('span:last-child');
            if (icon) icon.className = link.icon;
            if (text) text.textContent = link.label;
            element.classList.toggle('active', this.isCurrentPage(link.href));
        });

        const oldProfileLink = document.getElementById('navItemMyProfile');
        if (oldProfileLink) oldProfileLink.remove();

        const toolsContainer = document.getElementById('navItemTools');
        if (toolsContainer) {
            toolsContainer.style.display = '';
            toolsContainer.classList.toggle('active', config.tools.some(tool => this.isCurrentPage(tool.href)));
        }

        this.updateToolsDropdown(config.tools);
        this.buildSidebarCustomizeList(config.links);
        this.ensureCompactToggleInExistingModal();
        this.syncToolsPresentation();
    }

    updateToolsDropdown(tools) {
        const toolsMenu = document.getElementById('toolsDropdownMenu');
        const standaloneMount = document.getElementById('standaloneToolsMount');
        if (!toolsMenu || !standaloneMount) return;

        toolsMenu.innerHTML = '';
        standaloneMount.innerHTML = '';
        tools.forEach(tool => {
            // Helper to generate a consistent ID from tool name
            const toolId = 'navItem' + tool.name.replace(/\s+/g, '');

            const link = document.createElement('a');
            link.className = 'nav-item dropdown-item';
            link.id = toolId;
            link.href = tool.href;
            link.innerHTML = `<i class="${tool.icon}"></i><span>${tool.name}</span>`;
            if (this.isCurrentPage(tool.href)) {
                link.classList.add('active');
            }
            toolsMenu.appendChild(link);

            const standaloneLink = document.createElement('a');
            standaloneLink.className = 'nav-item tool-nav-item';
            standaloneLink.id = toolId + 'Standalone';
            standaloneLink.href = tool.href;
            standaloneLink.innerHTML = `<i class="${tool.icon}"></i><span>${tool.name}</span>`;
            if (this.isCurrentPage(tool.href)) {
                standaloneLink.classList.add('active');
            }
            standaloneMount.appendChild(standaloneLink);
        });
    }

    ensureStandaloneToolsMount() {
        if (document.getElementById('standaloneToolsMount')) return;

        const toolsContainer = document.getElementById('navItemTools');
        if (!toolsContainer || !toolsContainer.parentElement) return;

        const mount = document.createElement('div');
        mount.id = 'standaloneToolsMount';
        toolsContainer.parentElement.insertBefore(mount, toolsContainer);
    }

    buildSidebarCustomizeList(links) {
        const list = document.getElementById('sidebarCustomizeList');
        if (!list || list.dataset.generated === 'true') return;

        const isCompact = document.body.classList.contains('sidebar-compact');
        const items = [
            { id: 'compactSidebarToggle', label: 'Compact Mode', icon: 'fas fa-compress-alt', checked: isCompact, isSetting: true },
            ...links.map(link => ({ id: link.id, label: link.label, icon: link.icon, checked: true }))
        ];

        list.innerHTML = items.map(item => `
            <div class="switch-item">
                <span><i class="${item.icon}"></i> ${item.label}</span>
                <label class="switch">
                    <input type="checkbox" ${item.isSetting ? 'id="compactModeToggle"' : 'class="nav-toggle-switch" data-nav-id="' + item.id + '"'} ${item.checked ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
        `).join('');

        list.dataset.generated = 'true';
    }

    ensureCompactToggleInExistingModal() {
        if (document.getElementById('compactModeToggle')) return;

        const switchesList = document.querySelector('.switches-list');
        if (!switchesList) return;

        const compactRow = document.createElement('div');
        compactRow.className = 'switch-item';
        compactRow.innerHTML = `
            <span><i class="fas fa-compress-alt"></i> Compact Mode</span>
            <label class="switch">
                <input type="checkbox" id="compactModeToggle">
                <span class="slider round"></span>
            </label>
        `;

        switchesList.insertBefore(compactRow, switchesList.firstChild);
    }

    bindSidebarUi() {
        const toggle = document.getElementById('toolsDropdownToggle');
        const menu = document.getElementById('toolsDropdownMenu');
        if (toggle && menu && !toggle.dataset.bound) {
            toggle.dataset.bound = 'true';
            toggle.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                const shouldOpen = !menu.classList.contains('show');
                if (document.body.classList.contains('sidebar-compact')) {
                    document.body.classList.toggle('sidebar-open', shouldOpen);
                }
                toggle.classList.toggle('open', shouldOpen);
                menu.classList.toggle('show', shouldOpen);
            });
        }

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn && !settingsBtn.dataset.bound) {
            settingsBtn.dataset.bound = 'true';
            settingsBtn.addEventListener('click', event => {
                event.preventDefault();
                window.dispatchEvent(new Event('openSettings'));
            });
        }

        const compactToggle = document.getElementById('sidebarCompactToggle');
        if (compactToggle && !compactToggle.dataset.bound) {
            compactToggle.dataset.bound = 'true';
            compactToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-open');
            });
        }

        const userAvatar = document.querySelector('.sidebar-footer #userAvatar');
        if (userAvatar && !userAvatar.dataset.boundByNavbar) {
            userAvatar.dataset.boundByNavbar = 'true';
            userAvatar.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                const profileUrl = this.userId ? `profile.html?id=${this.userId}` : 'profile.html';
                window.location.href = profileUrl;
            });
        }

        const userNameButton = document.querySelector('.sidebar-footer #userNameButton');
        if (userNameButton && !userNameButton.dataset.boundByNavbar) {
            userNameButton.dataset.boundByNavbar = 'true';
            userNameButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                window.settingsManager?.openAccountSwitcher?.();
            });
        }

        if (!document.body.dataset.sidebarDocBound) {
            document.body.dataset.sidebarDocBound = 'true';
            document.addEventListener('click', event => {
                const clickedInsideToggle = event.target.closest('#toolsDropdownToggle');
                const clickedInsideMenu = event.target.closest('#toolsDropdownMenu');
                if (!clickedInsideToggle && !clickedInsideMenu) {
                    document.getElementById('toolsDropdownToggle')?.classList.remove('open');
                    document.getElementById('toolsDropdownMenu')?.classList.remove('show');
                    if (document.body.classList.contains('sidebar-compact')) {
                        document.body.classList.remove('sidebar-open');
                    }
                }
            });

            window.addEventListener('sidebarModeChanged', () => {
                this.syncToolsPresentation();
            });
        }
    }

    syncToolsPresentation() {
        const compactMode = document.body.classList.contains('sidebar-compact');
        const dropdownContainer = document.getElementById('navItemTools');
        const standaloneMount = document.getElementById('standaloneToolsMount');

        if (dropdownContainer) {
            dropdownContainer.style.display = compactMode ? '' : 'none';
        }

        if (standaloneMount) {
            standaloneMount.style.display = compactMode ? 'none' : '';
        }

        if (!compactMode) {
            document.getElementById('toolsDropdownToggle')?.classList.remove('open');
            document.getElementById('toolsDropdownMenu')?.classList.remove('show');
            document.body.classList.remove('sidebar-open');
        }
    }

    async ensureSettingsManager() {
        if (!window.SettingsManager || window.settingsManager || !this.userId) return;

        const tableName = this.userRole === 'performer' ? 'performers' : `${this.userRole}s`;
        window.settingsManager = new window.SettingsManager(this.supabaseClient, this.userId, tableName);
        
        // Wait for it to initialize itself
        if (window.settingsManager.init) {
            await window.settingsManager.init();
        }
    }

    isCurrentPage(href) {
        const current = window.location.pathname.split('/').pop().toLowerCase();
        return current === href.toLowerCase();
    }
}

async function startNavbarManager() {
    if (window.navbarManager?.initialized) return;

    const navbarManager = new NavbarManager();
    await navbarManager.init();
    window.navbarManager = navbarManager;

    if (!window.pushNotificationsBootstrapped) {
        window.pushNotificationsBootstrapped = true;
        const pushScript = document.createElement('script');
        pushScript.src = 'push_notifications.js';
        pushScript.onload = () => {
            if (window.NotificationManager && navbarManager.userId) {
                window.notifManager = new window.NotificationManager(navbarManager.supabaseClient, navbarManager.userId);
            }
        };
        document.head.appendChild(pushScript);
    }

    window.dispatchEvent(new CustomEvent('navbarReady', { detail: { role: navbarManager.userRole } }));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNavbarManager);
} else {
    startNavbarManager();
}
