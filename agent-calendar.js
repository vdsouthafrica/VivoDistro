// calendar.js - COMPLETE FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevMonthBtn = document.querySelector('.prev-month');
    const nextMonthBtn = document.querySelector('.next-month');
    const todayBtn = document.getElementById('todayBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventModal = document.getElementById('eventModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEvent = document.getElementById('cancelEvent');
    const eventForm = document.getElementById('eventForm');
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    const deleteEventBtn = document.getElementById('deleteEvent');
    
    // Calendar State
    let currentDate = new Date();
    let events = [];
    let editingEventId = null;
    
    // Initialize
    loadEvents();
    renderCalendar();
    updateUpcomingEvents();
    updateStats();
    
    // Month Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    // Add Event Button
    addEventBtn.addEventListener('click', () => {
        editingEventId = null;
        openEventModal();
    });
    
    // Modal Controls
    closeModal.addEventListener('click', closeEventModal);
    cancelEvent.addEventListener('click', closeEventModal);
    
    // Form Submission
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEvent();
    });
    
    // Delete Event
    deleteEventBtn.addEventListener('click', deleteCurrentEvent);
    
    // Load events from localStorage
    function loadEvents() {
        const savedEvents = localStorage.getItem('vivoCalendarEvents');
        if (savedEvents) {
            try {
                events = JSON.parse(savedEvents);
                
                // Convert date strings back to Date objects
                events.forEach(event => {
                    // Fix existing dates if they have timezone issues
                    if (event.date) {
                        const dateStr = event.date;
                        if (typeof dateStr === 'string') {
                            // Parse the date string properly
                            const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
                            event.date = new Date(year, month - 1, day, 12, 0, 0);
                        }
                    }
                    if (event.createdAt) event.createdAt = new Date(event.createdAt);
                    if (event.updatedAt) event.updatedAt = new Date(event.updatedAt);
                });
            } catch (e) {
                console.error('Error loading events:', e);
                events = [];
            }
        } else {
            // If no events in localStorage, start with empty array
            events = [];
        }
    }
    
    // Save events to localStorage
    function saveEvents() {
        localStorage.setItem('vivoCalendarEvents', JSON.stringify(events));
        updateUpcomingEvents();
        updateStats();
        updateHubUpcoming();
    }
    
    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Render Calendar
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();
        
        // Update month header
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Clear calendar
        calendarDays.innerHTML = '';
        
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
        const firstDayIndex = firstDay.getDay();
        
        // Add days from previous month
        for (let i = 0; i < firstDayIndex; i++) {
            const prevDate = new Date(year, month, -i);
            prevDate.setDate(firstDay.getDate() - (firstDayIndex - i));
            addCalendarDay(prevDate, true);
        }
        
        // Add days from current month
        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            const isToday = day.getDate() === today.getDate() && 
                           day.getMonth() === today.getMonth() && 
                           day.getFullYear() === today.getFullYear();
            addCalendarDay(day, false, isToday);
        }
        
        // Calculate total cells needed for 6 rows
        const totalCells = 42;
        const daysSoFar = firstDayIndex + daysInMonth;
        const daysNeeded = totalCells - daysSoFar;
        
        // Add days from next month
        for (let i = 1; i <= daysNeeded; i++) {
            const nextDate = new Date(year, month + 1, i);
            addCalendarDay(nextDate, true);
        }
    }
    
    // Add a day to the calendar with events
    function addCalendarDay(date, isOtherMonth, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) dayElement.classList.add('other-month');
        if (isToday) dayElement.classList.add('today');
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // Get events for this day
        const dayEvents = getEventsForDate(date);
        
        // Day events container
        const dayEventsContainer = document.createElement('div');
        dayEventsContainer.className = 'day-events';
        
        // Show up to 3 events
        const eventsToShow = dayEvents.slice(0, 3);
        eventsToShow.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'day-event';
            
            // Apply custom color
            eventElement.style.backgroundColor = event.color || '#6C63FF';
            eventElement.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
            
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.time} @ ${event.venue}`;
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                editEvent(event.id);
            });
            dayEventsContainer.appendChild(eventElement);
        });
        
        dayElement.appendChild(dayEventsContainer);
        
        // Show event count if more than 3 events
        if (dayEvents.length > 3) {
            const eventCount = document.createElement('div');
            eventCount.className = 'event-count';
            eventCount.textContent = `+${dayEvents.length - 3} more`;
            dayElement.appendChild(eventCount);
        }
        
        // Click to add event on this day
        dayElement.addEventListener('click', () => {
            editingEventId = null;
            openEventModal(date);
        });
        
        calendarDays.appendChild(dayElement);
    }
    
    // Get events for specific date (timezone-safe)
    function getEventsForDate(date) {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === date.getFullYear() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getDate() === date.getDate();
        });
    }
    
    // Open event modal
    function openEventModal(date = null) {
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteEvent');
        
        if (editingEventId) {
            modalTitle.textContent = 'Edit Event';
            deleteBtn.style.display = 'block';
            
            const event = events.find(e => e.id === editingEventId);
            if (event) {
                document.getElementById('eventTitle').value = event.title;
                
                // Format date for input
                const eventDate = new Date(event.date);
                const year = eventDate.getFullYear();
                const month = String(eventDate.getMonth() + 1).padStart(2, '0');
                const day = String(eventDate.getDate()).padStart(2, '0');
                document.getElementById('eventDate').value = `${year}-${month}-${day}`;
                
                document.getElementById('eventTime').value = event.time;
                document.getElementById('eventVenue').value = event.venue;
                document.getElementById('eventNotes').value = event.notes || '';
                
                // Set color
                const colorInput = document.querySelector(`input[name="color"][value="${event.color || '#6C63FF'}"]`);
                if (colorInput) colorInput.checked = true;
            }
        } else {
            modalTitle.textContent = 'Add New Event';
            deleteBtn.style.display = 'none';
            
            // Reset form
            eventForm.reset();
            
            // Set default color
            document.querySelector('input[name="color"][value="#6C63FF"]').checked = true;
            
            // Set date if provided
            if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                document.getElementById('eventDate').value = `${year}-${month}-${day}`;
            } else {
                // Default to today
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                document.getElementById('eventDate').value = `${year}-${month}-${day}`;
            }
            
            // Default time to 8 PM
            document.getElementById('eventTime').value = '20:00';
        }
        
        eventModal.style.display = 'flex';
    }
    
    // Close event modal
    function closeEventModal() {
        eventModal.style.display = 'none';
        editingEventId = null;
    }
    
    // Save event (FIXED TIMEZONE ISSUE)
    function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const dateInput = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const venue = document.getElementById('eventVenue').value.trim();
        const notes = document.getElementById('eventNotes').value.trim();
        
        // Get selected color
        const colorInput = document.querySelector('input[name="color"]:checked');
        const color = colorInput ? colorInput.value : '#6C63FF';
        
        // Validation
        if (!title || !venue) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // FIX: Create date without timezone issues
        const [year, month, day] = dateInput.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        
        if (editingEventId) {
            // Update existing event
            const eventIndex = events.findIndex(e => e.id === editingEventId);
            if (eventIndex > -1) {
                events[eventIndex] = {
                    ...events[eventIndex],
                    title,
                    date,
                    time,
                    venue,
                    notes,
                    color,
                    updatedAt: new Date()
                };
                showNotification('Event updated successfully!', 'success');
            }
        } else {
            // Create new event
            const newEvent = {
                id: generateId(),
                title,
                date,
                time,
                venue,
                notes,
                color,
                createdAt: new Date()
            };
            events.push(newEvent);
            showNotification('Event added successfully!', 'success');
        }
        
        saveEvents();
        renderCalendar();
        closeEventModal();
    }
    
    // Edit event
    function editEvent(eventId) {
        editingEventId = eventId;
        openEventModal();
    }
    
    // Delete event
    function deleteCurrentEvent() {
        if (confirm('Are you sure you want to delete this event?')) {
            events = events.filter(e => e.id !== editingEventId);
            saveEvents();
            renderCalendar();
            closeEventModal();
            showNotification('Event deleted', 'info');
        }
    }
    
    // Update upcoming events list
    function updateUpcomingEvents() {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        
        const upcoming = events
            .filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= now;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
        
        if (upcoming.length > 0) {
            upcomingEventsList.innerHTML = '';
            upcoming.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.addEventListener('click', () => editEvent(event.id));
                
                const eventDate = new Date(event.date);
                const dateStr = formatEventDate(eventDate);
                
                eventElement.innerHTML = `
                    <div class="event-date">
                        <i class="far fa-calendar"></i>
                        ${dateStr} • ${event.time}
                    </div>
                    <div class="event-title">${event.title}</div>
                    <div class="event-venue">${event.venue}</div>
                    <div class="event-color" style="background: ${event.color || '#6C63FF'}; width: 100%; height: 4px; border-radius: 2px; margin-top: 8px;"></div>
                `;
                
                upcomingEventsList.appendChild(eventElement);
            });
        } else {
            upcomingEventsList.innerHTML = `
                <div class="empty-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No upcoming events</p>
                    <small>Add your first gig!</small>
                </div>
            `;
        }
        
        updateHubUpcoming();
    }
    
    // Update hub upcoming
    function updateHubUpcoming() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const upcoming = events
            .filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= now;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        localStorage.setItem('upcomingGigs', JSON.stringify(upcoming));
        
        if (typeof updateDashboardUpcoming === 'function') {
            updateDashboardUpcoming(upcoming);
        }
    }
    
    // Format event date for display
    function formatEventDate(date) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Update stats
    function updateStats() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const totalGigs = events.length;
        const upcomingGigs = events.filter(e => {
            const eventDate = new Date(e.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= now;
        }).length;
        
        document.getElementById('totalGigs').textContent = totalGigs;
        document.getElementById('upcomingGigs').textContent = upcomingGigs;
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#F56565' : '#6C63FF'};
            color: white;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});