// calculator.js - Updated with proper visibility toggling

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calcScreen = document.getElementById('calcScreen');
    const calcOperations = document.getElementById('calcOperations');
    const addFeeBtn = document.getElementById('addFeeBtn');
    const inlineFeeForm = document.getElementById('inlineFeeForm');
    const closeInlineForm = document.getElementById('closeInlineForm');
    const feeTypeGrid = document.getElementById('feeTypeGrid');
    const feeDetailsForm = document.getElementById('feeDetailsForm');
    const selectedFeeTitle = document.getElementById('selectedFeeTitle');
    const formFields = document.getElementById('formFields');
    const feePreview = document.getElementById('feePreview');
    const previewText = document.getElementById('previewText');
    const cancelInlineFee = document.getElementById('cancelInlineFee');
    const addToQuoteInline = document.getElementById('addToQuoteInline');
    const feeList = document.getElementById('feeList');
    const discountInput = document.getElementById('discountInput');
    const applyDiscountBtn = document.getElementById('applyDiscountBtn');
    const discountPreview = document.getElementById('discountPreview');
    const clearSheetBtn = document.getElementById('clearSheetBtn');
    const saveQuoteBtn = document.getElementById('saveQuoteBtn');
    const sendQuoteBtn = document.getElementById('sendQuoteBtn');
    const previewModal = document.getElementById('previewModal');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const previewContent = document.getElementById('previewContent');
    const editQuoteBtn = document.getElementById('editQuoteBtn');
    const sendNowBtn = document.getElementById('sendNowBtn');
    const backToTypesBtn = document.getElementById('backToTypesBtn');
    
    // Get the calculator card
    const calculatorCard = document.querySelector('.calculator-card');
    
    // Calculator State
    let currentValue = '0';
    let previousValue = '';
    let operation = null;
    let shouldResetScreen = false;
    let currentFeeType = null;
    
    // Quote State
    let quoteItems = [];
    let discountPercent = 0;
    let discountAmount = 0;
    let subtotal = 0;
    let grandTotal = 0;
    
    // Fee Types Configuration (keep this as is from your original file)
    const feeTypes = [
        {
            id: 'hourly',
            name: 'Hourly Rate',
            icon: 'fas fa-clock',
            description: 'Charge per hour of performance',
            fields: [
                { id: 'hours', label: 'Hours', type: 'number', min: 0.5, step: 0.5, placeholder: 'e.g., 2, 3.5, 4' },
                { id: 'rate', label: 'Rate per hour (R)', type: 'number', min: 0, step: 50, placeholder: 'e.g., 500, 750, 1000' }
            ],
            calculate: (data) => {
                const hours = parseFloat(data.hours) || 0;
                const rate = parseFloat(data.rate) || 0;
                return hours * rate;
            },
            format: (data, amount) => {
                return `Performance Fee: ${data.hours} hours × R${data.rate}/hour = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'travel',
            name: 'Travel Distance',
            icon: 'fas fa-car',
            description: 'Charge for travel distance',
            fields: [
                { id: 'distance', label: 'Distance (km)', type: 'number', min: 0, step: 1, placeholder: 'e.g., 40, 100, 250' },
                { id: 'rate', label: 'Rate per km (R)', type: 'number', min: 0, step: 0.5, placeholder: 'e.g., 3.5, 5, 7.5' }
            ],
            calculate: (data) => {
                const distance = parseFloat(data.distance) || 0;
                const rate = parseFloat(data.rate) || 0;
                return distance * rate;
            },
            format: (data, amount) => {
                return `Travel: ${data.distance}km × R${data.rate}/km = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'flat',
            name: 'Flat Fee',
            icon: 'fas fa-money-bill-wave',
            description: 'Fixed amount for service',
            fields: [
                { id: 'amount', label: 'Amount (R)', type: 'number', min: 0, step: 100, placeholder: 'e.g., 2000, 5000, 10000' },
                { id: 'description', label: 'Description', type: 'text', placeholder: 'e.g., Sound System, Setup Fee, etc.' }
            ],
            calculate: (data) => {
                return parseFloat(data.amount) || 0;
            },
            format: (data, amount) => {
                const desc = data.description || 'Flat Fee';
                return `${desc}: R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'equipment',
            name: 'Equipment Rental',
            icon: 'fas fa-volume-up',
            description: 'Sound system & equipment',
            fields: [
                { id: 'systemSize', label: 'System Size', type: 'select', options: ['Small (100 people)', 'Medium (200 people)', 'Large (500 people)', 'X-Large (1000+ people)'] },
                { id: 'duration', label: 'Duration (days)', type: 'number', min: 1, step: 1, placeholder: 'e.g., 1, 2, 3' },
                { id: 'rate', label: 'Daily Rate (R)', type: 'number', min: 0, step: 500, placeholder: 'e.g., 1500, 3000, 5000' }
            ],
            calculate: (data) => {
                const duration = parseFloat(data.duration) || 1;
                const rate = parseFloat(data.rate) || 0;
                return duration * rate;
            },
            format: (data, amount) => {
                return `Equipment Rental (${data.systemSize}): ${data.duration} days × R${data.rate}/day = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'venue',
            name: 'Venue Type',
            icon: 'fas fa-building',
            description: 'Indoor/Outdoor & capacity',
            fields: [
                { id: 'type', label: 'Venue Type', type: 'select', options: ['Indoor (Club/Bar)', 'Outdoor (Festival)', 'Corporate (Conference)', 'Private (Wedding)'] },
                { id: 'capacity', label: 'Expected Audience', type: 'number', min: 0, step: 50, placeholder: 'e.g., 100, 500, 2000' },
                { id: 'rate', label: 'Base Rate (R)', type: 'number', min: 0, step: 1000, placeholder: 'e.g., 5000, 10000, 20000' }
            ],
            calculate: (data) => {
                const baseRate = parseFloat(data.rate) || 0;
                const capacity = parseFloat(data.capacity) || 0;
                // Add 10% for every 100 people over 100
                const multiplier = capacity > 100 ? 1 + ((capacity - 100) / 1000) : 1;
                return baseRate * multiplier;
            },
            format: (data, amount) => {
                return `Venue Fee (${data.type}): Base R${data.rate} for ${data.capacity} people = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'overtime',
            name: 'Overtime',
            icon: 'fas fa-moon',
            description: 'Late night or overtime charges',
            fields: [
                { id: 'hours', label: 'Overtime Hours', type: 'number', min: 0.5, step: 0.5, placeholder: 'e.g., 1, 1.5, 2' },
                { id: 'rate', label: 'Overtime Rate (R/hour)', type: 'number', min: 0, step: 100, placeholder: 'e.g., 750, 1000, 1500' },
                { id: 'multiplier', label: 'Rate Multiplier', type: 'select', options: ['1.5x (Standard)', '2x (Late Night)', '2.5x (Holiday)'] }
            ],
            calculate: (data) => {
                const hours = parseFloat(data.hours) || 0;
                const rate = parseFloat(data.rate) || 0;
                const multiplier = parseFloat(data.multiplier) || 1.5;
                return hours * rate * multiplier;
            },
            format: (data, amount) => {
                return `Overtime: ${data.hours} hours × R${data.rate}/hour × ${data.multiplier} = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'accommodation',
            name: 'Accommodation',
            icon: 'fas fa-hotel',
            description: 'Hotel or lodging costs',
            fields: [
                { id: 'nights', label: 'Number of Nights', type: 'number', min: 1, step: 1, placeholder: 'e.g., 1, 2, 3' },
                { id: 'rate', label: 'Rate per night (R)', type: 'number', min: 0, step: 500, placeholder: 'e.g., 1500, 2500, 4000' },
                { id: 'rooms', label: 'Number of Rooms', type: 'number', min: 1, step: 1, placeholder: 'e.g., 1, 2, 3' }
            ],
            calculate: (data) => {
                const nights = parseFloat(data.nights) || 1;
                const rate = parseFloat(data.rate) || 0;
                const rooms = parseFloat(data.rooms) || 1;
                return nights * rate * rooms;
            },
            format: (data, amount) => {
                return `Accommodation: ${data.nights} nights × ${data.rooms} rooms × R${data.rate}/night = R${amount.toFixed(2)}`;
            }
        },
        {
            id: 'perdiem',
            name: 'Per Diem',
            icon: 'fas fa-utensils',
            description: 'Daily food & expenses',
            fields: [
                { id: 'days', label: 'Number of Days', type: 'number', min: 1, step: 1, placeholder: 'e.g., 1, 2, 3' },
                { id: 'rate', label: 'Daily Rate (R)', type: 'number', min: 0, step: 100, placeholder: 'e.g., 300, 500, 750' },
                { id: 'people', label: 'Number of People', type: 'number', min: 1, step: 1, placeholder: 'e.g., 1, 3, 5' }
            ],
            calculate: (data) => {
                const days = parseFloat(data.days) || 1;
                const rate = parseFloat(data.rate) || 0;
                const people = parseFloat(data.people) || 1;
                return days * rate * people;
            },
            format: (data, amount) => {
                return `Per Diem: ${data.days} days × ${data.people} people × R${data.rate}/day = R${amount.toFixed(2)}`;
            }
        }
    ];
    
    // Initialize
    initCalculator();
    loadFeeTypes();
    loadSavedQuote();
    
    // Calculator Functions
    function initCalculator() {
        // Number buttons
        document.querySelectorAll('.calc-btn[data-number]').forEach(button => {
            button.addEventListener('click', () => appendNumber(button.dataset.number));
        });
        
        // Operation buttons
        document.querySelectorAll('.calc-btn[data-action]').forEach(button => {
            button.addEventListener('click', () => handleOperation(button.dataset.action));
        });
        
        // Add Fee Button - Show inline form
        addFeeBtn.addEventListener('click', showInlineFeeForm);
        
        // Inline form controls
        closeInlineForm.addEventListener('click', hideInlineFeeForm);
        cancelInlineFee.addEventListener('click', hideInlineFeeForm);
        
        // Back to fee types button
        if (backToTypesBtn) {
            backToTypesBtn.addEventListener('click', goBackToFeeTypes);
        }
        
        // Discount
        discountInput.addEventListener('input', updateDiscountPreview);
        applyDiscountBtn.addEventListener('click', applyDiscount);
        
        // Quote management
        clearSheetBtn.addEventListener('click', clearQuote);
        saveQuoteBtn.addEventListener('click', saveQuote);
        sendQuoteBtn.addEventListener('click', previewQuote);
        
        // Preview modal
        closePreviewModal.addEventListener('click', () => {
            previewModal.style.display = 'none';
        });
        editQuoteBtn.addEventListener('click', () => {
            previewModal.style.display = 'none';
        });
        sendNowBtn.addEventListener('click', sendQuote);
        
        // Initialize calculator display
        updateDisplay();
    }
    
    function loadFeeTypes() {
        feeTypeGrid.innerHTML = '';
        feeTypes.forEach(feeType => {
            const card = document.createElement('div');
            card.className = 'fee-type-card';
            card.dataset.type = feeType.id;
            
            card.innerHTML = `
                <div class="fee-type-icon">
                    <i class="${feeType.icon}"></i>
                </div>
                <div class="fee-type-label">${feeType.name}</div>
                <div class="fee-type-desc">${feeType.description}</div>
            `;
            
            card.addEventListener('click', () => selectFeeType(feeType));
            feeTypeGrid.appendChild(card);
        });
    }
    
    function selectFeeType(feeType) {
        currentFeeType = feeType;
        
        // Update UI - mark selected card
        document.querySelectorAll('.fee-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-type="${feeType.id}"]`).classList.add('selected');
        
        // Hide fee type grid
        feeTypeGrid.classList.add('hidden');
        
        // Show centered form
        feeDetailsForm.classList.add('visible');
        selectedFeeTitle.textContent = feeType.name;
        
        // Load form fields
        loadFormFields(feeType);
    }
    
    function goBackToFeeTypes() {
        // Hide form, show fee type grid
        feeDetailsForm.classList.remove('visible');
        feeTypeGrid.classList.remove('hidden');
        currentFeeType = null;
        
        // Reset any selected card
        document.querySelectorAll('.fee-type-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
    
    function loadFormFields(feeType) {
        formFields.innerHTML = '';
        
        feeType.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-field';
            
            let inputHtml = '';
            
            if (field.type === 'select') {
                inputHtml = `
                    <select id="${field.id}" class="fee-field">
                        ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
            } else {
                inputHtml = `
                    <input type="${field.type}" 
                           id="${field.id}" 
                           class="fee-field"
                           ${field.min ? `min="${field.min}"` : ''}
                           ${field.step ? `step="${field.step}"` : ''}
                           placeholder="${field.placeholder || ''}">
                `;
            }
            
            fieldDiv.innerHTML = `
                <label for="${field.id}">${field.label}</label>
                ${inputHtml}
            `;
            
            formFields.appendChild(fieldDiv);
        });
        
        // Add event listeners to fields
        document.querySelectorAll('.fee-field').forEach(field => {
            field.addEventListener('input', updateFeePreview);
        });
        
        updateFeePreview();
        
        // Auto-focus first field
        const firstField = document.querySelector('.fee-field');
        if (firstField) {
            setTimeout(() => firstField.focus(), 100);
        }
    }
    
    function updateFeePreview() {
        if (!currentFeeType) return;
        
        const data = {};
        currentFeeType.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                if (field.type === 'select') {
                    data[field.id] = input.value;
                } else {
                    data[field.id] = input.value || '0';
                }
            }
        });
        
        const amount = currentFeeType.calculate(data);
        previewText.textContent = currentFeeType.format(data, amount);
    }
    
    function addFeeToQuote() {
        if (!currentFeeType) return;
        
        const data = {};
        currentFeeType.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                data[field.id] = input.value || '0';
            }
        });
        
        const amount = currentFeeType.calculate(data);
        const description = currentFeeType.format(data, amount);
        
        // Add to quote items
        quoteItems.push({
            type: currentFeeType.id,
            name: currentFeeType.name,
            description: description,
            amount: amount,
            data: data
        });
        
        // Update display
        updateQuoteDisplay();
        
        // Reset and go back to calculator
        hideInlineFeeForm();
        
        // Reset form
        resetFeeForm();
        
        // Add to calculator display
        if (currentValue === '0' || shouldResetScreen) {
            currentValue = amount.toString();
            shouldResetScreen = false;
        } else {
            currentValue += ' + ' + amount.toString();
        }
        updateDisplay();
        
        // Show success message
        showNotification(`${currentFeeType.name} added to quote!`, 'success');
    }
    
    function resetFeeForm() {
        currentFeeType = null;
        document.querySelectorAll('.fee-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        feeDetailsForm.classList.remove('visible');
        feeTypeGrid.classList.remove('hidden');
        formFields.innerHTML = '';
    }
    
    function showInlineFeeForm() {
        console.log('Add Fee button clicked'); // Debug log
        
        // Hide calculator
        calculatorCard.classList.add('hidden');
        
        // Show fee form
        inlineFeeForm.classList.add('active');
        
        // Reset form state
        resetFeeForm();
        
        console.log('Calculator hidden, fee form shown'); // Debug log
    }
    
    function hideInlineFeeForm() {
        console.log('Hiding fee form'); // Debug log
        
        // Hide fee form
        inlineFeeForm.classList.remove('active');
        
        // Show calculator
        calculatorCard.classList.remove('hidden');
        
        // Reset form
        resetFeeForm();
        
        console.log('Fee form hidden, calculator shown'); // Debug log
    }
    
    function updateQuoteDisplay() {
        // Calculate totals
        subtotal = quoteItems.reduce((sum, item) => sum + item.amount, 0);
        discountAmount = (subtotal * discountPercent) / 100;
        grandTotal = subtotal - discountAmount;
        
        // Update fee list
        if (quoteItems.length === 0) {
            feeList.innerHTML = `
                <div class="empty-fees">
                    <i class="fas fa-calculator"></i>
                    <p>No fees added yet</p>
                    <small>Use the calculator to add fees</small>
                </div>
            `;
        } else {
            feeList.innerHTML = '';
            quoteItems.forEach((item, index) => {
                const feeItem = document.createElement('div');
                feeItem.className = 'fee-item';
                
                feeItem.innerHTML = `
                    <div class="fee-info">
                        <h4>${item.name}</h4>
                        <div class="fee-details">${item.description}</div>
                    </div>
                    <div class="fee-actions">
                        <div class="fee-amount">R ${item.amount.toFixed(2)}</div>
                        <button class="remove-fee" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                feeList.appendChild(feeItem);
            });
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-fee').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    removeFee(index);
                });
            });
        }
        
        // Update totals
        document.getElementById('subtotalAmount').textContent = `R ${subtotal.toFixed(2)}`;
        document.getElementById('discountPercent').textContent = discountPercent.toFixed(1);
        document.getElementById('discountAmount').textContent = `-R ${discountAmount.toFixed(2)}`;
        document.getElementById('grandTotal').textContent = `R ${grandTotal.toFixed(2)}`;
    }
    
    function removeFee(index) {
        quoteItems.splice(index, 1);
        updateQuoteDisplay();
    }
    
    function updateDiscountPreview() {
        const percent = parseFloat(discountInput.value) || 0;
        
        if (percent > 0) {
            const discount = (subtotal * percent) / 100;
            const newTotal = subtotal - discount;
            
            discountPreview.innerHTML = `
                <div><strong>Preview:</strong> ${percent}% discount = -R ${discount.toFixed(2)}</div>
                <div><small>New total: R ${newTotal.toFixed(2)}</small></div>
            `;
            discountPreview.style.display = 'block';
        } else {
            discountPreview.style.display = 'none';
        }
    }
    
    function applyDiscount() {
        discountPercent = parseFloat(discountInput.value) || 0;
        updateQuoteDisplay();
        updateDiscountPreview();
        
        // Show success message
        showNotification(`Discount of ${discountPercent}% applied!`, 'success');
    }
    
    function clearQuote() {
        if (confirm('Are you sure you want to clear the entire quote?')) {
            quoteItems = [];
            discountPercent = 0;
            discountInput.value = '';
            updateQuoteDisplay();
            discountPreview.style.display = 'none';
            showNotification('Quote cleared', 'info');
        }
    }
    
    function saveQuote() {
        const quote = {
            items: quoteItems,
            discount: discountPercent,
            clientName: document.getElementById('clientName').value,
            clientEmail: document.getElementById('clientEmail').value,
            eventName: document.getElementById('eventName').value,
            eventDate: document.getElementById('eventDate').value,
            notes: document.getElementById('quoteNotes').value,
            subtotal: subtotal,
            discountAmount: discountAmount,
            grandTotal: grandTotal,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('vivoQuote', JSON.stringify(quote));
        showNotification('Quote saved successfully!', 'success');
    }
    
    function loadSavedQuote() {
        const saved = localStorage.getItem('vivoQuote');
        if (saved) {
            try {
                const quote = JSON.parse(saved);
                quoteItems = quote.items || [];
                discountPercent = quote.discount || 0;
                
                // Fill in form fields
                if (quote.clientName) document.getElementById('clientName').value = quote.clientName;
                if (quote.clientEmail) document.getElementById('clientEmail').value = quote.clientEmail;
                if (quote.eventName) document.getElementById('eventName').value = quote.eventName;
                if (quote.eventDate) document.getElementById('eventDate').value = quote.eventDate;
                if (quote.notes) document.getElementById('quoteNotes').value = quote.notes;
                
                if (discountPercent > 0) {
                    discountInput.value = discountPercent;
                }
                
                updateQuoteDisplay();
                showNotification('Previous quote loaded', 'info');
            } catch (e) {
                console.error('Error loading quote:', e);
            }
        }
    }
    
    function previewQuote() {
        // Validate required fields
        const clientName = document.getElementById('clientName').value.trim();
        const eventName = document.getElementById('eventName').value.trim();
        
        if (!clientName || !eventName) {
            showNotification('Please fill in client name and event name', 'error');
            return;
        }
        
        if (quoteItems.length === 0) {
            showNotification('Please add at least one fee to the quote', 'error');
            return;
        }
        
        // Generate preview
        generatePreview();
        previewModal.style.display = 'flex';
    }
    
    function generatePreview() {
        const clientName = document.getElementById('clientName').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const eventName = document.getElementById('eventName').value;
        const eventDate = document.getElementById('eventDate').value;
        const notes = document.getElementById('quoteNotes').value;
        
        // Format date
        let formattedDate = 'TBD';
        if (eventDate) {
            const date = new Date(eventDate);
            formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Generate preview HTML
        let itemsHtml = '';
        quoteItems.forEach(item => {
            itemsHtml += `
                <div class="preview-item">
                    <div class="preview-item-desc">${item.description}</div>
                    <div class="preview-item-amount">R ${item.amount.toFixed(2)}</div>
                </div>
            `;
        });
        
        previewContent.innerHTML = `
            <div class="preview-header">
                <h2 style="color: var(--primary); margin-bottom: 5px;">QUOTE</h2>
                <p style="color: var(--gray-light); margin-bottom: 20px;">Generated by Vivo Distro</p>
            </div>
            
            <div class="preview-client-info">
                <div class="info-row">
                    <div>
                        <h4 style="color: var(--light); margin-bottom: 5px;">To:</h4>
                        <p style="color: var(--gray-light);">${clientName}</p>
                        ${clientEmail ? `<p style="color: var(--gray-light);">${clientEmail}</p>` : ''}
                    </div>
                    <div>
                        <h4 style="color: var(--light); margin-bottom: 5px;">Event:</h4>
                        <p style="color: var(--gray-light);">${eventName}</p>
                        <p style="color: var(--gray-light);">${formattedDate}</p>
                    </div>
                </div>
            </div>
            
            <div class="preview-items" style="margin: 30px 0;">
                <h4 style="color: var(--light); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">FEE BREAKDOWN</h4>
                ${itemsHtml}
            </div>
            
            <div class="preview-totals" style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 10px; margin: 30px 0;">
                <div class="total-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="color: var(--light);">Subtotal:</span>
                    <span style="color: var(--light);">R ${subtotal.toFixed(2)}</span>
                </div>
                ${discountPercent > 0 ? `
                    <div class="total-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: var(--success);">
                        <span>Discount (${discountPercent}%):</span>
                        <span>-R ${discountAmount.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="total-row" style="display: flex; justify-content: space-between; padding: 15px 0; font-size: 1.2rem; font-weight: 700; color: var(--primary);">
                    <span>TOTAL:</span>
                    <span>R ${grandTotal.toFixed(2)}</span>
                </div>
            </div>
            
            ${notes ? `
                <div class="preview-notes" style="margin: 30px 0;">
                    <h4 style="color: var(--light); margin-bottom: 10px;">NOTES</h4>
                    <p style="color: var(--gray-light); padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px;">${notes}</p>
                </div>
            ` : ''}
            
            <div class="preview-footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; color: var(--gray-light); font-size: 0.9rem;">
                <p>Thank you for considering our services. This quote is valid for 30 days.</p>
                <p>For any questions, please contact us through Vivo Distro.</p>
            </div>
        `;
    }
    
    function sendQuote() {
        // In the future, this would integrate with Vivo Chat
        // For now, just show a success message
        
        // Save the quote first
        saveQuote();
        
        showNotification('Quote sent to client! (Chat integration coming soon)', 'success');
        
        // Close preview
        setTimeout(() => {
            previewModal.style.display = 'none';
        }, 1000);
    }
    
    // Calculator Logic
    function appendNumber(number) {
        if (shouldResetScreen) {
            currentValue = '';
            shouldResetScreen = false;
        }
        
        if (number === '.' && currentValue.includes('.')) return;
        if (currentValue === '0' && number !== '.') {
            currentValue = number;
        } else {
            currentValue += number;
        }
        updateDisplay();
    }
    
    function handleOperation(op) {
        switch(op) {
            case 'clear':
                currentValue = '0';
                previousValue = '';
                operation = null;
                break;
                
            case 'backspace':
                if (currentValue.length > 1) {
                    currentValue = currentValue.slice(0, -1);
                } else {
                    currentValue = '0';
                }
                break;
                
            case 'percentage':
                currentValue = (parseFloat(currentValue) / 100).toString();
                break;
                
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                if (previousValue !== '' && operation !== null) {
                    calculate();
                }
                operation = op;
                previousValue = currentValue;
                shouldResetScreen = true;
                break;
                
            case 'equals':
                if (previousValue !== '' && operation !== null) {
                    calculate();
                    operation = null;
                    previousValue = '';
                }
                break;
                
            case 'decimal':
                if (!currentValue.includes('.')) {
                    currentValue += '.';
                }
                break;
        }
        updateDisplay();
    }
    
    function calculate() {
        const prev = parseFloat(previousValue);
        const current = parseFloat(currentValue);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch(operation) {
            case 'add':
                currentValue = (prev + current).toString();
                break;
            case 'subtract':
                currentValue = (prev - current).toString();
                break;
            case 'multiply':
                currentValue = (prev * current).toString();
                break;
            case 'divide':
                currentValue = current !== 0 ? (prev / current).toString() : 'Error';
                break;
        }
        
        // Store the operation in history
        const opSymbol = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷'
        }[operation];
        
        if (opSymbol) {
            calcOperations.textContent = `${previousValue} ${opSymbol} ${current}`;
        }
    }
    
    function updateDisplay() {
        calcScreen.textContent = currentValue;
    }
    
    // Helper function for notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
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
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Set up add to quote button for inline form
    addToQuoteInline.addEventListener('click', addFeeToQuote);
});