// agent-artist-edit.js - Edit Artist Profile (Full featured like performer edit)
document.addEventListener('DOMContentLoaded', function() {
    // Load the artist being edited
    const editingData = getFromLocalStorage('editingArtist');
    
    if (!editingData) {
        showToast('No artist selected for editing', 'error');
        setTimeout(() => {
            window.location.href = 'agent-artists.html';
        }, 2000);
        return;
    }
    
    console.log('Editing artist:', editingData);
    
    // Load the artist from agentArtists array
    const artists = getFromLocalStorage('agentArtists') || [];
    const artistIndex = editingData.index;
    const artist = artists[artistIndex];
    
    if (!artist) {
        showToast('Artist not found', 'error');
        setTimeout(() => {
            window.location.href = 'agent-artists.html';
        }, 2000);
        return;
    }
    
    // Store current artist data
    window.currentArtistIndex = artistIndex;
    window.currentArtist = artist;
    
    // Initialize form with artist data
    initializeForm(artist);
    
    // Setup real-time preview
    setupPreview(artist);
    
    // Setup social media inputs
    setupSocialInputs(artist);
    
    // Setup instrument input if needed
    setupInstrumentInput(artist);
    
    // Setup delete functionality
    setupDeleteFunctionality(artist);
    
    // Setup phone formatting
    setupPhoneFormatting();
    
    // Handle form submission
    const form = document.getElementById('editArtistForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSubmit(artistIndex);
        });
    }
});

// Social media platforms - WITH WHATSAPP AND EMAIL
const socialPlatforms = {
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
        placeholder: 'mailto:artist@gmail.com'
    },
    'instagram': {
        name: 'Instagram',
        icon: 'fab fa-instagram',
        urlPattern: 'instagram.com',
        color: '#E4405F',
        placeholder: 'https://instagram.com/artist'
    },
    'facebook': {
        name: 'Facebook',
        icon: 'fab fa-facebook',
        urlPattern: 'facebook.com',
        color: '#1877F2',
        placeholder: 'https://facebook.com/artist'
    },
    'twitter': {
        name: 'Twitter',
        icon: 'fab fa-twitter',
        urlPattern: 'twitter.com',
        color: '#1DA1F2',
        placeholder: 'https://twitter.com/artist'
    },
    'tiktok': {
        name: 'TikTok',
        icon: 'fab fa-tiktok',
        urlPattern: 'tiktok.com',
        color: '#000000',
        placeholder: 'https://tiktok.com/@artist'
    },
    'youtube': {
        name: 'YouTube',
        icon: 'fab fa-youtube',
        urlPattern: 'youtube.com',
        color: '#FF0000',
        placeholder: 'https://youtube.com/@artist'
    },
    'spotify': {
        name: 'Spotify',
        icon: 'fab fa-spotify',
        urlPattern: 'spotify.com',
        color: '#1DB954',
        placeholder: 'https://open.spotify.com/artist/...'
    },
    'soundcloud': {
        name: 'SoundCloud',
        icon: 'fab fa-soundcloud',
        urlPattern: 'soundcloud.com',
        color: '#FF3300',
        placeholder: 'https://soundcloud.com/artist'
    },
    'website': {
        name: 'Website',
        icon: 'fas fa-globe',
        urlPattern: '',
        color: '#6C63FF',
        placeholder: 'https://artistwebsite.com'
    }
};

function initializeForm(artist) {
    console.log('Initializing form with artist:', artist);
    
    // Set basic info
    const nameField = document.getElementById('editName');
    const locationField = document.getElementById('editLocation');
    const bioField = document.getElementById('editBio');
    const phoneField = document.getElementById('editPhone');
    const emailField = document.getElementById('editEmail');
    const websiteField = document.getElementById('editWebsite');
    
    if (nameField) nameField.value = artist.name || '';
    if (locationField) locationField.value = artist.location || '';
    if (bioField) bioField.value = artist.bio || '';
    if (phoneField) phoneField.value = artist.phone || '';
    if (emailField) emailField.value = artist.email || '';
    if (websiteField) websiteField.value = artist.website || '';
    
    // Update bio character count
    updateBioCharCount();
    
    // Set performer types (checkboxes)
    const typeCheckboxes = document.querySelectorAll('input[name="type"]');
    if (artist.types && artist.types.length > 0) {
        console.log('Setting types:', artist.types);
        typeCheckboxes.forEach(checkbox => {
            checkbox.checked = artist.types.includes(checkbox.value);
        });
    }
    
    // Check if instrumentalist is selected to show instrument input
    if (artist.types && artist.types.includes('Instrumentalist')) {
        const instrumentContainer = document.getElementById('instrumentContainer');
        if (instrumentContainer) {
            instrumentContainer.style.display = 'block';
        }
    }
    
    // Store instruments in window for access
    window.selectedInstruments = artist.instruments || [];
    
    // Set profile picture
    const avatarPreview = document.getElementById('editAvatarPreview');
    const previewAvatar = document.getElementById('previewAvatar');
    
    if (artist.image && avatarPreview) {
        console.log('Setting artist image:', artist.image);
        avatarPreview.innerHTML = `
            <img src="${artist.image}" alt="Artist Profile">
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Change Photo</span>
            </div>
        `;
        
        if (previewAvatar) {
            previewAvatar.innerHTML = `<img src="${artist.image}" alt="Artist Profile">`;
        }
    } else if (avatarPreview) {
        avatarPreview.innerHTML = `
            <i class="fas fa-user"></i>
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Upload Photo</span>
            </div>
        `;
    }
    
    // Setup image upload
    const avatarInput = document.getElementById('editAvatar');
    if (avatarInput && avatarPreview) {
        avatarPreview.addEventListener('click', () => {
            console.log('Clicking file input');
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', function(e) {
            console.log('File selected');
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
                console.log('Image loaded');
                avatarPreview.innerHTML = `
                    <img src="${e.target.result}" alt="Artist Profile">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Photo</span>
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
    if (emailField) emailField.addEventListener('input', updatePreview);
    if (websiteField) websiteField.addEventListener('input', updatePreview);
    
    typeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Show/hide instrument input based on Instrumentalist selection
            if (this.value === 'Instrumentalist') {
                const instrumentContainer = document.getElementById('instrumentContainer');
                if (instrumentContainer) {
                    instrumentContainer.style.display = this.checked ? 'block' : 'none';
                }
            }
            updatePreview();
        });
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

function setupInstrumentInput(artist) {
    const instrumentInput = document.getElementById('instrumentInput');
    const selectedInstruments = document.getElementById('selectedInstruments');
    
    if (!instrumentInput || !selectedInstruments) return;
    
    // Display existing instruments
    updateInstrumentsDisplay();
    
    // Add instrument on Enter key
    instrumentInput.addEventListener('keydown', function(e) {
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
    
    // Also add on blur
    instrumentInput.addEventListener('blur', function() {
        const instrument = this.value.trim();
        if (instrument && !window.selectedInstruments.includes(instrument)) {
            window.selectedInstruments.push(instrument);
            this.value = '';
            updateInstrumentsDisplay();
            updatePreview();
        }
    });
}

function updateInstrumentsDisplay() {
    const container = document.getElementById('selectedInstruments');
    if (!container) return;
    
    if (window.selectedInstruments && window.selectedInstruments.length > 0) {
        container.innerHTML = window.selectedInstruments.map((instrument, index) => `
            <div class="instrument-tag">
                ${instrument}
                <button type="button" class="remove-instrument" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Add remove handlers
        container.querySelectorAll('.remove-instrument').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                window.selectedInstruments.splice(index, 1);
                updateInstrumentsDisplay();
                updatePreview();
            });
        });
    } else {
        container.innerHTML = '';
    }
}

function setupSocialInputs(artist) {
    const socialInputs = document.getElementById('socialInputs');
    const addBtn = document.getElementById('addSocialBtn');
    
    if (!socialInputs) {
        console.error('Social inputs container not found');
        return;
    }
    
    console.log('Setting up social inputs with:', artist.socialLinks);
    
    // Clear existing inputs
    socialInputs.innerHTML = '';
    
    // Load existing social links
    if (artist.socialLinks && artist.socialLinks.length > 0) {
        artist.socialLinks.forEach(link => {
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
        ${Object.entries(socialPlatforms).map(([key, data]) => `
            <option value="${key}" ${platform === key ? 'selected' : ''}>${data.name}</option>
        `).join('')}
    `;
    
    // URL input with dynamic placeholder
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'social-url';
    urlInput.placeholder = socialPlatforms[platform]?.placeholder || 'https://...';
    urlInput.value = url;
    
    // Update placeholder when platform changes
    select.addEventListener('change', function() {
        const selectedPlatform = socialPlatforms[this.value];
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
            const platform = socialPlatforms[platformKey];
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

function setupPreview(initialArtist) {
    // Initial preview setup
    updatePreview();
}

function updatePreview() {
    console.log('Updating preview...');
    
    // Get form values
    const name = document.getElementById('editName')?.value || '';
    const location = document.getElementById('editLocation')?.value || '';
    const bio = document.getElementById('editBio')?.value || '';
    const phone = document.getElementById('editPhone')?.value || '';
    const email = document.getElementById('editEmail')?.value || '';
    const website = document.getElementById('editWebsite')?.value || '';
    
    // Get selected types
    const selectedTypes = [];
    document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
        selectedTypes.push(cb.value);
    });
    
    // Get profile image
    const avatarPreview = document.getElementById('editAvatarPreview');
    const img = avatarPreview?.querySelector('img');
    const imgSrc = img?.src;
    
    // Get instruments
    const instruments = window.selectedInstruments || [];
    
    console.log('Preview data:', { name, location, bio, selectedTypes, instruments, hasImage: !!imgSrc });
    
    // Update preview avatar
    const previewAvatar = document.getElementById('previewAvatar');
    if (previewAvatar) {
        if (imgSrc) {
            previewAvatar.innerHTML = `<img src="${imgSrc}" alt="Artist Profile">`;
        } else {
            if (window.currentArtist?.image) {
                previewAvatar.innerHTML = `<img src="${window.currentArtist.image}" alt="Artist Profile">`;
            } else {
                previewAvatar.innerHTML = '<i class="fas fa-user"></i>';
            }
        }
    }
    
    // Update preview name and location
    const previewName = document.getElementById('previewName');
    const previewLocation = document.getElementById('previewLocation');
    
    if (previewName) {
        previewName.textContent = name || 'Artist Name';
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
            if (window.currentArtist?.bio) {
                previewBio.innerHTML = `<p>${window.currentArtist.bio}</p>`;
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
        
        if (email) {
            contactHTML.push(`
                <div class="contact-card">
                    <i class="fas fa-envelope"></i>
                    <span>${email}</span>
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
            previewContact.innerHTML = contactHTML.join('');
        } else {
            previewContact.innerHTML = '';
        }
    }
    
    // Update preview types
    const previewTypes = document.getElementById('previewTypes');
    if (previewTypes) {
        if (selectedTypes.length > 0) {
            previewTypes.innerHTML = selectedTypes.map(type => 
                `<span class="preview-type">${type}</span>`
            ).join('');
        } else {
            if (window.currentArtist?.types && window.currentArtist.types.length > 0) {
                previewTypes.innerHTML = window.currentArtist.types.map(type => 
                    `<span class="preview-type">${type}</span>`
                ).join('');
            } else {
                previewTypes.innerHTML = '<span class="preview-type">Performer</span>';
            }
        }
    }
    
    // Update preview instruments
    const previewInstruments = document.getElementById('previewInstruments');
    if (previewInstruments) {
        if (instruments.length > 0) {
            previewInstruments.style.display = 'block';
            previewInstruments.innerHTML = `
                <div class="instruments-section">
                    <h4>Instruments</h4>
                    <div>
                        ${instruments.map(instrument => 
                            `<span class="preview-instrument-tag">${instrument}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        } else {
            if (window.currentArtist?.instruments && window.currentArtist.instruments.length > 0) {
                previewInstruments.style.display = 'block';
                previewInstruments.innerHTML = `
                    <div class="instruments-section">
                        <h4>Instruments</h4>
                        <div>
                            ${window.currentArtist.instruments.map(instrument => 
                                `<span class="preview-instrument-tag">${instrument}</span>`
                            ).join('')}
                        </div>
                    </div>
                `;
            } else {
                previewInstruments.style.display = 'none';
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
                    const platform = socialPlatforms[link.platform];
                    if (platform) {
                        // Handle WhatsApp and Email differently
                        if (link.platform === 'whatsapp' || link.platform === 'email') {
                            let displayValue = link.platform === 'whatsapp' 
                                ? link.url.replace(/\D/g, '')
                                : link.url.replace('mailto:', '');
                            return `
                                <div class="social-icon-preview" 
                                     style="background: ${platform.color + '20'}; color: ${platform.color}; cursor: pointer;"
                                     onclick="copyToClipboard('${displayValue}', '${platform.name}')"
                                     title="Click to copy ${platform.name}">
                                    <i class="${platform.icon}"></i>
                                </div>
                            `;
                        } else {
                            return `
                                <a href="${link.url}" target="_blank" class="social-icon-preview" 
                                   style="background: ${platform.color + '20'}; color: ${platform.color}"
                                   title="${platform.name}">
                                    <i class="${platform.icon}"></i>
                                </a>
                            `;
                        }
                    }
                    return '';
                }).join('');
            } else {
                previewSocial.innerHTML = '<p style="color: var(--gray-light); font-size: 0.9rem;">No social links added</p>';
            }
        } else {
            if (window.currentArtist?.socialLinks && window.currentArtist.socialLinks.length > 0) {
                previewSocial.innerHTML = window.currentArtist.socialLinks.map(link => {
                    const platform = socialPlatforms[link.platform];
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

function handleSubmit(artistIndex) {
    console.log('Form submitted for artist index:', artistIndex);
    
    // Get form values
    const name = document.getElementById('editName')?.value.trim();
    const location = document.getElementById('editLocation')?.value.trim();
    const bio = document.getElementById('editBio')?.value.trim();
    const phone = document.getElementById('editPhone')?.value.trim();
    const email = document.getElementById('editEmail')?.value.trim();
    const website = document.getElementById('editWebsite')?.value.trim();
    
    // Validate required fields
    if (!name) {
        showToast('Stage name is required', 'error');
        return;
    }
    
    if (!location) {
        showToast('Location is required', 'error');
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
    
    // Get profile image
    const avatarPreview = document.getElementById('editAvatarPreview');
    const img = avatarPreview?.querySelector('img');
    let image = img?.src || '';
    
    // If no new image, use existing one
    if (!image && window.currentArtist?.image) {
        image = window.currentArtist.image;
    }
    
    // Get social links
    const socialLinks = getSocialLinksFromForm();
    
    // Get instruments
    const instruments = window.selectedInstruments || [];
    
    console.log('Saving artist:', { name, location, selectedTypes, bio, phone, email, website, socialLinks, instruments });
    
    // Get existing artists array
    const artists = getFromLocalStorage('agentArtists') || [];
    
    // Update the artist at the specified index
    if (artists[artistIndex]) {
        artists[artistIndex] = {
            ...artists[artistIndex],
            name,
            location,
            types: selectedTypes,
            image,
            bio,
            phone: phone || '',
            email: email || '',
            website: website || '',
            socialLinks,
            instruments,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        saveToLocalStorage('agentArtists', artists);
        
        console.log('Artist updated in localStorage:', artists[artistIndex]);
        
        // Show success message
        showToast('Artist profile updated successfully!', 'success');
        
        // Redirect back to artists page after delay
        setTimeout(() => {
            window.location.href = 'agent-artists.html';
        }, 1500);
    } else {
        showToast('Artist not found', 'error');
    }
}

function setupDeleteFunctionality(artist) {
    const deleteBtn = document.getElementById('deleteArtistBtn');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const deleteArtistName = document.getElementById('deleteArtistName');
    
    if (!deleteBtn || !deleteModal) return;
    
    // Set artist name in confirmation modal
    if (deleteArtistName && artist.name) {
        deleteArtistName.textContent = artist.name;
    }
    
    // Open delete confirmation modal
    deleteBtn.addEventListener('click', function() {
        deleteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close delete modal
    if (closeDeleteBtn) {
        closeDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteArtist(window.currentArtistIndex);
        });
    }
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
        deleteModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function deleteArtist(artistIndex) {
    console.log('Deleting artist at index:', artistIndex);
    
    // Get existing artists array
    const artists = getFromLocalStorage('agentArtists') || [];
    
    if (artists[artistIndex]) {
        // Remove the artist from the array
        artists.splice(artistIndex, 1);
        
        // Save updated array to localStorage
        saveToLocalStorage('agentArtists', artists);
        
        // Close modal
        closeDeleteModal();
        
        // Show success message
        showToast('Artist removed from roster', 'success');
        
        // Redirect back to artists page
        setTimeout(() => {
            window.location.href = 'agent-artists.html';
        }, 1500);
    } else {
        showToast('Artist not found', 'error');
        closeDeleteModal();
    }
}

// Global copy function
window.copyToClipboard = function(text, type) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${type} copied to clipboard!`, 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
};

// ==================== HELPER FUNCTIONS ====================

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
        background: ${type === 'success' ? '#48BB78' : 
                    type === 'error' ? '#F56565' : 
                    type === 'info' ? '#6C63FF' : '#48BB78'};
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