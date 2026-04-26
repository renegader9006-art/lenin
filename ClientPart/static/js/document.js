const DocumentsApp = (() => {
    'use strict';

    const CONFIG = {
        API_BASE: `http://${window.location.hostname}:8080/api/v1`,
        SELECTORS: {
            CHARTER_CONTAINER: '#charter-container',
            PROFESSIONS_LIST: '#professions-list',
            PROTOCOLS_LIST: '#protocols-list',
            KNOWLEDGE_LIST: '#knowledge-list',
            MEETINGS_CONTAINER: '#meetings-container',
            MEETINGS_LIST: '#meetings-list-dynamic',
            STANDARDS_TOGGLE: '#standards-toggle',
            MEETINGS_TOGGLE: '#meetings-toggle',
            STANDARDS_ITEMS: '.standards-list__items',
            DATES_LIST: '.standards-list__dates'
        },
        CLASSES: {
            HIDDEN: 'standards-list__item--hidden',
            DATE_HIDDEN: 'standards-list__date-link--hidden',
            MEETINGS_HIDDEN: 'meetings-item--hidden',
            EXPANDED: 'expanded',
            ACTIVE: 'active'
        },
        LIMITS: {
            PROFESSIONS_VISIBLE: 5,
            PROTOCOLS_VISIBLE: 2,
            MEETINGS_VISIBLE: 10
        },
        TIMEOUT_MS: 10000
    };

    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            loadCharter();
            loadProfessions();
            loadProtocols();
            loadKnowledge();
            loadMeetings();
            initStandardsToggle();
        });
    }

    async function fetchJson(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name !== 'AbortError') console.warn(`Fetch failed: ${url}`, e);
            return null;
        }
    }

    function buildFileLink(folder, fileName) {
        const name = fileName.replace(/\.[^/.]+$/, '');
        return `${CONFIG.API_BASE}/folder/${folder}/get?attachment=${encodeURIComponent(name)}`;
    }

    function renderDocItem(text, href) {
        return `<div class="doc-item"><a class="doc-item__link" href="${href}" target="_blank">${text}</a></div>`;
    }

    function renderListItem(text, href, className, hidden = false) {
        const hiddenClass = hidden ? ` ${className}` : '';
        return `<li class="${className}${hiddenClass}"><a class="standards-list__link" href="${href}" target="_blank">${text}</a></li>`;
    }

    function renderDateItem(text, href, hidden = false) {
        const hiddenClass = hidden ? ` ${CONFIG.CLASSES.DATE_HIDDEN}` : '';
        return `<li${hiddenClass}><a class="standards-list__date-link" href="${href}" target="_blank">${text}</a></li>`;
    }

    function renderMeetingItem(text, href, hidden = false) {
        const hiddenClass = hidden ? ` ${CONFIG.CLASSES.MEETINGS_HIDDEN}` : '';
        return `<li class="meetings-item${hiddenClass}"><a class="meetings-list__link" href="${href}" target="_blank">${text}</a></li>`;
    }

    function setToggleVisibility(toggleBtn, shouldShow) {
        if (!toggleBtn) return;
        toggleBtn.style.display = shouldShow ? 'flex' : 'none';
        if (shouldShow) {
            toggleBtn.classList.remove(CONFIG.CLASSES.ACTIVE);
            const textEl = toggleBtn.querySelector('.doc-section__toggle-text');
            if (textEl) textEl.textContent = 'см. больше';
        }
    }

    function updateToggleText(toggleBtn) {
        const textEl = toggleBtn?.querySelector('.doc-section__toggle-text');
        if (textEl) {
            textEl.textContent = toggleBtn.classList.contains(CONFIG.CLASSES.ACTIVE) ? 'см. меньше' : 'см. больше';
        }
    }

    async function loadCharter() {
        const container = document.querySelector(CONFIG.SELECTORS.CHARTER_CONTAINER);
        if (!container) return;
        const files = await fetchJson(`${CONFIG.API_BASE}/folder/устав/list`);
        if (files?.length > 0) {
            container.innerHTML = files.map(f => renderDocItem(f.name, buildFileLink('устав', f.name))).join('');
        } else {
            container.innerHTML = '<div class="empty-message">Нет доступных документов</div>';
        }
    }

    async function loadProfessions() {
        const container = document.querySelector(CONFIG.SELECTORS.PROFESSIONS_LIST);
        const toggleBtn = document.querySelector(CONFIG.SELECTORS.STANDARDS_TOGGLE);
        if (!container) return;
        const files = await fetchJson(`${CONFIG.API_BASE}/folder/профессии/list`);
        if (files?.length > 0) {
            container.innerHTML = files.map((f, i) => 
                renderListItem(f.name, buildFileLink('профессии', f.name), CONFIG.CLASSES.HIDDEN, i >= CONFIG.LIMITS.PROFESSIONS_VISIBLE)
            ).join('');
            setToggleVisibility(toggleBtn, files.length > CONFIG.LIMITS.PROFESSIONS_VISIBLE);
        } else {
            container.innerHTML = '<li class="empty-message" style="list-style:none;padding-left:0">Нет доступных документов</li>';
            setToggleVisibility(toggleBtn, false);
        }
    }

    async function loadProtocols() {
        const container = document.querySelector(CONFIG.SELECTORS.PROTOCOLS_LIST);
        if (!container) return;
        const files = await fetchJson(`${CONFIG.API_BASE}/folder/протоколы/list`);
        if (files?.length > 0) {
            container.innerHTML = files.map((f, i) => 
                renderDateItem(f.name, buildFileLink('протоколы', f.name), i >= CONFIG.LIMITS.PROTOCOLS_VISIBLE)
            ).join('');
        } else {
            container.innerHTML = '<li class="empty-message" style="list-style:none;padding-left:0">Нет доступных протоколов</li>';
        }
    }

    async function loadKnowledge() {
        const container = document.querySelector(CONFIG.SELECTORS.KNOWLEDGE_LIST);
        if (!container) return;
        const files = await fetchJson(`${CONFIG.API_BASE}/folder/знания/list`);
        if (files?.length > 0) {
            container.innerHTML = files.map(f => 
                `<li class="knowledge__item"><a class="standards-list__date-link" href="${buildFileLink('знания', f.name)}" target="_blank">${f.name}</a></li>`
            ).join('');
        } else {
            container.innerHTML = '<li class="empty-message" style="list-style:none;padding-left:0">Нет доступных материалов</li>';
        }
    }

    async function loadMeetings() {
        const container = document.querySelector(CONFIG.SELECTORS.MEETINGS_CONTAINER);
        const toggleBtn = document.querySelector(CONFIG.SELECTORS.MEETINGS_TOGGLE);
        if (!container) return;
        const files = await fetchJson(`${CONFIG.API_BASE}/folder/совещания/list`);
        if (files?.length > 0) {
            const itemsHtml = files.map((f, i) => 
                renderMeetingItem(f.name, buildFileLink('совещания', f.name), i >= CONFIG.LIMITS.MEETINGS_VISIBLE)
            ).join('');
            container.innerHTML = `<ul class="meetings-list" id="meetings-list-dynamic">${itemsHtml}</ul>`;
            
            const shouldShowToggle = files.length > CONFIG.LIMITS.MEETINGS_VISIBLE;
            if (toggleBtn) {
                toggleBtn.style.display = shouldShowToggle ? 'flex' : 'none';
                if (shouldShowToggle) {
                    toggleBtn.classList.remove(CONFIG.CLASSES.ACTIVE);
                    const textEl = toggleBtn.querySelector('.doc-section__toggle-text');
                    if (textEl) textEl.textContent = 'см. больше';
                }
            }
            
            initMeetingsToggle();
        } else {
            container.innerHTML = '<div class="empty-message">Нет доступных материалов</div>';
            if (toggleBtn) toggleBtn.style.display = 'none';
        }
    }

    function initStandardsToggle() {
        const toggleBtn = document.querySelector(CONFIG.SELECTORS.STANDARDS_TOGGLE);
        const standardsItems = document.querySelector(CONFIG.SELECTORS.STANDARDS_ITEMS);
        const datesList = document.querySelector(CONFIG.SELECTORS.DATES_LIST);
        if (!toggleBtn || !standardsItems || !datesList || toggleBtn.style.display === 'none') return;
        toggleBtn.addEventListener('click', () => {
            standardsItems.classList.toggle(CONFIG.CLASSES.EXPANDED);
            datesList.classList.toggle(CONFIG.CLASSES.EXPANDED);
            toggleBtn.classList.toggle(CONFIG.CLASSES.ACTIVE);
            updateToggleText(toggleBtn);
        });
    }

    function initMeetingsToggle() {
        const toggleBtn = document.querySelector(CONFIG.SELECTORS.MEETINGS_TOGGLE);
        const meetingsList = document.querySelector(CONFIG.SELECTORS.MEETINGS_LIST);
        
        if (!toggleBtn || !meetingsList) return;
        
        const hiddenItems = meetingsList.querySelectorAll(`.${CONFIG.CLASSES.MEETINGS_HIDDEN}`);
        if (hiddenItems.length === 0) {
            toggleBtn.style.display = 'none';
            return;
        }
        
        if (toggleBtn.style.display !== 'flex') {
            toggleBtn.style.display = 'flex';
        }
        
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        const clickHandler = () => {
            meetingsList.classList.toggle(CONFIG.CLASSES.EXPANDED);
            newToggleBtn.classList.toggle(CONFIG.CLASSES.ACTIVE);
            const textEl = newToggleBtn.querySelector('.doc-section__toggle-text');
            if (textEl) {
                textEl.textContent = newToggleBtn.classList.contains(CONFIG.CLASSES.ACTIVE) ? 'см. меньше' : 'см. больше';
            }
        };
        
        newToggleBtn.addEventListener('click', clickHandler);
    }

    return { init };
})();

DocumentsApp.init();