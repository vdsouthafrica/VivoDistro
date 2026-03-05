// Create Event Page JavaScript - Dark Theme
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const photoUpload = document.getElementById('photoUpload');
    const swipeWrapper = document.getElementById('swipeWrapper');
    const photoIndicators = document.getElementById('photoIndicators');
    const prevPhotoBtn = document.getElementById('prevPhoto');
    const nextPhotoBtn = document.getElementById('nextPhoto');
    const removeAllBtn = document.getElementById('removeAllPhotos');
    const photoCount = document.getElementById('photoCount');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const saveDraftBtn = document.getElementById('saveDraft');
    const createEventBtn = document.getElementById('createEvent');

    // State
    let uploadedPhotos = [];
    let currentPhotoIndex = 0;
    const MAX_PHOTOS = 4;

    // Initialize
    updatePhotoCount();

    // Event Listeners
    photoUpload.addEventListener('change', handlePhotoUpload);
    prevPhotoBtn.addEventListener('click', showPreviousPhoto);
    nextPhotoBtn.addEventListener('click', showNextPhoto);
    removeAllBtn.addEventListener('click', removeAllPhotos);
    saveDraftBtn.addEventListener('click', saveAsDraft);
    createEventBtn.addEventListener('click', createEvent);

    // Functions
    function handlePhotoUpload(event) {
        const files = Array.from(event.target.files);
        const totalSlots = MAX_PHOTOS - uploadedPhotos.length;
        
        if (files.length > totalSlots) {
            alert(`You can only upload ${totalSlots} more photos (max ${MAX_PHOTOS} total)`);
            files.splice(totalSlots);
        }
        
        if (files.length === 0) return;
        
        // Simulate upload progress
        showUploadProgress();
        
        let uploaded = 0;
        files.forEach((file, index) => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedPhotos.push({
                    id: Date.now() + index,
                    src: e.target.result,
                    name: file.name
                });
                
                uploaded++;
                updateProgress(uploaded, files.length);
                
                if (uploaded === files.length) {
                    setTimeout(() => {
                        hideUploadProgress();
                        renderPhotos();
                        updatePhotoCount();
                        photoUpload.value = '';
                    }, 500);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function showUploadProgress() {
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Uploading...';
    }

    function updateProgress(current, total) {
        const percentage = (current / total) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Uploading ${current} of ${total} photos...`;
    }

    function hideUploadProgress() {
        setTimeout(() => {
            uploadProgress.style.display = 'none';
        }, 1000);
    }

    function renderPhotos() {
        // Clear existing content
        swipeWrapper.innerHTML = '';
        photoIndicators.innerHTML = '';
        
        if (uploadedPhotos.length === 0) {
            swipeWrapper.innerHTML = `
                <div class="empty-photos dark-empty">
                    <i class="fas fa-camera"></i>
                    <p>No photos uploaded yet</p>
                    <small>Upload photos to see preview</small>
                </div>
            `;
            prevPhotoBtn.style.display = 'none';
            nextPhotoBtn.style.display = 'none';
            return;
        }
        
        // Show navigation arrows
        prevPhotoBtn.style.display = 'flex';
        nextPhotoBtn.style.display = 'flex';
        
        // Create photo slides
        uploadedPhotos.forEach((photo, index) => {
            const slide = document.createElement('div');
            slide.className = 'photo-slide';
            slide.dataset.index = index;
            
            slide.innerHTML = `
                <img src="${photo.src}" alt="Event Photo ${index + 1}">
                <button class="remove-photo-btn" onclick="removePhoto(${photo.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            swipeWrapper.appendChild(slide);
            
            // Create indicator
            const indicator = document.createElement('div');
            indicator.className = `indicator ${index === currentPhotoIndex ? 'active' : ''}`;
            indicator.dataset.index = index;
            indicator.addEventListener('click', () => {
                currentPhotoIndex = index;
                updatePhotoDisplay();
            });
            photoIndicators.appendChild(indicator);
        });
        
        updatePhotoDisplay();
    }

    function updatePhotoDisplay() {
        const translateX = -currentPhotoIndex * 100;
        swipeWrapper.style.transform = `translateX(${translateX}%)`;
        
        // Update indicators
        document.querySelectorAll('.indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentPhotoIndex);
        });
        
        // Update arrow visibility
        prevPhotoBtn.style.opacity = currentPhotoIndex === 0 ? '0.5' : '1';
        nextPhotoBtn.style.opacity = currentPhotoIndex === uploadedPhotos.length - 1 ? '0.5' : '1';
    }

    function showPreviousPhoto() {
        if (currentPhotoIndex > 0) {
            currentPhotoIndex--;
            updatePhotoDisplay();
        }
    }

    function showNextPhoto() {
        if (currentPhotoIndex < uploadedPhotos.length - 1) {
            currentPhotoIndex++;
            updatePhotoDisplay();
        }
    }

    function removePhoto(photoId) {
        uploadedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
        
        if (currentPhotoIndex >= uploadedPhotos.length) {
            currentPhotoIndex = Math.max(0, uploadedPhotos.length - 1);
        }
        
        renderPhotos();
        updatePhotoCount();
    }

    function removeAllPhotos() {
        if (uploadedPhotos.length === 0) return;
        
        if (confirm('Are you sure you want to remove all photos?')) {
            uploadedPhotos = [];
            currentPhotoIndex = 0;
            renderPhotos();
            updatePhotoCount();
        }
    }

    function updatePhotoCount() {
        photoCount.textContent = `${uploadedPhotos.length}/${MAX_PHOTOS} photos`;
    }

    // Form Submission Functions
    async function saveAsDraft() {
        const eventData = collectFormData();
        eventData.status = 'draft';
        
        // Validate required fields
        if (!validateForm()) {
            return;
        }
        
        // In a real app, you would send this to your backend
        console.log('Saving as draft:', eventData);
        
        // Show success message
        showNotification('Event saved as draft successfully!', 'success');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to dashboard
        window.location.href = 'booker-hub.html';
    }

    async function createEvent() {
        const eventData = collectFormData();
        eventData.status = 'published';
        
        // Validate required fields
        if (!validateForm()) {
            return;
        }
        
        // In a real app, you would send this to your backend
        console.log('Creating event:', eventData);
        
        // Show loading state
        createEventBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        createEventBtn.disabled = true;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success message
        showNotification('Event created successfully!', 'success');
        
        // Redirect to dashboard or event page
        window.location.href = 'booker-hub.html';
    }

    function collectFormData() {
        return {
            name: document.getElementById('eventName').value,
            description: document.getElementById('eventDescription').value,
            venue: document.getElementById('eventVenue').value,
            location: document.getElementById('eventLocation').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            ticketPrice: document.getElementById('ticketPrice').value || 'Free',
            ticketLink: document.getElementById('ticketLink').value,
            photos: uploadedPhotos,
            createdAt: new Date().toISOString()
        };
    }

    function validateForm() {
        const requiredFields = [
            { id: 'eventName', name: 'Event Name' },
            { id: 'eventDescription', name: 'Description' },
            { id: 'eventVenue', name: 'Venue Name' },
            { id: 'eventLocation', name: 'Location' },
            { id: 'eventDate', name: 'Date' },
            { id: 'eventTime', name: 'Time' }
        ];
        
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                showNotification(`${field.name} is required`, 'error');
                element.focus();
                return false;
            }
        }
        
        return true;
    }

    function showNotification(message, type) {
        // Remove existing notification
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Make functions available globally for onclick handlers
    window.removePhoto = removePhoto;
});