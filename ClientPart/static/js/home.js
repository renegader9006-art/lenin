const HomePageApp = (() => {
    'use strict';

    const CONFIG = {
        API_BASE_URL: `http://${window.location.hostname}:8080`,
        SELECTORS: {
            HEADER_BLOCK: '#header-block',
            FOOTER_BLOCK: '#footer-block',
            HERO_TITLE: '.hero__title',
            HERO_SUBTITLE: '.hero__subtitle',
            ABOUT_TEXT: '.about__text',
            ABOUT_BTN: '.about__btn',
            ABOUT_BTN_WRAPPER: '.about__btn-wrapper',
            NEWS_LIST: '.news__list',
            NEWS_ITEM: 'a.news__item',
            NEWS_TITLE: '.news__title',
            NEWS_DATE: '.news__date',
            EVENTS_LIST: '.events__list',
            EVENTS_ITEM: '.events__item',
            EVENTS_TITLE: '.events__title',
            EVENTS_DATE: '.events__date',
            HOME_TEAM_SLIDER: '#home-team-slider',
            HOME_TEAM_CARD: '.home-team__card',
            HOME_TEAM_PHOTO: '.home-team__photo img',
            HOME_TEAM_NAME: '.home-team__name',
            HOME_TEAM_POSITION: '.home-team__position'
        },
        API_ENDPOINTS: {
            MAIN_LOCALE: '/api/v1/locale/главная',
            NEWS_ORDER: '/api/v1/block/новости/order',
            NEWS_CONTENT: '/api/v1/block/новости/content',
            NEWS_ATTACHMENT: '/api/v1/block/новости/attachment',
            EVENTS_ORDER: '/api/v1/block/мероприятия/order',
            EVENTS_CONTENT: '/api/v1/block/мероприятия/content',
            TEAM_ORDER: '/api/v1/block/команда/order',
            TEAM_CONTENT: '/api/v1/block/команда/content',
            TEAM_ATTACHMENT: '/api/v1/block/команда/attachment'
        },
        CLASSES: {
            ACTIVE: 'active'
        },
        TIMEOUT_MS: 10000,
        MAX_VISIBLE_ITEMS: 10,
        PLACEHOLDER_SVG: 'image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23e0e0e0\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23999\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' font-size=\'14\'%3EНет фото%3C/text%3E%3C/svg%3E'
    };

    let state = {
        newsPopupElement: null,
        eventsPopupElement: null,
        newsObjectUrls: [],
        eventsObjectUrls: [],
        teamObjectUrls: [],
        fullAboutText: '',
        shortAboutText: ''
    };

    function init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await Promise.all([
                loadComponent(CONFIG.SELECTORS.HEADER_BLOCK, '1header.html', '.main-header'),
                loadComponent(CONFIG.SELECTORS.FOOTER_BLOCK, '2footer.html', '.footer')
            ]);
            
            await loadMainPageTexts();
            initAboutText();
            loadNews();
            loadEvents();
        });
    }

    async function loadComponent(blockSelector, filePath, contentSelector) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const response = await fetch(filePath, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) return;
            
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const content = doc.querySelector(contentSelector);
            
            if (content) {
                const block = document.querySelector(blockSelector);
                if (block) block.appendChild(content);
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.warn(`Component load failed: ${filePath}`, e);
            }
        }
    }

    async function loadMainPageTexts() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const response = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.MAIN_LOCALE}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn('Не удалось загрузить тексты для главной');
                return;
            }
            
            const data = await response.json();
            
            const heroTitle = document.querySelector(CONFIG.SELECTORS.HERO_TITLE);
            if (heroTitle && data.название) {
                heroTitle.textContent = data.название;
            }
            
            const heroSubtitle = document.querySelector(CONFIG.SELECTORS.HERO_SUBTITLE);
            if (heroSubtitle && data.описание) {
                heroSubtitle.textContent = data.описание;
            }
            
            const aboutTexts = document.querySelectorAll(CONFIG.SELECTORS.ABOUT_TEXT);
            
            if (data.подробнее) {
                state.shortAboutText = data.подробнее;
            }
            
            if (data.полное) {
                state.fullAboutText = data.полное;
            }
            
            if (aboutTexts.length >= 1 && state.shortAboutText) {
                aboutTexts[0].textContent = state.shortAboutText;
            }
            
            if (aboutTexts.length >= 2 && state.fullAboutText) {
                aboutTexts[1].textContent = state.fullAboutText;
            }
        } catch (e) {
            console.error('Ошибка загрузки текстов для главной:', e);
        }
    }

    function checkTextHeight(element) {
        if (!element) return false;
        
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        const totalHeight = element.scrollHeight;
        const lineCount = Math.ceil(totalHeight / lineHeight);
        
        return lineCount > 3;
    }

    function initAboutText() {
    const aboutTexts = document.querySelectorAll(CONFIG.SELECTORS.ABOUT_TEXT);
    const aboutTextEl = aboutTexts.length >= 2 ? aboutTexts[1] : null;
    const aboutBtnWrapper = document.querySelector(CONFIG.SELECTORS.ABOUT_BTN_WRAPPER);
    const aboutBtn = document.querySelector(CONFIG.SELECTORS.ABOUT_BTN);

    if (!aboutTextEl) return;

    const fullText = state.fullAboutText;
    
    if (!fullText || fullText.trim() === '') {
        if (aboutBtnWrapper) aboutBtnWrapper.style.display = 'none';
        return;
    }

    const formattedFullText = fullText.replace(/\n/g, '<br>');
    const formattedShortText = state.shortAboutText ? state.shortAboutText.replace(/\n/g, '<br>') : '';

    if (aboutTexts.length >= 1 && formattedShortText) {
        aboutTexts[0].innerHTML = formattedShortText;
    }

    aboutTextEl.innerHTML = formattedFullText;
    const needsTruncation = checkTextHeight(aboutTextEl);
    
    if (needsTruncation) {
        if (aboutBtnWrapper) aboutBtnWrapper.style.display = 'flex';
        
        let isExpanded = false;
        
        const btnClickHandler = (e) => {
            e.preventDefault();
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                aboutTextEl.innerHTML = formattedFullText;
                aboutTextEl.style.display = 'block';
                aboutTextEl.style.webkitLineClamp = 'unset';
                aboutTextEl.style.webkitBoxOrient = 'unset';
                aboutTextEl.style.overflow = 'visible';
                aboutTextEl.style.textOverflow = 'clip';
                aboutBtn.textContent = 'Скрыть';
            } else {
                aboutTextEl.innerHTML = formattedFullText;
                aboutTextEl.style.display = '-webkit-box';
                aboutTextEl.style.webkitLineClamp = '3';
                aboutTextEl.style.webkitBoxOrient = 'vertical';
                aboutTextEl.style.overflow = 'hidden';
                aboutTextEl.style.textOverflow = 'ellipsis';
                aboutBtn.textContent = 'Читать далее';
            }
        };
        
        aboutBtn.removeEventListener('click', btnClickHandler);
        aboutBtn.addEventListener('click', btnClickHandler);
        
        aboutTextEl.innerHTML = formattedFullText;
        aboutTextEl.style.display = '-webkit-box';
        aboutTextEl.style.webkitLineClamp = '3';
        aboutTextEl.style.webkitBoxOrient = 'vertical';
        aboutTextEl.style.overflow = 'hidden';
        aboutTextEl.style.textOverflow = 'ellipsis';
    } else {
        aboutTextEl.innerHTML = formattedFullText;
        aboutTextEl.style.display = 'block';
        if (aboutBtnWrapper) aboutBtnWrapper.style.display = 'none';
    }
}

    async function loadNews() {
        const newsList = document.querySelector(CONFIG.SELECTORS.NEWS_LIST);
        if (!newsList) return;

        const allNewsItems = newsList.querySelectorAll(CONFIG.SELECTORS.NEWS_ITEM);
        if (!allNewsItems.length) return;

        allNewsItems.forEach(item => item.style.display = 'none');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const listResp = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.NEWS_ORDER}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!listResp.ok) {
                console.warn('Не удалось загрузить список новостей');
                return;
            }
            
            const ids = await listResp.json();
            const newsIds = Array.isArray(ids) ? ids : [];
            
            for (let i = 0; i < newsIds.length && i < allNewsItems.length && i < CONFIG.MAX_VISIBLE_ITEMS; i++) {
                const id = newsIds[i];
                const item = allNewsItems[i];
                
                const contentData = await fetchNewsContent(id);
                if (!contentData) continue;
                
                updateNewsCard(item, id, contentData);
                item.style.display = 'flex';
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Ошибка загрузки новостей:', e);
            }
        }
    }

    async function fetchNewsContent(id) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const resp = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.NEWS_CONTENT}?name=${encodeURIComponent(id)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!resp.ok) return null;
            return await resp.json();
        } catch {
            return null;
        }
    }

    function updateNewsCard(item, id, data) {
        const titleEl = item.querySelector(CONFIG.SELECTORS.NEWS_TITLE);
        if (titleEl && data.header) {
            titleEl.textContent = data.header;
        }
        
        const dateEl = item.querySelector(CONFIG.SELECTORS.NEWS_DATE);
        if (dateEl && data.date) {
            dateEl.textContent = formatDate(data.date);
        }
        
        if (data.header) {
            loadNewsImage(id, 'mini').then(url => {
                if (url) {
                    item.style.backgroundImage = `url('${url}')`;
                }
            });
        }
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openNewsPopup(id, data);
        }, { once: true });
        item.style.cursor = 'pointer';
    }

    async function loadNewsImage(id, type = 'mini') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const url = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.NEWS_ATTACHMENT}?name=${encodeURIComponent(id)}&attachment=${type}`;
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) return null;
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            state.newsObjectUrls.push(objectUrl);
            return objectUrl;
        } catch {
            return null;
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

    function createNewsPopup() {
        const popup = document.createElement('div');
        popup.className = 'news-popup';
        popup.id = 'news-popup-dynamic';
        popup.innerHTML = `
            <div class="news-popup__content">
                <button class="news-popup__close" id="news-popup-close-btn">
                    <img src="img/cross-icon.svg" alt="Закрыть">
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
        if (!state.newsPopupElement) return;
        
        const closeBtn = state.newsPopupElement.querySelector('#news-popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeNewsPopup);
        }
        
        state.newsPopupElement.addEventListener('click', (e) => {
            if (e.target === state.newsPopupElement) {
                closeNewsPopup();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.newsPopupElement.classList.contains(CONFIG.CLASSES.ACTIVE)) {
                closeNewsPopup();
            }
        });
    }

    function closeNewsPopup() {
        if (!state.newsPopupElement) return;
        
        state.newsPopupElement.classList.remove(CONFIG.CLASSES.ACTIVE);
        document.body.style.overflow = '';
    }

    function formatBodyContent(text) {
        if (!text) return '';
        let formatted = text.replace(/\n/g, '<br>');
        const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
        formatted = formatted.replace(urlRegex, (url) => {
            const href = url.startsWith('http') ? url : `https://${url}`;
            return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="news-popup__link">${escapeHtml(url)}</a>`;
        });
        return formatted;
    }

    async function openNewsPopup(id, cachedData) {
        if (!state.newsPopupElement) {
            state.newsPopupElement = createNewsPopup();
            initNewsPopupHandlers();
        }
        
        let contentData = cachedData;
        if (!contentData || !contentData.body) {
            contentData = await fetchNewsContent(id);
            if (!contentData) return;
        }
        
        const titleEl = state.newsPopupElement.querySelector('.news-popup__title');
        const subtitleEl = state.newsPopupElement.querySelector('.news-popup__subtitle');
        const bodyEl = state.newsPopupElement.querySelector('.news-popup__body-content');
        const imgEl = state.newsPopupElement.querySelector('.news-popup__image img');
        
        if (titleEl) titleEl.textContent = contentData.header || '';
        
        if (subtitleEl) {
            subtitleEl.textContent = '';
        }
        
        if (bodyEl && contentData.body) {
            bodyEl.innerHTML = formatBodyContent(contentData.body);
        }
        
        if (imgEl) {
            const fullUrl = await loadNewsImage(id, 'full');
            if (fullUrl) {
                imgEl.src = fullUrl;
                imgEl.alt = contentData.header || '';
            }
        }
        
        state.newsPopupElement.classList.add(CONFIG.CLASSES.ACTIVE);
        document.body.style.overflow = 'hidden';
    }

    async function loadEvents() {
        const eventsList = document.querySelector(CONFIG.SELECTORS.EVENTS_LIST);
        if (!eventsList) return;

        const allEventItems = eventsList.querySelectorAll(CONFIG.SELECTORS.EVENTS_ITEM);
        if (!allEventItems.length) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const listResp = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.EVENTS_ORDER}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!listResp.ok) return;
            
            const ids = await listResp.json();
            const eventIds = Array.isArray(ids) ? ids : [];
            
            allEventItems.forEach(item => item.style.display = 'none');

            if (!eventIds.length) return;

            for (let i = 0; i < eventIds.length && i < allEventItems.length && i < CONFIG.MAX_VISIBLE_ITEMS; i++) {
                const id = eventIds[i];
                const item = allEventItems[i];
                
                const contentData = await fetchEventContent(id);
                if (!contentData) continue;
                
                updateEventCard(item, id, contentData);
                item.style.display = 'flex';
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.warn('Events loading failed', e);
            }
        }
    }

    async function fetchEventContent(id) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const resp = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.EVENTS_CONTENT}?name=${encodeURIComponent(id)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!resp.ok) return null;
            return await resp.json();
        } catch {
            return null;
        }
    }

    function updateEventCard(item, id, data) {
        const titleEl = item.querySelector(CONFIG.SELECTORS.EVENTS_TITLE);
        if (titleEl && data.header) {
            titleEl.textContent = data.header;
        }
        
        const dateEl = item.querySelector(CONFIG.SELECTORS.EVENTS_DATE);
        if (dateEl && data.date) {
            dateEl.textContent = data.date;
        }
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openEventPopup(id, data);
        }, { once: true });
        item.style.cursor = 'pointer';
    }

    function createEventPopup() {
        const popup = document.createElement('div');
        popup.className = 'events-popup';
        popup.id = 'events-popup-dynamic';
        popup.innerHTML = `
            <div class="events-popup__content">
                <button class="events-popup__close" id="events-popup-close-btn">
                    <img src="img/cross-icon.svg" alt="Закрыть">
                </button>
                <h3 class="events-popup__title"></h3>
                <p class="events-popup__datetime"></p>
                <div class="events-popup__text"></div>
            </div>
        `;
        document.body.appendChild(popup);
        return popup;
    }

    function initEventsPopupHandlers() {
        if (!state.eventsPopupElement) return;
        
        const closeBtn = state.eventsPopupElement.querySelector('#events-popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEventsPopup);
        }
        
        state.eventsPopupElement.addEventListener('click', (e) => {
            if (e.target === state.eventsPopupElement) {
                closeEventsPopup();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.eventsPopupElement.classList.contains(CONFIG.CLASSES.ACTIVE)) {
                closeEventsPopup();
            }
        });
    }

    function closeEventsPopup() {
        if (!state.eventsPopupElement) return;
        
        state.eventsPopupElement.classList.remove(CONFIG.CLASSES.ACTIVE);
        document.body.style.overflow = '';
    }

    async function openEventPopup(id, cachedData) {
        if (!state.eventsPopupElement) {
            state.eventsPopupElement = createEventPopup();
            initEventsPopupHandlers();
        }
        
        let contentData = cachedData;
        if (!contentData || !contentData.body) {
            contentData = await fetchEventContent(id);
            if (!contentData) return;
        }
        
        const titleEl = state.eventsPopupElement.querySelector('.events-popup__title');
        const datetimeEl = state.eventsPopupElement.querySelector('.events-popup__datetime');
        const bodyEl = state.eventsPopupElement.querySelector('.events-popup__text');
        
        if (titleEl) titleEl.textContent = contentData.header || '';
        
        if (datetimeEl && contentData.date) {
            datetimeEl.textContent = contentData.date;
        }
        
        if (bodyEl && contentData.body) {
            bodyEl.innerHTML = formatBodyContent(contentData.body);
        }
        
        state.eventsPopupElement.classList.add(CONFIG.CLASSES.ACTIVE);
        document.body.style.overflow = 'hidden';
    }

    async function loadTeamPhoto(id, imgElement) {
        if (!imgElement || imgElement.dataset.loaded) return;
        imgElement.dataset.loaded = 'true';
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const url = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TEAM_ATTACHMENT}?name=${encodeURIComponent(id)}&attachment=photo`;
            const resp = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const blob = await resp.blob();
            const objectUrl = URL.createObjectURL(blob);
            state.teamObjectUrls.push(objectUrl);
            
            imgElement.src = objectUrl;
            imgElement.onload = () => URL.revokeObjectURL(objectUrl);
        } catch (e) {
            if (e.name !== 'AbortError') console.warn(`Photo load failed: ${id}`, e);
            imgElement.src = CONFIG.PLACEHOLDER_SVG;
        }
    }

    function initHomeTeamSliderScroll(slider) {
        let scrollTimeout;
        
        slider.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {}, 150);
        }, { passive: false });
        
        slider.style.scrollBehavior = 'smooth';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function cleanup() {
        state.newsObjectUrls.forEach(url => URL.revokeObjectURL(url));
        state.eventsObjectUrls.forEach(url => URL.revokeObjectURL(url));
        state.teamObjectUrls.forEach(url => URL.revokeObjectURL(url));
        state.newsObjectUrls = [];
        state.eventsObjectUrls = [];
        state.teamObjectUrls = [];
    }

    window.addEventListener('beforeunload', cleanup);

    return { init };
})();

HomePageApp.init();