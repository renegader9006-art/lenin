async function loadFooter() {
    try {
        const response = await fetch('2footer.html');
        if (!response.ok) {
            throw new Error('Ошибка загрузки footer');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const footerContent = doc.querySelector('.footer');

        if (footerContent) {
            const footerBlock = document.getElementById('footer-block');
            if (footerBlock) {
                footerBlock.appendChild(footerContent);
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке footer:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadFooter();
});
