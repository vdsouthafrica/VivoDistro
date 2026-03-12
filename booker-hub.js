// booker-hub.js - Booker Dashboard with fixes (COMPLETE VERSION)
document.addEventListener('DOMContentLoaded', function() {
    // Get Vivo ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const vivoId = urlParams.get('vivoId');
    
    // Load profile using ProfileManager
    loadProfile(vivoId);
    
    // Check for upcoming events
    checkUpcomingEvent();
    
    // Set up storage event listener for real-time updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'vivoCalendarEvents' || e.key === 'bookerProfile' || e.key === 'currentProfile') {
            loadProfile(vivoId);
            checkUpcomingEvent();
        }
    });
});

function loadProfile(vivoId) {
    console.log('Loading booker profile...');
    
    // Try to load profile from various sources
    let profile = null;
    
    // 1. Try ProfileManager if available
    if (window.ProfileManager) {
        if (vivoId) {
            profile = ProfileManager.loadProfile('booker', vivoId);
        } else {
            profile = ProfileManager.loadProfile('booker');
        }
    }
    
    // 2. Try specific key with vivoId
    if (!profile && vivoId) {
        const saved = localStorage.getItem(`bookerProfile_${vivoId}`);
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    // 3. Try generic bookerProfile key
    if (!profile) {
        const saved = localStorage.getItem('bookerProfile');
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    // 4. Try currentProfile
    if (!profile) {
        const saved = localStorage.getItem('currentProfile');
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    if (profile) {
        console.log('Booker profile loaded:', profile);
        updateDashboard(profile);
    } else {
        console.log('No booker profile found');
        showEmptyProfile();
    }
}

function updateDashboard(profile) {
    console.log('Updating dashboard with profile:', profile);
    
    // Update profile picture
    const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar');
    avatarElements.forEach(element => {
        if (profile.logo) {
            if (element.querySelector('img')) {
                element.querySelector('img').src = profile.logo;
            } else {
                element.innerHTML = `<img src="${profile.logo}" alt="Business Logo" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        } else {
            // Keep default icon if no logo
            element.innerHTML = '<i class="fas fa-building"></i>';
        }
    });
    
    // Update name
    const nameElements = document.querySelectorAll('#userName, #profileName');
    nameElements.forEach(element => {
        if (element) element.textContent = profile.name || 'Venue Name';
    });
    
    // Update location
    const locationElement = document.getElementById('profileLocation');
    if (locationElement) {
        locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location not set'}`;
    }
    
    // Update role
    const roleElement = document.getElementById('userRole');
    if (roleElement) {
        roleElement.textContent = 'Booker';
    }
    
    // Update bio
    const bioElement = document.getElementById('profileBio');
    if (bioElement) {
        if (profile.bio && profile.bio.trim()) {
            bioElement.innerHTML = `<p>${profile.bio}</p>`;
            bioElement.classList.remove('empty');
        } else {
            bioElement.innerHTML = '<p class="bio-placeholder">Add a bio to tell performers about your venue...</p>';
            bioElement.classList.add('empty');
        }
    }
    
    // Update business types
    const typesElement = document.getElementById('profileTypes');
    if (typesElement) {
        if (profile.types && profile.types.length > 0) {
            typesElement.innerHTML = profile.types.map(type => 
                `<span class="type-badge">${type}</span>`
            ).join('');
        } else {
            typesElement.innerHTML = '';
        }
    }
    
    // Update venue types - IMPROVED SPACING
    const venueTypesElement = document.getElementById('profileVenueTypes');
    if (venueTypesElement) {
        if (profile.venueTypes && profile.venueTypes.length > 0) {
            venueTypesElement.style.display = 'block';
            venueTypesElement.innerHTML = `
                <div class="venue-types-section">
                    <div class="section-header">
                        <i class="fas fa-map-pin"></i>
                        <h4>Venue Type</h4>
                    </div>
                    <div class="venue-tags-container">
                        ${profile.venueTypes.map(type => 
                            `<span class="venue-tag">${type}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            venueTypesElement.style.display = 'none';
        }
    }
    
    // Update social links - FIXED WHATSAPP AND EMAIL BEHAVIOR
    const socialElement = document.getElementById('profileSocial');
    if (socialElement) {
        if (profile.socialLinks && profile.socialLinks.length > 0) {
            // Only show links that have both platform and URL
            const validLinks = profile.socialLinks.filter(link => link && link.platform && link.url);
            
            if (validLinks.length > 0) {
                socialElement.innerHTML = `
                    <div class="social-section">
                        <div class="section-header">
                            <i class="fas fa-share-alt"></i>
                            <h4>Connect</h4>
                        </div>
                        <div class="social-icons-grid">
                            ${validLinks.map(link => {
                                const platform = getSocialPlatform(link.platform);
                                if (platform) {
                                    let displayValue = link.url;
                                    let clickHandler = '';
                                    
                                    // Handle WhatsApp - extract number for copying
                                    if (link.platform === 'whatsapp') {
                                        const number = link.url.replace(/\D/g, '');
                                        displayValue = `+${number}`;
                                        clickHandler = `onclick="copyToClipboard('${number}', 'WhatsApp number')"`;
                                    }
                                    // Handle Email - extract email for copying
                                    else if (link.platform === 'email') {
                                        const email = link.url.replace('mailto:', '');
                                        displayValue = email;
                                        clickHandler = `onclick="copyToClipboard('${email}', 'Email address')"`;
                                    }
                                    // Handle regular links
                                    else {
                                        return `
                                            <a href="${link.url}" target="_blank" class="social-icon-link" 
                                               style="background: ${platform.color + '15'};"
                                               title="${platform.name}">
                                                <i class="${platform.icon}" style="color: ${platform.color};"></i>
                                            </a>
                                        `;
                                    }
                                    
                                    // Return clickable icon for WhatsApp/Email that copies
                                    return `
                                        <div class="social-icon-copy" ${clickHandler}
                                             style="background: ${platform.color + '15'}; cursor: pointer;"
                                             title="Click to copy ${platform.name}">
                                            <i class="${platform.icon}" style="color: ${platform.color};"></i>
                                            <span class="copy-tooltip">Copy</span>
                                        </div>
                                    `;
                                }
                                return '';
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                socialElement.innerHTML = '';
            }
        } else {
            socialElement.innerHTML = '';
        }
    }
    
    // EVENTS STAT REMOVED - No longer displayed
    // The events stat section is completely removed
}

function getSocialPlatform(platformKey) {
    const socialPlatforms = {
        'whatsapp': { 
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp', 
            color: '#25D366' 
        },
        'email': { 
            name: 'Email',
            icon: 'fas fa-envelope', 
            color: '#EA4335' 
        },
        'instagram': { 
            name: 'Instagram',
            icon: 'fab fa-instagram', 
            color: '#E4405F' 
        },
        'facebook': { 
            name: 'Facebook',
            icon: 'fab fa-facebook', 
            color: '#1877F2' 
        },
        'twitter': { 
            name: 'Twitter',
            icon: 'fab fa-twitter', 
            color: '#1DA1F2' 
        },
        'tiktok': { 
            name: 'TikTok',
            icon: 'fab fa-tiktok', 
            color: '#000000' 
        },
        'linkedin': { 
            name: 'LinkedIn',
            icon: 'fab fa-linkedin', 
            color: '#0A66C2' 
        },
        'youtube': { 
            name: 'YouTube',
            icon: 'fab fa-youtube', 
            color: '#FF0000' 
        },
        'website': { 
            name: 'Website',
            icon: 'fas fa-globe', 
            color: '#6C63FF' 
        }
    };
    
    return socialPlatforms[platformKey];
}

// Global copy function
window.copyToClipboard = function(text, type) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${type} copied to clipboard!`, 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
};

function showEmptyProfile() {
    const profileName = document.getElementById('profileName');
    const profileLocation = document.getElementById('profileLocation');
    const profileBio = document.getElementById('profileBio');
    const profileTypes = document.getElementById('profileTypes');
    const profileVenueTypes = document.getElementById('profileVenueTypes');
    const profileSocial = document.getElementById('profileSocial');
    
    if (profileName) profileName.textContent = 'Complete Your Profile';
    if (profileLocation) profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Add your location';
    if (profileBio) {
        profileBio.innerHTML = '<p class="bio-placeholder">Click Edit Profile to get started!</p>';
    }
    if (profileTypes) profileTypes.innerHTML = '';
    if (profileVenueTypes) profileVenueTypes.style.display = 'none';
    if (profileSocial) profileSocial.innerHTML = '';
}

// ============================================
// UPCOMING EVENT FUNCTIONALITY
// ============================================

function checkUpcomingEvent() {
    console.log('Checking for upcoming events...');
    
    // Get events from localStorage
    const events = getEventsFromStorage();
    const upcomingNavItem = document.getElementById('upcomingEventNavItem');
    const upcomingEventText = document.getElementById('upcomingEventText');
    const upcomingEventBadge = document.getElementById('upcomingEventBadge');
    const calendarBadge = document.getElementById('calendarBadge');
    
    if (!upcomingNavItem || !upcomingEventText) return;
    
    // Find the next upcoming event
    const nextEvent = findNextEvent(events);
    
    if (nextEvent) {
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get event date at midnight
        const eventDate = new Date(nextEvent.date);
        eventDate.setHours(0, 0, 0, 0);
        
        // Calculate difference in days
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log('Today:', today.toDateString());
        console.log('Event Date:', eventDate.toDateString());
        console.log('Days until event:', diffDays);
        
        let eventDisplayText = '';
        let badgeText = '';
        
        if (diffDays === 0) {
            eventDisplayText = '🔔 Today!';
            badgeText = 'Today';
            upcomingNavItem.classList.add('event-today');
            if (upcomingEventBadge) {
                upcomingEventBadge.classList.add('event-today-badge');
            }
        } else if (diffDays === 1) {
            eventDisplayText = '📅 Tomorrow';
            badgeText = '1d';
            upcomingNavItem.classList.remove('event-today');
            if (upcomingEventBadge) {
                upcomingEventBadge.classList.remove('event-today-badge');
            }
        } else if (diffDays < 7) {
            eventDisplayText = `📅 In ${diffDays} days`;
            badgeText = `${diffDays}d`;
            upcomingNavItem.classList.remove('event-today');
            if (upcomingEventBadge) {
                upcomingEventBadge.classList.remove('event-today-badge');
            }
        } else {
            eventDisplayText = `📅 ${formatEventDate(eventDate)}`;
            badgeText = '';
            upcomingNavItem.classList.remove('event-today');
            if (upcomingEventBadge) {
                upcomingEventBadge.classList.remove('event-today-badge');
            }
        }
        
        // Update the nav item
        upcomingEventText.textContent = eventDisplayText;
        upcomingNavItem.classList.add('has-event');
        
        // Store the event ID for navigation
        upcomingNavItem.dataset.eventId = nextEvent.id;
        
        // Update badge if days are less than 7
        if (upcomingEventBadge && diffDays < 7 && diffDays > 0) {
            upcomingEventBadge.textContent = badgeText;
            upcomingEventBadge.style.display = 'inline-block';
        } else if (upcomingEventBadge) {
            upcomingEventBadge.style.display = 'none';
        }
        
        // Make the nav item clickable to go to the specific event
        upcomingNavItem.onclick = function(e) {
            e.preventDefault();
            goToCalendarEvent(nextEvent.id);
        };
        
        // Update calendar badge for events within 7 days
        if (calendarBadge) {
            if (diffDays <= 7) {
                calendarBadge.textContent = diffDays === 0 ? 'Today!' : `${diffDays}d`;
                calendarBadge.style.display = 'inline-block';
            } else {
                calendarBadge.style.display = 'none';
            }
        }
        
    } else {
        // No upcoming events
        upcomingEventText.textContent = 'No Events';
        upcomingNavItem.classList.remove('has-event', 'event-today');
        
        // Make nav item go to calendar to add event
        upcomingNavItem.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'calendar.html';
        };
        
        // Hide badge
        if (upcomingEventBadge) {
            upcomingEventBadge.style.display = 'none';
        }
        
        // Hide calendar badge
        if (calendarBadge) {
            calendarBadge.style.display = 'none';
        }
    }
}

function getEventsFromStorage() {
    try {
        const savedEvents = localStorage.getItem('vivoCalendarEvents');
        if (savedEvents) {
            return JSON.parse(savedEvents);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
    return [];
}

function findNextEvent(events) {
    if (!events || events.length === 0) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Filter for upcoming events (today or future)
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
    });
    
    if (upcomingEvents.length === 0) return null;
    
    // Sort by date (closest first)
    upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    return upcomingEvents[0]; // Return the closest event
}

function goToCalendarEvent(eventId) {
    // Store the event ID to highlight in calendar
    localStorage.setItem('highlightEventId', eventId);
    
    // Navigate to calendar
    window.location.href = 'calendar.html?highlight=' + eventId;
}

function formatEventDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#F56565' : '#6C63FF'};
        color: white;
        border-radius: 10px;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-family: inherit;
    `;
    
    document.body.appendChild(toast);
    
    // Add CSS animations if not already present
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0%); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Error saving data', 'error');
        return false;
    }
}

// ============================================
// DEBUG FUNCTIONS (available in console)
// ============================================

window.debugBooker = function() {
    console.log('=== DEBUG BOOKER ===');
    console.log('Booker Profile:', getFromLocalStorage('bookerProfile'));
    console.log('Current Profile:', getFromLocalStorage('currentProfile'));
    console.log('Vivo User:', getFromLocalStorage('vivoUser'));
    console.log('Calendar Events:', getEventsFromStorage());
    console.log('====================');
};