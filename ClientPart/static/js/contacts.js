const ContactsPageApp = (() => {
    'use strict';

    const CONFIG = {
        API_BASE_URL: `http://${window.location.hostname}:8080`,
        SELECTORS: {
            HEADER_BLOCK: '#header-block',
            FOOTER_BLOCK: '#footer-block',
            HERO_TITLE: '.hero__title',
            CONTACTS_INFO: '.contacts__info',
            CONTACT_ITEM: '.contacts__item',
            CONTACT_LABEL: '.contacts__label',
            CONTACT_VALUE: '.contacts__value',
            CONTACT_LINK: '.contacts__link'
        },
        API_ENDPOINTS: {
            LOCALE_CONTACTS: '/api/v1/locale/контакты'
        },
        TIMEOUT_MS: 10000,
        CONTACT_TYPES: ['адрес', 'телефон', 'почта', 'телеграм']
    };

    function init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await loadContactsData();
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
            const doc = new DOMParser().parseFromString(html, 'text/html');
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

    async function loadContactsData() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
            
            const response = await fetch(
                `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.LOCALE_CONTACTS}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn('Не удалось загрузить данные контактов');
                return;
            }
            
            const data = await response.json();
            
            const heroTitle = document.querySelector(CONFIG.SELECTORS.HERO_TITLE);
            if (heroTitle && data.название) {
                heroTitle.textContent = data.название;
            }
            
            CONFIG.CONTACT_TYPES.forEach(type => {
                if (!data[type]) return;
                
                const item = document.querySelector(`${CONFIG.SELECTORS.CONTACT_ITEM}[data-contact-type="${type}"]`);
                if (!item) return;
                
                const label = item.querySelector(CONFIG.SELECTORS.CONTACT_LABEL);
                const value = item.querySelector(CONFIG.SELECTORS.CONTACT_VALUE);
                
                if (label) {
                    const labelMap = {
                        'адрес': 'Адрес:',
                        'телефон': 'Телефон:',
                        'почта': 'E-mail:',
                        'телеграм': 'Канал в телеграм:'
                    };
                    label.textContent = labelMap[type] || '';
                }
                
                if (value && value.tagName === 'A') {
                    value.textContent = data[type];
                    
                    if (type === 'телефон') {
                        const phoneDigits = data[type].replace(/[^\d+]/g, '');
                        value.href = `tel:${phoneDigits}`;
                    } else if (type === 'почта') {
                        value.href = `mailto:${data[type]}`;
                    } else if (type === 'телеграм') {
                        const telegramLink = data[type].startsWith('http') ? data[type] : `https://t.me/${data[type].replace(/^[@/]+/, '')}`;
                        value.href = telegramLink;
                        value.target = '_blank';
                    }
                } else if (value) {
                    value.textContent = data[type];
                }
            });
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка загрузки данных контактов:', error);
            }
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init };
})();

ContactsPageApp.init();