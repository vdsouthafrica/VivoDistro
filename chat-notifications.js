// chat-notifications.js - Shared notification logic for all hubs

const ChatNotifications = {
    currentUser: null,
    supabaseClient: null,
    unreadCount: 0,
    updateCallbacks: [],
    
    // Initialize with supabase client
    init: function(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.loadCurrentUser();
        this.setupRealtimeSubscription();
    },
    
    // Load current user
    loadCurrentUser: async function() {
        const { data: { user } } = await this.supabaseClient.auth.getUser();
        if (user) {
            this.currentUser = user;
            this.loadUnreadCount();
        }
    },
    
    // Load initial unread count
    loadUnreadCount: async function() {
        if (!this.currentUser) return;
        
        try {
            // Get all conversations for current user
            const { data: conversations, error: convError } = await this.supabaseClient
                .from('conversations')
                .select('id')
                .or(`participant1_id.eq.${this.currentUser.id},participant2_id.eq.${this.currentUser.id}`);
            
            if (convError || !conversations?.length) {
                this.updateBadges(0);
                return;
            }
            
            const conversationIds = conversations.map(c => c.id);
            
            // Count unread messages (sent by others, not read)
            const { count, error } = await this.supabaseClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .neq('sender_id', this.currentUser.id)
                .is('read_at', null);
            
            if (!error) {
                this.unreadCount = count || 0;
                this.updateBadges(this.unreadCount);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    },
    
    // Setup realtime subscription for new messages
    setupRealtimeSubscription: function() {
        if (!this.supabaseClient) return;
        
        this.supabaseClient
            .channel('notifications-channel')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages' 
                },
                (payload) => {
                    // If message is not from current user, increment unread count
                    if (this.currentUser && payload.new.sender_id !== this.currentUser.id) {
                        this.unreadCount++;
                        this.updateBadges(this.unreadCount);
                    }
                }
            )
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: 'read_at=neq.null'
                },
                (payload) => {
                    // If message was read by current user, decrement count
                    if (this.currentUser && payload.new.read_at && 
                        payload.new.sender_id !== this.currentUser.id) {
                        // Reload count to be accurate
                        this.loadUnreadCount();
                    }
                }
            )
            .subscribe();
    },
    
    // Mark messages as read when opening a conversation
    markConversationAsRead: async function(conversationId) {
        if (!this.currentUser || !conversationId) return;
        
        try {
            const { error } = await this.supabaseClient
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .neq('sender_id', this.currentUser.id)
                .is('read_at', null);
            
            if (!error) {
                // Reload count to update badges
                this.loadUnreadCount();
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    },
    
    // Register callback for badge updates
    onUpdate: function(callback) {
        this.updateCallbacks.push(callback);
    },
    
    // Update all badges
    updateBadges: function(count) {
        const displayCount = count > 99 ? '99+' : count;
        
        // Update all registered callbacks
        this.updateCallbacks.forEach(callback => callback(displayCount));
        
        // Also update DOM directly for safety
        document.querySelectorAll('.chat-notification-badge, #chatNotificationBadge').forEach(badge => {
            if (count > 0) {
                badge.textContent = displayCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
    }
};

// Make it globally available
window.ChatNotifications = ChatNotifications;