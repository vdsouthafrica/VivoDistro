// vivo-chat.js - Main Chat Window Logic

document.addEventListener('DOMContentLoaded', function() {
    console.log('Vivo Chat window loaded');
    
    // Check if VivoChatData is available
    if (!window.VivoChatData) {
        console.error('VivoChatData not found!');
        showError('Chat system not initialized');
        return;
    }
    
    // Get conversation ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id');
    
    if (!conversationId) {
        showError('No conversation specified');
        setTimeout(() => {
            window.location.href = 'vivo-chat-list.html';
        }, 2000);
        return;
    }
    
    // DOM Elements
    const backToList = document.getElementById('backToList');
    const chatUserName = document.getElementById('chatUserName');
    const chatUserRole = document.getElementById('chatUserRole');
    const chatAvatar = document.getElementById('chatAvatar');
    const userStatus = document.getElementById('userStatus');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const requestBanner = document.getElementById('requestBanner');
    const requestBannerText = document.getElementById('requestBannerText');
    const requestBannerActions = document.getElementById('requestBannerActions');
    const messagesContainer = document.getElementById('messagesContainer');
    const messagesLoading = document.getElementById('messagesLoading');
    const typingIndicator = document.getElementById('typingIndicator');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const attachBtn = document.getElementById('attachBtn');
    const quoteBtn = document.getElementById('quoteBtn');
    const imageBtn = document.getElementById('imageBtn');
    const attachmentPreview = document.getElementById('attachmentPreview');
    
    // Modal elements
    const emojiPicker = document.getElementById('emojiPicker');
    const closeEmojiPicker = document.getElementById('closeEmojiPicker');
    const uploadModal = document.getElementById('uploadModal');
    const quoteModal = document.getElementById('quoteModal');
    const contextMenu = document.getElementById('contextMenu');
    
    // State
    let conversation = null;
    let otherUser = null;
    let attachments = [];
    let typingTimeout = null;
    let selectedMessageId = null;
    let refreshInterval = null;
    
    // Initialize
    loadConversation();
    setupEventListeners();
    markAsRead();
    startTypingSimulation();
    
    // ========== LOAD CONVERSATION ==========
    
    function loadConversation() {
        conversation = VivoChatData.getConversation(conversationId);
        
        if (!conversation) {
            showError('Conversation not found');
            setTimeout(() => {
                window.location.href = 'vivo-chat-list.html';
            }, 2000);
            return;
        }
        
        otherUser = VivoChatData.getOtherParticipant(conversation);
        
        // Update UI
        updateHeader();
        updateRequestBanner();
        renderMessages();
        
        // Start periodic refresh
        startRefreshInterval();
    }
    
    function updateHeader() {
        if (!otherUser) return;
        
        chatUserName.textContent = otherUser.name;
        chatUserRole.textContent = otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1);
        
        // Update avatar
        if (otherUser.avatar) {
            chatAvatar.innerHTML = `<img src="${otherUser.avatar}" alt="${otherUser.name}">`;
        } else {
            const icon = otherUser.role === 'performer' ? 'fa-user' : 
                        otherUser.role === 'agent' ? 'fa-user-tie' : 
                        otherUser.role === 'booker' ? 'fa-building' : 'fa-user';
            chatAvatar.innerHTML = `<i class="fas ${icon}"></i>`;
        }
        
        // Simulate online status (random for demo)
        const isOnline = Math.random() > 0.5;
        userStatus.innerHTML = isOnline ? 
            '<span class="status-dot online"></span> Online' : 
            '<span class="status-dot offline"></span> Offline';
    }
    
    function updateRequestBanner() {
        if (!conversation) return;
        
        const isPending = conversation.status === 'pending';
        const isOwnRequest = conversation.messages[0]?.senderId === VivoChatData.currentUser.id;
        
        if (isPending && !isOwnRequest) {
            // Show banner with accept/decline buttons for incoming requests
            requestBanner.style.display = 'flex';
            
            switch(conversation.type) {
                case 'booking':
                    requestBannerText.textContent = '🎵 This performer wants to book you? Actually, you want to book them? Wait...';
                    requestBannerText.textContent = '📅 You have a pending booking request';
                    break;
                case 'application':
                    requestBannerText.textContent = '🎸 You have a new gig application';
                    break;
                case 'representation':
                    requestBannerText.textContent = '🤝 You have a representation inquiry';
                    break;
                default:
                    requestBannerText.textContent = '💬 You have a new message request';
            }
            
            requestBannerActions.innerHTML = `
                <button class="btn-accept" onclick="handleRequestResponse('accept')">
                    <i class="fas fa-check-circle"></i> Accept
                </button>
                <button class="btn-decline" onclick="showDeclineOptions()">
                    <i class="fas fa-times-circle"></i> Decline
                </button>
                ${conversation.type !== 'general' ? `
                    <button class="btn-counter" onclick="showCounterOffer()">
                        <i class="fas fa-exchange-alt"></i> Counter
                    </button>
                ` : ''}
            `;
        } else if (isPending && isOwnRequest) {
            // Show waiting banner for own requests
            requestBanner.style.display = 'flex';
            requestBannerText.textContent = '⏳ Waiting for response...';
            requestBannerActions.innerHTML = '';
        } else {
            requestBanner.style.display = 'none';
        }
    }
    
    // ========== RENDER MESSAGES ==========
    
    function renderMessages() {
        if (!conversation) return;
        
        // Hide loading
        messagesLoading.style.display = 'none';
        
        // Clear container
        messagesContainer.innerHTML = '';
        
        if (conversation.messages.length === 0) {
            showEmptyMessages();
            return;
        }
        
        // Group messages by date
        let lastDate = null;
        
        conversation.messages.forEach(message => {
            const messageDate = new Date(message.timestamp).toDateString();
            
            // Add date separator if new date
            if (messageDate !== lastDate) {
                addDateSeparator(message.timestamp);
                lastDate = messageDate;
            }
            
            // Add message
            addMessageToContainer(message);
        });
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    function addDateSeparator(timestamp) {
        const date = new Date(timestamp);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        let dateText = '';
        if (date.toDateString() === today) {
            dateText = 'Today';
        } else if (date.toDateString() === yesterday) {
            dateText = 'Yesterday';
        } else {
            dateText = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        const separator = document.createElement('div');
        separator.className = 'date-separator';
        separator.innerHTML = `<span>${dateText}</span>`;
        messagesContainer.appendChild(separator);
    }
    
    function addMessageToContainer(message) {
        const isOwn = message.senderId === VivoChatData.currentUser.id;
        
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isOwn ? 'own' : 'other'}`;
        wrapper.dataset.messageId = message.id;
        
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${message.type}`;
        
        // Message content based on type
        let content = '';
        
        if (message.type === 'request') {
            content = renderRequestMessage(message);
        } else if (message.type === 'response') {
            content = renderResponseMessage(message);
        } else if (message.type === 'image') {
            content = renderImageMessage(message);
        } else if (message.attachments?.length > 0) {
            content = renderFileMessage(message);
        } else {
            content = `<div class="message-content">${formatMessageText(message.content)}</div>`;
        }
        
        // Message footer with time and status
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const statusIcon = isOwn ? getStatusIcon(message.status) : '';
        
        bubble.innerHTML = `
            ${content}
            <div class="message-footer">
                <span class="message-time">${time}</span>
                ${statusIcon}
            </div>
            ${renderReactions(message)}
        `;
        
        wrapper.appendChild(bubble);
        
        // Add context menu on right click
        wrapper.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showContextMenu(e, message.id);
        });
        
        messagesContainer.appendChild(wrapper);
    }
    
    function renderRequestMessage(message) {
        const data = message.data || {};
        let html = '<div class="message-content request">';
        
        switch(conversation.type) {
            case 'booking':
                html += `
                    <div style="margin-bottom: 10px;"><strong>📅 Booking Request</strong></div>
                    <div class="request-details">
                        <p><i class="fas fa-calendar"></i> ${new Date(data.eventDate).toLocaleDateString()}</p>
                        <p><i class="fas fa-clock"></i> ${data.eventTime || 'TBD'} (${data.duration || '?'} hours)</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${data.venue}</p>
                        ${data.fee ? `<p><i class="fas fa-money-bill-wave"></i> R${data.fee}</p>` : ''}
                        ${data.details ? `<p><i class="fas fa-align-left"></i> ${data.details}</p>` : ''}
                    </div>
                `;
                break;
                
            case 'application':
                html += `
                    <div style="margin-bottom: 10px;"><strong>🎸 Gig Application</strong></div>
                    <div class="request-details">
                        <p><i class="fas fa-money-bill-wave"></i> Proposed: R${data.proposedFee}</p>
                        <p><i class="fas fa-comment"></i> ${data.message}</p>
                    </div>
                `;
                break;
                
            default:
                html += `<div class="message-content">${message.content}</div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    function renderResponseMessage(message) {
        const isAccept = message.data?.response === 'accept';
        const icon = isAccept ? '✅' : '❌';
        const color = isAccept ? '#48BB78' : '#F56565';
        
        return `
            <div class="message-content" style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">${icon}</div>
                <div style="color: ${color}; font-weight: 600; margin-bottom: 5px;">
                    ${isAccept ? 'Request Accepted' : 'Request Declined'}
                </div>
                <div style="color: var(--gray-light); font-style: italic;">
                    ${message.content.split('"')[1] || ''}
                </div>
            </div>
        `;
    }
    
    function renderImageMessage(message) {
        return `
            <div class="message-content">
                <img src="${message.attachments[0].url}" class="message-image" onclick="previewImage('${message.attachments[0].url}')">
                ${message.content ? `<p style="margin-top: 8px;">${message.content}</p>` : ''}
            </div>
        `;
    }
    
    function renderFileMessage(message) {
        const file = message.attachments[0];
        return `
            <div class="message-content">
                <p>${message.content}</p>
                <div class="file-attachment">
                    <div class="file-icon"><i class="fas fa-file"></i></div>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                    <a href="${file.url}" download class="file-download">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            </div>
        `;
    }
    
    function renderReactions(message) {
        if (!message.reactions || message.reactions.length === 0) return '';
        
        // Group reactions by emoji
        const reactionGroups = {};
        message.reactions.forEach(r => {
            if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
            reactionGroups[r.emoji].push(r.userId);
        });
        
        let html = '<div class="message-reactions">';
        for (const [emoji, users] of Object.entries(reactionGroups)) {
            html += `
                <span class="reaction" onclick="addReaction('${emoji}', '${message.id}')">
                    <span>${emoji}</span>
                    <span class="count">${users.length}</span>
                </span>
            `;
        }
        html += '</div>';
        
        return html;
    }
    
    function getStatusIcon(status) {
        switch(status) {
            case 'sent':
                return '<span class="message-status"><i class="far fa-check-circle"></i></span>';
            case 'delivered':
                return '<span class="message-status"><i class="fas fa-check-circle"></i></span>';
            case 'read':
                return '<span class="message-status"><i class="fas fa-check-circle" style="color: var(--primary);"></i></span>';
            default:
                return '';
        }
    }
    
    function formatMessageText(text) {
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    function showEmptyMessages() {
        messagesContainer.innerHTML = `
            <div class="empty-state" style="margin-top: 50px;">
                <i class="fas fa-comments"></i>
                <h3>No messages yet</h3>
                <p>Send a message to start the conversation!</p>
            </div>
        `;
    }
    
    // ========== SEND MESSAGE ==========
    
    function sendMessage() {
        const text = messageInput.value.trim();
        
        if (!text && attachments.length === 0) return;
        
        // Send to data layer
        const message = VivoChatData.sendMessage(conversationId, text, attachments);
        
        if (message) {
            // Add to UI
            addMessageToContainer(message);
            
            // Clear input
            messageInput.value = '';
            autoResize(messageInput);
            
            // Clear attachments
            attachments = [];
            attachmentPreview.style.display = 'none';
            attachmentPreview.innerHTML = '';
            
            // Disable send button
            sendMessageBtn.disabled = true;
            
            // Scroll to bottom
            scrollToBottom();
            
            // Simulate "delivered" after 1 second
            setTimeout(() => {
                message.status = 'delivered';
                // In a real app, this would be updated via WebSocket
            }, 1000);
        }
    }
    
    // ========== EVENT LISTENERS ==========
    
    function setupEventListeners() {
        // Back button
        if (backToList) {
            backToList.addEventListener('click', function() {
                window.location.href = 'vivo-chat-list.html';
            });
        }
        
        // Message input
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                const hasText = this.value.trim().length > 0;
                sendMessageBtn.disabled = !hasText && attachments.length === 0;
                
                // Simulate typing indicator
                if (hasText) {
                    if (typingTimeout) clearTimeout(typingTimeout);
                    // In real app, would emit 'typing' event
                    typingTimeout = setTimeout(() => {
                        // Emit 'stop typing' event
                    }, 2000);
                }
            });
            
            messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        // Send button
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        
        // Emoji button
        if (emojiBtn) {
            emojiBtn.addEventListener('click', function() {
                emojiPicker.style.display = 'block';
            });
        }
        
        // Close emoji picker
        if (closeEmojiPicker) {
            closeEmojiPicker.addEventListener('click', function() {
                emojiPicker.style.display = 'none';
            });
        }
        
        // Emoji selection
        document.querySelectorAll('.emoji').forEach(emoji => {
            emoji.addEventListener('click', function() {
                messageInput.value += this.textContent;
                messageInput.dispatchEvent(new Event('input'));
                emojiPicker.style.display = 'none';
                messageInput.focus();
            });
        });
        
        // Attach button
        if (attachBtn) {
            attachBtn.addEventListener('click', function() {
                document.getElementById('fileInput').click();
            });
        }
        
        // Image button
        if (imageBtn) {
            imageBtn.addEventListener('click', function() {
                document.getElementById('fileInput').accept = 'image/*';
                document.getElementById('fileInput').multiple = true;
                document.getElementById('fileInput').click();
                setTimeout(() => {
                    document.getElementById('fileInput').accept = '*/*';
                }, 100);
            });
        }
        
        // Quote button
        if (quoteBtn) {
            quoteBtn.addEventListener('click', function() {
                quoteModal.style.display = 'flex';
            });
        }
        
        // File input change
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                handleFileSelect(e.target.files);
            });
        }
        
        // Upload area click
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', function() {
                document.getElementById('fileInput').click();
            });
            
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = 'var(--primary)';
            });
            
            uploadArea.addEventListener('dragleave', function() {
                this.style.borderColor = 'var(--chat-border)';
            });
            
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = 'var(--chat-border)';
                handleFileSelect(e.dataTransfer.files);
            });
        }
        
        // Close modals
        document.getElementById('closeUploadModal')?.addEventListener('click', function() {
            uploadModal.style.display = 'none';
        });
        
        document.getElementById('cancelUpload')?.addEventListener('click', function() {
            uploadModal.style.display = 'none';
        });
        
        document.getElementById('closeQuoteModal')?.addEventListener('click', function() {
            quoteModal.style.display = 'none';
        });
        
        document.getElementById('cancelQuote')?.addEventListener('click', function() {
            quoteModal.style.display = 'none';
        });
        
        // Send quote
        document.getElementById('sendQuoteBtn')?.addEventListener('click', function() {
            const description = document.getElementById('quoteDescription').value;
            const amount = document.getElementById('quoteAmount').value;
            const validUntil = document.getElementById('quoteValidUntil').value;
            const notes = document.getElementById('quoteNotes').value;
            
            if (!description || !amount) {
                alert('Please fill in description and amount');
                return;
            }
            
            const quoteText = `💰 **Quote**\n\nDescription: ${description}\nAmount: R${amount}\nValid until: ${validUntil || 'Not specified'}\n\nNotes: ${notes || 'None'}`;
            
            messageInput.value = quoteText;
            quoteModal.style.display = 'none';
            messageInput.focus();
            
            // Clear form
            document.getElementById('quoteForm').reset();
        });
        
        // Close modals on outside click
        window.addEventListener('click', function(e) {
            if (e.target === uploadModal) uploadModal.style.display = 'none';
            if (e.target === quoteModal) quoteModal.style.display = 'none';
            if (e.target === emojiPicker) emojiPicker.style.display = 'none';
            if (!e.target.closest('.context-menu')) contextMenu.style.display = 'none';
        });
        
        // View profile button
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', function() {
                // In a real app, would open user's profile
                alert(`View ${otherUser?.name}'s profile`);
            });
        }
    }
    
    // ========== HANDLE FILE UPLOAD ==========
    
    function handleFileSelect(files) {
        uploadModal.style.display = 'none';
        
        Array.from(files).forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Max 10MB.`);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const attachment = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: e.target.result,
                    data: e.target.result.split(',')[1] // base64 data
                };
                
                attachments.push(attachment);
                
                // Show preview
                attachmentPreview.style.display = 'flex';
                
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                if (file.type.startsWith('image/')) {
                    previewItem.innerHTML = `
                        <img src="${e.target.result}">
                        <button class="remove-preview" onclick="removeAttachment(${attachments.length - 1})">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                } else {
                    previewItem.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(108,99,255,0.1);">
                            <i class="fas fa-file" style="font-size:2rem; color:var(--primary);"></i>
                        </div>
                        <button class="remove-preview" onclick="removeAttachment(${attachments.length - 1})">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                }
                
                attachmentPreview.appendChild(previewItem);
                sendMessageBtn.disabled = false;
            };
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }
    
    window.removeAttachment = function(index) {
        attachments.splice(index, 1);
        updateAttachmentPreview();
    };
    
    function updateAttachmentPreview() {
        if (attachments.length === 0) {
            attachmentPreview.style.display = 'none';
            attachmentPreview.innerHTML = '';
            sendMessageBtn.disabled = !messageInput.value.trim();
        }
    }
    
    // ========== REQUEST HANDLING ==========
    
    window.handleRequestResponse = function(response) {
        if (response === 'decline') {
            showDeclineOptions();
            return;
        }
        
        // Handle accept
        const updated = VivoChatData.handleResponse(conversationId, response);
        if (updated) {
            conversation = updated;
            updateRequestBanner();
            
            // Add system message
            const systemMsg = {
                id: 'msg_' + Date.now(),
                senderId: 'system',
                type: 'system',
                content: response === 'accept' ? '✅ Request accepted' : '❌ Request declined',
                timestamp: new Date().toISOString()
            };
            
            addMessageToContainer(systemMsg);
        }
    };
    
    window.showDeclineOptions = function() {
        // Create decline modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'declineModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fas fa-times-circle" style="color: var(--danger);"></i> Decline Request</h3>
                    <button class="modal-close" onclick="document.getElementById('declineModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px;">Let them know why:</p>
                    <button class="decline-option" style="width:100%; text-align:left; padding:15px; margin-bottom:10px; background:rgba(255,255,255,0.05); border:1px solid var(--chat-border); border-radius:10px; cursor:pointer;" onclick="declineWithReason('unavailable')">
                        <i class="fas fa-calendar-xmark" style="color: var(--danger); margin-right:10px;"></i>
                        Sorry, I'm unavailable that date
                    </button>
                    <button class="decline-option" style="width:100%; text-align:left; padding:15px; margin-bottom:10px; background:rgba(255,255,255,0.05); border:1px solid var(--chat-border); border-radius:10px; cursor:pointer;" onclick="declineWithReason('fee')">
                        <i class="fas fa-money-bill-wave" style="color: var(--danger); margin-right:10px;"></i>
                        Fee is too low for this event
                    </button>
                    <button class="decline-option" style="width:100%; text-align:left; padding:15px; margin-bottom:10px; background:rgba(255,255,255,0.05); border:1px solid var(--chat-border); border-radius:10px; cursor:pointer;" onclick="declineWithReason('travel')">
                        <i class="fas fa-car" style="color: var(--danger); margin-right:10px;"></i>
                        Travel distance is too far
                    </button>
                    <button class="decline-option" style="width:100%; text-align:left; padding:15px; margin-bottom:10px; background:rgba(255,255,255,0.05); border:1px solid var(--chat-border); border-radius:10px; cursor:pointer;" onclick="declineWithReason('custom')">
                        <i class="fas fa-pen" style="color: var(--danger); margin-right:10px;"></i>
                        Custom reason...
                    </button>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="document.getElementById('declineModal').remove()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };
    
    window.declineWithReason = function(reason) {
        let message = '';
        
        switch(reason) {
            case 'unavailable':
                message = "Sorry, I'm already booked for that date. All the best with your event!";
                break;
            case 'fee':
                message = "Thank you for the offer, but the fee is too low for this type of event.";
                break;
            case 'travel':
                message = "I'd love to help, but the travel distance is too far for me at this time.";
                break;
            case 'custom':
                message = prompt('Enter your reason:');
                if (!message) return;
                break;
        }
        
        const updated = VivoChatData.handleResponse(conversationId, 'decline', message);
        if (updated) {
            conversation = updated;
            updateRequestBanner();
            document.getElementById('declineModal')?.remove();
            
            // Add system message
            const systemMsg = {
                id: 'msg_' + Date.now(),
                senderId: 'system',
                type: 'system',
                content: `❌ Request declined: "${message}"`,
                timestamp: new Date().toISOString()
            };
            
            addMessageToContainer(systemMsg);
        }
    };
    
    window.showCounterOffer = function() {
        alert('Counter offer feature coming soon!');
    };
    
    // ========== CONTEXT MENU ==========
    
    function showContextMenu(e, messageId) {
        e.preventDefault();
        selectedMessageId = messageId;
        
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
    }
    
    window.addReaction = function(emoji, messageId) {
        const messageIdToUse = messageId || selectedMessageId;
        if (!messageIdToUse) return;
        
        // Find message
        const message = conversation.messages.find(m => m.id === messageIdToUse);
        if (!message) return;
        
        // Add reaction
        if (!message.reactions) message.reactions = [];
        
        // Check if user already reacted with this emoji
        const existing = message.reactions.find(r => 
            r.emoji === emoji && r.userId === VivoChatData.currentUser.id
        );
        
        if (existing) {
            // Remove reaction
            message.reactions = message.reactions.filter(r => 
                !(r.emoji === emoji && r.userId === VivoChatData.currentUser.id)
            );
        } else {
            // Add reaction
            message.reactions.push({
                emoji: emoji,
                userId: VivoChatData.currentUser.id,
                timestamp: new Date().toISOString()
            });
        }
        
        // Save and re-render
        VivoChatData.saveConversations();
        renderMessages();
        contextMenu.style.display = 'none';
    };
    
    window.deleteMessage = function() {
        if (!selectedMessageId) return;
        
        if (confirm('Delete this message?')) {
            conversation.messages = conversation.messages.filter(m => m.id !== selectedMessageId);
            VivoChatData.saveConversations();
            renderMessages();
        }
        
        contextMenu.style.display = 'none';
    };
    
    // ========== IMAGE PREVIEW ==========
    
    window.previewImage = function(url) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <img src="${url}">
            <button class="close-preview" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(modal);
    };
    
    // ========== UTILITY FUNCTIONS ==========
    
    function markAsRead() {
        VivoChatData.markAsRead(conversationId);
    }
    
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    
    window.autoResize = autoResize;
    
    function showError(message) {
        messagesContainer.innerHTML = `
            <div class="empty-state" style="border-color: var(--danger);">
                <i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="window.location.href='vivo-chat-list.html'">
                    <i class="fas fa-arrow-left"></i> Back to Conversations
                </button>
            </div>
        `;
        messagesLoading.style.display = 'none';
    }
    
    function startRefreshInterval() {
        // Refresh every 10 seconds
        refreshInterval = setInterval(() => {
            VivoChatData.loadConversations();
            const updated = VivoChatData.getConversation(conversationId);
            if (updated && JSON.stringify(updated.messages) !== JSON.stringify(conversation.messages)) {
                conversation = updated;
                renderMessages();
                updateRequestBanner();
            }
        }, 10000);
    }
    
    function startTypingSimulation() {
        // Just for demo - in real app this would come from WebSocket
        setTimeout(() => {
            if (Math.random() > 0.7) {
                typingIndicator.style.display = 'flex';
                document.getElementById('typingText').textContent = `${otherUser?.name} is typing...`;
                
                setTimeout(() => {
                    typingIndicator.style.display = 'none';
                }, 3000);
            }
        }, 5000);
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (refreshInterval) clearInterval(refreshInterval);
    });
});