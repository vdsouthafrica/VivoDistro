// agent-artists.js - My Artists Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Agent Artists page loaded');
    
    // Load and display artists
    loadArtists();
    
    // Setup modal functionality
    setupModal();
    
    // Setup form submission
    setupForm();
    
    // Setup image upload
    setupImageUpload();
});

function loadArtists() {
    console.log('Loading artists...');
    const artistsGrid = document.getElementById('artistsGrid');
    const artists = getFromLocalStorage('agentArtists') || [];
    
    console.log('Found artists:', artists);
    
    // Clear grid
    artistsGrid.innerHTML = '';
    
    if (artists.length === 0) {
        // Show empty state
        artistsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Artists Yet</h3>
                <p>Add your first artist by clicking the "+" box below</p>
            </div>
        `;
    } else {
        // Display artists
        artists.forEach((artist, index) => {
            console.log('Creating card for artist:', artist);
            const artistCard = createArtistCard(artist, index);
            artistsGrid.appendChild(artistCard);
        });
    }
}

function createArtistCard(artist, index) {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.dataset.index = index;
    
    // Get initials for avatar if no image
    let avatarContent = '<i class="fas fa-user"></i>';
    if (artist.image) {
        avatarContent = `<img src="${artist.image}" alt="${artist.name}">`;
    }
    
    // Generate types HTML
    let typesHTML = '';
    if (artist.types && artist.types.length > 0) {
        typesHTML = artist.types.map(type => 
            `<span class="artist-type-tag">${type}</span>`
        ).join('');
    } else if (artist.type) { // Backward compatibility
        typesHTML = `<span class="artist-type-tag">${artist.type}</span>`;
    } else {
        typesHTML = '<span class="no-types">No types specified</span>';
    }
    
    // Generate social links HTML
    let socialHTML = '';
    if (artist.socialLinks && artist.socialLinks.length > 0) {
        // Social platforms with their icons and colors
        const socialPlatforms = {
            'instagram': { icon: 'fab fa-instagram', color: '#E4405F' },
            'facebook': { icon: 'fab fa-facebook', color: '#1877F2' },
            'twitter': { icon: 'fab fa-twitter', color: '#1DA1F2' },
            'tiktok': { icon: 'fab fa-tiktok', color: '#000000' },
            'youtube': { icon: 'fab fa-youtube', color: '#FF0000' },
            'spotify': { icon: 'fab fa-spotify', color: '#1DB954' },
            'soundcloud': { icon: 'fab fa-soundcloud', color: '#FF3300' },
            'apple-music': { icon: 'fab fa-apple', color: '#FA243C' },
            'website': { icon: 'fas fa-globe', color: '#6C63FF' }
        };
        
        socialHTML = artist.socialLinks.map(link => {
            const platform = socialPlatforms[link.platform];
            if (platform) {
                return `<a href="${link.url}" target="_blank" class="social-link-icon" 
                         style="background: ${platform.color + '20'}; color: ${platform.color}">
                    <i class="${platform.icon}"></i>
                </a>`;
            }
            return `<a href="${link.url}" target="_blank" class="social-link-icon">
                <i class="fas fa-link"></i>
            </a>`;
        }).join('');
    } else {
        socialHTML = '<span class="no-social">No social links</span>';
    }
    
    card.innerHTML = `
        <div class="artist-card-header">
            <div class="artist-avatar">
                ${avatarContent}
            </div>
            <div class="artist-info">
                <h3>${artist.name || 'Unnamed Artist'}</h3>
                <div class="artist-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${artist.location || 'Location not set'}
                </div>
            </div>
        </div>
        
        <div class="artist-card-body">
            <div class="artist-types">
                ${typesHTML}
            </div>
            <div class="artist-social-links">
                ${socialHTML}
            </div>
        </div>
        
        <div class="artist-card-footer">
            <button class="edit-artist-btn" data-index="${index}">
                <i class="fas fa-edit"></i> Edit Profile
            </button>
        </div>
    `;
    
    // Add event listener to edit button
    const editBtn = card.querySelector('.edit-artist-btn');
    editBtn.addEventListener('click', function() {
        editArtist(index);
    });
    
    return card;
}

function setupModal() {
    console.log('Setting up modal...');
    
    const addArtistBox = document.getElementById('addArtistBox');
    const modal = document.getElementById('addArtistModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelAdd');
    
    if (!addArtistBox) {
        console.error('Add artist box not found!');
        return;
    }
    
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Open modal when clicking add artist box
    addArtistBox.addEventListener('click', function(e) {
        console.log('Add artist box clicked');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
    
    // Close modal buttons
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('addArtistModal');
    const form = document.getElementById('addArtistForm');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
    
    if (form) {
        form.reset();
        
        // Uncheck all checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // Reset image preview
    const preview = document.getElementById('artistProfilePreview');
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-user"></i>
            <div class="upload-overlay">
                <i class="fas fa-camera"></i>
                <span>Upload Photo</span>
            </div>
        `;
    }
    
    // Clear errors
    clearErrors();
}

function setupForm() {
    console.log('Setting up form...');
    
    const form = document.getElementById('addArtistForm');
    if (!form) {
        console.error('Add artist form not found!');
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        if (validateForm()) {
            addArtist();
        }
    });
}

function validateForm() {
    let isValid = true;
    clearErrors();
    
    const name = document.getElementById('artistName');
    const location = document.getElementById('artistLocation');
    const typeCheckboxes = document.querySelectorAll('input[name="artistType"]:checked');
    
    // Validate name
    if (!name || !name.value.trim()) {
        showError('nameError', 'Stage name is required');
        isValid = false;
    }
    
    // Validate location
    if (!location || !location.value.trim()) {
        showError('locationError', 'Location is required');
        isValid = false;
    }
    
    // Validate at least one type selected
    if (typeCheckboxes.length === 0) {
        showError('typeError', 'Please select at least one performer type');
        isValid = false;
    }
    
    return isValid;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => {
        if (error) {
            error.textContent = '';
            error.style.display = 'none';
        }
    });
}

function setupImageUpload() {
    console.log('Setting up image upload...');
    
    const imageInput = document.getElementById('artistProfileImage');
    const preview = document.getElementById('artistProfilePreview');
    
    if (!preview) {
        console.error('Profile preview not found!');
        return;
    }
    
    if (!imageInput) {
        console.error('Image input not found!');
        return;
    }
    
    // Click preview to open file selector
    preview.addEventListener('click', function() {
        console.log('Profile preview clicked');
        imageInput.click();
    });
    
    // Handle file selection
    imageInput.addEventListener('change', function(e) {
        console.log('File selected');
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
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
            console.log('File loaded successfully');
            if (preview.querySelector('img')) {
                preview.querySelector('img').src = e.target.result;
            } else {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Profile">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Photo</span>
                    </div>
                `;
            }
        };
        reader.onerror = function() {
            console.error('Error reading file');
            showToast('Error loading image', 'error');
        };
        reader.readAsDataURL(file);
    });
}

function addArtist() {
    console.log('Adding artist...');
    
    const name = document.getElementById('artistName').value.trim();
    const location = document.getElementById('artistLocation').value.trim();
    const typeCheckboxes = document.querySelectorAll('input[name="artistType"]:checked');
    const types = Array.from(typeCheckboxes).map(cb => cb.value);
    const preview = document.getElementById('artistProfilePreview');
    const image = preview.querySelector('img')?.src || '';
    
    console.log('Artist data:', { name, location, types, hasImage: !!image });
    
    // Get existing artists
    const artists = getFromLocalStorage('agentArtists') || [];
    
    // Create new artist object
    const newArtist = {
        id: Date.now(), // Unique ID
        name,
        location,
        types, // Array of types
        image,
        createdAt: new Date().toISOString(),
        bio: '',
        socialLinks: [],
        instruments: []
    };
    
    // Add to array
    artists.push(newArtist);
    
    // Save to localStorage
    saveToLocalStorage('agentArtists', artists);
    
    console.log('Artist saved:', newArtist);
    console.log('Total artists now:', artists.length);
    
    // Show success message
    showToast('Artist added successfully!', 'success');
    
    // Close modal
    closeModal();
    
    // Reload artists list
    setTimeout(() => {
        loadArtists();
    }, 500);
}

function editArtist(index) {
    console.log('Editing artist at index:', index);
    
    const artists = getFromLocalStorage('agentArtists') || [];
    if (artists[index]) {
        // Save the artist data temporarily for editing
        saveToLocalStorage('editingArtist', {
            ...artists[index],
            index: index
        });
        
        // Redirect to agent-artist-edit.html
        showToast('Redirecting to edit page...', 'info');
        setTimeout(() => {
            window.location.href = 'agent-artist-edit.html';
        }, 1000);
    } else {
        showToast('Artist not found', 'error');
    }
}

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
    
    // Style the toast
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

// ==================== DEBUG FUNCTION ====================
// Add this to help debug - you can call it from browser console
window.debugArtists = function() {
    console.log('=== DEBUG ARTISTS ===');
    console.log('LocalStorage agentArtists:', getFromLocalStorage('agentArtists'));
    console.log('Add Artist Box:', document.getElementById('addArtistBox'));
    console.log('Modal:', document.getElementById('addArtistModal'));
    console.log('Form:', document.getElementById('addArtistForm'));
    console.log('Artists Grid:', document.getElementById('artistsGrid'));
    
    // Check all checkboxes
    const checkboxes = document.querySelectorAll('input[name="artistType"]');
    console.log('Found checkboxes:', checkboxes.length);
    checkboxes.forEach((cb, i) => {
        console.log(`Checkbox ${i}:`, cb.checked, cb.value);
    });
    
    console.log('=====================');
};
// Add to existing agent-artists.js
function createArtistCard(artist, index) {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.dataset.index = index;
    
    // Get initials for avatar if no image
    let avatarContent = '<i class="fas fa-user"></i>';
    if (artist.image) {
        avatarContent = `<img src="${artist.image}" alt="${artist.name}">`;
    }
    
    // Generate types HTML
    let typesHTML = '';
    if (artist.types && artist.types.length > 0) {
        typesHTML = artist.types.map(type => 
            `<span class="artist-type-tag">${type}</span>`
        ).join('');
    } else if (artist.type) { // Backward compatibility
        typesHTML = `<span class="artist-type-tag">${artist.type}</span>`;
    } else {
        typesHTML = '<span class="no-types">No types specified</span>';
    }
    
    // Generate social links HTML
    let socialHTML = '';
    if (artist.socialLinks && artist.socialLinks.length > 0) {
        // Social platforms with their icons and colors
        const socialPlatforms = {
            'instagram': { icon: 'fab fa-instagram', color: '#E4405F' },
            'facebook': { icon: 'fab fa-facebook', color: '#1877F2' },
            'twitter': { icon: 'fab fa-twitter', color: '#1DA1F2' },
            'tiktok': { icon: 'fab fa-tiktok', color: '#000000' },
            'youtube': { icon: 'fab fa-youtube', color: '#FF0000' },
            'spotify': { icon: 'fab fa-spotify', color: '#1DB954' },
            'soundcloud': { icon: 'fab fa-soundcloud', color: '#FF3300' },
            'apple-music': { icon: 'fab fa-apple', color: '#FA243C' },
            'website': { icon: 'fas fa-globe', color: '#6C63FF' }
        };
        
        socialHTML = artist.socialLinks.map(link => {
            const platform = socialPlatforms[link.platform];
            if (platform) {
                return `<a href="${link.url}" target="_blank" class="social-link-icon" 
                         style="background: ${platform.color + '20'}; color: ${platform.color}">
                    <i class="${platform.icon}"></i>
                </a>`;
            }
            return `<a href="${link.url}" target="_blank" class="social-link-icon">
                <i class="fas fa-link"></i>
            </a>`;
        }).join('');
    } else {
        socialHTML = '<span class="no-social">No social links</span>';
    }
    
    card.innerHTML = `
        <!-- DELETE BUTTON - TOP RIGHT -->
        <button class="artist-delete-btn" data-index="${index}" title="Remove artist">
            <i class="fas fa-times"></i>
        </button>
        
        <div class="artist-card-header">
            <div class="artist-avatar">
                ${avatarContent}
            </div>
            <div class="artist-info">
                <h3>${artist.name || 'Unnamed Artist'}</h3>
                <div class="artist-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${artist.location || 'Location not set'}
                </div>
            </div>
        </div>
        
        <div class="artist-card-body">
            <div class="artist-types">
                ${typesHTML}
            </div>
            <div class="artist-social-links">
                ${socialHTML}
            </div>
        </div>
        
        <div class="artist-card-footer">
            <button class="edit-artist-btn" data-index="${index}">
                <i class="fas fa-edit"></i> Edit Profile
            </button>
        </div>
    `;
    
    // Add event listener to edit button
    const editBtn = card.querySelector('.edit-artist-btn');
    editBtn.addEventListener('click', function() {
        editArtist(index);
    });
    
    // Add event listener to delete button
    const deleteBtn = card.querySelector('.artist-delete-btn');
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click events
        showDeleteConfirmation(index, artist.name);
    });
    
    return card;
}

// Add this function to show delete confirmation
function showDeleteConfirmation(index, artistName) {
    console.log('Showing delete confirmation for artist:', index, artistName);
    
    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteArtistName = document.getElementById('deleteArtistName');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    if (!deleteModal) {
        console.error('Delete modal not found!');
        return;
    }
    
    // Set artist name in confirmation modal
    if (deleteArtistName && artistName) {
        deleteArtistName.textContent = artistName;
    }
    
    // Store the index to delete
    deleteModal.dataset.deleteIndex = index;
    
    // Show modal
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Setup event listeners for modal buttons
    const closeModal = function() {
        deleteModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        deleteModal.dataset.deleteIndex = '';
    };
    
    // Close buttons
    if (closeDeleteBtn) {
        closeDeleteBtn.onclick = closeModal;
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = closeModal;
    }
    
    // Close modal when clicking outside
    deleteModal.onclick = function(e) {
        if (e.target === deleteModal) {
            closeModal();
        }
    };
    
    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = function() {
            const indexToDelete = parseInt(deleteModal.dataset.deleteIndex);
            if (!isNaN(indexToDelete)) {
                deleteArtist(indexToDelete);
                closeModal();
            }
        };
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape' && deleteModal.classList.contains('active')) {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

// Add this function to delete an artist
function deleteArtist(index) {
    console.log('Deleting artist at index:', index);
    
    // Get existing artists array
    const artists = getFromLocalStorage('agentArtists') || [];
    
    if (artists[index]) {
        // Get artist name for message
        const artistName = artists[index].name || 'Artist';
        
        // Remove the artist from the array
        artists.splice(index, 1);
        
        // Save updated array to localStorage
        saveToLocalStorage('agentArtists', artists);
        
        console.log('Artist deleted. Remaining artists:', artists.length);
        
        // Show success message
        showToast(`${artistName} removed from roster`, 'success');
        
        // Reload artists list
        setTimeout(() => {
            loadArtists();
        }, 500);
    } else {
        showToast('Artist not found', 'error');
    }
}

// Make sure to also update the existing editArtist function
function editArtist(index) {
    console.log('Editing artist at index:', index);
    
    const artists = getFromLocalStorage('agentArtists') || [];
    if (artists[index]) {
        // Save the artist data temporarily for editing
        saveToLocalStorage('editingArtist', {
            ...artists[index],
            index: index
        });
        
        // Redirect to agent-artist-edit.html
        showToast('Redirecting to edit page...', 'info');
        setTimeout(() => {
            window.location.href = 'agent-artist-edit.html';
        }, 1000);
    } else {
        showToast('Artist not found', 'error');
    }
}