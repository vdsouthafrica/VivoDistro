// performer-edit.js - COMPLETE WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    const supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);

    // Global variables
    window.selectedInstruments = [];
    let currentProfile = null;
    let profileImageData = null;

    // Social media platforms
    const socialPlatforms = {
        'instagram': { name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
        'facebook': { name: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2' },
        'twitter': { name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
        'tiktok': { name: 'TikTok', icon: 'fab fa-tiktok', color: '#000000' },
        'youtube': { name: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000' },
        'spotify': { name: 'Spotify', icon: 'fab fa-spotify', color: '#1DB954' },
        'soundcloud': { name: 'SoundCloud', icon: 'fab fa-soundcloud', color: '#FF3300' },
        'website': { name: 'Website', icon: 'fas fa-globe', color: '#6C63FF' }
    };

    // Load profile on page start
    loadProfile();

    async function loadProfile() {
        console.log('Loading profile...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'signup.html.';
            return;
        }

        // Fetch profile from Supabase
        const { data: profile, error } = await supabase
            .from('performers')
            .select('*')
            .eq('auth_id', user.id)
            .single();

        if (error) {
            console.error('Error loading profile:', error);
            return;
        }

        if (profile) {
            currentProfile = profile;
            console.log('Profile loaded:', profile);

            // Fill in basic info
            document.getElementById('editName').value = profile.name || '';
            document.getElementById('editLocation').value = profile.location || '';
            document.getElementById('editBio').value = profile.bio || '';

            // Set performer types
            if (profile.types && profile.types.length > 0) {
                document.querySelectorAll('input[name="type"]').forEach(cb => {
                    cb.checked = profile.types.includes(cb.value);
                    if (cb.value === 'Instrumentalist' && cb.checked) {
                        document.getElementById('instrumentContainer').style.display = 'block';
                    }
                });
            }

            // Set instruments
            if (profile.instruments && profile.instruments.length > 0) {
                window.selectedInstruments = profile.instruments;
                updateInstrumentsDisplay();
            }

            // Set profile picture
            if (profile.image_url) {
                const avatarPreview = document.getElementById('editAvatarPreview');
                avatarPreview.innerHTML = `
                    <img src="${profile.image_url}" alt="Profile" style="width:100%; height:100%; object-fit:cover;">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Photo</span>
                    </div>
                `;
                profileImageData = profile.image_url;
            }

            // Set social links
            if (profile.social_links && profile.social_links.length > 0) {
                profile.social_links.forEach(link => {
                    addSocialInput(link.platform, link.url);
                });
            }
        }

        // Update UI
        updateBioCharCount();
        updatePreview();
    }

    // ========== PROFILE PICTURE UPLOAD ==========
    const avatarPreview = document.getElementById('editAvatarPreview');
    const avatarInput = document.getElementById('editAvatar');

    if (avatarPreview) {
        avatarPreview.addEventListener('click', () => avatarInput.click());
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match('image.*')) {
                showToast('Please select an image file', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                showToast('File size must be less than 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.innerHTML = `
                    <img src="${e.target.result}" alt="Profile" style="width:100%; height:100%; object-fit:cover;">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Photo</span>
                    </div>
                `;
                profileImageData = e.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    // ========== PERFORMER TYPE SELECTION ==========
    document.querySelectorAll('input[name="type"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.value === 'Instrumentalist') {
                document.getElementById('instrumentContainer').style.display = 
                    this.checked ? 'block' : 'none';
            }
            updatePreview();
        });
    });

    // ========== INSTRUMENT INPUT ==========
    const instrumentInput = document.getElementById('instrumentInput');
    if (instrumentInput) {
        instrumentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const instrument = this.value.trim();
                if (instrument && !window.selectedInstruments.includes(instrument)) {
                    window.selectedInstruments.push(instrument);
                    this.value = '';
                    updateInstrumentsDisplay();
                    updatePreview();
                }
            }
        });
    }

    function updateInstrumentsDisplay() {
        const container = document.getElementById('selectedInstruments');
        if (!container) return;

        if (window.selectedInstruments.length > 0) {
            container.innerHTML = window.selectedInstruments.map((instrument, index) => `
                <span class="instrument-tag" style="background:rgba(108,99,255,0.15); color:#6C63FF; padding:5px 12px; border-radius:20px; margin:0 5px 5px 0; display:inline-block;">
                    ${instrument}
                    <button onclick="removeInstrument(${index})" style="background:none; border:none; color:#6C63FF; margin-left:5px; cursor:pointer;">×</button>
                </span>
            `).join('');
        } else {
            container.innerHTML = '';
        }
    }

    window.removeInstrument = function(index) {
        window.selectedInstruments.splice(index, 1);
        updateInstrumentsDisplay();
        updatePreview();
    };

    // ========== SOCIAL MEDIA INPUTS ==========
    const socialInputs = document.getElementById('socialInputs');
    const addSocialBtn = document.getElementById('addSocialBtn');

    if (addSocialBtn) {
        addSocialBtn.addEventListener('click', () => addSocialInput());
    }

    function addSocialInput(platform = '', url = '') {
        const row = document.createElement('div');
        row.className = 'social-input-row';
        row.style.cssText = 'display:flex; gap:10px; margin-bottom:10px; align-items:center;';

        // Platform select
        const select = document.createElement('select');
        select.className = 'social-select';
        select.style.cssText = 'flex:1; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;';
        select.innerHTML = '<option value="">Select Platform</option>';
        
        Object.entries(socialPlatforms).forEach(([key, data]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = data.name;
            if (platform === key) option.selected = true;
            select.appendChild(option);
        });

        // URL input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'social-url';
        input.placeholder = 'URL';
        input.value = url;
        input.style.cssText = 'flex:2; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;';

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.cssText = 'width:40px; height:40px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#F56565; cursor:pointer;';
        removeBtn.onclick = function() {
            row.remove();
            updatePreview();
        };

        row.appendChild(select);
        row.appendChild(input);
        row.appendChild(removeBtn);
        socialInputs.appendChild(row);

        select.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
    }

    // ========== BIO CHARACTER COUNT ==========
    const bioField = document.getElementById('editBio');
    const charCount = document.getElementById('bioChars');

    if (bioField && charCount) {
        bioField.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            if (count > 500) {
                charCount.style.color = '#F56565';
                this.value = this.value.substring(0, 500);
                charCount.textContent = 500;
            } else if (count > 450) {
                charCount.style.color = '#ED8936';
            } else {
                charCount.style.color = '#8892b0';
            }
        });
    }

    // ========== PREVIEW UPDATE ==========
    function updatePreview() {
        // Basic info
        document.getElementById('previewName').textContent = 
            document.getElementById('editName').value || 'Stage Name';
        
        document.getElementById('previewLocation').innerHTML = 
            `<i class="fas fa-map-marker-alt"></i> ${document.getElementById('editLocation').value || 'Location'}`;

        // Bio
        const previewBio = document.getElementById('previewBio');
        const bio = document.getElementById('editBio').value;
        if (bio) {
            previewBio.innerHTML = `<p>${bio}</p>`;
            previewBio.classList.remove('empty');
        } else {
            previewBio.innerHTML = '<p class="bio-placeholder">No bio added yet</p>';
            previewBio.classList.add('empty');
        }

        // Types
        const selectedTypes = [];
        document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
            selectedTypes.push(cb.value);
        });
        
        document.getElementById('previewTypes').innerHTML = 
            selectedTypes.map(type => `<span class="preview-type">${type}</span>`).join('');

        // Instruments
        const previewInstruments = document.getElementById('previewInstruments');
        if (window.selectedInstruments.length > 0) {
            previewInstruments.style.display = 'block';
            previewInstruments.innerHTML = window.selectedInstruments.map(instrument => 
                `<span class="preview-instrument-tag">${instrument}</span>`
            ).join('');
        } else {
            previewInstruments.style.display = 'none';
        }

        // Social links
        const socialLinks = [];
        document.querySelectorAll('.social-input-row').forEach(row => {
            const select = row.querySelector('select');
            const input = row.querySelector('input');
            if (select && select.value && input && input.value) {
                socialLinks.push({ platform: select.value, url: input.value });
            }
        });

        const previewSocial = document.getElementById('previewSocial');
        if (socialLinks.length > 0) {
            previewSocial.innerHTML = socialLinks.map(link => {
                const platform = socialPlatforms[link.platform];
                if (platform) {
                    return `<a href="${link.url}" target="_blank" class="social-icon-preview" 
                        style="background:${platform.color}20; color:${platform.color}; width:40px; height:40px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 5px; text-decoration:none;">
                        <i class="${platform.icon}"></i>
                    </a>`;
                }
                return '';
            }).join('');
        } else {
            previewSocial.innerHTML = '';
        }

        // Avatar
        if (profileImageData) {
            document.getElementById('previewAvatar').innerHTML = 
                `<img src="${profileImageData}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    }

    // ========== INPUT LISTENERS FOR PREVIEW ==========
    document.getElementById('editName').addEventListener('input', updatePreview);
    document.getElementById('editLocation').addEventListener('input', updatePreview);
    document.getElementById('editBio').addEventListener('input', updatePreview);

    // ========== FORM SUBMISSION ==========
    document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('editName').value.trim();
        const location = document.getElementById('editLocation').value.trim();

        if (!name || !location) {
            showToast('Name and location are required', 'error');
            return;
        }

        // Get selected types
        const selectedTypes = [];
        document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
            selectedTypes.push(cb.value);
        });

        if (selectedTypes.length === 0) {
            showToast('Please select at least one performer type', 'error');
            return;
        }

        // Get social links
        const socialLinks = [];
        document.querySelectorAll('.social-input-row').forEach(row => {
            const select = row.querySelector('select');
            const input = row.querySelector('input');
            if (select && select.value && input && input.value) {
                socialLinks.push({ platform: select.value, url: input.value });
            }
        });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'signup.html';
            return;
        }

        // Disable submit button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        // Update profile in Supabase
        const { error } = await supabase
            .from('performers')
            .update({
                name: name,
                location: location,
                types: selectedTypes,
                instruments: window.selectedInstruments || [],
                bio: document.getElementById('editBio').value || '',
                image_url: profileImageData || '',
                social_links: socialLinks,
                updated_at: new Date().toISOString()
            })
            .eq('auth_id', user.id);

        if (error) {
            console.error('Error saving:', error);
            showToast('Error saving profile: ' + error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } else {
            showToast('Profile updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'performer-hub.html';
            }, 1500);
        }
    });

    // ========== TOAST FUNCTION ==========
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#48BB78' : '#F56565'};
            color: white;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});