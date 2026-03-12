// push-service.js - COMPLETE WORKING VERSION WITH FIXED AUTHENTICATION
const PushService = {
    supabase: null,
    currentUser: null,
    vapidPublicKey: 'BDCnZJ8uMwoNk6Mt2zkHS9u1GR80-E0EjFjDZ5FSVcVKe37LxufaDy-2dtRTdcDAL3ft1qBlyTNrXAad6N6VhqM',
    swRegistration: null,
    
    init: async function(supabaseClient) {
        console.log('PushService initializing...');
        this.supabase = supabaseClient;
        
        // Check if supabase client is valid
        if (!this.supabase) {
            console.error('❌ No Supabase client provided');
            return;
        }
        
        await this.loadCurrentUser();
        
        // Check if notifications are supported
        if (!this.isSupported()) {
            console.log('Push notifications not supported in this browser');
            return;
        }
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Check permission and register
        await this.checkPermission();
    },
    
    isSupported: function() {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    },
    
    loadCurrentUser: async function() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) {
                console.error('Error loading user:', error);
                return null;
            }
            this.currentUser = user;
            console.log('Current user loaded:', user?.email);
            return user;
        } catch (error) {
            console.error('Error in loadCurrentUser:', error);
            return null;
        }
    },
    
    registerServiceWorker: async function() {
        try {
            // Check if already registered
            let registration = await navigator.serviceWorker.getRegistration();
            
            if (!registration) {
                console.log('Registering service worker...');
                registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered successfully');
            } else {
                console.log('✅ Service Worker already registered');
            }
            
            this.swRegistration = registration;
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            
            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            throw error;
        }
    },
    
    checkPermission: async function() {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            console.log('✅ Notification permission already granted');
            await this.subscribeUser();
        } 
        else if (Notification.permission === 'denied') {
            console.log('❌ Notification permission denied');
        }
        else {
            // Request permission
            console.log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            
            if (permission === 'granted') {
                await this.subscribeUser();
            }
        }
    },
    
    subscribeUser: async function() {
        if (!this.swRegistration || !this.currentUser) {
            console.log('Cannot subscribe: No service worker or user');
            return;
        }
        
        try {
            // Check for existing subscription
            let subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                console.log('Creating new push subscription...');
                
                // Convert VAPID key
                const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
                
                subscription = await this.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                
                console.log('✅ New push subscription created');
            } else {
                console.log('✅ Using existing push subscription');
            }
            
            // Create device fingerprint
            const deviceInfo = this.getDeviceInfo();
            
            // Save subscription to database
            const { error } = await this.supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: this.currentUser.id,
                    subscription: subscription,
                    device_info: deviceInfo,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id, device_info'
                });
            
            if (error) {
                console.error('❌ Error saving subscription:', error);
            } else {
                console.log('✅ Push subscription saved to database');
            }
            
        } catch (error) {
            console.error('❌ Error during push subscription:', error);
        }
    },
    
    getDeviceInfo: function() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const screenSize = `${screen.width}x${screen.height}`;
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
        
        return `${platform}-${screenSize}-${isMobile ? 'mobile' : 'desktop'}-${Date.now()}`;
    },
    
    urlBase64ToUint8Array: function(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },
    
    // ========== FIXED sendNotification FUNCTION ==========
    sendNotification: async function(userId, notification) {
        try {
            console.log('📤 Sending notification to:', userId);
            
            // Get the current session for the JWT token
            const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.error('❌ No active session found:', sessionError);
                
                // Try to refresh the session
                console.log('Attempting to refresh session...');
                const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
                
                if (refreshError || !refreshData.session) {
                    console.error('❌ Could not refresh session:', refreshError);
                    return null;
                }
                
                // Use the refreshed session
                const token = refreshData.session.access_token;
                console.log('✅ Session refreshed, token:', token.substring(0, 20) + '...');
                
                // Make the function call with the new token
                const { data, error } = await this.supabase.functions.invoke('send-notification', {
                    body: { userId, notification },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (error) {
                    console.error('❌ Edge function error:', error);
                    
                    // Log the full error details
                    if (error.context) {
                        console.error('Error context:', error.context);
                    }
                    return null;
                }
                
                console.log('✅ Notification sent successfully:', data);
                return data;
            }
            
            // We have a valid session
            const token = session.access_token;
            console.log('Using token:', token.substring(0, 20) + '...');
            
            // Make the function call
            const { data, error } = await this.supabase.functions.invoke('send-notification', {
                body: { userId, notification },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (error) {
                console.error('❌ Edge function error:', error);
                
                // Log the full error details
                if (error.context) {
                    console.error('Error context:', error.context);
                }
                
                // If token expired (401), try to refresh and retry once
                if (error.message?.includes('401') || error.status === 401) {
                    console.log('Token expired, refreshing and retrying...');
                    
                    const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
                    
                    if (!refreshError && refreshData.session) {
                        const newToken = refreshData.session.access_token;
                        
                        const { data: retryData, error: retryError } = await this.supabase.functions.invoke('send-notification', {
                            body: { userId, notification },
                            headers: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });
                        
                        if (retryError) {
                            console.error('❌ Retry failed:', retryError);
                            return null;
                        }
                        
                        console.log('✅ Notification sent on retry:', retryData);
                        return retryData;
                    }
                }
                
                return null;
            }
            
            console.log('✅ Notification sent successfully:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return null;
        }
    },
    
    // Send message notification
    sendMessageNotification: async function(recipientId, senderName, messageContent, conversationId) {
        return this.sendNotification(recipientId, {
            type: 'message',
            title: `💬 New message from ${senderName}`,
            body: messageContent.length > 100 
                ? messageContent.substring(0, 97) + '...' 
                : messageContent,
            data: {
                url: `/vivo-chat.html?id=${conversationId}`,
                conversationId: conversationId,
                type: 'message'
            }
        });
    },
    
    // Send event reminder
    sendEventReminder: async function(userId, event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        
        return this.sendNotification(userId, {
            type: 'event_reminder',
            title: `📅 Event Tomorrow: ${event.title}`,
            body: `${formattedDate} at ${event.time} - ${event.venue}`,
            data: {
                url: '/calendar.html',
                eventId: event.id,
                type: 'event_reminder'
            }
        });
    },
    
    // Test notification
    testNotification: async function() {
        if (!this.currentUser) {
            console.log('No user logged in');
            
            // Try to load user again
            await this.loadCurrentUser();
            
            if (!this.currentUser) {
                console.log('Still no user - please log in first');
                return;
            }
        }
        
        console.log('Sending test notification to:', this.currentUser.id);
        
        return this.sendNotification(this.currentUser.id, {
            type: 'test',
            title: '🔔 Test Notification',
            body: 'This is a test push notification from Vivo Distro!',
            data: {
                url: '/',
                timestamp: new Date().toISOString()
            }
        });
    }
};

// Make it globally available
window.PushService = PushService;
console.log('✅ PushService loaded');