// calculator.js - COMPLETE WITH DEPOSIT, NO NEGATIVE, IMPROVED QUOTE

document.addEventListener('DOMContentLoaded', function() {
    // ========== DOM ELEMENTS ==========
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
    const depositType = document.getElementById('depositType');
    const depositValue = document.getElementById('depositValue');
    const applyDepositBtn = document.getElementById('applyDepositBtn');
    const depositPreview = document.getElementById('depositPreview');
    const clearSheetBtn = document.getElementById('clearSheetBtn');
    const saveQuoteBtn = document.getElementById('saveQuoteBtn');
    const sendQuoteBtn = document.getElementById('sendQuoteBtn');
    const previewModal = document.getElementById('previewModal');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const previewContent = document.getElementById('previewContent');
    const editQuoteBtn = document.getElementById('editQuoteBtn');
    const sendNowBtn = document.getElementById('sendNowBtn');
    const backToTypesBtn = document.getElementById('backToTypesBtn');

    const calculatorCard = document.querySelector('.calculator-card');

    // ========== STATE ==========
    let currentValue = '0';
    let previousValue = '';
    let operation = null;
    let shouldResetScreen = false;
    let currentFeeType = null;

    let quoteItems = [];
    let discountPercent = 0;
    let depositPercent = 0;
    let depositFixed = 0;
    let subtotal = 0;
    let discountAmount = 0;
    let depositAmount = 0;
    let grandTotal = 0; // total after discount

    // ========== FEE TYPES CONFIGURATION ==========
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
                return Math.max(0, hours * rate);
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
                return Math.max(0, distance * rate);
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
                return Math.max(0, parseFloat(data.amount) || 0);
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
                return Math.max(0, duration * rate);
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
                const multiplier = capacity > 100 ? 1 + ((capacity - 100) / 1000) : 1;
                return Math.max(0, baseRate * multiplier);
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
                return Math.max(0, hours * rate * multiplier);
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
                return Math.max(0, nights * rate * rooms);
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
                return Math.max(0, days * rate * people);
            },
            format: (data, amount) => {
                return `Per Diem: ${data.days} days × ${data.people} people × R${data.rate}/day = R${amount.toFixed(2)}`;
            }
        }
    ];

    // ========== INITIALIZATION ==========
    initCalculator();
    loadFeeTypes();
    loadSavedQuote();

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

        // Deposit
        depositValue.addEventListener('input', updateDepositPreview);
        applyDepositBtn.addEventListener('click', applyDeposit);

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
                <div class="fee-type-icon"><i class="${feeType.icon}"></i></div>
                <div class="fee-type-label">${feeType.name}</div>
                <div class="fee-type-desc">${feeType.description}</div>
            `;
            card.addEventListener('click', () => selectFeeType(feeType));
            feeTypeGrid.appendChild(card);
        });
    }

    function selectFeeType(feeType) {
        currentFeeType = feeType;
        document.querySelectorAll('.fee-type-card').forEach(card => card.classList.remove('selected'));
        document.querySelector(`[data-type="${feeType.id}"]`).classList.add('selected');
        feeTypeGrid.classList.add('hidden');
        feeDetailsForm.classList.add('visible');
        selectedFeeTitle.textContent = feeType.name;
        loadFormFields(feeType);
    }

    function goBackToFeeTypes() {
        feeDetailsForm.classList.remove('visible');
        feeTypeGrid.classList.remove('hidden');
        currentFeeType = null;
        document.querySelectorAll('.fee-type-card').forEach(card => card.classList.remove('selected'));
    }

    function loadFormFields(feeType) {
        formFields.innerHTML = '';
        feeType.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-field';
            let inputHtml = '';
            if (field.type === 'select') {
                inputHtml = `<select id="${field.id}" class="fee-field">${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`;
            } else {
                inputHtml = `<input type="${field.type}" id="${field.id}" class="fee-field" ${field.min ? `min="${field.min}"` : ''} ${field.step ? `step="${field.step}"` : ''} placeholder="${field.placeholder || ''}">`;
            }
            fieldDiv.innerHTML = `<label for="${field.id}">${field.label}</label>${inputHtml}`;
            formFields.appendChild(fieldDiv);
        });
        document.querySelectorAll('.fee-field').forEach(field => field.addEventListener('input', updateFeePreview));
        updateFeePreview();
        const firstField = document.querySelector('.fee-field');
        if (firstField) setTimeout(() => firstField.focus(), 100);
    }

    function updateFeePreview() {
        if (!currentFeeType) return;
        const data = {};
        currentFeeType.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) data[field.id] = input.value || '0';
        });
        const amount = currentFeeType.calculate(data);
        previewText.textContent = currentFeeType.format(data, amount);
    }

    function addFeeToQuote() {
        if (!currentFeeType) return;
        const data = {};
        currentFeeType.fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) data[field.id] = input.value || '0';
        });
        const amount = currentFeeType.calculate(data);
        const description = currentFeeType.format(data, amount);
        quoteItems.push({
            type: currentFeeType.id,
            name: currentFeeType.name,
            description: description,
            amount: amount,
            data: data
        });
        updateQuoteDisplay();
        hideInlineFeeForm();
        resetFeeForm();
        if (currentValue === '0' || shouldResetScreen) {
            currentValue = amount.toString();
            shouldResetScreen = false;
        } else {
            currentValue += ' + ' + amount.toString();
        }
        updateDisplay();
        showNotification(`${currentFeeType.name} added to quote!`, 'success');
    }

    function resetFeeForm() {
        currentFeeType = null;
        document.querySelectorAll('.fee-type-card').forEach(card => card.classList.remove('selected'));
        feeDetailsForm.classList.remove('visible');
        feeTypeGrid.classList.remove('hidden');
        formFields.innerHTML = '';
    }

    function showInlineFeeForm() {
        calculatorCard.classList.add('hidden');
        inlineFeeForm.classList.add('active');
        resetFeeForm();
    }

    function hideInlineFeeForm() {
        inlineFeeForm.classList.remove('active');
        calculatorCard.classList.remove('hidden');
        resetFeeForm();
    }

    function updateQuoteDisplay() {
        subtotal = quoteItems.reduce((sum, item) => sum + item.amount, 0);
        discountAmount = (subtotal * discountPercent) / 100;
        let afterDiscount = subtotal - discountAmount;
        if (afterDiscount < 0) afterDiscount = 0;

        // Deposit calculation
        if (depositType.value === 'percent') {
            depositAmount = (afterDiscount * depositPercent) / 100;
        } else {
            depositAmount = depositFixed;
        }
        // Deposit cannot exceed total after discount
        if (depositAmount > afterDiscount) depositAmount = afterDiscount;

        grandTotal = afterDiscount; // total after discount

        // Render fee list
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
                        <button class="remove-fee" data-index="${index}"><i class="fas fa-times"></i></button>
                    </div>
                `;
                feeList.appendChild(feeItem);
            });
            document.querySelectorAll('.remove-fee').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    quoteItems.splice(index, 1);
                    updateQuoteDisplay();
                });
            });
        }

        // Update totals display
        document.getElementById('subtotalAmount').textContent = `R ${subtotal.toFixed(2)}`;
        document.getElementById('discountPercent').textContent = discountPercent.toFixed(1);
        document.getElementById('discountAmount').textContent = `-R ${discountAmount.toFixed(2)}`;
        document.getElementById('depositAmount').textContent = `R ${depositAmount.toFixed(2)}`;
        document.getElementById('grandTotal').textContent = `R ${grandTotal.toFixed(2)}`;
    }

    function updateDiscountPreview() {
        const percent = parseFloat(discountInput.value) || 0;
        if (percent > 0) {
            const discount = (subtotal * percent) / 100;
            discountPreview.innerHTML = `<div><strong>Preview:</strong> ${percent}% discount = -R ${discount.toFixed(2)}</div>`;
            discountPreview.style.display = 'block';
        } else {
            discountPreview.style.display = 'none';
        }
    }

    function applyDiscount() {
        discountPercent = parseFloat(discountInput.value) || 0;
        updateQuoteDisplay();
        updateDiscountPreview();
        showNotification(`Discount of ${discountPercent}% applied!`, 'success');
    }

    function updateDepositPreview() {
        const type = depositType.value;
        const val = parseFloat(depositValue.value) || 0;
        if (val > 0) {
            const afterDiscount = subtotal - (subtotal * discountPercent / 100);
            let dep = type === 'percent' ? (afterDiscount * val / 100) : val;
            if (dep > afterDiscount) dep = afterDiscount;
            depositPreview.innerHTML = `<div><strong>Deposit:</strong> ${type === 'percent' ? val+'%' : 'R'+val} = R ${dep.toFixed(2)}</div>`;
            depositPreview.style.display = 'block';
        } else {
            depositPreview.style.display = 'none';
        }
    }

    function applyDeposit() {
        depositPercent = depositType.value === 'percent' ? parseFloat(depositValue.value) || 0 : 0;
        depositFixed = depositType.value === 'fixed' ? parseFloat(depositValue.value) || 0 : 0;
        updateQuoteDisplay();
        updateDepositPreview();
        showNotification('Deposit applied!', 'success');
    }

    function clearQuote() {
        if (confirm('Are you sure you want to clear the entire quote?')) {
            quoteItems = [];
            discountPercent = 0;
            depositPercent = 0;
            depositFixed = 0;
            discountInput.value = '';
            depositValue.value = '';
            discountPreview.style.display = 'none';
            depositPreview.style.display = 'none';
            updateQuoteDisplay();
            showNotification('Quote cleared', 'info');
        }
    }

    function saveQuote() {
        const quote = {
            items: quoteItems,
            discount: discountPercent,
            deposit: { type: depositType.value, value: depositPercent || depositFixed },
            clientName: document.getElementById('clientName').value,
            clientEmail: document.getElementById('clientEmail').value,
            eventName: document.getElementById('eventName').value,
            eventDate: document.getElementById('eventDate').value,
            notes: document.getElementById('quoteNotes').value,
            subtotal: subtotal,
            discountAmount: discountAmount,
            depositAmount: depositAmount,
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
                if (quote.deposit) {
                    depositType.value = quote.deposit.type;
                    depositValue.value = quote.deposit.value;
                    depositPercent = quote.deposit.type === 'percent' ? quote.deposit.value : 0;
                    depositFixed = quote.deposit.type === 'fixed' ? quote.deposit.value : 0;
                }
                document.getElementById('clientName').value = quote.clientName || '';
                document.getElementById('clientEmail').value = quote.clientEmail || '';
                document.getElementById('eventName').value = quote.eventName || '';
                document.getElementById('eventDate').value = quote.eventDate || '';
                document.getElementById('quoteNotes').value = quote.notes || '';
                if (discountPercent > 0) discountInput.value = discountPercent;
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
        generatePreview();
        previewModal.style.display = 'flex';
    }

    function generatePreview() {
        const clientName = document.getElementById('clientName').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const eventName = document.getElementById('eventName').value;
        const eventDate = document.getElementById('eventDate').value;
        const notes = document.getElementById('quoteNotes').value;

        let formattedDate = 'TBD';
        if (eventDate) {
            const date = new Date(eventDate);
            formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Build items HTML
        let itemsHtml = '';
        quoteItems.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #cbd5e0;">${item.description}</span>
                    <span style="font-weight: 600; color: #fff;">R ${item.amount.toFixed(2)}</span>
                </div>
            `;
        });

        // Build totals HTML
        const afterDiscount = subtotal - discountAmount;
        const remaining = afterDiscount - depositAmount;

        previewContent.innerHTML = `
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #6C63FF; margin-bottom: 5px;">QUOTE</h2>
                    <p style="color: #8892b0;">Generated by Vivo Distro</p>
                </div>

                <div style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h4 style="color: #fff; margin-bottom: 10px;">To:</h4>
                            <p style="color: #cbd5e0;">${clientName}</p>
                            ${clientEmail ? `<p style="color: #cbd5e0;">${clientEmail}</p>` : ''}
                        </div>
                        <div>
                            <h4 style="color: #fff; margin-bottom: 10px;">Event:</h4>
                            <p style="color: #cbd5e0;">${eventName}</p>
                            <p style="color: #cbd5e0;">${formattedDate}</p>
                        </div>
                    </div>
                </div>

                <h4 style="color: #fff; margin-bottom: 15px;">Fee Breakdown</h4>
                ${itemsHtml}

                <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #cbd5e0;">Subtotal:</span>
                        <span style="color: #fff;">R ${subtotal.toFixed(2)}</span>
                    </div>
                    ${discountPercent > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #ED8936;">
                        <span>Discount (${discountPercent}%):</span>
                        <span>-R ${discountAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 600;">
                        <span style="color: #fff;">Total after discount:</span>
                        <span style="color: #fff;">R ${afterDiscount.toFixed(2)}</span>
                    </div>
                    ${depositAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #48BB78;">
                        <span>Deposit required:</span>
                        <span>R ${depositAmount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #cbd5e0;">Remaining balance:</span>
                        <span style="color: #fff;">R ${remaining.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>

                ${notes ? `
                <div style="margin-bottom: 30px;">
                    <h4 style="color: #fff; margin-bottom: 10px;">Notes</h4>
                    <p style="color: #cbd5e0; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">${notes}</p>
                </div>
                ` : ''}

                <div style="text-align: center; color: #8892b0; font-size: 0.9rem;">
                    <p>Thank you for considering our services. This quote is valid for 30 days.</p>
                    <p>For any questions, please contact us through Vivo Distro.</p>
                </div>
            </div>
        `;
    }

    function sendQuote() {
        saveQuote();
        showNotification('Quote sent to client! (Integration coming soon)', 'success');
        setTimeout(() => {
            previewModal.style.display = 'none';
        }, 1000);
    }

    // ========== CALCULATOR LOGIC ==========
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
        switch (op) {
            case 'clear':
                currentValue = '0';
                previousValue = '';
                operation = null;
                calcOperations.textContent = '';
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
        const curr = parseFloat(currentValue);
        if (isNaN(prev) || isNaN(curr)) return;

        let result;
        switch (operation) {
            case 'add': result = prev + curr; break;
            case 'subtract': result = prev - curr; break;
            case 'multiply': result = prev * curr; break;
            case 'divide': result = curr !== 0 ? prev / curr : NaN; break;
        }
        if (isNaN(result) || result < 0) result = 0;
        currentValue = result.toString();

        const opSymbol = { add: '+', subtract: '−', multiply: '×', divide: '÷' }[operation];
        if (opSymbol) {
            calcOperations.textContent = `${previousValue} ${opSymbol} ${curr}`;
        }
    }

    function updateDisplay() {
        calcScreen.textContent = currentValue;
    }

    // ========== NOTIFICATION ==========
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

    // Attach add to quote button
    addToQuoteInline.addEventListener('click', addFeeToQuote);
});