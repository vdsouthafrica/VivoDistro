// booker-setup.js - Booker Profile Setup (FIXED VERSION)
document.addEventListener('DOMContentLoaded', function() {
    // Get Vivo ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const vivoId = urlParams.get('vivoId');
    
    // Store Vivo ID globally
    window.currentVivoId = vivoId || getVivoIdFromStorage();
    
    console.log('Booker setup - Vivo ID:', window.currentVivoId);
    
    // Elements
    const form = document.getElementById('bookerForm');
    const profilePreview = document.getElementById('profilePreview');
    const profileImageInput = document.getElementById('profileImage');
    const businessNameInput = document.getElementById('businessName');
    const locationInput = document.getElementById('location');
    const typeOptions = document.querySelectorAll('.type-option');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const submitButton = document.getElementById('createProfileBtn');
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.form-step');

    // Store selected types
    window.selectedTypes = [];

    // Initialize from localStorage if exists (for returning users)
    loadExistingProfile();

    // Update review section
    updateReview();

    // Profile image upload
    if (profilePreview) {
        profilePreview.addEventListener('click', () => {
            profileImageInput.click();
        });
    }

    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
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
                if (profilePreview) {
                    profilePreview.innerHTML = `
                        <img src="${e.target.result}" alt="Business Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                        <div class="upload-overlay">
                            <i class="fas fa-camera"></i>
                            <span>Change Logo</span>
                        </div>
                    `;
                    window.profileImageData = e.target.result;
                }
                updateReview();
            };
            reader.readAsDataURL(file);
        });
    }

    // Type selection
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-value');
            
            if (this.classList.contains('selected')) {
                // Remove if already selected
                this.classList.remove('selected');
                window.selectedTypes = window.selectedTypes.filter(t => t !== type);
            } else {
                // Add if not selected
                this.classList.add('selected');
                window.selectedTypes.push(type);
            }

            updateSelectedTypes();
            updateReview();
            clearError('typeError');
        });
    });

    // Next button click
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStepNum = parseInt(document.querySelector('.form-step.active').getAttribute('data-step'));
            const nextStepNum = parseInt(this.getAttribute('data-next'));
            
            // Validate current step
            if (!validateStep(currentStepNum)) {
                return;
            }
            
            // Move to next step
            goToStep(nextStepNum);
        });
    });

    // Previous button click
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStepNum = parseInt(this.getAttribute('data-prev'));
            goToStep(prevStepNum);
        });
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateStep(3)) {
            return;
        }
        
        // Get profile image
        const profileImg = profilePreview?.querySelector('img');
        const image = profileImg ? profileImg.src : (window.profileImageData || '');

        // Create profile object
        const profile = {
            id: window.currentVivoId || generateBookerId(),
            name: businessNameInput?.value.trim() || '',
            location: locationInput?.value.trim() || '',
            types: window.selectedTypes || [],
            logo: image,
            bio: '',
            phone: '',
            website: '',
            email: '',
            socialLinks: [],
            venueTypes: [],
            stats: {
                events: 0,
                artists: 0,
                spent: 0
            },
            createdAt: new Date().toISOString()
        };

        console.log('Saving booker profile:', profile);

        // Save using ProfileManager if available
        if (window.ProfileManager) {
            ProfileManager.saveProfile('booker', profile);
        } else {
            // Fallback save
            localStorage.setItem('bookerProfile', JSON.stringify(profile));
            if (profile.id) {
                localStorage.setItem(`bookerProfile_${profile.id}`, JSON.stringify(profile));
            }
            localStorage.setItem('currentProfile', JSON.stringify({...profile, role: 'booker'}));
        }

        // Update user data
        updateUserData(profile.id);

        // Show loading state
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitButton.disabled = true;
        }

        // Show success message and redirect
        setTimeout(() => {
            showToast('Booker profile created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'booker-hub.html';
            }, 1500);
        }, 1000);
    });

    // Update review on input
    if (businessNameInput) businessNameInput.addEventListener('input', updateReview);
    if (locationInput) locationInput.addEventListener('input', updateReview);

    // ========== HELPER FUNCTIONS ==========

    function getVivoIdFromStorage() {
        try {
            const userData = JSON.parse(localStorage.getItem('vivoUser') || '{}');
            return userData.vivoId || null;
        } catch (e) {
            return null;
        }
    }

    function generateBookerId() {
        return 'booker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function updateUserData(profileId) {
        try {
            const userData = JSON.parse(localStorage.getItem('vivoUser') || '{}');
            userData.hasProfile = true;
            userData.profileCompleted = true;
            userData.role = 'booker';
            userData.profileId = profileId;
            userData.lastActive = new Date().toISOString();
            localStorage.setItem('vivoUser', JSON.stringify(userData));
            localStorage.setItem('selectedRole', 'booker');
        } catch (e) {
            console.error('Error updating user data:', e);
        }
    }

    function loadExistingProfile() {
        let profile = null;
        
        // Try to load from various sources
        if (window.currentVivoId) {
            const saved = localStorage.getItem(`bookerProfile_${window.currentVivoId}`);
            if (saved) {
                try {
                    profile = JSON.parse(saved);
                } catch (e) {}
            }
        }
        
        if (!profile) {
            const saved = localStorage.getItem('bookerProfile');
            if (saved) {
                try {
                    profile = JSON.parse(saved);
                } catch (e) {}
            }
        }
        
        if (profile) {
            if (businessNameInput) businessNameInput.value = profile.name || '';
            if (locationInput) locationInput.value = profile.location || '';
            
            if (profile.types && profile.types.length > 0) {
                window.selectedTypes = profile.types;
                profile.types.forEach(type => {
                    const option = document.querySelector(`.type-option[data-value="${type}"]`);
                    if (option) option.classList.add('selected');
                });
                updateSelectedTypes();
            }
            
            if (profile.logo && profilePreview) {
                profilePreview.innerHTML = `
                    <img src="${profile.logo}" alt="Business Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    <div class="upload-overlay">
                        <i class="fas fa-camera"></i>
                        <span>Change Logo</span>
                    </div>
                `;
                window.profileImageData = profile.logo;
            }
        }
    }

    function updateSelectedTypes() {
        const selectedContainer = document.getElementById('selectedTypes');
        if (selectedContainer) {
            if (window.selectedTypes.length > 0) {
                selectedContainer.innerHTML = window.selectedTypes.map(type => 
                    `<span class="selected-type">${type}</span>`
                ).join('');
            } else {
                selectedContainer.innerHTML = '<span class="no-types">No types selected</span>';
            }
        }
    }

    function updateReview() {
        const reviewName = document.getElementById('reviewName');
        const reviewLocation = document.getElementById('reviewLocation');
        const reviewTypes = document.getElementById('reviewTypes');
        const reviewPic = document.getElementById('reviewPic');

        if (reviewName) {
            reviewName.textContent = businessNameInput?.value.trim() || 'Business Name';
        }
        
        if (reviewLocation) {
            reviewLocation.textContent = locationInput?.value.trim() || 'Location';
        }
        
        if (reviewTypes) {
            if (window.selectedTypes.length > 0) {
                reviewTypes.textContent = window.selectedTypes.join(', ');
            } else {
                reviewTypes.textContent = 'Not specified';
            }
        }

        // Update profile picture in review
        if (reviewPic) {
            const img = profilePreview?.querySelector('img');
            if (img) {
                reviewPic.innerHTML = `<img src="${img.src}" alt="Business Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else if (window.profileImageData) {
                reviewPic.innerHTML = `<img src="${window.profileImageData}" alt="Business Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                reviewPic.innerHTML = '<i class="fas fa-building"></i>';
            }
        }
    }

    function validateStep(step) {
        clearAllErrors();

        switch(step) {
            case 1:
                if (!businessNameInput?.value.trim()) {
                    showError('nameError', 'Business name is required');
                    businessNameInput?.focus();
                    return false;
                }
                if (!locationInput?.value.trim()) {
                    showError('locationError', 'Location is required');
                    locationInput?.focus();
                    return false;
                }
                return true;
                
            case 2:
                if (window.selectedTypes.length === 0) {
                    showError('typeError', 'Please select at least one business type');
                    return false;
                }
                return true;
                
            case 3:
                return true;
        }
    }

    function goToStep(step) {
        // Hide all steps
        steps.forEach(s => s.classList.remove('active'));
        
        // Show target step
        const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update progress bar
        if (progressFill) {
            const progressPercentage = ((step - 1) / 2) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update step indicators
        document.querySelectorAll('.progress-steps .step').forEach((stepEl, index) => {
            stepEl.classList.remove('active');
            if (index + 1 === step) {
                stepEl.classList.add('active');
            }
        });
        
        // Update review when going to step 3
        if (step === 3) {
            updateReview();
        }
    }

    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function clearError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
    }
});

// ========== TOAST FUNCTION ==========

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