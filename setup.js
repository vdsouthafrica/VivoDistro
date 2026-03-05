// performer-setup.js - Save to Supabase (COMPLETE)
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    const supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Elements
    const form = document.getElementById('performerForm');
    const profilePreview = document.getElementById('profilePreview');
    const profileImageInput = document.getElementById('profileImage');
    const stageNameInput = document.getElementById('stageName');
    const locationInput = document.getElementById('location');
    const typeOptions = document.querySelectorAll('.type-option');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const submitButton = document.getElementById('createProfileBtn');
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.form-step');
    const instrumentContainer = document.getElementById('instrumentContainer');
    const instrumentInput = document.getElementById('instrumentInput');
    const selectedInstruments = document.getElementById('selectedInstruments');

    // Store selected types and instruments
    window.selectedTypes = [];
    window.selectedInstruments = [];

    // Check if user is logged in
    checkUser();

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('Please sign in first', 'error');
            setTimeout(() => {
                window.location.href = 'signup.html';
            }, 2000);
            return;
        }
        console.log('Logged in user:', user);
        window.currentUserId = user.id;
    }

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
                        <img src="${e.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                        <div class="upload-overlay">
                            <i class="fas fa-camera"></i>
                            <span>Change Photo</span>
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
                this.classList.remove('selected');
                window.selectedTypes = window.selectedTypes.filter(t => t !== type);
                
                if (type === 'Instrumentalist') {
                    if (instrumentContainer) instrumentContainer.style.display = 'none';
                    window.selectedInstruments = [];
                    updateInstrumentsDisplay();
                }
            } else {
                this.classList.add('selected');
                window.selectedTypes.push(type);
                
                if (type === 'Instrumentalist') {
                    if (instrumentContainer) instrumentContainer.style.display = 'block';
                }
            }

            updateSelectedTypes();
            updateReview();
        });
    });

    // Instrument input
    if (instrumentInput) {
        instrumentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const instrument = this.value.trim();
                
                if (instrument && !window.selectedInstruments.includes(instrument)) {
                    window.selectedInstruments.push(instrument);
                    this.value = '';
                    updateInstrumentsDisplay();
                    updateReview();
                }
            }
        });

        instrumentInput.addEventListener('blur', function() {
            const instrument = this.value.trim();
            if (instrument && !window.selectedInstruments.includes(instrument)) {
                window.selectedInstruments.push(instrument);
                this.value = '';
                updateInstrumentsDisplay();
                updateReview();
            }
        });
    }

    // Next button click
    nextButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const currentStepNum = parseInt(document.querySelector('.form-step.active').getAttribute('data-step'));
            const nextStepNum = parseInt(this.getAttribute('data-next'));
            
            if (validateStep(currentStepNum)) {
                goToStep(nextStepNum);
            }
        });
    });

    // Previous button click
    prevButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const prevStepNum = parseInt(this.getAttribute('data-prev'));
            goToStep(prevStepNum);
        });
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep(2)) {
            return;
        }
        
        // Get profile image
        const profileImg = profilePreview?.querySelector('img');
        const image = profileImg ? profileImg.src : (window.profileImageData || '');

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            showToast('Please sign in first', 'error');
            return;
        }

        // Create profile object
        const profile = {
            auth_id: user.id,
            name: stageNameInput?.value.trim() || '',
            location: locationInput?.value.trim() || '',
            types: window.selectedTypes || [],
            instruments: window.selectedInstruments || [],
            image_url: image,
            bio: '',
            fans: 0
        };

        console.log('Saving performer profile:', profile);

        // Show loading state
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitButton.disabled = true;
        }

        // Save to Supabase
        const { data, error } = await supabase
            .from('performers')
            .insert([profile])
            .select();

        if (error) {
            console.error('Error saving profile:', error);
            showToast('Error creating profile: ' + error.message, 'error');
            submitButton.innerHTML = '<i class="fas fa-check"></i> Create Profile';
            submitButton.disabled = false;
            return;
        }

        console.log('Profile saved:', data);
        
        // Show success message and redirect
        showToast('Performer profile created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'performer-hub.html';
        }, 1500);
    });

    // Update review on input
    if (stageNameInput) stageNameInput.addEventListener('input', updateReview);
    if (locationInput) locationInput.addEventListener('input', updateReview);

    // ========== HELPER FUNCTIONS ==========

    function updateSelectedTypes() {
        const selectedContainer = document.getElementById('selectedTypes');
        if (selectedContainer) {
            if (window.selectedTypes.length > 0) {
                selectedContainer.innerHTML = window.selectedTypes.map(type => 
                    `<span class="selected-type">${type}</span>`
                ).join('');
            } else {
                selectedContainer.innerHTML = '';
            }
        }
    }

    function updateInstrumentsDisplay() {
        if (!selectedInstruments) return;
        
        if (window.selectedInstruments.length > 0) {
            selectedInstruments.innerHTML = window.selectedInstruments.map((instrument, index) => `
                <div class="instrument-tag">
                    ${instrument}
                    <button type="button" class="remove-instrument" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            selectedInstruments.querySelectorAll('.remove-instrument').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    window.selectedInstruments.splice(index, 1);
                    updateInstrumentsDisplay();
                    updateReview();
                });
            });
        } else {
            selectedInstruments.innerHTML = '';
        }
    }

    function updateReview() {
        const reviewName = document.getElementById('reviewName');
        const reviewLocation = document.getElementById('reviewLocation');
        const reviewTypes = document.getElementById('reviewTypes');
        const reviewInstrumentsItem = document.getElementById('reviewInstrumentsItem');
        const reviewInstruments = document.getElementById('reviewInstruments');
        const reviewPic = document.getElementById('reviewPic');

        if (reviewName) {
            reviewName.textContent = stageNameInput?.value.trim() || 'Stage Name';
        }
        
        if (reviewLocation) {
            reviewLocation.textContent = locationInput?.value.trim() || 'Location';
        }
        
        if (reviewTypes) {
            if (window.selectedTypes.length > 0) {
                reviewTypes.innerHTML = window.selectedTypes.map(t => 
                    `<span class="type-badge-small">${t}</span>`
                ).join(' ');
            } else {
                reviewTypes.innerHTML = 'None selected';
            }
        }

        if (reviewInstrumentsItem && reviewInstruments) {
            if (window.selectedTypes.includes('Instrumentalist') && window.selectedInstruments.length > 0) {
                reviewInstrumentsItem.style.display = 'block';
                reviewInstruments.textContent = window.selectedInstruments.join(', ');
            } else {
                reviewInstrumentsItem.style.display = 'none';
            }
        }

        if (reviewPic) {
            const img = profilePreview?.querySelector('img');
            if (img) {
                reviewPic.innerHTML = `<img src="${img.src}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else if (window.profileImageData) {
                reviewPic.innerHTML = `<img src="${window.profileImageData}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                reviewPic.innerHTML = '<i class="fas fa-user"></i>';
            }
        }
    }

    function validateStep(step) {
        clearAllErrors();

        switch(step) {
            case 1:
                if (!stageNameInput?.value.trim()) {
                    showError('nameError', 'Stage name is required');
                    stageNameInput?.focus();
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
                    showError('typeError', 'Please select at least one performer type');
                    return false;
                }
                
                if (window.selectedTypes.includes('Instrumentalist') && window.selectedInstruments.length === 0) {
                    showError('instrumentError', 'Please add at least one instrument');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }

    function goToStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        
        const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        if (progressFill) {
            const progressPercentage = ((step - 1) / 2) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        document.querySelectorAll('.progress-steps .step').forEach((stepEl, index) => {
            stepEl.classList.remove('active');
            if (index + 1 === step) {
                stepEl.classList.add('active');
            }
        });
        
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

    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
    }
});

// Toast function
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