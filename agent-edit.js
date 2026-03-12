// agent-edit.js - Agent Profile Edit (COMPLETE WORKING VERSION)
document.addEventListener('DOMContentLoaded', function() {
    // Load existing agent profile
    const profile = getFromLocalStorage('agentProfile') || {
        name: '',
        location: '',
        email: '',
        phone: '',
        website: '',
        logo: '',
        bio: '',
        specialties: [],
        socialLinks: []
    };
    
    console.log('Loaded agent profile:', profile);
    
    // Initialize form with existing data
    initializeForm(profile);
    
    // Setup real-time preview
    setupPreview(profile);
    
    // Setup social media inputs
    setupSocialInputs(profile);
    
    // Setup phone formatting
    setupPhoneFormatting();
    
    // Handle form submission
    const form = document.getElementById('editAgentForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// Social media platforms for agents - WITH WHATSAPP AND EMAIL
const agentSocialPlatforms = {
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
        placeholder: 'mailto:youragency@gmail.com'
    },
    'instagram': {
        name: 'Instagram',
        icon: 'fab fa-instagram',
        urlPattern: 'instagram.com',
        color: '#E4405F',
        placeholder: 'https://instagram.com/youragency'
    },
    'facebook': {
        name: 'Facebook',
        icon: 'fab fa-facebook',
        urlPattern: 'facebook.com',
        color: '#1877F2',
        placeholder: 'https://facebook.com/youragency'
    },
    'twitter': {
        name: 'Twitter',
        icon: 'fab fa-twitter',
        urlPattern: 'twitter.com',
        color: '#1DA1F2',
        placeholder: 'https://twitter.com/youragency'
    },
    'tiktok': {
        name: 'TikTok',
        icon: 'fab fa-tiktok',
        urlPattern: 'tiktok.com',
        color: '#000000',
        placeholder: 'https://tiktok.com/@youragency'
    },
    'linkedin': {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin',
        urlPattern: 'linkedin.com',
        color: '#0A66C2',
        placeholder: 'https://linkedin.com/company/youragency'
    },
    'youtube': {
        name: 'YouTube',
        icon: 'fab fa-youtube',
        urlPattern: 'youtube.com',
        color: '#FF0000',
        placeholder: 'https://youtube.com/@youragency'
    },
    'website': {
        name: 'Website',
        icon: 'fas fa-globe',
        urlPattern: '',
        color: '#6C63FF',
        placeholder: 'https://youragency.com'
    }
};

function initializeForm(profile) {
    console.log('Initializing agent form with:', profile);
    
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
    
    // Set specialties
    const specialtyCheckboxes = document.querySelectorAll('input[name="specialty"]');
    if (profile.specialties && profile.specialties.length > 0) {
        console.log('Setting specialties:', profile.specialties);
        specialtyCheckboxes.forEach(checkbox => {
            checkbox.checked = profile.specialties.includes(checkbox.value);
        });
    }
    
    // Set agency logo
    const logoPreview = document.getElementById('editLogoPreview');
    const previewAvatar = document.getElementById('previewAvatar');
    
    if (profile.logo && logoPreview) {
        console.log('Setting agency logo:', profile.logo);
        logoPreview.innerHTML = `
            <img src="${profile.logo}" alt="Agency Logo">
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Change Logo</span>
            </div>
        `;
        
        if (previewAvatar) {
            previewAvatar.innerHTML = `<img src="${profile.logo}" alt="Agency Logo">`;
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
    const logoInput = document.getElementById('editLogo');
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
                    <img src="${e.target.result}" alt="Agency Logo">
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
    
    specialtyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePreview);
    });
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
        ${Object.entries(agentSocialPlatforms).map(([key, data]) => `
            <option value="${key}" ${platform === key ? 'selected' : ''}>${data.name}</option>
        `).join('')}
    `;
    
    // URL input with dynamic placeholder
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'social-url';
    urlInput.placeholder = agentSocialPlatforms[platform]?.placeholder || 'https://...';
    urlInput.value = url;
    
    // Update placeholder when platform changes
    select.addEventListener('change', function() {
        const selectedPlatform = agentSocialPlatforms[this.value];
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
            const platform = agentSocialPlatforms[platformKey];
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
    console.log('Updating agent preview...');
    
    // Get form values
    const name = document.getElementById('editName')?.value || '';
    const location = document.getElementById('editLocation')?.value || '';
    const bio = document.getElementById('editBio')?.value || '';
    const phone = document.getElementById('editPhone')?.value || '';
    const website = document.getElementById('editWebsite')?.value || '';
    
    // Get selected specialties
    const selectedSpecialties = [];
    document.querySelectorAll('input[name="specialty"]:checked').forEach(cb => {
        selectedSpecialties.push(cb.value);
    });
    
    // Get logo image
    const logoPreview = document.getElementById('editLogoPreview');
    const img = logoPreview?.querySelector('img');
    const imgSrc = img?.src;
    
    console.log('Agent preview data:', { 
        name, location, bio, phone, website,
        selectedSpecialties, hasImage: !!imgSrc 
    });
    
    // Update preview avatar
    const previewAvatar = document.getElementById('previewAvatar');
    if (previewAvatar) {
        if (imgSrc) {
            previewAvatar.innerHTML = `<img src="${imgSrc}" alt="Agency Logo">`;
        } else {
            const profile = getFromLocalStorage('agentProfile');
            if (profile?.logo) {
                previewAvatar.innerHTML = `<img src="${profile.logo}" alt="Agency Logo">`;
            } else {
                previewAvatar.innerHTML = '<i class="fas fa-user-tie"></i>';
            }
        }
    }
    
    // Update preview name and location
    const previewName = document.getElementById('previewName');
    const previewLocation = document.getElementById('previewLocation');
    
    if (previewName) {
        previewName.textContent = name || 'Agency Name';
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
            previewBio.innerHTML = `<p>${bio}</p>`;
            previewBio.classList.remove('empty');
        } else {
            const profile = getFromLocalStorage('agentProfile');
            if (profile?.bio) {
                previewBio.innerHTML = `<p>${profile.bio}</p>`;
                previewBio.classList.remove('empty');
            } else {
                previewBio.innerHTML = '<p class="bio-placeholder">No bio added yet</p>';
                previewBio.classList.add('empty');
            }
        }
    }
    
    // Update preview contact
    const previewContact = document.getElementById('previewContact');
    if (previewContact) {
        const contactHTML = [];
        
        if (phone) {
            contactHTML.push(`
                <div class="contact-card">
                    <i class="fas fa-phone-alt"></i>
                    <span>${phone}</span>
                </div>
            `);
        }
        
        if (website) {
            const displayWebsite = website.replace('https://', '').replace('http://', '');
            contactHTML.push(`
                <div class="contact-card">
                    <i class="fas fa-globe"></i>
                    <a href="${website}" target="_blank">${displayWebsite}</a>
                </div>
            `);
        }
        
        if (contactHTML.length > 0) {
            previewContact.innerHTML = `<div class="contact-grid">${contactHTML.join('')}</div>`;
        } else {
            previewContact.innerHTML = '';
        }
    }
    
    // Update preview specialties
    const previewTypes = document.getElementById('previewTypes');
    if (previewTypes) {
        if (selectedSpecialties.length > 0) {
            previewTypes.innerHTML = selectedSpecialties.map(specialty => 
                `<span class="preview-type">${specialty}</span>`
            ).join('');
        } else {
            const profile = getFromLocalStorage('agentProfile');
            if (profile?.specialties && profile.specialties.length > 0) {
                previewTypes.innerHTML = profile.specialties.map(specialty => 
                    `<span class="preview-type">${specialty}</span>`
                ).join('');
            } else {
                previewTypes.innerHTML = '<span class="preview-type">Agent</span>';
            }
        }
    }
    
    // Update preview social links
    const previewSocial = document.getElementById('previewSocial');
    if (previewSocial) {
        const socialLinks = getSocialLinksFromForm();
        
        console.log('Social links from form:', socialLinks);
        
        if (socialLinks.length > 0) {
            const validLinks = socialLinks.filter(link => link && link.platform && link.url);
            
            if (validLinks.length > 0) {
                previewSocial.innerHTML = validLinks.map(link => {
                    const platform = agentSocialPlatforms[link.platform];
                    if (platform) {
                        return `
                            <a href="${link.url}" target="_blank" class="social-icon-preview" 
                               style="background: ${platform.color + '20'}; color: ${platform.color}"
                               title="${platform.name}">
                                <i class="${platform.icon}"></i>
                            </a>
                        `;
                    }
                    return '';
                }).join('');
            } else {
                previewSocial.innerHTML = '';
            }
        } else {
            const profile = getFromLocalStorage('agentProfile');
            if (profile?.socialLinks && profile.socialLinks.length > 0) {
                previewSocial.innerHTML = profile.socialLinks.map(link => {
                    const platform = agentSocialPlatforms[link.platform];
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
                previewSocial.innerHTML = '';
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
    
    console.log('Agent form submitted');
    
    // Get form values
    const name = document.getElementById('editName')?.value.trim();
    const location = document.getElementById('editLocation')?.value.trim();
    const bio = document.getElementById('editBio')?.value.trim();
    const phone = document.getElementById('editPhone')?.value.trim();
    const website = document.getElementById('editWebsite')?.value.trim();
    
    // Validate required fields
    if (!name) {
        showToast('Agency name is required', 'error');
        return;
    }
    
    if (!location) {
        showToast('Location is required', 'error');
        return;
    }
    
    // Get selected specialties
    const selectedSpecialties = [];
    document.querySelectorAll('input[name="specialty"]:checked').forEach(cb => {
        selectedSpecialties.push(cb.value);
    });
    
    // Get agency logo
    const logoPreview = document.getElementById('editLogoPreview');
    const img = logoPreview?.querySelector('img');
    let logo = img?.src || '';
    
    // If no new logo, use existing one from localStorage
    if (!logo) {
        const profile = getFromLocalStorage('agentProfile');
        logo = profile?.logo || '';
    }
    
    // Get social links
    const socialLinks = getSocialLinksFromForm();
    
    console.log('Saving agent profile:', { 
        name, location, selectedSpecialties, bio, phone, website, socialLinks 
    });
    
    // Get existing profile to preserve other data
    const existingProfile = getFromLocalStorage('agentProfile') || {};
    
    // Create updated profile
    const updatedProfile = {
        ...existingProfile,
        name,
        location,
        phone: phone || '',
        website: website || '',
        logo,
        bio,
        specialties: selectedSpecialties,
        socialLinks,
        updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveToLocalStorage('agentProfile', updatedProfile);
    
    console.log('Agent profile saved to localStorage:', updatedProfile);
    
    // Show success message
    showToast('Agent profile updated successfully!', 'success');
    
    // Redirect back to hub after delay
    setTimeout(() => {
        window.location.href = 'agent-hub.html';
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