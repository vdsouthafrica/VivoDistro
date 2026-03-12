// performer-hub.js - Load profile from Supabase
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    const supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Load profile
    loadProfile();
    
    // Check for upcoming events
    checkUpcomingEvent();
    
    async function loadProfile() {
        console.log('Loading performer profile from Supabase...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.log('No user logged in');
            showEmptyProfile();
            return;
        }
        
        // Fetch profile from performers table
        const { data: profile, error } = await supabase
            .from('performers')
            .select('*')
            .eq('auth_id', user.id)
            .single();
        
        if (error) {
            console.error('Error loading profile:', error);
            showEmptyProfile();
            return;
        }
        
        if (profile) {
            console.log('Profile loaded:', profile);
            updateDashboard(profile);
        } else {
            console.log('No profile found');
            showEmptyProfile();
        }
    }
    
    function updateDashboard(profile) {
        // Update profile picture
        const avatarElements = document.querySelectorAll('#userAvatar, #profileAvatar');
        avatarElements.forEach(element => {
            if (profile.image_url) {
                element.innerHTML = `<img src="${profile.image_url}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                element.innerHTML = '<i class="fas fa-user"></i>';
            }
        });
        
        // Update name
        const nameElements = document.querySelectorAll('#userName, #profileName');
        nameElements.forEach(element => {
            if (element) element.textContent = profile.name || 'Stage Name';
        });
        
        // Update location
        const locationElement = document.getElementById('profileLocation');
        if (locationElement) {
            locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profile.location || 'Location not set'}`;
        }
        
        // Update role
        const roleElement = document.getElementById('userRole');
        if (roleElement) {
            roleElement.textContent = 'Performer';
        }
        
        // Update bio
        const bioElement = document.getElementById('profileBio');
        if (bioElement) {
            if (profile.bio && profile.bio.trim()) {
                bioElement.innerHTML = `<p>${profile.bio}</p>`;
                bioElement.classList.remove('empty');
            } else {
                bioElement.innerHTML = '<p class="bio-placeholder">Add a bio to tell people about yourself...</p>';
                bioElement.classList.add('empty');
            }
        }
        
        // Update types
        const typesElement = document.getElementById('profileTypes');
        if (typesElement && profile.types && profile.types.length > 0) {
            typesElement.innerHTML = profile.types.map(type => 
                `<span class="type-badge">${type}</span>`
            ).join('');
        }
        
        // Update instruments
        const instrumentsElement = document.getElementById('profileInstruments');
        if (instrumentsElement && profile.instruments && profile.instruments.length > 0) {
            instrumentsElement.style.display = 'block';
            instrumentsElement.innerHTML = `
                <div class="instruments-section">
                    <div class="section-header">
                        <i class="fas fa-guitar"></i>
                        <h4>Instruments</h4>
                    </div>
                    <div class="instruments-tags">
                        ${profile.instruments.map(instrument => 
                            `<span class="instrument-tag">${instrument}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        // Update fans count
        const fansElement = document.querySelector('.stat-number');
        if (fansElement) {
            fansElement.textContent = profile.fans || '0';
        }
    }
    
    function showEmptyProfile() {
        const profileName = document.getElementById('profileName');
        const profileLocation = document.getElementById('profileLocation');
        const profileBio = document.getElementById('profileBio');
        const profileTypes = document.getElementById('profileTypes');
        const profileInstruments = document.getElementById('profileInstruments');
        
        if (profileName) profileName.textContent = 'Complete Your Profile';
        if (profileLocation) profileLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Add your location';
        if (profileBio) {
            profileBio.innerHTML = '<p class="bio-placeholder">Click Edit Profile to get started!</p>';
        }
        if (profileTypes) profileTypes.innerHTML = '';
        if (profileInstruments) profileInstruments.style.display = 'none';
    }
    
    function checkUpcomingEvent() {
        // Keep your existing upcoming event function
        console.log('Checking for upcoming events...');
    }
});