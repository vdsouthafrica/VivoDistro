// agent-hub.js - Agent Dashboard with WhatsApp/Email copy (COMPLETE WORKING VERSION)
document.addEventListener('DOMContentLoaded', function() {
    // Get Vivo ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const vivoId = urlParams.get('vivoId');
    
    // Load profile
    loadProfile(vivoId);
    
    // Check for upcoming events
    checkUpcomingEvent();
    
    // Set up storage event listener
    window.addEventListener('storage', function(e) {
        if (e.key === 'vivoCalendarEvents' || e.key === 'agentProfile' || e.key === 'currentProfile') {
            loadProfile(vivoId);
            checkUpcomingEvent();
        }
    });
});

function loadProfile(vivoId) {
    console.log('Loading agent profile...');
    
    let profile = null;
    
    // Try to load profile
    if (vivoId) {
        const saved = localStorage.getItem(`agentProfile_${vivoId}`);
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    if (!profile) {
        const saved = localStorage.getItem('agentProfile');
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    if (!profile) {
        const saved = localStorage.getItem('currentProfile');
        if (saved) {
            try {
                profile = JSON.parse(saved);
            } catch (e) {}
        }
    }
    
    if (profile) {
        console.log('Agent profile loaded:', profile);
        updateDashboard(profile);
    } else {
        console.log('No agent profile found');
        showEmptyProfile();
    }
}

function updateDashboard(profile) {
    console.log('Updating dashboard with profile:', profile);
    
    // Update profile picture
    const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar');
    avatarElements.forEach(element => {
        if (profile.logo) {
            element.innerHTML = `<img src="${profile.logo}" alt="Agency Logo" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            element.innerHTML = '<i class="fas fa-user-tie"></i>';
        }
    });
    
    // Update name
    const nameElements = document.querySelectorAll('#userName, #profileName');
    nameElements.forEach(element => {
        if (element) element.textContent = profile.name || 'Agency Name';
    });
    
    // Update location
    const locationElement = document.getElementById('profileLocation');
    if (locationElement) {
        locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location not set'}`;
    }
    
    // Update role
    const roleElement = document.getElementById('userRole');
    if (roleElement) {
        roleElement.textContent = 'Agent';
    }
    
    // Update bio
    const bioElement = document.getElementById('profileBio');
    if (bioElement) {
        if (profile.bio && profile.bio.trim()) {
            bioElement.innerHTML = `<p>${profile.bio}</p>`;
            bioElement.classList.remove('empty');
        } else {
            bioElement.innerHTML = '<p class="bio-placeholder">Add a bio to tell artists about your agency...</p>';
            bioElement.classList.add('empty');
        }
    }
    
    // Update contact info
    const contactElement = document.getElementById('profileContact');
    if (contactElement) {
        const contactHTML = [];
        
        if (profile.phone) {
            contactHTML.push(`
                <div class="contact-card">
                    <i class="fas fa-phone-alt"></i>
                    <span>${profile.phone}</span>
                </div>
            `);
        }
        
        if (profile.website) {
            const displayWebsite = profile.website.replace('https://', '').replace('http://', '');
            contactHTML.push(`
                <div class="contact-card">
                    <i class="fas fa-globe"></i>
                    <a href="${profile.website}" target="_blank">${displayWebsite}</a>
                </div>
            `);
        }
        
        if (contactHTML.length > 0) {
            contactElement.innerHTML = `<div class="contact-grid">${contactHTML.join('')}</div>`;
        } else {
            contactElement.innerHTML = '';
        }
    }
    
    // Update specialties
    const specialtiesElement = document.getElementById('profileSpecialties');
    if (specialtiesElement) {
        if (profile.specialties && profile.specialties.length > 0) {
            specialtiesElement.innerHTML = `
                <div class="specialties-section">
                    <div class="section-header">
                        <i class="fas fa-star"></i>
                        <h4>Specialties</h4>
                    </div>
                    <div class="specialties-tags">
                        ${profile.specialties.map(specialty => 
                            `<span class="specialty-tag">${specialty}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            specialtiesElement.innerHTML = '';
        }
    }
    
    // Update social links - WITH COPY FUNCTIONALITY
    const socialElement = document.getElementById('profileSocial');
    if (socialElement) {
        if (profile.socialLinks && profile.socialLinks.length > 0) {
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
                                    // Handle WhatsApp - copy number
                                    if (link.platform === 'whatsapp') {
                                        const number = link.url.replace(/\D/g, '');
                                        return `
                                            <div class="social-icon-copy" onclick="copyToClipboard('${number}', 'WhatsApp number')"
                                                 style="background: ${platform.color + '15'}; cursor: pointer;"
                                                 title="Click to copy WhatsApp number">
                                                <i class="${platform.icon}" style="color: ${platform.color};"></i>
                                                <span class="copy-tooltip">Copy</span>
                                            </div>
                                        `;
                                    }
                                    // Handle Email - copy email address
                                    else if (link.platform === 'email') {
                                        const email = link.url.replace('mailto:', '');
                                        return `
                                            <div class="social-icon-copy" onclick="copyToClipboard('${email}', 'Email address')"
                                                 style="background: ${platform.color + '15'}; cursor: pointer;"
                                                 title="Click to copy email address">
                                                <i class="${platform.icon}" style="color: ${platform.color};"></i>
                                                <span class="copy-tooltip">Copy</span>
                                            </div>
                                        `;
                                    }
                                    // Regular social links
                                    else {
                                        return `
                                            <a href="${link.url}" target="_blank" class="social-icon-link" 
                                               style="background: ${platform.color + '15'};"
                                               title="${platform.name}">
                                                <i class="${platform.icon}" style="color: ${platform.color};"></i>
                                            </a>
                                        `;
                                    }
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
    
    // Update artists count
    const artists = JSON.parse(localStorage.getItem('agentArtists')) || [];
    const artistsCount = document.getElementById('artistsCount');
    if (artistsCount) artistsCount.textContent = artists.length;
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
    const profileSpecialties = document.getElementById('profileSpecialties');
    const profileContact = document.getElementById('profileContact');
    const profileSocial = document.getElementById('profileSocial');
    const artistsCount = document.getElementById('artistsCount');
    
    if (profileName) profileName.textContent = 'Complete Your Profile';
    if (profileLocation) profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Add your location';
    if (profileBio) {
        profileBio.innerHTML = '<p class="bio-placeholder">Click Edit Profile to get started!</p>';
    }
    if (profileSpecialties) profileSpecialties.innerHTML = '';
    if (profileContact) profileContact.innerHTML = '';
    if (profileSocial) profileSocial.innerHTML = '';
    if (artistsCount) artistsCount.textContent = '0';
}

// ============================================
// UPCOMING EVENT FUNCTIONALITY
// ============================================

function checkUpcomingEvent() {
    const events = getEventsFromStorage();
    const upcomingNavItem = document.getElementById('upcomingEventNavItem');
    const upcomingEventText = document.getElementById('upcomingEventText');
    const upcomingEventBadge = document.getElementById('upcomingEventBadge');
    const calendarBadge = document.getElementById('calendarBadge');
    
    if (!upcomingNavItem || !upcomingEventText) return;
    
    const nextEvent = findNextEvent(events);
    
    if (nextEvent) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventDate = new Date(nextEvent.date);
        eventDate.setHours(0, 0, 0, 0);
        
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
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
        
        upcomingEventText.textContent = eventDisplayText;
        upcomingNavItem.classList.add('has-event');
        upcomingNavItem.dataset.eventId = nextEvent.id;
        
        if (upcomingEventBadge && diffDays < 7 && diffDays > 0) {
            upcomingEventBadge.textContent = badgeText;
            upcomingEventBadge.style.display = 'inline-block';
        } else if (upcomingEventBadge) {
            upcomingEventBadge.style.display = 'none';
        }
        
        upcomingNavItem.onclick = function(e) {
            e.preventDefault();
            goToCalendarEvent(nextEvent.id);
        };
        
        if (calendarBadge) {
            if (diffDays <= 7) {
                calendarBadge.textContent = diffDays === 0 ? 'Today!' : `${diffDays}d`;
                calendarBadge.style.display = 'inline-block';
            } else {
                calendarBadge.style.display = 'none';
            }
        }
        
    } else {
        upcomingEventText.textContent = 'No Events';
        upcomingNavItem.classList.remove('has-event', 'event-today');
        
        upcomingNavItem.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'agent-calendar.html';
        };
        
        if (upcomingEventBadge) {
            upcomingEventBadge.style.display = 'none';
        }
        
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
    
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
    });
    
    if (upcomingEvents.length === 0) return null;
    
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcomingEvents[0];
}

function goToCalendarEvent(eventId) {
    localStorage.setItem('highlightEventId', eventId);
    window.location.href = 'agent-calendar.html?highlight=' + eventId;
}

function formatEventDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Toast notification
function showToast(message, type = 'success') {
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
    `;
    
    document.body.appendChild(toast);
    
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

// Helper functions
function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}