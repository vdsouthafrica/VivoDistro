/**
 * NotificationManager - Centralized Web Push & Realtime Alerts
 */
class NotificationManager {
    constructor(sb, userId) {
        this.sb = sb;
        this.userId = userId;
        this.granted = false;
        this.subscriptionVersion = 'v2';
        
        // Official VAPID Public Key (Generated via web-push library)
        this.vapidPublicKey = 'BCEV0qn2Z7G6Xlf32IDDY5m5atf1q1HHtB0RD-1FLcwnUnvMohN6dwwbfaQ1_73tvvdyxfFMphGlJf0-eogMtyo'; 
        
        // CORRESPONDING PRIVATE KEY FOR EDGE FUNCTION:
        // 1vgIAoV_fvE2m5F_6l4_sAiZU23owEVnpCysX0YZQIc=
        
        console.log('🔔 Initializing NotificationManager for user:', this.userId);

        if (!('Notification' in window)) {
            console.warn("❌ This browser does not support desktop notifications");
            return;
        }
        
        this.init();
    }

    async init() {
        if (window.notifManager && window.notifManager !== this) {
            console.log('🔔 NotificationManager already exists. Skipping duplicate init.');
            return;
        }

        await this.registerServiceWorker();
        this.updateUI();

        if (Notification.permission === 'granted') {
            this.granted = true;
            this.startSystems();
        }
        
        window.addEventListener('requestNotificationPermission', () => this.requestPermission());
        
        if (this.userId) {
            this.syncLocalEventsWithServer();
        }

        // Auto-prompt for notifications if not yet decided
        if (Notification.permission === 'default') {
            console.log('💡 First time user: Prompting for notifications...');
            setTimeout(() => this.requestPermission(), 3000); // Wait 3s so the page loads first
        }
    }

    async requestPermission() {
        if (window.location.protocol === 'file:') {
            console.warn('Notifications are unavailable on file:// pages.');
            return;
        }

        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            this.granted = true;
            this.startSystems();
            this.fireNotification('Notifications Enabled!', 'You will now receive alerts for bookings and messages.');
        } else {
            console.warn('⚠️ Permission not granted:', permission);
        }
        this.updateUI();
    }

    async startSystems() {
        console.log('✅ Notifications active. Starting pulse...');
        this.setupRealtimeListeners();
        this.setupReminders();
        this.subscribeToPush();
        this.updateUI();
    }

    updateUI() {
        const ids = ['', 'Settings'];
        let statusStr = "Off";
        let isGranted = Notification.permission === 'granted';

        if (Notification.permission === 'granted') {
            statusStr = "On";
        } else if (Notification.permission === 'denied') {
            statusStr = "Blocked";
        }

        ids.forEach(suffix => {
            const statusText = document.getElementById('notifStatusText' + suffix);
            const enableBtn = document.getElementById('enableNotifBtn' + suffix);
            const statusIcon = document.getElementById('notifStatusIcon' + suffix);
            
            if (statusText) {
                statusText.textContent = 'Notifications: ' + statusStr;
                statusText.style.color = statusStr === 'On' ? '#48BB78' : (statusStr === 'Blocked' ? '#ef4444' : '#8892b0');
            }
            if (statusIcon) {
                statusIcon.className = statusStr === 'On' ? 'fas fa-check-circle' : (statusStr === 'Blocked' ? 'fas fa-exclamation-triangle' : 'fas fa-bell');
                statusIcon.style.color = statusStr === 'On' ? '#48BB78' : (statusStr === 'Blocked' ? '#ef4444' : '#8892b0');
            }
            if (enableBtn) {
                if (statusStr === 'On') {
                    enableBtn.style.display = 'none';
                } else if (statusStr === 'Blocked') {
                    enableBtn.style.display = 'inline-block';
                    enableBtn.textContent = 'How to Unblock';
                    enableBtn.onclick = () => alert('Please click the lock icon in your browser address bar to allow notifications.');
                } else {
                    enableBtn.style.display = 'inline-block';
                    enableBtn.textContent = 'Enable Notifications';
                    enableBtn.onclick = () => this.requestPermission();
                }
            }
        });

        // Sync with any toggle switches
        const toggle = document.getElementById('notifToggleSwitch');
        if (toggle) toggle.checked = isGranted;

        // Notify SettingsManager
        window.dispatchEvent(new CustomEvent('notificationStatusUpdate', {
            detail: { status: statusStr, isGranted: isGranted }
        }));
    }

    // Public methods for UI toggles
    checkPermission() {
        return Notification.permission === 'granted';
    }

    async enablePush() {
        await this.requestPermission();
    }

    disablePush() {
        alert("To disable notifications, please use your browser site settings (click the lock icon in the address bar).");
        this.updateUI();
    }

    async registerServiceWorker() {
        if (window.location.protocol === 'file:') {
            console.warn('⚠️ ServiceWorker cannot be registered on file:// protocol. Please use a local web server (like Live Server) for testing notifications.');
            return null;
        }

        if ('serviceWorker' in navigator) {
            try {
                // Ensure the path is correct relative to the root
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('📦 ServiceWorker registered:', registration.scope);
                
                // Wait for the active worker if it exists
                if (registration.active) {
                    console.log('📦 ServiceWorker is active.');
                }
                
                return registration;
            } catch (err) {
                console.error('📦 ServiceWorker registration failed:', err);
            }
        }
        return null;
    }

    async subscribeToPush() {
        if (!('serviceWorker' in navigator)) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check if PushManager is available
            if (!registration.pushManager) {
                console.warn('⚠️ PushManager not supported in this browser.');
                return;
            }

            let subscription = await registration.pushManager.getSubscription();
            const savedVersion = localStorage.getItem('vivo_push_subscription_version');

            // Force a one-time resubscribe when VAPID keys or push config changes.
            if (subscription && savedVersion !== this.subscriptionVersion) {
                console.log('🌐 Refreshing existing Push Subscription for current config...');
                try {
                    await subscription.unsubscribe();
                } catch (unsubscribeError) {
                    console.warn('⚠️ Failed to unsubscribe old push subscription:', unsubscribeError);
                }
                subscription = null;
            }
            
            if (!subscription) {
                console.log('🌐 Creating new Push Subscription...');
                const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }
            
            console.log('🌐 Push Subscription ready:', subscription);
            await this.syncSubscriptionWithServer(subscription);
            localStorage.setItem('vivo_push_subscription_version', this.subscriptionVersion);
        } catch (err) {
            console.error('🌐 Failed to subscribe to Web Push:', err);
        }
    }

    async syncSubscriptionWithServer(subscription) {
        if (!this.sb || !this.userId) return;
        
        // Use upsert to save the subscription for this user
        const { error } = await this.sb
            .from('push_subscriptions')
            .upsert({ 
                user_id: this.userId, 
                subscription: subscription,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, subscription' });
        
        if (error) {
            console.error('❌ PUSH SYNC ERROR:', error.message, error.details, error.hint);
        } else {
            console.log('✅ PUSH SYNC: Device registered for offline alerts.');
        }
    }

    async syncLocalEventsWithServer() {
        if (!this.sb || !this.userId) return;
        const localEventsRaw = localStorage.getItem('vivoCalendarEvents');
        if (!localEventsRaw) return;

        const localEvents = JSON.parse(localEventsRaw);
        if (localEvents.length === 0) return;

        console.log(`☁️ SYNC: Uploading ${localEvents.length} local events...`);

        const formattedEvents = localEvents.map(event => ({
            user_id: this.userId,
            title: event.title,
            event_date: event.date,
            event_time: event.time || '12:00',
            venue: event.venue || '',
            notes: event.notes || '',
            color: event.color || '#4361ee'
        }));

        const { error } = await this.sb.from('calendar_events').upsert(formattedEvents, { onConflict: 'user_id, title, event_date' });
        if (error) console.error('❌ SYNC ERROR:', error);
        else console.log('✅ SYNC SUCCESS: Calendar backed up to cloud.');
    }

    setupRealtimeListeners() {
        if (this.realtimeSubscribed) return;
        
        console.log(`📡 REALTIME: Tuning in for user ${this.userId}...`);
        
        // Use a unique channel name to avoid conflicts with other tabs/instances
        const channelName = `inbox-notifications-${this.userId.slice(0, 8)}`;
        const channel = this.sb.channel(channelName);

        channel
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'inbox_items', 
                filter: `recipient_id=eq.${this.userId}` 
            }, async payload => {
                const item = payload.new;
                console.log('📬 INBOX: New update!', item);

                // Fetch sender name from the correct tables
                let senderName = 'Someone';
                try {
                    // Try performers first, then agents, then bookers
                    const roleTables = ['performers', 'agents', 'bookers'];
                    for (const table of roleTables) {
                        const { data } = await this.sb
                            .from(table)
                            .select('name')
                            .eq('auth_id', item.sender_id)
                            .maybeSingle();
                        
                        if (data && data.name) {
                            senderName = data.name;
                            break;
                        }
                    }
                } catch (e) { 
                    console.error('Error fetching sender name:', e); 
                }

                let title = 'New Update';
                let body = item.message || 'Check your inbox.';

                if (item.type === 'chat') {
                    title = `New Message from ${senderName}`;
                } else if (item.type === 'booking') {
                    title = `New Booking from ${senderName}`;
                    body = `Requested: ${item.message || 'Booking details inside.'}`;
                } else if (item.type === 'profile') {
                    title = `Profile Shared by ${senderName}`;
                    body = `Check out their profile in your inbox.`;
                }

                // Avoid duplicate desktop notifications.
                // Realtime keeps the UI in sync while web push handles actual device alerts.
                if (window.navbarManager) {
                    window.navbarManager.updateNotifications();
                }
            });

        channel.subscribe(status => {
            console.log(`📡 REALTIME STATUS for ${channelName}: ${status}`);
            if (status === 'SUBSCRIBED') {
                this.realtimeSubscribed = true;
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('❌ REALTIME SUBSCRIPTION ERROR: Check if Realtime is enabled for inbox_items in Supabase dashboard.');
            }
        });
    }

    fireNotification(title, body, url = 'inbox.html') {
        if (Notification.permission !== 'granted') {
            console.warn('🔔 Notification blocked - permission not granted.');
            return;
        }

        const options = { 
            body, 
            icon: 'favicon-32x32.png', 
            badge: 'favicon-32x32.png', 
            vibrate: [100, 50, 100], 
            data: { url },
            tag: 'vivo-notification', // Prevent stacking too many identical ones
            renotify: true
        };
        
        // Prefer Service Worker for more reliable cross-browser background notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, options);
            }).catch(err => {
                console.error('🔔 SW Notification Error:', err);
                new Notification(title, options);
            });
        } else {
            console.log('🔔 Falling back to standard browser notification...');
            const notif = new Notification(title, options);
            notif.onclick = () => { window.focus(); window.location.href = url; };
        }
    }

    setupReminders() {
        this.checkAllUpcomingEvents();
        setInterval(() => this.checkAllUpcomingEvents(), 60000);
    }

    async checkAllUpcomingEvents() {
        if (!this.userId) return;
        console.log('🕒 SCANNING: Checking upcoming reminders...');
        const notifiedEvents = JSON.parse(localStorage.getItem('notifiedEvents') || '{}');
        const localEvents = JSON.parse(localStorage.getItem('vivoCalendarEvents') || '[]');
        
        localEvents.forEach(event => {
            const eventDateTime = new Date(`${event.date}T${event.time || '12:00'}:00`);
            const diffHours = (eventDateTime - new Date()) / (1000 * 60 * 60);

            if (diffHours > 0 && diffHours <= 1.1 && !notifiedEvents[`${event.id}_1h`]) {
                console.log(`⏰ ALERT: ${event.title} in < 1h`);
                this.fireNotification('Event Soon', `"${event.title}" starts soon!`, 'calendar.html');
                notifiedEvents[`${event.id}_1h`] = true;
            }
        });
        localStorage.setItem('notifiedEvents', JSON.stringify(notifiedEvents));
    }

    urlBase64ToUint8Array(base64String) {
        const rawString = base64String.trim();
        const padding = '='.repeat((4 - rawString.length % 4) % 4);
        const base64 = (rawString + padding).replace(/-/g, '+').replace(/_/g, '/');
        try {
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
            return outputArray;
        } catch (err) {
            console.error('❌ VAPID ERROR:', err, 'String:', base64);
            throw err;
        }
    }
}
window.NotificationManager = NotificationManager;
