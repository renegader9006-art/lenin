// all-news.js
const API_BASE_URL = `http://${window.location.hostname}:8080`;

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    initDropdown();
    loadNews();
});

let currentFilter = 'all';
let newsData = [];
let newsPopupElement = null;

async function loadHeader() {
    try {
        const response = await fetch('1header.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headerContent = doc.querySelector('.main-header');
        
        if (headerContent) {
            const headerBlock = document.getElementById('header-block');
            if (headerBlock) headerBlock.appendChild(headerContent);
        }
        
        if (typeof initHeaderDropdown === 'function') initHeaderDropdown();
        if (typeof initMobileHeader === 'function') initMobileHeader();
    } catch (error) {
        console.error('Header load failed:', error);
    }
}

async function loadFooter() {
    try {
        const response = await fetch('2footer.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const footerContent = doc.querySelector('.footer');
        
        if (footerContent) {
            const footerBlock = document.getElementById('footer-block');
            if (footerBlock) footerBlock.appendChild(footerContent);
        }
    } catch (error) {
        console.error('Footer load failed:', error);
    }
}

function initDropdown() {
    const filterButton = document.getElementById('filter-button');
    const filterMenu = document.getElementById('filter-menu');
    const filterItems = document.querySelectorAll('.dropdown__item');

    if (!filterButton || !filterMenu) return;

    filterButton.addEventListener('click', (event) => {
        event.stopPropagation();
        filterButton.classList.toggle('active');
        filterMenu.classList.toggle('active');
    });

    filterItems.forEach((item) => {
        item.addEventListener('click', () => {
            const filterValue = item.getAttribute('data-filter');
            const filterText = item.textContent;

            filterItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const selectedSpan = filterButton.querySelector('.dropdown__selected');
            if (selectedSpan) selectedSpan.textContent = filterText;

            currentFilter = filterValue;
            renderNews(newsData);

            filterButton.classList.remove('active');
            filterMenu.classList.remove('active');
        });
    });

    document.addEventListener('click', (event) => {
        if (!filterMenu.contains(event.target) && !filterButton.contains(event.target)) {
            filterButton.classList.remove('active');
            filterMenu.classList.remove('active');
        }
    });
}

async function loadNews() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    try {
        const listResponse = await fetch(`${API_BASE_URL}/api/v1/block/новости/order`);
        
        if (!listResponse.ok) {
            newsGrid.innerHTML = '<div class="news-grid__empty">Нет новостей</div>';
            return;
        }

        const ids = await listResponse.json();
        const newsIds = Array.isArray(ids) ? ids : [];

        if (newsIds.length === 0) {
            newsGrid.innerHTML = '<div class="news-grid__empty">Нет новостей</div>';
            return;
        }

        newsData = [];

        for (const id of newsIds) {
            try {
                const contentData = await fetchNewsContent(id);
                if (contentData) {
                    newsData.push({
                        id,
                        header: contentData.header || '',
                        body: contentData.body || '',
                        date: contentData.date || '',
                        year: extractYear(contentData.date)
                    });
                }
            } catch (error) {
                console.warn(`Failed to load news ${id}:`, error);
            }
        }

        renderNews(newsData);
    } catch (error) {
        console.error('News load failed:', error);
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = '<div class="news-grid__error">Ошибка загрузки новостей</div>';
        }
    }
}

async function fetchNewsContent(id) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/v1/block/новости/content?name=${encodeURIComponent(id)}`
        );
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

function extractYear(dateStr) {
    if (!dateStr) return '';
    
    try {
        const [year] = dateStr.split('-');
        return year;
    } catch {
        return '';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    } catch {
        return dateStr;
    }
}

async function loadNewsImage(id, type = 'mini') {
    try {
        const url = `${API_BASE_URL}/api/v1/block/новости/attachment?name=${encodeURIComponent(id)}&attachment=${type}`;
        const response = await fetch(url);
        
        if (!response.ok) return null;
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch {
        return null;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createNewsCard(news) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.dataset.newsId = news.id;
    card.style.cursor = 'pointer';

    const content = document.createElement('div');
    content.className = 'news-card__content';

    const title = document.createElement('h3');
    title.className = 'news-card__title';
    title.textContent = news.header || 'Без названия';

    const date = document.createElement('p');
    date.className = 'news-card__date';
    date.textContent = formatDate(news.date);

    content.appendChild(title);
    content.appendChild(date);
    card.appendChild(content);

    loadNewsImage(news.id, 'mini')
        .then(url => {
            if (url) {
                card.style.backgroundImage = `url('${url}')`;
            }
        })
        .catch(() => {});

    card.addEventListener('click', (event) => {
        event.preventDefault();
        openNewsPopup(news.id, news);
    });

    return card;
}

function renderNews(newsArray) {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    const filteredNews = currentFilter === 'all' 
        ? newsArray 
        : newsArray.filter(news => news.year === currentFilter);

    newsGrid.innerHTML = '';

    if (filteredNews.length === 0) {
        newsGrid.innerHTML = '<div class="news-grid__empty">Нет новостей за выбранный период</div>';
        return;
    }

    filteredNews.forEach(news => {
        newsGrid.appendChild(createNewsCard(news));
    });
}

function createNewsPopup() {
    const popup = document.createElement('div');
    popup.className = 'news-popup';
    popup.id = 'news-popup-dynamic';
    popup.setAttribute('aria-hidden', 'true');
    
    popup.innerHTML = `
        <div class="news-popup__content" role="dialog" aria-modal="true" aria-label="Новость">
            <button class="news-popup__close" id="news-popup-close-btn" aria-label="Закрыть">
                <img src="img/cross-icon.svg" alt="" aria-hidden="true">
            </button>
            <div class="news-popup__text-wrapper">
                <h3 class="news-popup__title"></h3>
                <p class="news-popup__subtitle"></p>
                <div class="news-popup__section">
                    <div class="news-popup__body-content"></div>
                </div>
            </div>
            <div class="news-popup__image">
                <img src="" alt="">
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    return popup;
}

function initNewsPopupHandlers() {
    if (!newsPopupElement) return;
    
    const closeBtn = newsPopupElement.querySelector('#news-popup-close-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNewsPopup);
    }

    newsPopupElement.addEventListener('click', (event) => {
        if (event.target === newsPopupElement) {
            closeNewsPopup();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && newsPopupElement?.classList.contains('active')) {
            closeNewsPopup();
        }
    });
}

function closeNewsPopup() {
    if (!newsPopupElement) return;
    
    newsPopupElement.classList.remove('active');
    newsPopupElement.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function formatBodyContent(text) {
    if (!text) return '';
    
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
    
    if (paragraphs.length > 1) {
        return paragraphs.map(paragraph => {
            let processed = paragraph.trim().replace(/\n/g, ' ');
            processed = processed.replace(urlRegex, (url) => {
                const href = url.startsWith('http') ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="news-popup__link">${escapeHtml(url)}</a>`;
            });
            return `<p class="news-popup__paragraph">${processed}</p>`;
        }).join('');
    } else {
        let formatted = text.replace(/\n/g, '<br>');
        formatted = formatted.replace(urlRegex, (url) => {
            const href = url.startsWith('http') ? url : `https://${url}`;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="news-popup__link">${escapeHtml(url)}</a>`;
        });
        return `<p class="news-popup__paragraph">${formatted}</p>`;
    }
}

async function openNewsPopup(id, cachedData) {
    if (!newsPopupElement) {
        newsPopupElement = createNewsPopup();
        initNewsPopupHandlers();
    }

    let contentData = cachedData;
    
    if (!contentData?.body) {
        contentData = await fetchNewsContent(id);
        if (!contentData) return;
    }

    const titleElement = newsPopupElement.querySelector('.news-popup__title');
    const subtitleElement = newsPopupElement.querySelector('.news-popup__subtitle');
    const bodyElement = newsPopupElement.querySelector('.news-popup__body-content');
    const imageElement = newsPopupElement.querySelector('.news-popup__image img');
    const imageContainer = newsPopupElement.querySelector('.news-popup__image');

    if (titleElement) {
        titleElement.textContent = contentData.header || '';
    }

    if (subtitleElement) {
        subtitleElement.style.display = 'none';
    }

    if (bodyElement && contentData.body) {
        bodyElement.innerHTML = formatBodyContent(contentData.body);
    }

    if (imageElement && imageContainer) {
        const fullImageUrl = await loadNewsImage(id, 'full');
        
        if (fullImageUrl) {
            imageElement.src = fullImageUrl;
            imageElement.alt = contentData.header || '';
            imageContainer.style.display = '';
        } else {
            imageContainer.style.display = 'none';
        }
    }

    newsPopupElement.classList.add('active');
    newsPopupElement.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}