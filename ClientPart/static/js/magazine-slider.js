document.addEventListener('DOMContentLoaded', function() {
    initMagazineSlider();
});

function initMagazineSlider() {
    const magazineItems = document.querySelectorAll('.magazine-item');
    const popup = document.getElementById('magazine-popup');
    const closeBtn = popup?.querySelector('.magazine-popup__close');
    const nextBtn = popup?.querySelector('.magazine-popup__nav--next');
    const prevBtn = popup?.querySelector('.magazine-popup__nav--prev');
    const slides = popup?.querySelectorAll('.magazine-popup__slide');
    const content = popup?.querySelector('.magazine-popup__content');

    if (!popup || !magazineItems.length) return;

    let currentSlide = 0;
    const totalSlides = slides?.length || 0;

    function updateNavButtons() {
        if (!prevBtn || !nextBtn) return;
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function goToSlide(index) {
        if (!slides || index < 0 || index >= totalSlides) return;

        slides.forEach((slide, i) => {
            slide.classList.toggle('magazine-popup__slide--active', i === index);
        });

        currentSlide = index;
        updateNavButtons();
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }

    function openPopup(targetItem) {
        if (!popup) return;
        goToSlide(0);
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePopup() {
        if (!popup) return;
        popup.classList.remove('active');
        document.body.style.overflow = '';
    }

    magazineItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openPopup(item);
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closePopup);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            closePopup();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            closePopup();
        }

        if (popup.classList.contains('active')) {
            if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        }
    });

    updateNavButtons();
}
