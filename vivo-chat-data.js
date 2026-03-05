// vivo-chat-data.js - Data structure and storage for Vivo Chat
// This file must be loaded FIRST before any other chat scripts

const VivoChatData = {
    // Current logged in user
    currentUser: null,
    
    // All conversations
    conversations: [],
    
    // Initialize the chat system
    init: function() {
        this.loadCurrentUser();
        this.loadConversations();
        console.log('✅ Vivo Chat Data initialized');
    },
    
    // Load current user from localStorage
    loadCurrentUser: function() {
        try {
            // Try to get from various sources
            const userData = JSON.parse(localStorage.getItem('vivoUser') || '{}');
            const selectedRole = localStorage.getItem('selectedRole');
            
            // Get profile based on role
            let profile = null;
            const role = userData.role || selectedRole;
            
            if (role === 'performer') {
                profile = JSON.parse(localStorage.getItem('performerProfile') || '{}');
            } else if (role === 'agent') {
                profile = JSON.parse(localStorage.getItem('agentProfile') || '{}');
            } else if (role === 'booker') {
                profile = JSON.parse(localStorage.getItem('bookerProfile') || '{}');
            }
            
            this.currentUser = {
                id: userData.vivoId || profile.id || 'guest_' + Date.now(),
                role: role || 'guest',
                name: profile.name || 'User',
                avatar: profile.image || profile.logo || null,
                phone: profile.phone || '',
                email: profile.email || ''
            };
            
            console.log('Current user loaded:', this.currentUser);
        } catch (e) {
            console.error('Error loading user:', e);
            this.currentUser = { id: 'guest', role: 'guest', name: 'Guest' };
        }
    },
    
    // ========== CONVERSATION TYPES ==========
    // Different types of conversation starters
    
    ConversationTypes: {
        BOOKING: 'booking',           // Booker → Performer
        APPLICATION: 'application',    // Performer → Booker (for a gig)
        REPRESENTATION: 'representation', // Performer → Agent
        TALENT_SCOUT: 'talent_scout',  // Agent → Performer
        GENERAL: 'general'             // Any → Any
    },
    
    // ========== CONVERSATION STATUS ==========
    ConversationStatus: {
        PENDING: 'pending',        // Waiting for response
        ACTIVE: 'active',          // Chat is open
        DECLINED: 'declined',       // Request was declined
        ACCEPTED: 'accepted',       // Request accepted
        COMPLETED: 'completed',      // Booking done
        ARCHIVED: 'archived'         // Hidden from main view
    },
    
    // ========== MESSAGE TYPES ==========
    MessageTypes: {
        TEXT: 'text',
        IMAGE: 'image',
        FILE: 'file',
        SYSTEM: 'system',
        REQUEST: 'request',         // Initial request form
        RESPONSE: 'response',        // Accept/Decline response
        QUOTE: 'quote'               // Quote/Invoice
    },
    
    // ========== CREATE A NEW CONVERSATION ==========
    createConversation: function(recipient, type, requestData = {}) {
        const conversation = {
            id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            participants: [
                {
                    id: this.currentUser.id,
                    role: this.currentUser.role,
                    name: this.currentUser.name,
                    avatar: this.currentUser.avatar
                },
                {
                    id: recipient.id,
                    role: recipient.role,
                    name: recipient.name,
                    avatar: recipient.avatar
                }
            ],
            type: type,
            status: this.ConversationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Store the request data (date, venue, etc)
            requestData: requestData,
            
            // Messages array
            messages: [],
            
            // Unread count for each participant
            unreadCount: {
                [this.currentUser.id]: 0,
                [recipient.id]: 1  // Recipient has 1 unread (the request)
            },
            
            // For pending actions (accept/decline buttons)
            pendingAction: {
                type: type,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                actions: ['accept', 'decline', 'counter']
            }
        };
        
        // Create the initial request message
        const requestMessage = this.createRequestMessage(type, requestData);
        conversation.messages.push(requestMessage);
        
        // Add to conversations array
        this.conversations.push(conversation);
        this.saveConversations();
        
        // Send notification to recipient
        this.sendNotification(recipient.id, conversation);
        
        return conversation;
    },
    
    // ========== CREATE REQUEST MESSAGE ==========
    createRequestMessage: function(type, data) {
        let content = '';
        let formattedData = {};
        
        switch(type) {
            case this.ConversationTypes.BOOKING:
                content = this.formatBookingRequest(data);
                formattedData = {
                    eventDate: data.eventDate,
                    eventTime: data.eventTime,
                    duration: data.duration,
                    venue: data.venue,
                    fee: data.fee,
                    details: data.details
                };
                break;
                
            case this.ConversationTypes.APPLICATION:
                content = this.formatApplicationRequest(data);
                formattedData = {
                    gigId: data.gigId,
                    proposedFee: data.proposedFee,
                    message: data.message,
                    attachments: data.attachments || []
                };
                break;
                
            case this.ConversationTypes.REPRESENTATION:
                content = this.formatRepresentationRequest(data);
                formattedData = {
                    message: data.message,
                    genre: data.genre,
                    experience: data.experience
                };
                break;
                
            default:
                content = data.message || 'Hello, I would like to connect.';
                formattedData = { message: data.message };
        }
        
        return {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            senderId: this.currentUser.id,
            type: this.MessageTypes.REQUEST,
            content: content,
            data: formattedData,
            timestamp: new Date().toISOString(),
            status: 'sent',
            reactions: []
        };
    },
    
    // ========== FORMAT DIFFERENT REQUEST TYPES ==========
    formatBookingRequest: function(data) {
        const date = new Date(data.eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `🎵 **Booking Request**\n\n` +
               `📅 **Date:** ${date}\n` +
               `⏰ **Time:** ${data.eventTime || 'TBD'} (${data.duration || '?'} hours)\n` +
               `📍 **Venue:** ${data.venue}\n` +
               `💰 **Fee:** ${data.fee ? 'R' + data.fee : 'To be discussed'}\n\n` +
               `📝 **Details:**\n${data.details || 'No additional details provided.'}`;
    },
    
    formatApplicationRequest: function(data) {
        return `🎸 **Gig Application**\n\n` +
               `💰 **Proposed Fee:** R${data.proposedFee}\n\n` +
               `📝 **Message:**\n${data.message}`;
    },
    
    formatRepresentationRequest: function(data) {
        return `🤝 **Representation Inquiry**\n\n` +
               `🎵 **Genre:** ${data.genre || 'Not specified'}\n` +
               `⭐ **Experience:** ${data.experience || 'Not specified'}\n\n` +
               `📝 **Message:**\n${data.message}`;
    },
    
    // ========== HANDLE RESPONSES (ACCEPT/DECLINE) ==========
    handleResponse: function(conversationId, response, reason = '') {
        const conversation = this.getConversation(conversationId);
        if (!conversation) return null;
        
        let responseMessage = {};
        
        if (response === 'accept') {
            conversation.status = this.ConversationStatus.ACCEPTED;
            responseMessage = {
                id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                senderId: this.getOtherParticipant().id,
                type: this.MessageTypes.RESPONSE,
                content: '✅ **Request Accepted**\n\nGreat! Let\'s discuss the details further.',
                data: { response: 'accept' },
                timestamp: new Date().toISOString(),
                status: 'sent',
                reactions: []
            };
        } else if (response === 'decline') {
            conversation.status = this.ConversationStatus.DECLINED;
            
            // Professional decline messages based on reason
            let declineMessage = '';
            switch(reason) {
                case 'unavailable':
                    declineMessage = 'Sorry, I\'m already booked for that date. All the best with your event!';
                    break;
                case 'fee':
                    declineMessage = 'Thank you for the offer, but the fee is too low for this type of event.';
                    break;
                case 'travel':
                    declineMessage = 'I\'d love to help, but the travel distance is too far for me at this time.';
                    break;
                default:
                    declineMessage = reason || 'Sorry, I won\'t be able to accommodate this request at this time.';
            }
            
            responseMessage = {
                id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                senderId: this.getOtherParticipant().id,
                type: this.MessageTypes.RESPONSE,
                content: `❌ **Request Declined**\n\n"${declineMessage}"`,
                data: { response: 'decline', reason: reason },
                timestamp: new Date().toISOString(),
                status: 'sent',
                reactions: []
            };
        }
        
        conversation.messages.push(responseMessage);
        conversation.updatedAt = new Date().toISOString();
        conversation.pendingAction = null; // Remove pending action
        
        this.saveConversations();
        return conversation;
    },
    
    // ========== SEND A REGULAR MESSAGE ==========
    sendMessage: function(conversationId, text, attachments = []) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) return null;
        
        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            senderId: this.currentUser.id,
            type: attachments.length > 0 ? 
                  (attachments[0].type.startsWith('image/') ? this.MessageTypes.IMAGE : this.MessageTypes.FILE) 
                  : this.MessageTypes.TEXT,
            content: text,
            attachments: attachments,
            timestamp: new Date().toISOString(),
            status: 'sent',
            reactions: [],
            readBy: []
        };
        
        conversation.messages.push(message);
        conversation.updatedAt = new Date().toISOString();
        
        // Update unread count for other participant
        const otherId = this.getOtherParticipant(conversation).id;
        conversation.unreadCount[otherId] = (conversation.unreadCount[otherId] || 0) + 1;
        
        this.saveConversations();
        return message;
    },
    
    // ========== MARK MESSAGES AS READ ==========
    markAsRead: function(conversationId) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) return;
        
        conversation.unreadCount[this.currentUser.id] = 0;
        this.saveConversations();
    },
    
    // ========== GET CONVERSATION BY ID ==========
    getConversation: function(id) {
        return this.conversations.find(c => c.id === id);
    },
    
    // ========== GET ALL CONVERSATIONS FOR CURRENT USER ==========
    getMyConversations: function() {
        return this.conversations.filter(conv => 
            conv.participants.some(p => p.id === this.currentUser.id)
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    
    // ========== GET UNREAD COUNT ==========
    getUnreadCount: function() {
        return this.conversations.reduce((total, conv) => {
            if (conv.participants.some(p => p.id === this.currentUser.id)) {
                return total + (conv.unreadCount[this.currentUser.id] || 0);
            }
            return total;
        }, 0);
    },
    
    // ========== GET OTHER PARTICIPANT IN CONVERSATION ==========
    getOtherParticipant: function(conversation) {
        return conversation.participants.find(p => p.id !== this.currentUser.id);
    },
    
    // ========== SAVE TO LOCALSTORAGE ==========
    saveConversations: function() {
        try {
            localStorage.setItem('vivoChat_conversations', JSON.stringify(this.conversations));
            
            // Also save by user for multi-user support
            if (this.currentUser?.id) {
                localStorage.setItem(`vivoChat_${this.currentUser.id}`, JSON.stringify(this.conversations));
            }
            
            // Update notification badge across all pages
            this.updateNotificationBadge();
        } catch (e) {
            console.error('Error saving conversations:', e);
        }
    },
    
    // ========== LOAD FROM LOCALSTORAGE ==========
    loadConversations: function() {
        try {
            // Try user-specific conversations first
            if (this.currentUser?.id) {
                const userChats = localStorage.getItem(`vivoChat_${this.currentUser.id}`);
                if (userChats) {
                    this.conversations = JSON.parse(userChats);
                    console.log('Loaded user conversations:', this.conversations.length);
                    return;
                }
            }
            
            // Fallback to global
            const saved = localStorage.getItem('vivoChat_conversations');
            if (saved) {
                this.conversations = JSON.parse(saved);
                console.log('Loaded global conversations:', this.conversations.length);
            } else {
                this.conversations = [];
            }
        } catch (e) {
            console.error('Error loading conversations:', e);
            this.conversations = [];
        }
    },
    
    // ========== SEND NOTIFICATION ==========
    sendNotification: function(recipientId, conversation) {
        // Store notification in localStorage for other user to pick up
        const notifications = JSON.parse(localStorage.getItem('vivoChat_notifications') || '[]');
        notifications.push({
            id: 'notif_' + Date.now(),
            recipientId: recipientId,
            conversationId: conversation.id,
            senderName: this.currentUser.name,
            type: conversation.type,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('vivoChat_notifications', JSON.stringify(notifications));
    },
    
    // ========== GET NOTIFICATIONS ==========
    getMyNotifications: function() {
        try {
            const all = JSON.parse(localStorage.getItem('vivoChat_notifications') || '[]');
            return all.filter(n => n.recipientId === this.currentUser.id && !n.read);
        } catch (e) {
            return [];
        }
    },
    
    // ========== MARK NOTIFICATION AS READ ==========
    markNotificationRead: function(notificationId) {
        try {
            const notifications = JSON.parse(localStorage.getItem('vivoChat_notifications') || '[]');
            const index = notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                notifications[index].read = true;
                localStorage.setItem('vivoChat_notifications', JSON.stringify(notifications));
            }
        } catch (e) {}
    },
    
    // ========== UPDATE NOTIFICATION BADGE ==========
    updateNotificationBadge: function() {
        const count = this.getUnreadCount();
        
        // Update all badges on the page
        document.querySelectorAll('.chat-notification-badge, #chatNotificationBadge').forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
        
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('chatNotificationsUpdated', { detail: { count } }));
    },
    
    // ========== DELETE CONVERSATION ==========
    deleteConversation: function(conversationId) {
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        this.saveConversations();
    },
    
    // ========== SEARCH CONVERSATIONS ==========
    searchConversations: function(query) {
        const myConvs = this.getMyConversations();
        return myConvs.filter(conv => {
            const other = this.getOtherParticipant(conv);
            return other.name.toLowerCase().includes(query.toLowerCase()) ||
                   conv.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()));
        });
    }
};

// Initialize when script loads
VivoChatData.init();

// Make it globally available
window.VivoChatData = VivoChatData;