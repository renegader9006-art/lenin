const API_BASE_URL = `http://${window.location.hostname}:8080`;
const DEFAULT_TEXT = 'Текст по умолчанию';
const MODAL_ID = 'metroModal';
const OVERLAY_ID = 'modalOverlay';
const CONTENT_ID = 'modalContent';
const EMPTY_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Fallback данные
const FALLBACK_METRO_DATA = {
    '123': {
        name: 'МЕТРОПОЛИТЕН',
        short_desc: DEFAULT_TEXT,
        full_desc_one: DEFAULT_TEXT,
        full_desc_two: DEFAULT_TEXT,
        scheme_desc: DEFAULT_TEXT,
        modern_desc: DEFAULT_TEXT,
        struct_desc: DEFAULT_TEXT,
        partnership_desc: DEFAULT_TEXT,
        safety_desc: DEFAULT_TEXT,
        acessable_desc: DEFAULT_TEXT
    }
};

const FALLBACK_COMPANY_DATA = {
    'default': {
        name: 'ПРЕДПРИЯТИЕ',
        short_desc: DEFAULT_TEXT,
        full_desc_one: DEFAULT_TEXT,
        full_desc_two: DEFAULT_TEXT,
        spec_desc: DEFAULT_TEXT,
        struct_desc: DEFAULT_TEXT,
        quality: DEFAULT_TEXT,
        contact: DEFAULT_TEXT
    }
};

const FALLBACK_COMITET_DATA = {
    'default': {
        name: 'КОМИТЕТ',
        short_desc: DEFAULT_TEXT,
        full_desc_one: DEFAULT_TEXT,
        full_desc_two: DEFAULT_TEXT,
        specs_desc: DEFAULT_TEXT,
        functions_desc: DEFAULT_TEXT
    }
};

const STATIC_METRO_ITEMS = [
    { id: 'moscow', name: 'Московский метрополитен', image: 'img/metro1.svg' },
    { id: 'peterburg', name: 'Петербургский метрополитен', image: 'img/metro2.svg' },
    { id: 'nizhny-novgorod', name: 'Нижегородское метро', image: 'img/metro3.svg' },
    { id: 'novosibirsk', name: 'Новосибирский метрополитен', image: 'img/metro4.svg' },
    { id: 'samara', name: 'Самарский метрополитен', image: 'img/metro5.svg' },
    { id: 'ekaterinburg', name: 'Екатеринбургский метрополитен', image: 'img/metro6.svg' },
    { id: 'kazan', name: 'Казанский метрополитен', image: 'img/metro7.svg' },
    { id: 'minsk', name: 'Минский метрополитен', image: 'img/metro8.svg' }
];

const STATIC_COMPANY_ITEMS = [
    { id: 'company-1', name: 'Предприятие - участник ассоциации', image: 'img/predp1.svg' },
    { id: 'company-2', name: 'Предприятие - участник ассоциации', image: 'img/predp2.svg' },
    { id: 'company-3', name: 'Предприятие - участник ассоциации', image: 'img/predp3.svg' },
    { id: 'company-4', name: 'Предприятие - участник ассоциации', image: 'img/predp4.svg' }
];

const STATIC_COMITET_ITEMS = [
    { id: 'operation', name: 'Комитет по эксплуатации' },
    { id: 'safety', name: 'Комитет по безопасности' },
    { id: 'infrastructure', name: 'Комитет по инфраструктуре' },
    { id: 'rolling-stock', name: 'Комитет по подвижному составу' }
];

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

function applyStaticImage(card, selector, image) {
    const img = card.querySelector(selector);
    const imageBox = img ? img.parentElement : null;

    if (!img || !image) {
        if (imageBox) imageBox.style.display = 'none';
        return;
    }

    img.src = image;
    img.style.display = 'block';
    img.dataset.loaded = 'true';
    if (imageBox) imageBox.style.display = 'flex';
}

function renderStaticMetroItems(grid) {
    grid.innerHTML = '';
    STATIC_METRO_ITEMS.forEach(item => {
        const data = {
            ...FALLBACK_METRO_DATA['123'],
            name: item.name,
            short_desc: item.name
        };
        const card = createMetroCard(item.name, data, item.id);
        applyStaticImage(card, '.metro-item__image img', item.image);
        grid.appendChild(card);
    });
}

function renderStaticCompanyItems(grid) {
    grid.innerHTML = '';
    STATIC_COMPANY_ITEMS.forEach(item => {
        const data = {
            ...FALLBACK_COMPANY_DATA.default,
            name: item.name,
            short_desc: item.name
        };
        const card = createPredpriyatiyaCard(item.name, data, item.id);
        applyStaticImage(card, '.predpriyatiya-item__image img', item.image);
        grid.appendChild(card);
    });
}

function renderStaticComitetItems(grid) {
    grid.innerHTML = '';
    STATIC_COMITET_ITEMS.forEach(item => {
        const data = {
            ...FALLBACK_COMITET_DATA.default,
            name: item.name,
            short_desc: item.name
        };
        const card = createComitetCard(item.name, data, item.id);
        applyStaticImage(card, '.comitet-item__image img');
        grid.appendChild(card);
    });
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

    let dataToShow = metroData;
    if (metroData && metroData.status === 'content aint exists') {
        dataToShow = FALLBACK_METRO_DATA['123'] || FALLBACK_METRO_DATA[metroId];
    }

    modalContent.innerHTML = generateMetroContent(dataToShow, metroId);
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
            renderStaticMetroItems(grid);
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

                if (contentData.status === 'content aint exists') {
                    const fallbackData = { ...FALLBACK_METRO_DATA['123'], name: id };
                    const card = createMetroCard(id, fallbackData, id);
                    grid.appendChild(card);
                } else {
                    const name = contentData.name || id;
                    const card = createMetroCard(name, contentData, id);
                    grid.appendChild(card);
                }

                const img = grid.lastChild.querySelector('.metro-item__image img');
                if (img) loadMetroLogo(id, img);
            } catch (e) {
                console.error(`Error loading metro ${id}:`, e);
            }
        }
    } catch (error) {
        console.error('Error loading metro list:', error);
        renderStaticMetroItems(grid);
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

    let dataToShow = companyData;
    if (companyData && companyData.status === 'content aint exists') {
        dataToShow = FALLBACK_COMPANY_DATA['default'];
    }

    modalContent.innerHTML = generatePredpriyatiyaContent(dataToShow, companyId);
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
            renderStaticCompanyItems(grid);
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

            const card = createPredpriyatiyaCard(name, contentData, id);
            grid.appendChild(card);

            const img = card.querySelector('.predpriyatiya-item__image img');
            if (img) loadPredpriyatiyaLogo(id, img, [name]);
        }
    } catch (error) {
        console.error('Error loading companies list:', error);
        renderStaticCompanyItems(grid);
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

    let dataToShow = comitetData;
    if (comitetData && comitetData.status === 'content aint exists') {
        dataToShow = FALLBACK_COMITET_DATA['default'];
    }

    modalContent.innerHTML = generateComitetContent(dataToShow, comitetId);
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
            renderStaticComitetItems(grid);
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

            const card = createComitetCard(name, contentData, id, activeBlockType);
            grid.appendChild(card);

            const img = card.querySelector('.comitet-item__image img');
            if (img) loadComitetLogo(id, img, activeBlockType);
        }
    } catch (error) {
        console.error('Error loading comitet list:', error);
        renderStaticComitetItems(grid);
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
