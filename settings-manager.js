/**
 * SettingsManager - Centralized User Preferences & UI Personalization
 */
class SettingsManager {
    constructor(sb, userId, role) {
        this.sb = sb;
        this.userId = userId;
        this.role = role;
        this.settings = {
            theme: 'default',
            hiddenNavItems: [],
            backgroundUrl: null,
            notificationsEnabled: true,
            compactSidebar: false
        };
        
        console.log(`🛠️ Initializing SettingsManager for ${this.userId} (${this.role})`);
        this.init();
    }

    async init() {
        await this.loadSettings();
        // Force apply immediately after load
        this.applySettings();
        this.setupEventListeners();
        this.syncNotificationUIWithManager();
        this.setupAccountActions();
    }

    setupAccountActions() {
        // 1. Inject Account Security section into Settings Modal
        const settingsModal = document.querySelector('.settings-modal');
        if (settingsModal && !document.getElementById('changePasswordBtn')) {
            const actionsDiv = settingsModal.querySelector('.settings-actions');
            const accountSection = document.createElement('div');
            accountSection.className = 'settings-section';
            accountSection.innerHTML = `
                <h3><i class="fas fa-user-shield"></i> ACCOUNT SECURITY</h3>
                <div class="list-options" style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-secondary" id="changePasswordBtn" onclick="window.settingsManager?.openChangePasswordModal()" style="background:rgba(108,99,255,0.1); border:1px solid rgba(108,99,255,0.5); padding:10px; border-radius:8px; color:white; cursor:pointer;"><i class="fas fa-key"></i> Change Password</button>
                    <button class="btn-danger" id="logoutBtn" onclick="window.settingsManager?.logout()" style="background:rgba(245,101,101,0.1); border:1px solid rgba(245,101,101,0.5); padding:10px; border-radius:8px; color:#F56565; cursor:pointer;"><i class="fas fa-sign-out-alt"></i> Log Out</button>
                </div>
            `;
            if (actionsDiv) {
                settingsModal.insertBefore(accountSection, actionsDiv);
            } else {
                settingsModal.appendChild(accountSection);
            }
        }

        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar && !userAvatar.dataset.accountBound) {
            userAvatar.dataset.accountBound = 'true';
            userAvatar.style.cursor = 'pointer';
            userAvatar.title = 'Open profile';
            userAvatar.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const profileUrl = this.userId ? `profile.html?id=${this.userId}` : 'profile.html';
                window.location.href = profileUrl;
            });
        }

        const userInfo = document.querySelector('.user-info');
        const userName = document.getElementById('userName');
        if (userInfo && userName && !document.getElementById('userNameButton')) {
            const nameButton = document.createElement('button');
            nameButton.type = 'button';
            nameButton.id = 'userNameButton';
            nameButton.className = 'user-name-button';
            nameButton.title = 'Switch account';
            userInfo.insertBefore(nameButton, userName);
            nameButton.appendChild(userName);
        }

        const roleLine = userInfo?.querySelector('p');
        let nameRow = userInfo?.querySelector('.user-name-row');
        if (userInfo && !nameRow) {
            nameRow = document.createElement('div');
            nameRow.className = 'user-name-row';
            userInfo.insertBefore(nameRow, roleLine || userInfo.firstChild);
            const nameButton = document.getElementById('userNameButton');
            if (nameButton) {
                nameRow.appendChild(nameButton);
            }
        }

        const userNameButton = document.getElementById('userNameButton');
        if (userNameButton && !userNameButton.dataset.accountBound) {
            userNameButton.dataset.accountBound = 'true';
            userNameButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.openAccountSwitcher();
            });
        }

        let sidebarSignOutBtn = document.getElementById('sidebarSignOutBtn') || document.querySelector('.user-profile .logout-btn');
        if (sidebarSignOutBtn && !sidebarSignOutBtn.id) {
            sidebarSignOutBtn.id = 'sidebarSignOutBtn';
        }

        if (nameRow && sidebarSignOutBtn && sidebarSignOutBtn.parentElement !== nameRow) {
            nameRow.appendChild(sidebarSignOutBtn);
        }

        if (nameRow && !sidebarSignOutBtn) {
            sidebarSignOutBtn = document.createElement('button');
            sidebarSignOutBtn.type = 'button';
            sidebarSignOutBtn.id = 'sidebarSignOutBtn';
            sidebarSignOutBtn.className = 'logout-btn';
            sidebarSignOutBtn.title = 'Sign out';
            sidebarSignOutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            nameRow.appendChild(sidebarSignOutBtn);
        }

        if (sidebarSignOutBtn && !sidebarSignOutBtn.dataset.accountBound) {
            sidebarSignOutBtn.dataset.accountBound = 'true';
            sidebarSignOutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.logout();
            });
        }
    }

    async logout() {
        if (this.sb) {
            await this.sb.auth.signOut();
        }
        window.location.href = 'login.html';
    }

    openChangePasswordModal() {
        let modal = document.getElementById('changePasswordModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'changePasswordModal';
            modal.className = 'settings-modal-overlay';
            modal.style.zIndex = '100000';
            modal.innerHTML = `
                <div class="settings-modal" style="max-width:400px; width:100%;">
                    <div class="settings-header">
                        <h2><i class="fas fa-key"></i> Change Password</h2>
                        <button class="close-settings" onclick="document.getElementById('changePasswordModal').style.display='none';">&times;</button>
                    </div>
                    <div style="padding: 10px 0;">
                        <div class="form-group" style="position:relative; margin-bottom:15px;">
                            <input type="password" id="newPasswordInput" placeholder="New Password" style="width:100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;" autocomplete="new-password">
                            <i class="fas fa-eye password-toggle-manager" onclick="window.settingsManager?.togglePasswordVisibility('newPasswordInput', this)" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer; color:#8892b0;"></i>
                        </div>
                        <div class="form-group" style="position:relative; margin-bottom:15px;">
                            <input type="password" id="confirmPasswordInput" placeholder="Confirm New Password" style="width:100%; padding:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;" autocomplete="new-password">
                            <i class="fas fa-eye password-toggle-manager" onclick="window.settingsManager?.togglePasswordVisibility('confirmPasswordInput', this)" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer; color:#8892b0;"></i>
                        </div>
                        <button class="btn-primary" onclick="window.settingsManager?.submitChangePassword()" style="width:100%;background:linear-gradient(90deg, #6C63FF, #FF6584);border:none;padding:12px;border-radius:8px;color:white;cursor:pointer;font-weight:600;">Update Password</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        document.getElementById('newPasswordInput').value = '';
        document.getElementById('confirmPasswordInput').value = '';
        document.getElementById('newPasswordInput').type = 'password';
        document.getElementById('confirmPasswordInput').type = 'password';
        modal.querySelectorAll('.password-toggle-manager').forEach(i => i.className = 'fas fa-eye password-toggle-manager');
        
        modal.style.display = 'flex';
    }

    togglePasswordVisibility(inputId, iconElement) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            iconElement.className = 'fas fa-eye-slash password-toggle-manager';
        } else {
            input.type = 'password';
            iconElement.className = 'fas fa-eye password-toggle-manager';
        }
    }

    async submitChangePassword() {
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;
        
        if (!newPassword) {
            this.showToast("Please enter a new password", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            this.showToast("Passwords do not match!", "error");
            return;
        }
        
        if (this.sb) {
            document.getElementById('changePasswordModal').style.display = 'none';
            this.showToast("Updating password...", "info");
            const { error } = await this.sb.auth.updateUser({ password: newPassword });
            if (error) {
                this.showToast(error.message, "error");
            } else {
                this.showToast("Password updated successfully!", "success");
            }
        }
    }

    openAccountSwitcher() {
        let switcher = document.getElementById('accountSwitcherModal');
        if (!switcher) {
            switcher = document.createElement('div');
            switcher.id = 'accountSwitcherModal';
            switcher.className = 'settings-modal-overlay';
            switcher.style.display = 'none';
            switcher.style.zIndex = '100000';
            document.body.appendChild(switcher);
        }
        
        const accountsStr = localStorage.getItem('vivo_saved_accounts') || '[]';
        const accounts = JSON.parse(accountsStr);
        
        let accountsHtml = accounts.map(a => `
            <div class="account-item" style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(0,0,0,0.2); border-radius:12px; margin-bottom:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.05); transition:all 0.2s;" onmouseover="this.style.background='rgba(108,99,255,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'" onclick="window.settingsManager?.switchAccount('${a.email}')">
                <div class="account-avatar" style="width:40px;height:40px;border-radius:50%;background:rgba(108,99,255,0.2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                    ${a.avatar ? `<img src="${a.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<i class="fas fa-user" style="color:#6C63FF"></i>`}
                </div>
                <div style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
                    <h4 style="margin:0;font-size:1rem;color:#fff;">${a.name || a.username}</h4>
                    <p style="margin:0;font-size:0.8rem;color:#8892b0;text-transform:capitalize;">${a.role}</p>
                </div>
                <i class="fas fa-chevron-right" style="color:#8892b0;font-size:0.8rem;"></i>
            </div>
        `).join('');

        if (accounts.length === 0) {
            accountsHtml = `<p style="color:#8892b0;text-align:center;padding:20px;">No saved accounts found. Check "Remember Me" when logging in to save accounts.</p>`;
        }

        switcher.innerHTML = `
            <div class="settings-modal" style="max-width:400px; width:100%;">
                <div class="settings-header">
                    <h2><i class="fas fa-users"></i> Switch Account</h2>
                    <button class="close-settings" onclick="document.getElementById('accountSwitcherModal').style.display='none';">&times;</button>
                </div>
                <div class="accounts-list" style="margin-bottom:20px;max-height:300px;overflow-y:auto;padding-right:5px;">
                    ${accountsHtml}
                </div>
                <button class="btn-primary" onclick="window.location.href='login.html'" style="width:100%;background:linear-gradient(90deg, #6C63FF, #FF6584);border:none;padding:12px;border-radius:8px;color:white;cursor:pointer;font-weight:600;"><i class="fas fa-plus"></i> Add Another Account</button>
            </div>
        `;
        
        // Highlight active user if possible
        if (this.sb) {
            this.sb.auth.getUser().then(({data}) => {
                if (data?.user) {
                    const email = data.user.email;
                    const items = switcher.querySelectorAll('.account-item');
                    items.forEach(item => {
                        if (item.getAttribute('onclick').includes(email)) {
                            item.style.borderColor = '#6C63FF';
                            item.querySelector('.fa-chevron-right').className = 'fas fa-check-circle';
                            item.querySelector('.fa-check-circle').style.color = '#48BB78';
                        }
                    });
                }
            });
        }

        switcher.style.display = 'flex';
    }

    async switchAccount(email) {
        const accountsStr = localStorage.getItem('vivo_saved_accounts') || '[]';
        const accounts = JSON.parse(accountsStr);
        const account = accounts.find(a => a.email === email);
        if (!account) return;

        if (this.sb) {
            this.showToast("Switching account...", "info");
            try {
                // btoa was used to save, use atob to decode
                const password = atob(account.password);
                const { error, data } = await this.sb.auth.signInWithPassword({
                    email: account.email,
                    password: password
                });
                
                if (error) {
                    this.showToast("Please log in manually: " + error.message, "error");
                    setTimeout(() => window.location.href = 'login.html', 1500);
                    return;
                }
                
                // Success - redirect to right hub
                if (account.role === 'performer') window.location.href = 'performer-hub.html';
                else if (account.role === 'agent') window.location.href = 'agent-hub.html';
                else if (account.role === 'booker') window.location.href = 'booker-hub.html';
                else window.location.href = 'role-redirect.html';
            } catch (err) {
                this.showToast("Failed to switch. Redirecting to login...", "error");
                setTimeout(() => window.location.href = 'login.html', 1500);
            }
        }
    }

    async loadSettings() {
        const local = localStorage.getItem(`vivotheme_${this.userId}`);
        if (local) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(local) };
                console.log("📝 Settings loaded from localStorage.");
            } catch (e) { console.error("LS Load Error:", e); }
        }

        if (!this.sb || !this.userId) return;
        
        try {
            const { data, error } = await this.sb
                .from(this.role)
                .select('settings')
                .eq('auth_id', this.userId)
                .single();
            
            if (data && data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                // Ensure notifications are ON by default if the setting is null/undefined
                if (this.settings.notificationsEnabled === undefined || this.settings.notificationsEnabled === null) {
                    this.settings.notificationsEnabled = true;
                }
                console.log("✅ Settings loaded from database.");
                localStorage.setItem(`vivotheme_${this.userId}`, JSON.stringify(this.settings));
                if (this.settings.theme && this.settings.theme !== 'default') {
                    localStorage.setItem('vivo_theme', `theme-${this.settings.theme}`);
                } else {
                    localStorage.removeItem('vivo_theme');
                }
            }
        } catch (err) {
            console.warn("⚠️ Database settings column might be missing:", err.message);
        }
    }

    async saveSettings() {
        localStorage.setItem(`vivotheme_${this.userId}`, JSON.stringify(this.settings));
        if (this.settings.theme && this.settings.theme !== 'default') {
            localStorage.setItem('vivo_theme', `theme-${this.settings.theme}`);
        } else {
            localStorage.removeItem('vivo_theme');
        }

        if (!this.sb || !this.userId) {
            this.showToast("Saved locally (offline mode).", "info");
            return;
        }
        
        try {
            const { error } = await this.sb
                .from(this.role)
                .update({ settings: this.settings })
                .eq('auth_id', this.userId);
            
            if (error) throw error;
            console.log("✅ Settings saved to database.");
            this.showToast("Settings saved to account!", "success");
        } catch (err) {
            console.error("❌ Failed to save to database:", err.message);
            this.showToast("Saved locally. Sync across devices may be limited.", "warning");
        }
    }

    applySettings() {
        console.log("🎨 Applying settings:", this.settings);
        
        // Remove all existing theme classes
        const themeClasses = ['theme-blosm', 'theme-forest', 'theme-blackout', 'theme-light', 'theme-ocean', 'theme-desert', 'theme-neon'];
        document.body.classList.remove(...themeClasses);
        
        // Apply new theme class
        if (this.settings.theme && this.settings.theme !== 'default') {
            document.body.classList.add(`theme-${this.settings.theme}`);
            console.log(`✅ Applied theme: ${this.settings.theme}`);
        }
        
        // Apply Background - FIXED
        const mainElement = document.querySelector('.hub-main');
        if (this.settings.backgroundUrl && this.settings.backgroundUrl !== 'null' && this.settings.backgroundUrl !== '') {
            console.log("🎨 Applying background:", this.settings.backgroundUrl);
            document.body.classList.add('custom-bg');
            if (mainElement) {
                mainElement.style.background = '';
                mainElement.style.backgroundImage = `url("${this.settings.backgroundUrl}")`;
                mainElement.style.backgroundSize = 'cover';
                mainElement.style.backgroundPosition = 'center';
                mainElement.style.backgroundAttachment = 'fixed';
                mainElement.style.backgroundRepeat = 'no-repeat';
            }
        } else {
            console.log("🎨 Removing custom background");
            document.body.classList.remove('custom-bg');
            if (mainElement) {
                mainElement.style.background = '';
                mainElement.style.backgroundImage = '';
            }
        }

        // Apply Navbar Customization
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-nav .dropdown-container');
        navItems.forEach(item => {
            const id = item.id || item.getAttribute('data-nav-id');
            if (id && this.settings.hiddenNavItems.includes(id)) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });

        document.body.classList.toggle('sidebar-compact', this.settings.compactSidebar === true);
        if (this.settings.compactSidebar !== true) {
            document.body.classList.remove('sidebar-open');
        }
        window.dispatchEvent(new CustomEvent('sidebarModeChanged', {
            detail: { compact: this.settings.compactSidebar === true }
        }));

        // Reset any previously applied zoom
        document.documentElement.style.zoom = '';
        document.documentElement.style.transform = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';

        this.syncModalUI();
    }

    setupEventListeners() {
        window.addEventListener('openSettings', () => this.openModal());
        
        const bgInput = document.getElementById('bgUploadInput');
        if (bgInput) {
            bgInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        }

        // Use event delegation for toggles since they might be added dynamically by NavbarManager
        document.addEventListener('change', (e) => {
            if (e.target.id === 'compactModeToggle') {
                this.settings.compactSidebar = e.target.checked;
                // Also save to a simplified key for quick access by navbar.js if needed
                localStorage.setItem('vivo_sidebar_compact', e.target.checked);
                this.applySettings();
                this.saveSettings();
            } else if (e.target.id === 'notifToggleSwitch') {
                this.settings.notificationsEnabled = e.target.checked;
                if (window.notifManager) {
                    if (this.settings.notificationsEnabled) {
                        // If they turn it ON, make sure we have permissions
                        if (Notification.permission === 'default') {
                            window.notifManager.requestPermission?.();
                        } else if (Notification.permission === 'granted') {
                            window.notifManager.enablePush?.();
                        }
                    } else {
                        window.notifManager.disablePush?.();
                    }
                }
                this.showToast(`Notifications ${this.settings.notificationsEnabled ? 'enabled' : 'disabled'}`, "info");
                this.saveSettings();
            } else if (e.target.classList.contains('nav-toggle-switch')) {
                const navId = e.target.getAttribute('data-nav-id');
                if (navId) {
                    this.toggleNavItem(navId, e.target.checked);
                    this.saveSettings();
                }
            }
        });

        window.addEventListener('notificationStatusUpdate', (e) => {
            this.updateNotificationUI(e.detail.status, e.detail.isGranted);
        });
    }

    updateNotificationUI(statusText, isGranted) {
        const statusSpan = document.getElementById('notifStatusTextSettings');
        const toggleSwitch = document.getElementById('notifToggleSwitch');
        const iconEl = document.getElementById('notifStatusIconSettings');
        
        // Priority: If explicitly Blocked, show Blocked. 
        // Otherwise, show On/Off based on the switch state.
        let displayStatus = (statusText === 'Blocked') ? 'Blocked' : (this.settings.notificationsEnabled ? 'On' : 'Off');
        let isActive = (displayStatus === 'On');

        if (statusSpan) {
            statusSpan.innerText = `Status: ${displayStatus}`;
            statusSpan.style.color = (displayStatus === 'Blocked') ? '#F56565' : (isActive ? '#48BB78' : '#8892b0');
        }
        
        if (toggleSwitch) {
            toggleSwitch.disabled = (statusText === 'Blocked');
            if (statusText === 'Blocked') {
                toggleSwitch.checked = false;
            } else {
                toggleSwitch.checked = this.settings.notificationsEnabled;
            }
        }

        if (iconEl) {
            iconEl.className = (displayStatus === 'Blocked') ? 'fas fa-bell-slash' : 'fas fa-bell';
            iconEl.style.color = (displayStatus === 'Blocked') ? '#F56565' : (isActive ? '#48BB78' : '#8892b0');
        }
    }

    async syncNotificationUIWithManager() {
        if (window.notifManager) {
            const granted = await window.notifManager.checkPermission();
            this.updateNotificationUI(granted ? 'On' : 'Blocked', granted);
        }
    }

    openModal() {
        const modal = document.getElementById('settingsModalOverlay');
        if (modal) {
            modal.style.display = 'flex';
            this.syncModalUI();
            this.syncNotificationUIWithManager();
        }
    }

    closeModal() {
        const modal = document.getElementById('settingsModalOverlay');
        if (modal) modal.style.display = 'none';
    }

    syncModalUI() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            if (opt.getAttribute('data-theme') === (this.settings.theme || 'default')) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        const toggles = document.querySelectorAll('.nav-toggle-switch');
        toggles.forEach(sw => {
            const id = sw.getAttribute('data-nav-id');
            if (id) {
                sw.checked = !this.settings.hiddenNavItems.includes(id);
            }
        });

        const compactToggle = document.getElementById('compactModeToggle');
        if (compactToggle) compactToggle.checked = this.settings.compactSidebar === true;

        const notifToggle = document.getElementById('notifToggleSwitch');
        if (notifToggle) notifToggle.checked = this.settings.notificationsEnabled !== false;
    }

    setTheme(themeName) {
        if (this.settings.theme === themeName) return;
        this.settings.theme = themeName;
        this.applySettings();
    }

    toggleNavItem(navId, isVisible) {
        if (!isVisible) {
            if (!this.settings.hiddenNavItems.includes(navId)) {
                this.settings.hiddenNavItems.push(navId);
            }
        } else {
            this.settings.hiddenNavItems = this.settings.hiddenNavItems.filter(id => id !== navId);
        }
        this.applySettings();
    }

    async handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            this.showToast("No file selected", "error");
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showToast("File too large! Max 5MB", "error");
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            this.showToast("Please select an image file", "error");
            return;
        }
        
        if (!this.sb) {
            this.showToast("Supabase client not ready", "error");
            return;
        }

        this.showToast("Uploading background...", "info");
        
        try {
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop();
            const fileName = `bg_${this.userId}_${timestamp}.${fileExt}`;
            const filePath = fileName;

            console.log("📤 Uploading to:", filePath);
            
            const { data, error: uploadError } = await this.sb.storage
                .from('user-assets')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: '3600'
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            console.log("✅ Upload success:", data);

            const { data: { publicUrl } } = this.sb.storage
                .from('user-assets')
                .getPublicUrl(filePath);

            console.log("🔗 Public URL:", publicUrl);

            this.settings.backgroundUrl = publicUrl;
            this.applySettings();
            await this.saveSettings();
            
            this.showToast("Background uploaded successfully!", "success");
            event.target.value = '';
            
        } catch (err) {
            console.error("❌ Upload failed:", err);
            this.showToast(`Upload failed: ${err.message}`, "error");
        }
    }

    removeBackground() {
        this.settings.backgroundUrl = null;
        this.applySettings();
        this.saveSettings();
        this.showToast("Background removed", "info");
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        const bgColor = type === 'success' ? '#48BB78' : (type === 'error' ? '#F56565' : '#6C63FF');
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
            background: ${bgColor}; color: white; border-radius: 12px; z-index: 10001;
            font-weight: 500; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

window.SettingsManager = SettingsManager;
