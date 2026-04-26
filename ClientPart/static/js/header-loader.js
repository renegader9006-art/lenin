async function loadHeader() {
    try {
        const response = await fetch('1header.html');
        if (!response.ok) {
            throw new Error('Ошибка загрузки header');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headerContent = doc.querySelector('.main-header');

        if (headerContent) {
            const headerBlock = document.getElementById('header-block');
            if (headerBlock) {
                headerBlock.appendChild(headerContent);
            }
        }

        if (typeof initHeaderDropdown === 'function') {
            initHeaderDropdown();
        }

        if (typeof initMobileHeader === 'function') {
            initMobileHeader();
        }
    } catch (error) {
        console.error('Ошибка при загрузке header:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});