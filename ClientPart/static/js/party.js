const API_BASE_URL = `http://${window.location.hostname}:8080`;
const MODAL_ID = 'metroModal';
const OVERLAY_ID = 'modalOverlay';
const CONTENT_ID = 'modalContent';
const EMPTY_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Утилиты
function formatTextWithLineBreaks(text) {
    if (!text || typeof text !== 'string') return '';
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isMissingContent(data) {
    return !data || data.status === 'content aint exists';
}

function showNoData(grid, message) {
    grid.innerHTML = `<p class="no-data">${escapeHtml(message)}</p>`;
}

function showLoadError(grid) {
    grid.innerHTML = '<p class="error">Ошибка загрузки данных</p>';
}

function buildNameCandidates(...values) {
    const unique = new Set();

    values.forEach(value => {
        if (value === null || value === undefined) return;

        const raw = String(value);
        const normalized = raw.normalize('NFKC');
        const compactSpaces = normalized.replace(/\s+/g, ' ');
        const variants = [raw, normalized, compactSpaces, compactSpaces.trim()];

        variants.forEach(variant => {
            if (variant) unique.add(variant);
        });
    });

    return Array.from(unique);
}

async function fetchAttachmentBlob(blockType, nameCandidates, attachment) {
    const candidates = buildNameCandidates(...nameCandidates);
    let lastError = new Error('Attachment not found');

    for (const name of candidates) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const cacheBust = Date.now() + '-' + Math.random().toString(16).slice(2);
                const url = `${API_BASE_URL}/api/v1/block/${blockType}/attachment?name=${encodeURIComponent(name)}&attachment=${encodeURIComponent(attachment)}&_=${cacheBust}`;
                const response = await fetch(url, { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                if (!blob || blob.size === 0) {
                    throw new Error('Empty blob');
                }

                return blob;
            } catch (error) {
                lastError = error;
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }
    }

    throw lastError;
}

function applyBlobToImage(img, blob) {
    return new Promise((resolve, reject) => {
        const src = URL.createObjectURL(blob);

        const cleanup = () => {
            img.onload = null;
            img.onerror = null;
        };

        img.onload = () => {
            cleanup();
            URL.revokeObjectURL(src);
            resolve();
        };

        img.onerror = () => {
            cleanup();
            URL.revokeObjectURL(src);
            reject(new Error('Image decode failed'));
        };

        img.src = src;
        img.style.display = 'block';
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
    loadFooter();

    if (document.body.dataset.page === 'committees') {
        loadComitet();
    } else {
        loadPartyText();
        loadMetro();
        loadPredpriyatiya();
    }

    initModal();
});

// Загрузка текста страницы
async function loadPartyText() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/locale/участники`);
        if (!response.ok) {
            console.warn('Не удалось загрузить описание для страницы участников');
            return;
        }
        const data = await response.json();
        const heroSubtitle = document.querySelector('.hero__subtitle');
        if (heroSubtitle && data.описание) {
            heroSubtitle.textContent = data.описание;
        }
    } catch (error) {
        console.error('Ошибка загрузки описания для страницы участников:', error);
    }
}

// Модальное окно
function initModal() {
    const modal = document.getElementById(MODAL_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    if (!modal) return;

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Загрузка изображений в модалке
function loadModalImages(type, id, extraNameCandidates = []) {
    const images = Array.from(document.querySelectorAll('.modal-image'))
        .filter(img => String(img.dataset.id) === String(id));

    const nameCandidates = buildNameCandidates(id, ...extraNameCandidates);

    images.forEach(async (img) => {
        if (img.dataset.loaded === 'true') return;

        const attachment = img.dataset.attachment;
        const imageContainer = img.closest('.piter-section__image');
        const logoContainer = img.closest('.hero__logo');
        const section = img.closest('.piter-section');

        try {
            const blob = await fetchAttachmentBlob(type, nameCandidates, attachment);
            await applyBlobToImage(img, blob);
            img.dataset.loaded = 'true';

            if (imageContainer) {
                imageContainer.style.display = 'block';
                if (section && section.classList.contains('piter-section--no-image')) {
                    section.classList.remove('piter-section--no-image');
                }
            }
            if (logoContainer) {
                logoContainer.style.display = 'flex';
            }
        } catch (error) {
            img.style.display = 'none';
            delete img.dataset.loaded;

            if (imageContainer) {
                imageContainer.style.display = 'none';
                if (section && section.dataset.sectionType === 'image-text') {
                    section.classList.add('piter-section--no-image');
                }
            }
            if (logoContainer) {
                logoContainer.style.display = 'none';
            }

            console.warn(`Modal image load failed: type=${type}, id=${id}, attachment=${attachment}`, error);
        }
    });
}

// ===== МЕТРОПОЛИТЕНЫ =====

function openMetroModal(metroId, metroData) {
    const modal = document.getElementById(MODAL_ID);
    const modalContent = document.getElementById(CONTENT_ID);
    if (!modal || !modalContent) return;

    if (isMissingContent(metroData)) return;

    modalContent.innerHTML = generateMetroContent(metroData, metroId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!modalContent.querySelector('.modal-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        modalContent.appendChild(closeBtn);
    }

    loadModalImages('метро', metroId);
}

function generateMetroContent(data, metroId) {
    let html = `
        <div class="hero--piter">
            <div class="hero__container">
                <div class="hero__content">
                    <h1 class="hero__title">${escapeHtml(data.name || 'МЕТРОПОЛИТЕН')}</h1>
                    <p class="hero__subtitle">${formatTextWithLineBreaks(data.short_desc)}</p>
                </div>
                <div class="hero__logo" id="logo-container-${metroId}">
                    <img src="${EMPTY_PIXEL}" alt="Логотип" data-id="${metroId}" data-type="метро" data-attachment="logo" class="modal-image">
                </div>
            </div>
        </div>
    `;

    if (data.full_desc_one) {
        html += `
            <div class="piter-section piter-section--white" id="section-desc-one-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-one-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="desc_one" class="modal-image">
                        <p class="piter-section__caption">Станция метро</p>
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">ПОДРОБНО О МЕТРОПОЛИТЕНЕ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_one)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.full_desc_two) {
        html += `
            <div class="piter-section piter-section--blue" id="section-desc-two-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-two-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="desc_two" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_two)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.scheme_desc) {
        html += `
            <div class="piter-section piter-section--white" id="section-scheme-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-scheme-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="scheme" class="modal-image">
                        <p class="piter-section__caption">Схема линий</p>
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">СХЕМА ЛИНИЙ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.scheme_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.modern_desc) {
        html += `
            <div class="piter-section piter-section--blue" id="section-modern-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-modern-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="modern" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">МОДЕРНИЗАЦИЯ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.modern_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.struct_desc) {
        html += `
            <div class="piter-section piter-section--white" id="section-struct-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-struct-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="struct" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">ИНФРАСТРУКТУРА</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.struct_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.partnership_desc) {
        html += `
            <div class="piter-section piter-section--blue" id="section-partnership-${metroId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-partnership-${metroId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${metroId}" data-type="метро" data-attachment="partnership" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">РАЗВИТИЕ И ПАРТНЁРСТВО</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.partnership_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.safety_desc || data.acessable_desc) {
        html += `
            <div class="piter-section piter-section--white piter-section--double-text">
                <div class="piter-section__container">
                    ${data.safety_desc ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">БЕЗОПАСНОСТЬ</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.safety_desc)}</p>
                        </div>
                    ` : ''}
                    ${data.acessable_desc ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">ДОСТУПНОСТЬ</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.acessable_desc)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return html;
}

async function loadMetro() {
    const grid = document.getElementById('metro-grid');
    if (!grid) return;
    try {
        const listResp = await fetch(`${API_BASE_URL}/api/v1/block/метро/order`);
        if (!listResp.ok) throw new Error(`HTTP ${listResp.status}`);
        const listData = await listResp.json();
        const ids = Array.isArray(listData) ? listData : [];

        if (ids.length === 0) {
            showNoData(grid, 'Нет данных о метрополитенах');
            return;
        }

        grid.innerHTML = '';

        for (const id of ids) {
            try {
                const contentResp = await fetch(
                    `${API_BASE_URL}/api/v1/block/метро/content?name=${encodeURIComponent(id)}`
                );
                if (!contentResp.ok) continue;

                const contentData = await contentResp.json();

                if (isMissingContent(contentData)) continue;

                const name = contentData.name || id;
                const card = createMetroCard(name, contentData, id);
                grid.appendChild(card);

                const img = grid.lastChild.querySelector('.metro-item__image img');
                if (img) loadMetroLogo(id, img);
            } catch (e) {
                console.error(`Error loading metro ${id}:`, e);
            }
        }

        if (!grid.children.length) {
            showNoData(grid, 'Нет данных о метрополитенах');
        }
    } catch (error) {
        console.error('Error loading metro list:', error);
        showLoadError(grid);
    }
}

async function loadMetroLogo(id, imgElement) {
    if (!imgElement || imgElement.dataset.loaded) return;

    try {
        const blob = await fetchAttachmentBlob('метро', [id], 'logo');
        await applyBlobToImage(imgElement, blob);
        imgElement.dataset.loaded = 'true';

        const parentDiv = imgElement.closest('.metro-item__image');
        if (parentDiv) parentDiv.style.display = 'flex';
    } catch (error) {
        imgElement.style.display = 'none';
        delete imgElement.dataset.loaded;

        const parentDiv = imgElement.closest('.metro-item__image');
        if (parentDiv) parentDiv.style.display = 'none';

        console.warn(`Metro logo load failed: id=${id}`, error);
    }
}

function createMetroCard(name, data, id) {
    const card = document.createElement('div');
    card.className = 'metro-item';
    card.setAttribute('data-metro-id', id);
    card.style.cursor = 'pointer';
    card.innerHTML = `
        <div class="metro-item__image">
            <img src="${EMPTY_PIXEL}" alt="${escapeHtml(name)}" loading="lazy" style="display: none;">
        </div>
        <p class="metro-item__name">${escapeHtml(name)}</p>
    `;
    if (data.short_desc) card.title = data.short_desc;
    card.metroData = data;
    card.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openMetroModal(id, this.metroData);
        return false;
    };
    return card;
}

// ===== ПРЕДПРИЯТИЯ =====

function openPredpriyatiyaModal(companyId, companyData) {
    const modal = document.getElementById(MODAL_ID);
    const modalContent = document.getElementById(CONTENT_ID);
    if (!modal || !modalContent) return;

    if (isMissingContent(companyData)) return;

    modalContent.innerHTML = generatePredpriyatiyaContent(companyData, companyId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!modalContent.querySelector('.modal-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        modalContent.appendChild(closeBtn);
    }

    loadModalImages('предприятия', companyId, [companyData?.name]);
}

function generatePredpriyatiyaContent(data, companyId) {
    let html = `
        <div class="hero--piter">
            <div class="hero__container">
                <div class="hero__content">
                    <h1 class="hero__title">${escapeHtml(data.name || 'ПРЕДПРИЯТИЕ')}</h1>
                    <p class="hero__subtitle">${formatTextWithLineBreaks(data.short_desc)}</p>
                </div>
                <div class="hero__logo" id="logo-container-${companyId}">
                    <img src="${EMPTY_PIXEL}" alt="Логотип" data-id="${companyId}" data-type="предприятия" data-attachment="logo" class="modal-image">
                </div>
            </div>
        </div>
    `;

    if (data.full_desc_one) {
        html += `
            <div class="piter-section piter-section--white" id="section-desc-one-${companyId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-one-${companyId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${companyId}" data-type="предприятия" data-attachment="desc_one" class="modal-image">
                        <p class="piter-section__caption">Производство</p>
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">О ПРЕДПРИЯТИИ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_one)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.full_desc_two) {
        html += `
            <div class="piter-section piter-section--blue" id="section-desc-two-${companyId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-two-${companyId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${companyId}" data-type="предприятия" data-attachment="desc_two" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_two)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.spec_desc) {
        html += `
            <div class="piter-section piter-section--white" id="section-spec-${companyId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-spec-${companyId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${companyId}" data-type="предприятия" data-attachment="spec" class="modal-image">
                        <p class="piter-section__caption">Специализация</p>
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">СПЕЦИАЛИЗАЦИЯ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.spec_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.struct_desc) {
        html += `
            <div class="piter-section piter-section--blue" id="section-struct-${companyId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-struct-${companyId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${companyId}" data-type="предприятия" data-attachment="struct" class="modal-image">
                        <p class="piter-section__caption">Инфраструктура</p>
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">ИНФРАСТРУКТУРА</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.struct_desc)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.quality || data.contact) {
        html += `
            <div class="piter-section piter-section--white piter-section--double-text">
                <div class="piter-section__container">
                    ${data.quality ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">КАЧЕСТВО</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.quality)}</p>
                        </div>
                    ` : ''}
                    ${data.contact ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">КОНТАКТЫ</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.contact)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return html;
}

async function loadPredpriyatiya() {
    const grid = document.getElementById('predpriyatiya-grid');
    if (!grid) return;
    try {
        const listResp = await fetch(`${API_BASE_URL}/api/v1/block/предприятия/order`);
        if (!listResp.ok) throw new Error(`HTTP ${listResp.status}`);
        const listData = await listResp.json();
        const ids = Array.isArray(listData) ? listData : [];

        if (ids.length === 0) {
            showNoData(grid, 'Нет данных о предприятиях');
            return;
        }

        grid.innerHTML = '';

        for (const id of ids) {
            let contentData = {};
            let name = id;

            try {
                const contentResp = await fetch(
                    `${API_BASE_URL}/api/v1/block/предприятия/content?name=${encodeURIComponent(id)}`
                );
                if (contentResp.ok) {
                    contentData = await contentResp.json();
                    if (contentData.name) name = contentData.name;
                }
            } catch (e) {
                console.error(`Error loading company ${id}:`, e);
            }

            if (isMissingContent(contentData)) continue;

            const card = createPredpriyatiyaCard(name, contentData, id);
            grid.appendChild(card);

            const img = card.querySelector('.predpriyatiya-item__image img');
            if (img) loadPredpriyatiyaLogo(id, img, [name]);
        }

        if (!grid.children.length) {
            showNoData(grid, 'Нет данных о предприятиях');
        }
    } catch (error) {
        console.error('Error loading companies list:', error);
        showLoadError(grid);
    }
}

async function loadPredpriyatiyaLogo(id, imgElement, extraNameCandidates = []) {
    if (!imgElement || imgElement.dataset.loaded) return;

    try {
        const blob = await fetchAttachmentBlob('предприятия', [id, ...extraNameCandidates], 'logo');
        await applyBlobToImage(imgElement, blob);
        imgElement.dataset.loaded = 'true';

        const parentDiv = imgElement.closest('.predpriyatiya-item__image');
        if (parentDiv) parentDiv.style.display = 'flex';
    } catch (error) {
        imgElement.style.display = 'none';
        delete imgElement.dataset.loaded;

        const parentDiv = imgElement.closest('.predpriyatiya-item__image');
        if (parentDiv) parentDiv.style.display = 'none';

        console.warn(`Company logo load failed: id=${id}`, error);
    }
}

function createPredpriyatiyaCard(name, data, id) {
    const card = document.createElement('div');
    card.className = 'predpriyatiya-item';
    card.setAttribute('data-predpriyatiya-id', id);
    card.style.cursor = 'pointer';
    card.innerHTML = `
        <div class="predpriyatiya-item__image">
            <img src="${EMPTY_PIXEL}" alt="${escapeHtml(name)}" loading="lazy" style="display: none;">
        </div>
        <p class="predpriyatiya-item__name">${escapeHtml(name)}</p>
    `;
    if (data.short_desc) card.title = data.short_desc;
    card.predpriyatiyaData = data;
    card.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openPredpriyatiyaModal(id, this.predpriyatiyaData);
        return false;
    };
    return card;
}

// ===== КОМИТЕТЫ =====

function openComitetModal(comitetId, comitetData, blockType = 'комитет') {
    const modal = document.getElementById(MODAL_ID);
    const modalContent = document.getElementById(CONTENT_ID);
    if (!modal || !modalContent) return;

    if (isMissingContent(comitetData)) return;

    modalContent.innerHTML = generateComitetContent(comitetData, comitetId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!modalContent.querySelector('.modal-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
        modalContent.appendChild(closeBtn);
    }

    loadModalImages(blockType, comitetId);
}

function generateComitetContent(data, comitetId) {
    let html = `
        <div class="hero--piter">
            <div class="hero__container">
                <div class="hero__content">
                    <h1 class="hero__title">${escapeHtml(data.name || 'КОМИТЕТ')}</h1>
                    <p class="hero__subtitle">${formatTextWithLineBreaks(data.short_desc)}</p>
                </div>
                <div class="hero__logo" id="logo-container-${comitetId}">
                    <img src="${EMPTY_PIXEL}" alt="Логотип" data-id="${comitetId}" data-type="комитет" data-attachment="logo" class="modal-image">
                </div>
            </div>
        </div>
    `;

    if (data.full_desc_one) {
        html += `
            <div class="piter-section piter-section--white" id="section-desc-one-${comitetId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-one-${comitetId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${comitetId}" data-type="комитет" data-attachment="desc_one" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <h2 class="piter-section__title">О КОМИТЕТЕ</h2>
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_one)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.full_desc_two) {
        html += `
            <div class="piter-section piter-section--blue" id="section-desc-two-${comitetId}" data-section-type="image-text">
                <div class="piter-section__container">
                    <div class="piter-section__image" id="image-desc-two-${comitetId}">
                        <img src="${EMPTY_PIXEL}" alt="" data-id="${comitetId}" data-type="комитет" data-attachment="desc_two" class="modal-image">
                    </div>
                    <div class="piter-section__text">
                        <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.full_desc_two)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (data.specs_desc || data.functions_desc) {
        html += `
            <div class="piter-section piter-section--white piter-section--double-text">
                <div class="piter-section__container">
                    ${data.specs_desc ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">ОСОБЕННОСТИ</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.specs_desc)}</p>
                        </div>
                    ` : ''}
                    ${data.functions_desc ? `
                        <div class="piter-section__text-block">
                            <h2 class="piter-section__title">ФУНКЦИИ</h2>
                            <p class="piter-section__paragraph">${formatTextWithLineBreaks(data.functions_desc)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return html;
}

async function loadComitet() {
    const grid = document.getElementById('comitet-grid');
    if (!grid) return;

    const blockTypes = ['комитет', 'коммитет'];
    let activeBlockType = blockTypes[0];

    try {
        let listData = [];
        let lastError = null;

        for (const blockType of blockTypes) {
            try {
                const listResp = await fetch(`${API_BASE_URL}/api/v1/block/${blockType}/order`);
                if (!listResp.ok) throw new Error(`HTTP ${listResp.status}`);

                listData = await listResp.json();
                activeBlockType = blockType;
                if (Array.isArray(listData) && listData.length > 0) {
                    break;
                }
            } catch (error) {
                lastError = error;
            }
        }

        if (!Array.isArray(listData) && lastError) {
            throw lastError;
        }

        const ids = Array.isArray(listData) ? listData : [];

        if (ids.length === 0) {
            showNoData(grid, 'Нет данных о комитетах');
            return;
        }

        grid.innerHTML = '';

        for (const id of ids) {
            let contentData = {};
            let name = id;

            try {
                const contentResp = await fetch(
                    `${API_BASE_URL}/api/v1/block/${activeBlockType}/content?name=${encodeURIComponent(id)}`
                );
                if (contentResp.ok) {
                    contentData = await contentResp.json();
                    if (contentData.name) name = contentData.name;
                }
            } catch (e) {
                console.error(`Error loading comitet ${id}:`, e);
            }

            if (isMissingContent(contentData)) continue;

            const card = createComitetCard(name, contentData, id, activeBlockType);
            grid.appendChild(card);

            const img = card.querySelector('.comitet-item__image img');
            if (img) loadComitetLogo(id, img, activeBlockType);
        }

        if (!grid.children.length) {
            showNoData(grid, 'Нет данных о комитетах');
        }
    } catch (error) {
        console.error('Error loading comitet list:', error);
        showLoadError(grid);
    }
}

async function loadComitetLogo(id, imgElement, blockType = 'комитет') {
    if (!imgElement || imgElement.dataset.loaded) return;

    try {
        const blob = await fetchAttachmentBlob(blockType, [id], 'logo');
        await applyBlobToImage(imgElement, blob);
        imgElement.dataset.loaded = 'true';

        const parentDiv = imgElement.closest('.comitet-item__image');
        if (parentDiv) parentDiv.style.display = 'flex';
    } catch (error) {
        imgElement.style.display = 'none';
        delete imgElement.dataset.loaded;

        const parentDiv = imgElement.closest('.comitet-item__image');
        if (parentDiv) parentDiv.style.display = 'none';

        console.warn(`Comitet logo load failed: id=${id}`, error);
    }
}

function createComitetCard(name, data, id, blockType = 'комитет') {
    const card = document.createElement('div');
    card.className = 'comitet-item';
    card.setAttribute('data-comitet-id', id);
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
        <div class="comitet-item__image">
            <img src="${EMPTY_PIXEL}" alt="${escapeHtml(name)}" loading="lazy" style="display: none;">
        </div>
        <p class="comitet-item__name">${escapeHtml(name)}</p>
    `;
    
    if (data.short_desc) card.title = data.short_desc;
    card.comitetData = data;
    card.comitetBlockType = blockType;
    
    card.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openComitetModal(id, this.comitetData, this.comitetBlockType);
        return false;
    };
    
    return card;
}

// ===== ЗАГРУЗКА HEADER/FOOTER =====

async function loadHeader() {
    try {
        const response = await fetch('1header.html');
        if (!response.ok) throw new Error('Header error');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headerContent = doc.querySelector('.main-header');
        if (headerContent) {
            const block = document.getElementById('header-block');
            if (block) block.appendChild(headerContent);
        }
    } catch (e) {
        console.error('Header load error:', e);
    }
}

async function loadFooter() {
    try {
        const response = await fetch('2footer.html');
        if (!response.ok) throw new Error('Footer error');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const footerContent = doc.querySelector('.footer');
        if (footerContent) {
            const block = document.getElementById('footer-block');
            if (block) block.appendChild(footerContent);
        }
    } catch (e) {
        console.error('Footer load error:', e);
    }
}
