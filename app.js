




let wardrobe = [];
let wearingLog = [];
let activeTab = 'closet';
let activeStream = null;
let currentPhotoData = null;
let selectedColorName = null;


let stylistOccasion = 'Casual';
let stylistWeather = 'Mild';


const COLOR_PALETTE = [
    { name: 'Black', hex: '#111111' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Grey', hex: '#6b7280' },
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Blue', stroke: '#3b82f6', hex: '#3b82f6' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Beige', hex: '#d97706' },
    { name: 'Brown', hex: '#78350f' },
    { name: 'Yellow', hex: '#eab308' }
];


document.addEventListener('DOMContentLoaded', () => {
    
    initColorSwatches();
    
    
    loadCloset();
    loadWearingLog();

    
    
    
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('log-date').value = today;

    
    updateUIState();
    
    
    switchTab('closet');
});




function switchTab(tabId) {
    activeTab = tabId;
    
    
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-tab-${tabId}`);
    if (targetBtn) targetBtn.classList.add('active');

    
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`tab-content-${tabId}`).classList.add('active');

    
    const titleHeader = document.getElementById('header-title');
    const badgeContainer = document.getElementById('pieces-badge-container');
    
    if (tabId === 'closet') {
        titleHeader.innerText = 'Closet';
        badgeContainer.style.display = 'block';
        renderClosetGrid(wardrobe);
    } else if (tabId === 'log') {
        titleHeader.innerText = 'Wearing Log';
        badgeContainer.style.display = 'none';
        populateLogSelectors();
        renderLogHistory();
    } else if (tabId === 'add') {
        titleHeader.innerText = 'Add Garment';
        badgeContainer.style.display = 'none';
        initCamera();
    } else if (tabId === 'stylist') {
        titleHeader.innerText = 'Stylist';
        badgeContainer.style.display = 'none';
        
        generateOutfits();
    } else if (tabId === 'insights') {
        titleHeader.innerText = 'Insights';
        badgeContainer.style.display = 'none';
        generateWardrobeInsights();
    }

    
    if (tabId !== 'add') {
        stopCamera();
    }
}




async function initCamera() {
    const video = document.getElementById('camera-feed');
    const overlay = document.getElementById('camera-overlay');
    
    if (document.getElementById('upload-preview-container').style.display === 'block') {
        return;
    }

    try {
        overlay.style.display = 'flex';
        overlay.querySelector('.overlay-text').innerText = 'Starting Camera...';

        if (activeStream) {
            stopCamera();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 640 },
            audio: false
        });
        
        activeStream = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            overlay.style.display = 'none';
        };
    } catch (e) {
        console.warn('Camera failed to start, fallback mode active:', e);
        overlay.style.display = 'flex';
        overlay.querySelector('.overlay-text').innerHTML = `
            📷 Camera blocked or unavailable.<br>
            Please use <strong>Upload Photo</strong>.
        `;
    }
}

function stopCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
        document.getElementById('camera-feed').srcObject = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('snapshot-canvas');
    const isUploaded = document.getElementById('upload-preview-container').style.display === 'block';

    if (isUploaded) {
        const previewImg = document.getElementById('uploaded-image-preview');
        currentPhotoData = previewImg.src;
        openMetadataModal(currentPhotoData);
    } else {
        if (!activeStream) {
            alert('Camera stream is inactive. Please use file upload fallback.');
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        
        
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
        compressImage(rawUrl, (compressedUrl) => {
            currentPhotoData = compressedUrl;
            openMetadataModal(currentPhotoData);
        });
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        stopCamera();
        document.getElementById('camera-overlay').style.display = 'none';
        
        const previewContainer = document.getElementById('upload-preview-container');
        const previewImg = document.getElementById('uploaded-image-preview');
        previewImg.src = event.target.result;
        previewContainer.style.display = 'block';
        
        currentPhotoData = event.target.result;
    };
    reader.readAsDataURL(file);
}

function resetUploadPreview() {
    document.getElementById('upload-preview-container').style.display = 'none';
    document.getElementById('uploaded-image-preview').src = '';
    document.getElementById('file-upload-input').value = '';
    currentPhotoData = null;
    initCamera();
}

function compressImage(dataUrl, callback) {
    const img = new Image();
    img.onload = () => {
        const targetDim = 320;
        let w = img.width;
        let h = img.height;
        
        if (w > h) {
            h = Math.round((h * targetDim) / w);
            w = targetDim;
        } else {
            w = Math.round((w * targetDim) / h);
            h = targetDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        callback(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = dataUrl;
}




function initColorSwatches() {
    const container = document.getElementById('color-swatches-container');
    container.innerHTML = '';
    
    COLOR_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = color.hex;
        swatch.setAttribute('data-color-name', color.name);
        swatch.onclick = () => {
            container.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            selectedColorName = color.name;
            document.getElementById('garment-color').value = color.name;
        };
        container.appendChild(swatch);
    });
}

function openMetadataModal(imgSrc) {
    document.getElementById('modal-image-view').src = imgSrc;
    document.getElementById('metadata-modal').classList.add('open');
    document.getElementById('garment-name').focus();
    
    
    document.getElementById('garment-name').value = '';
    document.getElementById('garment-category').selectedIndex = 0;
    document.getElementById('garment-pattern').selectedIndex = 0;
    document.getElementById('garment-occasion').selectedIndex = 0;
    document.getElementById('garment-color').value = '';
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
    selectedColorName = null;
}

function closeModal() {
    document.getElementById('metadata-modal').classList.remove('open');
}

function handleCategoryChange() {
    const nameInput = document.getElementById('garment-name');
    const categorySelect = document.getElementById('garment-category');
    if (nameInput.value === '') {
        nameInput.value = `My ${categorySelect.options[categorySelect.selectedIndex].text}`;
    }
}

function saveGarment(e) {
    e.preventDefault();
    const name = document.getElementById('garment-name').value.trim();
    const category = document.getElementById('garment-category').value;
    const color = document.getElementById('garment-color').value;
    const pattern = document.getElementById('garment-pattern').value;
    const occasion = document.getElementById('garment-occasion').value;

    if (!name || !category || !color || !pattern || !occasion) {
        alert('Please fill out all fields and pick a swatch color.');
        return;
    }

    compressImage(currentPhotoData, (finalImg) => {
        const item = {
            id: Date.now().toString(),
            name: name,
            category: category,
            color: color,
            pattern: pattern,
            occasion: occasion,
            image: finalImg,
            createdAt: new Date().toISOString()
        };

        wardrobe.push(item);
        saveCloset();
        updateUIState();
        closeModal();
        resetUploadPreview();
        
        switchTab('closet');
    });
}




function updateUIState() {
    const countEl = document.getElementById('pieces-count');
    countEl.innerText = wardrobe.length;

    
    const emptyState = document.getElementById('closet-empty-state');
    const grid = document.getElementById('clothes-grid');
    const filters = document.getElementById('closet-filters');
    const warningBanner = document.getElementById('onboarding-banner');

    const topsCount = wardrobe.filter(item => ['shirt', 'tshirt', 'sweater'].includes(item.category)).length;
    const bottomsCount = wardrobe.filter(item => ['pants', 'trouser', 'shorts', 'skirt'].includes(item.category)).length;

    
    if (topsCount >= 1 && bottomsCount >= 1) {
        warningBanner.style.display = 'none';
    } else {
        warningBanner.style.display = 'flex';
    }

    if (wardrobe.length === 0) {
        emptyState.style.display = 'flex';
        grid.style.display = 'none';
        filters.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';
        filters.style.display = 'flex';
    }
}

function renderClosetGrid(items) {
    const grid = document.getElementById('clothes-grid');
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: span 2;">
                <p>No matching closet pieces found.</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'garment-card';
        
        const matchingColor = COLOR_PALETTE.find(c => c.name.toLowerCase() === item.color.toLowerCase());
        const colorHex = matchingColor ? matchingColor.hex : '#ffffff';

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${item.image}" alt="${item.name}">
                <button type="button" class="btn-delete-garment" onclick="deleteGarment('${item.id}')">✕</button>
            </div>
            <div class="card-details">
                <h3>${item.name}</h3>
                <div class="card-badges">
                    <span class="badge-tag">${capitalize(item.category)}</span>
                    <span class="badge-tag badge-color">
                        <span class="badge-color-dot" style="background-color: ${colorHex}"></span>
                        ${item.color}
                    </span>
                    <span class="badge-tag">${item.occasion}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterCloset() {
    const category = document.getElementById('filter-category').value;
    const color = document.getElementById('filter-color').value;

    let filtered = [...wardrobe];
    if (category !== 'all') {
        if (category === 'top') {
            filtered = filtered.filter(item => ['shirt', 'tshirt', 'sweater'].includes(item.category));
        } else if (category === 'bottom') {
            filtered = filtered.filter(item => ['pants', 'trouser', 'shorts', 'skirt'].includes(item.category));
        } else {
            filtered = filtered.filter(item => item.category === category);
        }
    }
    if (color !== 'all') {
        filtered = filtered.filter(item => item.color === color);
    }
    renderClosetGrid(filtered);
}

function deleteGarment(id) {
    if (confirm('Delete this garment from your closet?')) {
        wardrobe = wardrobe.filter(item => item.id !== id);
        
        wearingLog = wearingLog.filter(log => log.topId !== id && log.bottomId !== id);
        saveCloset();
        saveWearingLog();
        updateUIState();
        renderClosetGrid(wardrobe);
    }
}




function populateLogSelectors() {
    const topSelect = document.getElementById('log-top-select');
    const bottomSelect = document.getElementById('log-bottom-select');

    topSelect.innerHTML = '<option value="" disabled selected>Choose top...</option>';
    bottomSelect.innerHTML = '<option value="" disabled selected>Choose bottom...</option>';

    const tops = wardrobe.filter(item => ['shirt', 'tshirt', 'sweater'].includes(item.category));
    const bottoms = wardrobe.filter(item => ['pants', 'trouser', 'shorts', 'skirt'].includes(item.category));

    tops.forEach(item => {
        topSelect.innerHTML += `<option value="${item.id}">${item.name} (${item.color})</option>`;
    });

    bottoms.forEach(item => {
        bottomSelect.innerHTML += `<option value="${item.id}">${item.name} (${item.color})</option>`;
    });
}

function saveLogEntry(e) {
    e.preventDefault();
    const date = document.getElementById('log-date').value;
    const topId = document.getElementById('log-top-select').value;
    const bottomId = document.getElementById('log-bottom-select').value;

    if (!date || !topId || !bottomId) {
        alert('Please fill in date and clothes selection.');
        return;
    }

    
    wearingLog = wearingLog.filter(log => log.date !== date);

    const logEntry = {
        id: Date.now().toString(),
        date: date,
        topId: topId,
        bottomId: bottomId
    };

    wearingLog.push(logEntry);
    saveWearingLog();
    renderLogHistory();
    
    
    document.getElementById('log-top-select').selectedIndex = 0;
    document.getElementById('log-bottom-select').selectedIndex = 0;
}

function renderLogHistory() {
    const list = document.getElementById('timeline-list');
    const empty = document.getElementById('log-empty-state');
    list.innerHTML = '';

    if (wearingLog.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';

    
    const sortedLogs = [...wearingLog].sort((a, b) => b.date.localeCompare(a.date));

    sortedLogs.forEach(entry => {
        
        const top = wardrobe.find(i => i.id === entry.topId);
        const bottom = wardrobe.find(i => i.id === entry.bottomId);

        if (!top || !bottom) return; 

        const formattedDate = formatDateString(entry.date);
        
        const row = document.createElement('div');
        row.className = 'log-timeline-item';
        row.innerHTML = `
            <div class="log-item-date">
                <span class="log-date-header">${formattedDate}</span>
                <span class="log-garments-desc">${top.name} + ${bottom.name}</span>
            </div>
            <div class="log-item-visuals">
                <div class="log-mini-thumb" title="${top.name}">
                    <img src="${top.image}" alt="">
                </div>
                <div class="log-mini-thumb" title="${bottom.name}">
                    <img src="${bottom.image}" alt="">
                </div>
            </div>
        `;
        list.appendChild(row);
    });
}

function saveWearingLog() {
    localStorage.setItem('aura_wearing_log', JSON.stringify(wearingLog));
}

function loadWearingLog() {
    const raw = localStorage.getItem('aura_wearing_log');
    if (raw) {
        try {
            wearingLog = JSON.parse(raw);
        } catch (e) {
            wearingLog = [];
        }
    }
}




function setPref(type, value, btnEl) {
    const container = btnEl.parentElement;
    container.querySelectorAll('.pref-pill').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');

    if (type === 'occasion') {
        stylistOccasion = value;
    } else if (type === 'weather') {
        stylistWeather = value;
    }
    
    
    generateOutfits();
}

function generateOutfits() {
    const list = document.getElementById('outfits-list');
    const empty = document.getElementById('match-empty-state');
    
    const tops = wardrobe.filter(item => ['shirt', 'tshirt', 'sweater'].includes(item.category));
    const bottoms = wardrobe.filter(item => ['pants', 'trouser', 'shorts', 'skirt'].includes(item.category));

    if (tops.length === 0 || bottoms.length === 0) {
        empty.style.display = 'flex';
        list.style.display = 'none';
        empty.innerHTML = `
            <span class="empty-icon">⚠️</span>
            <h3>Insufficient Items</h3>
            <p>You have ${tops.length} tops and ${bottoms.length} bottoms. Add at least 1 top and 1 bottom to run the coordinate engine.</p>
        `;
        return;
    }

    empty.style.display = 'flex';
    list.style.display = 'none';
    empty.innerHTML = `
        <div class="scanner-animation-wrapper">
            <div class="radar-spinner"></div>
            <p>AI Stylist choosing coordinate combos...</p>
        </div>
    `;

    setTimeout(() => {
        const matchingPairs = [];

        tops.forEach(top => {
            bottoms.forEach(bottom => {
                const analysis = evaluatePreferenceOutfit(top, bottom, stylistOccasion, stylistWeather);
                if (analysis.score >= 50) {
                    matchingPairs.push({
                        top: top,
                        bottom: bottom,
                        analysis: analysis
                    });
                }
            });
        });

        
        matchingPairs.sort((a, b) => b.analysis.score - a.analysis.score);

        empty.style.display = 'none';
        list.style.display = 'flex';
        list.innerHTML = '';

        if (matchingPairs.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>No suggestions found</h3>
                    <p>No outfits matched your weather and occasion profiles. Try adjusting preferences or adding classic tops.</p>
                </div>
            `;
            return;
        }

        matchingPairs.forEach(combo => {
            const card = document.createElement('div');
            card.className = 'outfit-combo-card';
            card.innerHTML = `
                <div class="outfit-visuals">
                    <div class="visual-item">
                        <div class="visual-item-img">
                            <img src="${combo.top.image}" alt="">
                        </div>
                        <span>${combo.top.name}</span>
                    </div>
                    <div class="visual-connector">✚</div>
                    <div class="visual-item">
                        <div class="visual-item-img">
                            <img src="${combo.bottom.image}" alt="">
                        </div>
                        <span>${combo.bottom.name}</span>
                    </div>
                </div>
                
                <div class="outfit-details">
                    <div class="outfit-score-block">
                        <span class="score-badge">${combo.analysis.score}%</span>
                        <span class="score-label">Coordinate Match</span>
                    </div>
                    <div class="outfit-description">
                        <h3>${combo.analysis.styleTitle}</h3>
                        <p>${combo.analysis.feedback}</p>
                    </div>
                    <div class="outfit-tags">
                        <span>🌤️ Weather: ${stylistWeather}</span>
                        <span>👜 Occasion: ${stylistOccasion}</span>
                        <span>🎨 Theme: ${combo.analysis.colorHarmony}</span>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }, 800);
}


function evaluatePreferenceOutfit(top, bottom, occasion, weather) {
    let score = 70;
    let feedback = [];
    let styleTitle = "Personalized Look";

    
    if (weather === 'Cold') {
        
        if (top.category === 'sweater') {
            score += 15;
            feedback.push("The sweater provides comfortable warmth for cold weather.");
        } else if (top.category === 'tshirt') {
            score -= 10;
            feedback.push("A t-shirt alone is too cool for rainy/cold weather.");
        }

        if (['pants', 'trouser'].includes(bottom.category)) {
            score += 10;
        } else if (bottom.category === 'shorts' || bottom.category === 'skirt') {
            score -= 20;
            feedback.push("Shorts/skirts are not recommended for cold weather.");
        }
    } else if (weather === 'Hot') {
        
        if (top.category === 'tshirt') {
            score += 10;
            feedback.push("Breathable T-shirt is ideal for hot/humid days.");
        } else if (top.category === 'sweater') {
            score -= 25;
            feedback.push("Note: Sweaters will feel uncomfortably warm today.");
        }

        if (bottom.category === 'shorts' || bottom.category === 'skirt') {
            score += 15;
            feedback.push("Lightweight lower coordinates provide ventilation.");
        } else if (['pants', 'trouser'].includes(bottom.category)) {
            score -= 5;
        }
    } else {
        
        if (top.category === 'shirt') {
            score += 10;
            feedback.push("Button-up shirt is perfect for mild climates.");
        }
    }

    
    if (top.occasion === occasion && bottom.occasion === occasion) {
        score += 15;
        feedback.push(`Both coordinates are pre-cataloged for ${occasion.toLowerCase()} events.`);
    } else if (top.occasion === occasion || bottom.occasion === occasion) {
        score += 5;
    } else {
        score -= 15;
        feedback.push(`Neither item is styled for ${occasion.toLowerCase()} code.`);
    }

    
    if (occasion === 'Work') styleTitle = "Business Professional";
    else if (occasion === 'Formal') styleTitle = "Black-Tie Smart";
    else if (occasion === 'Casual') styleTitle = "Minimal Leisure";
    else if (occasion === 'Party') styleTitle = "Vibrant Nightout";
    else if (occasion === 'Sport') styleTitle = "Urban Activewear";

    
    const neutrals = ['Black', 'White', 'Grey', 'Navy', 'Beige'];
    let colorHarmony = "Contrasting";
    
    if (top.color === bottom.color) {
        if (['Black', 'Navy'].includes(top.color)) {
            score += 12;
            feedback.push("Sleek all-dark monochrome style silhouette.");
            colorHarmony = "Monochrome";
        } else {
            score -= 8;
            feedback.push("Identical colored top and bottoms might feel uniform-like.");
        }
    } else {
        const tNeutral = neutrals.includes(top.color);
        const bNeutral = neutrals.includes(bottom.color);
        
        if (tNeutral && bNeutral) {
            score += 10;
            feedback.push("Classic neutral-block styling.");
            colorHarmony = "Neutral Blend";
        } else if (tNeutral || bNeutral) {
            score += 8;
            colorHarmony = "Accent Pop";
        }
    }

    
    if (top.pattern !== 'Solid' && bottom.pattern !== 'Solid') {
        score -= 20;
        feedback.push("Pattern conflict: avoid striped and patterned layers together.");
    } else if (top.pattern === 'Solid' && bottom.pattern === 'Solid') {
        score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score: score,
        feedback: feedback.join(' '),
        styleTitle: styleTitle,
        colorHarmony: colorHarmony
    };
}




function generateWardrobeInsights() {
    const tops = wardrobe.filter(item => ['shirt', 'tshirt', 'sweater'].includes(item.category));
    const bottoms = wardrobe.filter(item => ['pants', 'trouser', 'shorts', 'skirt'].includes(item.category));
    const container = document.getElementById('insights-suggestions-container');
    container.innerHTML = '';

    
    const total = tops.length + bottoms.length;
    let topsPercent = 0;
    let bottomsPercent = 0;
    
    if (total > 0) {
        topsPercent = Math.round((tops.length / total) * 100);
        bottomsPercent = Math.round((bottoms.length / total) * 100);
    }

    document.getElementById('insights-tops-percent').innerText = `${topsPercent}%`;
    document.getElementById('insights-bottoms-percent').innerText = `${bottomsPercent}%`;
    document.getElementById('insights-tops-fill').style.width = `${topsPercent}%`;
    document.getElementById('insights-bottoms-fill').style.width = `${bottomsPercent}%`;

    const suggestions = [];

    
    if (wardrobe.length === 0) {
        suggestions.push({
            icon: '🧥',
            label: 'Initial Setup',
            desc: 'Start by photographing at least 1 top and 1 bottom to catalog your initial coordinates.',
            impact: 'Unlock matchmaker'
        });
    }

    
    if (tops.length > 0 && bottoms.length > 0) {
        if (tops.length >= bottoms.length * 2) {
            suggestions.push({
                icon: '👖',
                label: 'Imbalance Gap',
                desc: `You have ${tops.length} tops but only ${bottoms.length} bottoms. Adding a versatile pair of dark chinos or blue jeans will double your coordinate permutations.`,
                impact: `+${tops.length * 2} Outfit Options`
            });
        }
    }

    
    const sweaters = wardrobe.filter(i => i.category === 'sweater').length;
    if (sweaters === 0 && wardrobe.length > 0) {
        suggestions.push({
            icon: '🧶',
            label: 'Weather Deficit',
            desc: 'You have no Sweaters cataloged. Buy a neutral grey or beige crewneck sweater to unlock cozy cold-weather style suggestions.',
            impact: 'Expand cold options'
        });
    }

    
    const workwear = wardrobe.filter(i => i.occasion === 'Work').length;
    if (workwear === 0 && wardrobe.length > 0) {
        suggestions.push({
            icon: '💼',
            label: 'Occasion Gap',
            desc: 'No corporate/work office clothes detected. A classic button-up Oxford shirt (white or light blue) is recommended to unlock smart-casual styles.',
            impact: 'Unlock Workwear'
        });
    }

    
    if (wardrobe.length >= 4) {
        const darkColors = wardrobe.filter(i => ['Black', 'Navy', 'Brown'].includes(i.color)).length;
        if (darkColors / wardrobe.length >= 0.75) {
            suggestions.push({
                icon: '🎨',
                label: 'Contrast Deficit',
                desc: '75%+ of your closet is dark colors. Adding a crisp White Tee or Beige trousers will create high-contrast accent pop outfits.',
                impact: '+35% Stylist Score'
            });
        }
    }

    
    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="insight-card">
                <div class="insight-icon">✨</div>
                <div class="insight-text-wrapper">
                    <span class="insight-tag-label">Wardrobe Optimized</span>
                    <p class="insight-desc">Congratulations! Your wardrobe categories, colors, and occasion distributions are fully balanced.</p>
                </div>
            </div>
        `;
        return;
    }

    suggestions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = `
            <div class="insight-icon">${s.icon}</div>
            <div class="insight-text-wrapper">
                <span class="insight-tag-label">${s.label}</span>
                <p class="insight-desc">${s.desc}</p>
                <span class="insight-score-impact">💡 impact: ${s.impact}</span>
            </div>
        `;
        container.appendChild(card);
    });
}




function toggleSettingsModal() {
    document.getElementById('settings-modal').classList.toggle('open');
}

function triggerClearCloset() {
    if (confirm('Are you absolutely sure you want to clear your closet and logs? All images will be permanently deleted.')) {
        wardrobe = [];
        wearingLog = [];
        saveCloset();
        saveWearingLog();
        updateUIState();
        toggleSettingsModal();
        switchTab('closet');
    }
}

function triggerLoadDemoData() {
    loadDemoWardrobe();
    saveCloset();
    updateUIState();
    toggleSettingsModal();
    switchTab('closet');
}


function generateSVGVector(colorName, category) {
    const colorMap = {
        'Black': '#18181b', 'White': '#ffffff', 'Grey': '#71717a',
        'Navy': '#1e3a8a', 'Blue': '#3b82f6', 'Red': '#ef4444',
        'Green': '#10b981', 'Beige': '#d97706', 'Brown': '#78350f', 'Yellow': '#eab308'
    };
    const hex = colorMap[colorName] || '#6366f1';
    let path = '', details = '';

    if (category === 'tshirt') {
        path = `M30 18 L38 23 C42 19, 58 19, 62 23 L70 18 L88 28 L78 40 L70 38 L70 82 C70 86, 67 88, 64 88 L36 88 C33 88, 30 86, 30 82 L30 38 L22 40 L12 28 Z`;
        details = `<path d="M38 23 C42 19, 58 19, 62 23 C58 26, 42 26, 38 23 Z" fill="#000000" opacity="0.15"/>`;
    } else if (category === 'shirt') {
        path = `M30 18 L38 23 L50 18 L62 23 L70 18 L88 28 L78 40 L70 38 L70 86 C70 88, 67 90, 64 90 L36 90 C33 90, 30 88, 30 86 L30 38 L22 40 L12 28 Z`;
        details = `
            <path d="M30 18 L42 25 L50 20 L58 25 L70 18 L62 30 L50 24 L38 30 Z" fill="#000000" opacity="0.15"/>
            <line x1="50" y1="24" x2="50" y2="90" stroke="#000000" stroke-width="1.5" stroke-dasharray="1 3" opacity="0.3"/>
            <circle cx="50" cy="38" r="1.5" fill="#ffffff" opacity="0.8"/><circle cx="50" cy="50" r="1.5" fill="#ffffff" opacity="0.8"/>
            <circle cx="50" cy="62" r="1.5" fill="#ffffff" opacity="0.8"/><circle cx="50" cy="74" r="1.5" fill="#ffffff" opacity="0.8"/>
        `;
    } else if (category === 'sweater') {
        path = `M30 18 L38 23 C42 19, 58 19, 62 23 L70 18 L88 32 L80 78 C79 81, 76 82, 73 82 L68 82 L68 86 C68 88, 66 90, 64 90 L36 90 C34 90, 32 88, 32 86 L32 82 L27 82 C24 82, 21 81, 20 78 L12 32 Z`;
        details = `<path d="M38 23 C42 19, 58 19, 62 23 C58 25, 42 25, 38 23 Z" fill="#000" opacity="0.15"/>`;
    } else if (category === 'pants' || category === 'trouser') {
        path = `M30 15 L70 15 C73 15, 75 17, 75 20 L72 86 C72 88, 70 90, 68 90 L52 90 L50 45 L48 90 L32 90 C30 90, 28 88, 28 86 L25 20 C25 17, 27 15, 30 15 Z`;
        details = `<line x1="50" y1="20" x2="50" y2="45" stroke="#000" stroke-width="1.5" opacity="0.2"/>`;
    } else if (category === 'shorts') {
        path = `M30 15 L70 15 C73 15, 75 17, 75 20 L73 55 C73 57, 71 59, 69 59 L52 59 L50 35 L48 59 L31 59 C29 59, 27 57, 27 55 L25 20 C25 17, 27 15, 30 15 Z`;
        details = `<line x1="50" y1="20" x2="50" y2="35" stroke="#000" stroke-width="1.5" opacity="0.2"/>`;
    } else if (category === 'skirt') {
        path = `M36 15 L64 15 C66 15, 68 16, 68 18 L82 82 C83 85, 80 88, 77 88 L23 88 C20 88, 17 85, 18 82 L32 18 C32 16, 34 15, 36 15 Z`;
        details = `<line x1="50" y1="18" x2="50" y2="88" stroke="#000" stroke-width="1.5" opacity="0.2"/>`;
    }

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" rx="16" fill="url(%23g1)"/>
        <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="%231a1515"/><stop offset="100%" stop-color="%230c0a09"/>
            </linearGradient>
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="${hex}" flood-opacity="0.25"/>
            </filter>
        </defs>
        <path d="${path}" fill="${hex}" filter="url(%23glow)" opacity="0.35"/>
        <path d="${path}" fill="${hex}"/>
        ${details}
    </svg>`.replace(/#/g, '%23');
}

function loadDemoWardrobe() {
    wardrobe = [
        { id: 'd1', name: 'Premium Linen White Tee', category: 'tshirt', color: 'White', pattern: 'Solid', occasion: 'Casual', image: generateSVGVector('White', 'tshirt'), createdAt: new Date().toISOString() },
        { id: 'd2', name: 'Warm Charcoal Sweater', category: 'sweater', color: 'Black', pattern: 'Solid', occasion: 'Casual', image: generateSVGVector('Black', 'sweater'), createdAt: new Date().toISOString() },
        { id: 'd3', name: 'Classic Blue Chambray Shirt', category: 'shirt', color: 'Blue', pattern: 'Solid', occasion: 'Work', image: generateSVGVector('Blue', 'shirt'), createdAt: new Date().toISOString() },
        { id: 'd4', name: 'Khaki Tailored Chinos', category: 'pants', color: 'Beige', pattern: 'Solid', occasion: 'Casual', image: generateSVGVector('Beige', 'pants'), createdAt: new Date().toISOString() },
        { id: 'd5', name: 'Midnight Flat-Front Trousers', category: 'trouser', color: 'Navy', pattern: 'Solid', occasion: 'Work', image: generateSVGVector('Navy', 'trouser'), createdAt: new Date().toISOString() }
    ];
}

function loadCloset() {
    const raw = localStorage.getItem('aura_wardrobe');
    if (raw) {
        try { wardrobe = JSON.parse(raw); }
        catch (e) { wardrobe = []; }
    }
}

function saveCloset() {
    localStorage.setItem('aura_wardrobe', JSON.stringify(wardrobe));
}


function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateString(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    });
}
