document.addEventListener('DOMContentLoaded', function() {
    initNewsPopups();
    initEventsPopups();
});

function initNewsPopups() {
    const newsItems = document.querySelectorAll('.news__item[data-popup]');
    const newsPopups = document.querySelectorAll('.news-popup');

    newsItems.forEach(function(newsItem) {
        const popupId = newsItem.getAttribute('data-popup');
        const popup = document.getElementById('news-popup-' + popupId.split('-')[1]);
        if (!popup) return;

        newsItem.addEventListener('click', function(e) {
            e.preventDefault();
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closeButtons = document.querySelectorAll('.news-popup__close');
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const popupId = button.getAttribute('data-popup-close');
            const popup = document.getElementById('news-popup-' + popupId.split('-')[1]);
            if (popup) {
                popup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    newsPopups.forEach(function(popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                popup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activePopup = document.querySelector('.news-popup.active');
            if (activePopup) {
                activePopup.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}

function initEventsPopups() {
    const eventsItems = document.querySelectorAll('.events__item[data-popup]');
    const eventsPopups = document.querySelectorAll('.events-popup');

    eventsItems.forEach(function(eventsItem) {
        const popupId = eventsItem.getAttribute('data-popup');
        const popup = document.getElementById('events-popup-' + popupId.split('-')[1]);
        if (!popup) return;

        eventsItem.addEventListener('click', function(e) {
            e.preventDefault();
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closeButtons = document.querySelectorAll('.events-popup__close');
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const popupId = button.getAttribute('data-popup-close');
            const popup = document.getElementById('events-popup-' + popupId.split('-')[1]);
            if (popup) {
                popup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    eventsPopups.forEach(function(popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                popup.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activePopup = document.querySelector('.events-popup.active');
            if (activePopup) {
                activePopup.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
}
