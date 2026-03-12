// event-reminder.js - Check for upcoming events and send reminders
const EventReminder = {
    supabase: null,
    checkInterval: null,
    
    init: function(supabaseClient) {
        this.supabase = supabaseClient;
        this.startChecking();
        console.log('✅ Event Reminder system initialized');
    },
    
    startChecking: function() {
        // Check every hour
        this.checkInterval = setInterval(() => {
            this.checkUpcomingEvents();
        }, 60 * 60 * 1000); // 1 hour
        
        // Also check immediately on init
        this.checkUpcomingEvents();
    },
    
    stopChecking: function() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    },
    
    checkUpcomingEvents: async function() {
        console.log('Checking for upcoming events...');
        
        // Get current user
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;
        
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        dayAfterTomorrow.setHours(0, 0, 0, 0);
        
        // Format dates for comparison
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Get events from localStorage (or from database)
        const events = this.getEventsFromStorage();
        
        // Filter events that are tomorrow and haven't had reminder sent
        const eventsTomorrow = events.filter(event => {
            const eventDate = new Date(event.date);
            const eventDateStr = eventDate.toISOString().split('T')[0];
            
            // Check if event is tomorrow
            const isTomorrow = eventDateStr === tomorrowStr;
            
            // Check if reminder already sent
            const reminderKey = `event_reminder_${event.id}`;
            const reminderSent = localStorage.getItem(reminderKey);
            
            return isTomorrow && !reminderSent;
        });
        
        // Send reminders
        for (const event of eventsTomorrow) {
            await this.sendReminder(user.id, event);
            
            // Mark reminder as sent
            localStorage.setItem(`event_reminder_${event.id}`, 'sent');
        }
    },
    
    getEventsFromStorage: function() {
        try {
            const savedEvents = localStorage.getItem('vivoCalendarEvents');
            return savedEvents ? JSON.parse(savedEvents) : [];
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    },
    
    sendReminder: async function(userId, event) {
        if (!window.PushService) {
            console.log('PushService not available');
            return;
        }
        
        console.log('Sending event reminder for:', event.title);
        
        // Send push notification
        await PushService.sendEventReminder(userId, event);
        
        // Also store in-app notification
        await this.storeNotification(userId, event);
    },
    
    storeNotification: async function(userId, event) {
        if (!this.supabase) return;
        
        const eventDate = new Date(event.date);
        
        const { error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type: 'event_reminder',
                title: `📅 Event Tomorrow: ${event.title}`,
                body: `${eventDate.toLocaleDateString()} at ${event.time} - ${event.venue}`,
                data: { eventId: event.id },
                read: false,
                created_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Error storing notification:', error);
        }
    }
};

// Make it globally available
window.EventReminder = EventReminder;