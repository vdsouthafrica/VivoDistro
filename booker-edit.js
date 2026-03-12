// booker-edit.js - Booker Profile Edit (COMPLETE FIXED VERSION)
document.addEventListener('DOMContentLoaded', function() {
    // Load existing booker profile
    const profile = getFromLocalStorage('bookerProfile') || {
        name: '',
        location: '',
        email: '',
        phone: '',
        website: '',
        logo: '',
        bio: '',
        types: [],
        venueTypes: [],
        socialLinks: []
    };
    
    console.log('Loaded booker profile:', profile);
    
    // Initialize form with existing data
    initializeForm(profile);
    
    // Setup real-time preview
    setupPreview(profile);
    
    // Setup social media inputs
    setupSocialInputs(profile);
    
    // Setup email input
    setupEmailInput(profile);
    
    // Setup venue types
    setupVenueTypes(profile);
    
    // Setup phone formatting
    setupPhoneFormatting();
    
    // Handle form submission
    const form = document.getElementById('editBookerForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// Social media platforms for bookers
const bookerSocialPlatforms = {
    'whatsapp': {
        name: 'WhatsApp',
        icon: 'fab fa-whatsapp',
        urlPattern: 'wa.me',
        color: '#25D366',
        placeholder: 'https://wa.me/27821234567'
    },
    'email': {
        name: 'Email',
        icon: 'fas fa-envelope',
        urlPattern: 'mailto:',
        color: '#EA4335',
        placeholder: 'mailto:your.email@gmail.com'
    },
    'instagram': {
        name: 'Instagram',
        icon: 'fab fa-instagram',
        urlPattern: 'instagram.com',
        color: '#E4405F',
        placeholder: 'https://instagram.com/yourprofile'
    },
    'facebook': {
        name: 'Facebook',
        icon: 'fab fa-facebook',
        urlPattern: 'facebook.com',
        color: '#1877F2',
        placeholder: 'https://facebook.com/yourpage'
    },
    'twitter': {
        name: 'Twitter',
        icon: 'fab fa-twitter',
        urlPattern: 'twitter.com',
        color: '#1DA1F2',
        placeholder: 'https://twitter.com/yourhandle'
    },
    'tiktok': {
        name: 'TikTok',
        icon: 'fab fa-tiktok',
        urlPattern: 'tiktok.com',
        color: '#000000',
        placeholder: 'https://tiktok.com/@username'
    },
    'linkedin': {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin',
        urlPattern: 'linkedin.com',
        color: '#0A66C2',
        placeholder: 'https://linkedin.com/company/yourcompany'
    },
    'youtube': {
        name: 'YouTube',
        icon: 'fab fa-youtube',
        urlPattern: 'youtube.com',
        color: '#FF0000',
        placeholder: 'https://youtube.com/@yourchannel'
    },
    'website': {
        name: 'Website',
        icon: 'fas fa-globe',
        urlPattern: '',
        color: '#6C63FF',
        placeholder: 'https://yourvenue.com'
    }
};

function initializeForm(profile) {
    console.log('Initializing booker form with:', profile);
    
    // Set basic info
    const nameField = document.getElementById('editName');
    const locationField = document.getElementById('editLocation');
    const bioField = document.getElementById('editBio');
    const phoneField = document.getElementById('editPhone');
    const websiteField = document.getElementById('editWebsite');
    
    if (nameField) nameField.value = profile.name || '';
    if (locationField) locationField.value = profile.location || '';
    if (bioField) bioField.value = profile.bio || '';
    if (phoneField) phoneField.value = profile.phone || '';
    if (websiteField) websiteField.value = profile.website || '';
    
    // Update bio character count
    updateBioCharCount();
    
    // Set business types
    const typeCheckboxes = document.querySelectorAll('input[name="type"]');
    if (profile.types && profile.types.length > 0) {
        console.log('Setting business types:', profile.types);
        typeCheckboxes.forEach(checkbox => {
            checkbox.checked = profile.types.includes(checkbox.value);
            
            // Show venue type container if venue-related type is selected
            if (checkbox.value === 'Venue Owner' || checkbox.value === 'Club Manager' || 
                checkbox.value === 'Restaurant Owner' || checkbox.value === 'Hotel Events') {
                if (checkbox.checked) {
                    document.getElementById('venueTypeContainer').style.display = 'block';
                }
            }
        });
    }
    
    // Set business logo
    const logoPreview = document.getElementById('editAvatarPreview');
    const previewAvatar = document.getElementById('previewAvatar');
    
    if (profile.logo && logoPreview) {
        console.log('Setting business logo:', profile.logo);
        logoPreview.innerHTML = `
            <img src="${profile.logo}" alt="Business Logo">
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Change Logo</span>
            </div>
        `;
        
        if (previewAvatar) {
            previewAvatar.innerHTML = `<img src="${profile.logo}" alt="Business Logo">`;
        }
    } else if (logoPreview) {
        logoPreview.innerHTML = `
            <i class="fas fa-building"></i>
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Upload Logo</span>
            </div>
        `;
    }
    
    // Setup logo upload
    const logoInput = document.getElementById('editAvatar');
    if (logoInput && logoPreview) {
        logoPreview.addEventListener('click', () => {
            console.log('Clicking logo file input');
            logoInput.click();
        });
        
        logoInput.addEventListener('change', function(e) {
            console.log('Logo file selected');
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file
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
                console.log('Logo image loaded');
                logoPreview.innerHTML = `
                    <img src="${e.target.result}" alt="Business Logo">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Logo</span>
                    </div>
                `;
                
                // Update preview
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Bio character count
    if (bioField) {
        bioField.addEventListener('input', updateBioCharCount);
    }
    
    // Update preview on input changes
    if (nameField) nameField.addEventListener('input', updatePreview);
    if (locationField) locationField.addEventListener('input', updatePreview);
    if (bioField) bioField.addEventListener('input', updatePreview);
    if (phoneField) phoneField.addEventListener('input', updatePreview);
    if (websiteField) websiteField.addEventListener('input', updatePreview);
    
    typeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Show/hide venue type container
            if (this.value === 'Venue Owner' || this.value === 'Club Manager' || 
                this.value === 'Restaurant Owner' || this.value === 'Hotel Events') {
                const container = document.getElementById('venueTypeContainer');
                if (this.checked) {
                    container.style.display = 'block';
                } else {
                    // Check if any venue-related types are still selected
                    const venueRelatedTypes = ['Venue Owner', 'Club Manager', 'Restaurant Owner', 'Hotel Events'];
                    const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
                    const hasVenueType = Array.from(typeCheckboxes).some(cb => 
                        venueRelatedTypes.includes(cb.value)
                    );
                    if (!hasVenueType) {
                        container.style.display = 'none';
                    }
                }
            }
            updatePreview();
        });
    });
}

function setupEmailInput(profile) {
    const emailPrefixInput = document.getElementById('emailPrefix');
    const emailHiddenInput = document.getElementById('email');
    
    if (emailPrefixInput && emailHiddenInput) {
        // If we have an existing email, extract the prefix
        if (profile.email) {
            const fullEmail = profile.email;
            if (fullEmail.includes('@')) {
                const atIndex = fullEmail.indexOf('@');
                const prefix = fullEmail.substring(0, atIndex);
                emailPrefixInput.value = prefix;
                emailHiddenInput.value = fullEmail;
            } else {
                emailPrefixInput.value = fullEmail;
                emailHiddenInput.value = fullEmail + '@gmail.com';
            }
        }
        
        // Update hidden field on input
        emailPrefixInput.addEventListener('input', function() {
            const emailPrefix = this.value.trim();
            if (emailPrefix) {
                emailHiddenInput.value = emailPrefix + '@gmail.com';
            } else {
                emailHiddenInput.value = '';
            }
            updatePreview();
        });
        
        // Prevent typing @ symbol
        emailPrefixInput.addEventListener('keydown', function(e) {
            if (e.key === '@') {
                e.preventDefault();
            }
        });
        
        // Handle pasted full email
        emailPrefixInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (pastedText.includes('@')) {
                const prefix = pastedText.split('@')[0];
                this.value = prefix;
            } else {
                this.value = pastedText;
            }
            emailHiddenInput.value = this.value.trim() + '@gmail.com';
            updatePreview();
        });
    }
}

function setupPhoneFormatting() {
    const phoneInput = document.getElementById('editPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.substring(0, 3) + ' ' + value.substring(3);
                } else {
                    value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6, 10);
                }
            }
            
            e.target.value = value;
        });
    }
}

function setupVenueTypes(profile) {
    const venueTypeInput = document.getElementById('venueTypeInput');
    const selectedVenueTypes = document.getElementById('selectedVenueTypes');
    
    if (!venueTypeInput || !selectedVenueTypes) return;
    
    // Load existing venue types
    if (profile.venueTypes && profile.venueTypes.length > 0) {
        profile.venueTypes.forEach(venueType => {
            addVenueTypeTag(venueType);
        });
    }
    
    // Add new venue type on Enter
    venueTypeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const venueType = this.value.trim();
            
            if (venueType && !isVenueTypeDuplicate(venueType)) {
                addVenueTypeTag(venueType);
                this.value = '';
                updatePreview();
            }
        }
    });
    
    // Add venue type on blur (if there's content)
    venueTypeInput.addEventListener('blur', function() {
        const venueType = this.value.trim();
        if (venueType && !isVenueTypeDuplicate(venueType)) {
            addVenueTypeTag(venueType);
            this.value = '';
            updatePreview();
        }
    });
}

function addVenueTypeTag(venueType) {
    const selectedVenueTypes = document.getElementById('selectedVenueTypes');
    if (!selectedVenueTypes) return;
    
    const tag = document.createElement('div');
    tag.className = 'venue-type-tag';
    tag.innerHTML = `
        ${venueType}
        <button type="button" class="remove-venue-type">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = tag.querySelector('.remove-venue-type');
    removeBtn.addEventListener('click', function() {
        tag.remove();
        updatePreview();
    });
    
    selectedVenueTypes.appendChild(tag);
}

function isVenueTypeDuplicate(venueType) {
    const selectedVenueTypes = document.getElementById('selectedVenueTypes');
    if (!selectedVenueTypes) return false;
    
    const existingTags = selectedVenueTypes.querySelectorAll('.venue-type-tag');
    for (const tag of existingTags) {
        if (tag.textContent.includes(venueType)) {
            return true;
        }
    }
    return false;
}

function getSelectedVenueTypes() {
    const selectedVenueTypes = document.getElementById('selectedVenueTypes');
    if (!selectedVenueTypes) return [];
    
    const venueTypes = [];
    const tags = selectedVenueTypes.querySelectorAll('.venue-type-tag');
    tags.forEach(tag => {
        const text = tag.textContent.replace('×', '').trim();
        if (text) venueTypes.push(text);
    });
    
    return venueTypes;
}

function setupSocialInputs(profile) {
    const socialInputs = document.getElementById('socialInputs');
    const addBtn = document.getElementById('addSocialBtn');
    
    if (!socialInputs) {
        console.error('Social inputs container not found');
        return;
    }
    
    console.log('Setting up social inputs with:', profile.socialLinks);
    
    // Clear existing inputs
    socialInputs.innerHTML = '';
    
    // Load existing social links
    if (profile.socialLinks && profile.socialLinks.length > 0) {
        profile.socialLinks.forEach(link => {
            addSocialInput(link.platform, link.url);
        });
    }
    
    // Add new social input button
    if (addBtn) {
        addBtn.addEventListener('click', () => addSocialInput());
    }
    
    // Update preview when social inputs change
    socialInputs.addEventListener('input', updatePreview);
    socialInputs.addEventListener('change', updatePreview);
}

function addSocialInput(platform = '', url = '') {
    const socialInputs = document.getElementById('socialInputs');
    if (!socialInputs) return;
    
    const row = document.createElement('div');
    row.className = 'social-input-row';
    
    // Platform select
    const select = document.createElement('select');
    select.className = 'social-select';
    select.innerHTML = `
        <option value="">Select Platform</option>
        ${Object.entries(bookerSocialPlatforms).map(([key, data]) => `
            <option value="${key}" ${platform === key ? 'selected' : ''}>${data.name}</option>
        `).join('')}
    `;
    
    // URL input with dynamic placeholder
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'social-url';
    urlInput.placeholder = bookerSocialPlatforms[platform]?.placeholder || 'https://...';
    urlInput.value = url;
    
    // Update placeholder when platform changes
    select.addEventListener('change', function() {
        const selectedPlatform = bookerSocialPlatforms[this.value];
        if (selectedPlatform) {
            urlInput.placeholder = selectedPlatform.placeholder;
        } else {
            urlInput.placeholder = 'https://...';
        }
    });
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-social';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function() {
        row.remove();
        updatePreview();
    });
    
    row.appendChild(select);
    row.appendChild(urlInput);
    row.appendChild(removeBtn);
    socialInputs.appendChild(row);
    
    // Validate URL on change
    urlInput.addEventListener('blur', function() {
        const platformKey = select.value;
        if (platformKey && this.value) {
            const platform = bookerSocialPlatforms[platformKey];
            if (platformKey === 'email') {
                if (!this.value.startsWith('mailto:')) {
                    showToast('Email should start with mailto:', 'error');
                }
            } else if (platformKey === 'whatsapp') {
                if (!this.value.includes('wa.me')) {
                    showToast('WhatsApp link should contain wa.me', 'error');
                }
            } else if (platform.urlPattern && !this.value.includes(platform.urlPattern)) {
                showToast(`URL should contain ${platform.urlPattern}`, 'error');
            }
        }
    });
    
    // Trigger preview update
    updatePreview();
}

function updateBioCharCount() {
    const bio = document.getElementById('editBio');
    const charCount = document.getElementById('bioChars');
    
    if (!bio || !charCount) return;
    
    const count = bio.value.length;
    charCount.textContent = count;
    
    if (count > 500) {
        charCount.style.color = 'var(--danger)';
        bio.value = bio.value.substring(0, 500);
        charCount.textContent = 500;
    } else if (count > 450) {
        charCount.style.color = 'var(--warning)';
    } else {
        charCount.style.color = 'var(--gray-light)';
    }
}

function setupPreview(initialProfile) {
    // Initial preview setup
    updatePreview();
}

function updatePreview() {
    console.log('Updating booker preview...');
    
    // Get form values
    const name = document.getElementById('editName')?.value || '';
    const location = document.getElementById('editLocation')?.value || '';
    const bio = document.getElementById('editBio')?.value || '';
    const phone = document.getElementById('editPhone')?.value || '';
    const website = document.getElementById('editWebsite')?.value || '';
    const emailHidden = document.getElementById('email')?.value || '';
    
    // Get selected business types
    const selectedTypes = [];
    document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
        selectedTypes.push(cb.value);
    });
    
    // Get venue types
    const venueTypes = getSelectedVenueTypes();
    
    // Get logo image
    const logoPreview = document.getElementById('editAvatarPreview');
    const img = logoPreview?.querySelector('img');
    const imgSrc = img?.src;
    
    console.log('Booker preview data:', { 
        name, location, bio, phone, website, email: emailHidden,
        selectedTypes, venueTypes, hasImage: !!imgSrc 
    });
    
    // Update preview avatar
    const previewAvatar = document.getElementById('previewAvatar');
    if (previewAvatar) {
        if (imgSrc) {
            previewAvatar.innerHTML = `<img src="${imgSrc}" alt="Business Logo">`;
        } else {
            const profile = getFromLocalStorage('bookerProfile');
            if (profile?.logo) {
                previewAvatar.innerHTML = `<img src="${profile.logo}" alt="Business Logo">`;
            } else {
                previewAvatar.innerHTML = '<i class="fas fa-building"></i>';
            }
        }
    }
    
    // Update preview name and location
    const previewName = document.getElementById('previewName');
    const previewLocation = document.getElementById('previewLocation');
    
    if (previewName) {
        previewName.textContent = name || 'Business Name';
    }
    
    if (previewLocation) {
        previewLocation.innerHTML = `
            <i class="fas fa-map-marker-alt"></i> ${location || 'Location not set'}
        `;
    }
    
    // Update preview bio
    const previewBio = document.getElementById('previewBio');
    if (previewBio) {
        if (bio) {
            previewBio.textContent = bio;
            previewBio.classList.remove('empty');
        } else {
            const profile = getFromLocalStorage('bookerProfile');
            if (profile?.bio) {
                previewBio.textContent = profile.bio;
                previewBio.classList.remove('empty');
            } else {
                previewBio.textContent = 'No bio added yet';
                previewBio.classList.add('empty');
            }
        }
    }
    
    // Update preview business types
    const previewTypes = document.getElementById('previewTypes');
    if (previewTypes) {
        if (selectedTypes.length > 0) {
            previewTypes.innerHTML = selectedTypes.map(type => 
                `<span class="preview-type">${type}</span>`
            ).join('');
        } else {
            const profile = getFromLocalStorage('bookerProfile');
            if (profile?.types && profile.types.length > 0) {
                previewTypes.innerHTML = profile.types.map(type => 
                    `<span class="preview-type">${type}</span>`
                ).join('');
            } else {
                previewTypes.innerHTML = '<span class="preview-type">Booker</span>';
            }
        }
    }
    
    // Update preview venue types
    const previewVenueTypes = document.getElementById('previewVenueTypes');
    if (previewVenueTypes) {
        if (venueTypes.length > 0) {
            previewVenueTypes.innerHTML = venueTypes.map(type => 
                `<span class="preview-venue-type-tag">${type}</span>`
            ).join('');
            previewVenueTypes.style.display = 'block';
        } else {
            previewVenueTypes.style.display = 'none';
        }
    }
    
    // Update preview social links
    const previewSocial = document.getElementById('previewSocial');
    if (previewSocial) {
        const socialLinks = getSocialLinksFromForm();
        
        console.log('Social links from form:', socialLinks);
        
        if (socialLinks.length > 0) {
            previewSocial.innerHTML = socialLinks.map(link => {
                const platform = bookerSocialPlatforms[link.platform];
                if (platform) {
                    return `
                        <a href="${link.url}" target="_blank" class="social-icon-preview" 
                           style="background: ${platform.color + '20'}; color: ${platform.color}">
                            <i class="${platform.icon}"></i>
                        </a>
                    `;
                }
                return '';
            }).join('');
        } else {
            const profile = getFromLocalStorage('bookerProfile');
            if (profile?.socialLinks && profile.socialLinks.length > 0) {
                previewSocial.innerHTML = profile.socialLinks.map(link => {
                    const platform = bookerSocialPlatforms[link.platform];
                    if (platform) {
                        return `
                            <a href="${link.url}" target="_blank" class="social-icon-preview" 
                               style="background: ${platform.color + '20'}; color: ${platform.color}">
                                <i class="${platform.icon}"></i>
                            </a>
                        `;
                    }
                    return '';
                }).join('');
            } else {
                previewSocial.innerHTML = '<p style="color: var(--gray-light); font-size: 0.9rem;">No social links added</p>';
            }
        }
    }
}

function getSocialLinksFromForm() {
    const socialLinks = [];
    const rows = document.querySelectorAll('.social-input-row');
    
    rows.forEach(row => {
        const select = row.querySelector('.social-select');
        const urlInput = row.querySelector('.social-url');
        
        if (select && urlInput) {
            const platform = select.value;
            const url = urlInput.value.trim();
            
            if (platform && url) {
                socialLinks.push({ platform, url });
            }
        }
    });
    
    return socialLinks;
}

function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Booker form submitted');
    
    // Get form values
    const name = document.getElementById('editName')?.value.trim();
    const location = document.getElementById('editLocation')?.value.trim();
    const bio = document.getElementById('editBio')?.value.trim();
    const phone = document.getElementById('editPhone')?.value.trim();
    const website = document.getElementById('editWebsite')?.value.trim();
    const email = document.getElementById('email')?.value.trim(); // Optional now
    
    // Validate required fields
    if (!name) {
        showToast('Business name is required', 'error');
        return;
    }
    
    if (!location) {
        showToast('Location is required', 'error');
        return;
    }
    
    // EMAIL VALIDATION REMOVED - IT'S NOW OPTIONAL
    
    // Get selected business types
    const selectedTypes = [];
    document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
        selectedTypes.push(cb.value);
    });
    
    if (selectedTypes.length === 0) {
        showToast('Please select at least one business type', 'error');
        return;
    }
    
    // Get venue types
    const venueTypes = getSelectedVenueTypes();
    
    // Check if venue type is required but not provided
    const venueRelatedTypes = ['Venue Owner', 'Club Manager', 'Restaurant Owner', 'Hotel Events'];
    const hasVenueType = selectedTypes.some(type => venueRelatedTypes.includes(type));
    if (hasVenueType && venueTypes.length === 0) {
        showToast('Please add at least one venue type', 'error');
        document.getElementById('venueTypeInput').focus();
        return;
    }
    
    // Get business logo
    const logoPreview = document.getElementById('editAvatarPreview');
    const img = logoPreview?.querySelector('img');
    let logo = img?.src || '';
    
    // If no new logo, use existing one from localStorage
    if (!logo) {
        const profile = getFromLocalStorage('bookerProfile');
        logo = profile?.logo || '';
    }
    
    // Get social links
    const socialLinks = getSocialLinksFromForm();
    
    console.log('Saving booker profile:', { 
        name, location, selectedTypes, venueTypes, bio, phone, website, email, socialLinks 
    });
    
    // Get existing profile to preserve other data
    const existingProfile = getFromLocalStorage('bookerProfile') || {};
    
    // Create updated profile
    const updatedProfile = {
        ...existingProfile,
        name,
        location,
        email: email || '', // Allow empty email
        phone: phone || '',
        website: website || '',
        logo,
        bio,
        types: selectedTypes,
        venueTypes,
        socialLinks,
        updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveToLocalStorage('bookerProfile', updatedProfile);
    
    console.log('Booker profile saved to localStorage:', updatedProfile);
    
    // Show success message
    showToast('Booker profile updated successfully!', 'success');
    
    // Redirect back to hub after delay
    setTimeout(() => {
        window.location.href = 'booker-hub.html';
    }, 1500);
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

function showToast(message, type = 'success') {
    console.log(`Toast [${type}]:`, message);
    
    // Remove any existing toasts
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
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toast);
    
    // Add CSS animations if not already present
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
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
    }
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}