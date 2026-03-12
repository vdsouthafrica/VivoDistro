// agent-setup.js - Agent Profile Creation (COMPLETE - EMAIL REMOVED)
document.addEventListener('DOMContentLoaded', function() {
    // Get Vivo ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const vivoId = urlParams.get('vivoId');
    
    // Store Vivo ID globally
    window.currentVivoId = vivoId || getVivoIdFromStorage();
    
    console.log('Agent setup - Vivo ID:', window.currentVivoId);
    
    const form = document.getElementById('agentForm');
    const steps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const createButton = document.getElementById('createProfileBtn');
    
    let currentStep = 1;
    
    // Initialize progress
    updateProgressBar(currentStep);
    
    // Step navigation
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            // Validate current step before proceeding
            if (validateStep(currentStep)) {
                navigateToStep(currentStep, nextStep);
                currentStep = nextStep;
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            navigateToStep(currentStep, prevStep);
            currentStep = prevStep;
        });
    });
    
    // Update review section when inputs change
    document.getElementById('agencyName')?.addEventListener('input', updateReview);
    document.getElementById('location')?.addEventListener('input', updateReview);
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Final validation
        if (!validateStep(currentStep)) {
            return;
        }
        
        // Get form data
        const agentData = {
            id: window.currentVivoId || generateAgentId(),
            name: document.getElementById('agencyName').value,
            location: document.getElementById('location').value,
            logo: document.getElementById('agencyLogoPreview')?.querySelector('img')?.src || '',
            bio: '',
            phone: '',
            website: '',
            specialties: [],
            socialLinks: [],
            stats: {
                artists: 0,
                bookings: 0,
                revenue: 0
            },
            createdAt: new Date().toISOString(),
            role: 'agent'
        };
        
        console.log('Saving agent profile:', agentData);
        
        // Save to localStorage
        saveToLocalStorage('agentProfile', agentData);
        if (agentData.id) {
            saveToLocalStorage(`agentProfile_${agentData.id}`, agentData);
        }
        saveToLocalStorage('currentProfile', {...agentData, role: 'agent'});
        
        // Update user data
        updateUserData(agentData.id);
        
        // Show loading state
        if (createButton) {
            createButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Profile...';
            createButton.disabled = true;
        }
        
        // Show success message and redirect
        setTimeout(() => {
            showToast('Agent profile created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'agent-hub.html';
            }, 1500);
        }, 1000);
    });
    
    // Logo upload preview
    const logoInput = document.getElementById('agencyLogo');
    const logoPreview = document.getElementById('agencyLogoPreview');
    
    if (logoPreview) {
        logoPreview.addEventListener('click', () => {
            logoInput.click();
        });
    }
    
    if (logoInput) {
        logoInput.addEventListener('change', function(e) {
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
                if (logoPreview.querySelector('img')) {
                    logoPreview.querySelector('img').src = e.target.result;
                } else {
                    logoPreview.innerHTML = `
                        <img src="${e.target.result}" alt="Agency Logo">
                        <div class="upload-overlay">
                            <i class="fas fa-camera"></i>
                            <span>Change Logo</span>
                        </div>
                    `;
                }
                window.profileImageData = e.target.result;
                updateReview();
            };
            reader.readAsDataURL(file);
        });
    }
});

// Step validation for agent
function validateStep(step) {
    let isValid = true;
    
    switch(step) {
        case 1:
            const name = document.getElementById('agencyName');
            const location = document.getElementById('location');
            const nameError = document.getElementById('nameError');
            const locationError = document.getElementById('locationError');
            
            // Reset errors
            hideError(nameError);
            hideError(locationError);
            
            // Validate name
            if (!validateRequired(name)) {
                showError(nameError, 'Agency name is required');
                isValid = false;
            }
            
            // Validate location
            if (!validateRequired(location)) {
                showError(locationError, 'Location is required');
                isValid = false;
            }
            break;
            
        case 2:
            // No validation needed for step 2 (review step)
            break;
    }
    
    return isValid;
}

// Update review section
function updateReview() {
    const name = document.getElementById('agencyName').value;
    const location = document.getElementById('location').value;
    const logoPic = document.getElementById('agencyLogoPreview');
    
    // Update name
    const reviewName = document.getElementById('reviewName');
    if (reviewName) reviewName.textContent = name || 'Not set';
    
    // Update location
    const reviewLocation = document.getElementById('reviewLocation');
    if (reviewLocation) reviewLocation.textContent = location || 'Not set';
    
    // Update logo in review
    const reviewLogo = document.getElementById('reviewLogo');
    if (reviewLogo) {
        const img = logoPic?.querySelector('img');
        if (img) {
            reviewLogo.innerHTML = `<img src="${img.src}" alt="Agency Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            reviewLogo.innerHTML = '<i class="fas fa-building"></i>';
        }
    }
}

// Helper functions
function getVivoIdFromStorage() {
    try {
        const userData = JSON.parse(localStorage.getItem('vivoUser') || '{}');
        return userData.vivoId || null;
    } catch (e) {
        return null;
    }
}

function generateAgentId() {
    return 'agent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function updateUserData(profileId) {
    try {
        const userData = JSON.parse(localStorage.getItem('vivoUser') || '{}');
        userData.hasProfile = true;
        userData.profileCompleted = true;
        userData.role = 'agent';
        userData.profileId = profileId;
        userData.lastActive = new Date().toISOString();
        localStorage.setItem('vivoUser', JSON.stringify(userData));
        localStorage.setItem('selectedRole', 'agent');
    } catch (e) {
        console.error('Error updating user data:', e);
    }
}

function updateProgressBar(step) {
    const percentage = ((step - 1) / 1) * 100; // Only 2 steps now
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.step');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    
    steps.forEach((stepEl, index) => {
        if (index + 1 <= step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

function navigateToStep(current, next) {
    const currentStepEl = document.querySelector(`[data-step="${current}"]`);
    const nextStepEl = document.querySelector(`[data-step="${next}"]`);
    
    if (currentStepEl && nextStepEl) {
        currentStepEl.classList.remove('active');
        nextStepEl.classList.add('active');
        updateProgressBar(next);
        
        // Update review when going to step 2
        if (next === 2) {
            updateReview();
        }
    }
}

function validateRequired(input) {
    return input && input.value.trim() !== '';
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        element.style.display = 'block';
    }
}

function hideError(element) {
    if (element) {
        element.classList.remove('show');
        element.style.display = 'none';
    }
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
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
// ========== GEOLOCATION ==========
document.getElementById('getLocationBtn').addEventListener('click', function() {
    const btn = this;
    const locationInput = document.getElementById('location');
    const countryCodeInput = document.getElementById('countryCode');
    const cityInput = document.getElementById('city');
    const countryInput = document.getElementById('country');
    const errorDiv = document.getElementById('locationError');

    if (!navigator.geolocation) {
        errorDiv.textContent = 'Geolocation is not supported by your browser';
        errorDiv.style.display = 'block';
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    btn.disabled = true;
    errorDiv.style.display = 'none';

    navigator.geolocation.getCurrentPosition(async function(position) {
        try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get address
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            const address = data.address;
            
            // Extract location components
            const city = address.city || address.town || address.village || address.county || 'Unknown';
            const state = address.state || '';
            const country = address.country || 'Unknown';
            const countryCode = getCountryCode(address.country_code || '');
            
            // Format display location
            let displayLocation = city;
            if (state) displayLocation += `, ${state}`;
            displayLocation += `, ${country}`;
            
            // Update fields
            locationInput.value = displayLocation;
            cityInput.value = city;
            countryInput.value = country;
            countryCodeInput.value = countryCode;
            
            // Show success
            btn.innerHTML = '<i class="fas fa-check"></i> Detected!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-location-dot"></i> Detect Location';
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Geocoding error:', error);
            errorDiv.textContent = 'Could not detect your location. Please enter manually.';
            errorDiv.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-location-dot"></i> Detect Location';
            btn.disabled = false;
        }
    }, function(error) {
        let message = 'Location access denied. Please enter manually.';
        if (error.code === 1) message = 'Please allow location access to use this feature.';
        else if (error.code === 2) message = 'Location unavailable. Please enter manually.';
        else if (error.code === 3) message = 'Location request timed out. Please try again.';
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-location-dot"></i> Detect Location';
        btn.disabled = false;
    });
});

function getCountryCode(code) {
    const countryCodes = {
        'za': 'ZA', 'us': 'US', 'gb': 'GB', 'ng': 'NG', 'ke': 'KE',
        'gh': 'GH', 'ca': 'CA', 'au': 'AU', 'de': 'DE', 'fr': 'FR',
        'br': 'BR', 'in': 'IN', 'jp': 'JP', 'cn': 'CN', 'mx': 'MX'
    };
    return countryCodes[code?.toLowerCase()] || code?.toUpperCase() || 'XX';
}