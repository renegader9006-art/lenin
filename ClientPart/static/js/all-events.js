const EventApp = (() => {
    'use strict';

    const CONFIG = {
        API_BASE_URL: `http://${window.location.hostname}:8080`,
        SELECTORS: {
            HEADER_BLOCK: '#header-block',
            FOOTER_BLOCK: '#footer-block',
            EVENTS_GRID: '#events-grid',
            FILTER_BUTTON: '#filter-button',
            FILTER_MENU: '#filter-menu',
            FILTER_ITEMS: '.dropdown__item',
            EVENTS_CARD: '.events-card',
            POPUP_CLOSE: '#event-popup-close-btn'
        },
        CLASSES: {
            ACTIVE: 'active',
            POPUP_ACTIVE: 'active'
        },
        API_ENDPOINTS: {
            EVENTS_ORDER: '/api/v1/block/мероприятия/order',
            EVENTS_CONTENT: '/api/v1/block/мероприятия/content'
        },
        TIMEOUT_MS: 10000
    };

    let state = {
        currentFilter: 'all',
        eventsData: [],
        popupElement: null
    };

    const abortControllers = new Map();

    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            Promise.all([
                loadComponent(CONFIG.SELECTORS.HEADER_BLOCK, '1header.html', '.main-header'),
                loadComponent(CONFIG.SELECTORS.FOOTER_BLOCK, '2footer.html', '.footer')
            ]).then(() => {
                if (typeof initHeaderDropdown === 'function') initHeaderDropdown();
                if (typeof initMobileHeader === 'function') initMobileHeader();
            }).catch(console.error);
            
            initFilterDropdown();
            loadEvents();
        });
    }

    async function loadComponent(blockSelector, filePath, contentSelector) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const response = await fetch(filePath, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector(contentSelector);
            
            if (content) {
                const block = document.querySelector(blockSelector);
                if (block) block.appendChild(content);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(`Component load failed: ${filePath}`, error);
            }
        }
    }

    function initFilterDropdown() {
        const filterButton = document.querySelector(CONFIG.SELECTORS.FILTER_BUTTON);
        const filterMenu = document.querySelector(CONFIG.SELECTORS.FILTER_MENU);
        
        if (!filterButton || !filterMenu) return;

        filterButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDropdown(filterButton, filterMenu);
        });

        document.addEventListener('click', (event) => {
            if (!filterMenu.contains(event.target) && !filterButton.contains(event.target)) {
                closeDropdown(filterButton, filterMenu);
            }
        });

        document.querySelectorAll(CONFIG.SELECTORS.FILTER_ITEMS).forEach((item) => {
            item.addEventListener('click', () => {
                const filterValue = item.getAttribute('data-filter');
                const filterText = item.textContent;

                document.querySelectorAll(CONFIG.SELECTORS.FILTER_ITEMS).forEach(i => 
                    i.classList.remove(CONFIG.CLASSES.ACTIVE)
                );
                item.classList.add(CONFIG.CLASSES.ACTIVE);

                const selectedSpan = filterButton.querySelector('.dropdown__selected');
                if (selectedSpan) selectedSpan.textContent = filterText;

                state.currentFilter = filterValue;
                renderEvents(state.eventsData);
                closeDropdown(filterButton, filterMenu);
            });
        });
    }

    function toggleDropdown(button, menu) {
        button.classList.toggle(CONFIG.CLASSES.ACTIVE);
        menu.classList.toggle(CONFIG.CLASSES.ACTIVE);
    }

    function closeDropdown(button, menu) {
        button.classList.remove(CONFIG.CLASSES.ACTIVE);
        menu.classList.remove(CONFIG.CLASSES.ACTIVE);
    }

    async function loadEvents() {
        const eventsGrid = document.querySelector(CONFIG.SELECTORS.EVENTS_GRID);
        if (!eventsGrid) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const listResponse = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.EVENTS_ORDER}`, 
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!listResponse.ok) {
                eventsGrid.innerHTML = '<div class="news-grid__error">Ошибка загрузки</div>';
                return;
            }
            
            const ids = await listResponse.json();
            const eventIds = Array.isArray(ids) ? ids : [];
            
            if (!eventIds.length) {
                eventsGrid.innerHTML = '<div class="news-grid__empty">Нет мероприятий</div>';
                return;
            }

            state.eventsData = [];
            
            for (const id of eventIds) {
                try {
                    const contentData = await fetchEventContent(id);
                    if (contentData) {
                        state.eventsData.push({
                            id,
                            title: contentData.header || 'Без названия',
                            datetime: contentData.date || '',
                            year: extractYear(contentData.date),
                            body: contentData.body || '',
                            dateRaw: contentData.date
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to load event ${id}:`, error);
                }
            }

            renderEvents(state.eventsData);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Events load failed:', error);
                eventsGrid.innerHTML = '<div class="news-grid__error">Ошибка загрузки</div>';
            }
        }
    }

    async function fetchEventContent(id) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const response = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.EVENTS_CONTENT}?name=${encodeURIComponent(id)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) return null;
            return await response.json();
        } catch {
            return null;
        }
    }

    function extractYear(dateStr) {
        if (!dateStr) return '';
        const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : '';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createEventsCard(event) {
        let dayMonth = '';
        const year = event.year || '';
        
        const dateMatch = event.datetime.match(/(\d{1,2})\s+([а-я]+)/i);
        if (dateMatch) {
            dayMonth = dateMatch[0];
        } else {
            dayMonth = event.datetime.substring(0, 10);
        }

        return `
            <div class="events-card" data-event-id="${escapeHtml(event.id)}">
                <div class="events-card__badge">
                    <p class="events-card__badge-day">${escapeHtml(dayMonth)}</p>
                    <p class="events-card__badge-year">${escapeHtml(year)}</p>
                </div>
                <h3 class="events-card__title">${escapeHtml(event.title)}</h3>
                <div class="events-card__footer">
                    <p class="events-card__date">${escapeHtml(event.datetime)}</p>
                    <div class="events-card__button">
                        <img src="img/arrow-right (2).svg" alt="→">
                    </div>
                </div>
            </div>
        `;
    }

    function renderEvents(eventsArray) {
        const eventsGrid = document.querySelector(CONFIG.SELECTORS.EVENTS_GRID);
        if (!eventsGrid) return;

        const filteredEvents = state.currentFilter === 'all' 
            ? eventsArray 
            : eventsArray.filter(event => event.year === state.currentFilter);

        if (!filteredEvents.length) {
            eventsGrid.innerHTML = '<div class="news-grid__empty">Нет мероприятий за выбранный период</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = filteredEvents.map(createEventsCard).join('');
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        eventsGrid.innerHTML = '';
        eventsGrid.appendChild(fragment);
        initEventsCardClicks();
    }

    function initEventsCardClicks() {
        document.querySelector(CONFIG.SELECTORS.EVENTS_GRID)?.addEventListener('click', (event) => {
            const card = event.target.closest(CONFIG.SELECTORS.EVENTS_CARD);
            if (!card) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const eventId = card.getAttribute('data-event-id');
            const eventData = state.eventsData.find(e => e.id === eventId);
            
            if (eventData) {
                openEventPopup(eventData);
            }
        }, { once: true });
    }

    function createEventPopup() {
        const popup = document.createElement('div');
        popup.className = 'events-popup';
        popup.id = 'event-popup-dynamic';
        popup.setAttribute('aria-hidden', 'true');
        
        popup.innerHTML = `
            <div class="events-popup__content" role="dialog" aria-modal="true" aria-label="Детали мероприятия">
                <button class="events-popup__close" id="event-popup-close-btn" aria-label="Закрыть">
                    <img src="img/cross-icon.svg" alt="" aria-hidden="true">
                </button>
                <h3 class="events-popup__title"></h3>
                <p class="events-popup__datetime"></p>
                <div class="events-popup__text"></div>
            </div>
        `;
        
        document.body.appendChild(popup);
        return popup;
    }

    function initEventPopupHandlers() {
        if (!state.popupElement) return;
        
        const closeBtn = state.popupElement.querySelector(CONFIG.SELECTORS.POPUP_CLOSE);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEventPopup);
        }
        
        state.popupElement.addEventListener('click', (event) => {
            if (event.target === state.popupElement) {
                closeEventPopup();
            }
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.popupElement?.classList.contains(CONFIG.CLASSES.POPUP_ACTIVE)) {
                closeEventPopup();
            }
        });
    }

    function closeEventPopup() {
        if (!state.popupElement) return;
        
        state.popupElement.classList.remove(CONFIG.CLASSES.POPUP_ACTIVE);
        state.popupElement.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function formatBodyContent(text) {
        if (!text) return '';
        
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
        
        return paragraphs.map(paragraph => {
            let processed = paragraph.trim();
            processed = processed.replace(urlRegex, (url) => {
                const href = url.startsWith('http') ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
            });
            return `<p>${processed}</p>`;
        }).join('');
    }

    async function openEventPopup(eventData) {
        if (!state.popupElement) {
            state.popupElement = createEventPopup();
            initEventPopupHandlers();
        }

        let content = eventData;
        
        if (!content.body) {
            const fresh = await fetchEventContent(eventData.id);
            if (fresh) content = fresh;
        }

        const titleElement = state.popupElement.querySelector('.events-popup__title');
        const datetimeElement = state.popupElement.querySelector('.events-popup__datetime');
        const bodyElement = state.popupElement.querySelector('.events-popup__text');

        if (titleElement) {
            titleElement.textContent = content.header || eventData.title || '';
        }
        
        if (datetimeElement) {
            datetimeElement.textContent = content.date || eventData.dateRaw || '';
        }
        
        if (bodyElement && content.body) {
            bodyElement.innerHTML = formatBodyContent(content.body);
        }

        state.popupElement.classList.add(CONFIG.CLASSES.POPUP_ACTIVE);
        state.popupElement.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    return { init };
})();

EventApp.init();