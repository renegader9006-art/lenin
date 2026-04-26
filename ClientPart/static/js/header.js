function initHeaderDropdown() {
    const mainHeader = document.querySelector('.main-header');
    if (!mainHeader || mainHeader.dataset.dropdownBound === 'true') return false;

    const navItems = Array.from(mainHeader.querySelectorAll('.nav__item[data-dropdown]'));
    const dropdowns = Array.from(mainHeader.querySelectorAll('.nav__dropdown[data-dropdown-panel]'));
    const dropdownsContainer = mainHeader.querySelector('.nav__dropdowns');

    mainHeader.dataset.dropdownBound = 'true';

    if (!navItems.length || !dropdowns.length || !dropdownsContainer) {
        return true;
    }

    const dropdownMap = new Map(
        dropdowns.map(dropdown => [dropdown.dataset.dropdownPanel, dropdown])
    );

    let closeTimer = null;

    function setDropdownVisibility(isOpen) {
        if (isOpen) {
            mainHeader.classList.add('main-header--dropdown-open');
            dropdownsContainer.setAttribute('aria-hidden', 'false');
        } else {
            mainHeader.classList.remove('main-header--dropdown-open');
            dropdownsContainer.setAttribute('aria-hidden', 'true');
        }
    }

    function closeDropdowns() {
        navItems.forEach(item => item.classList.remove('nav__item--active'));
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        setDropdownVisibility(false);
    }

    function openDropdown(id) {
        if (window.innerWidth <= 1024 || !id) return;

        const target = dropdownMap.get(id);
        if (!target) {
            closeDropdowns();
            return;
        }

        navItems.forEach(item => {
            const isActive = item.dataset.dropdown === id;
            item.classList.toggle('nav__item--active', isActive);
        });

        dropdowns.forEach(dropdown => {
            dropdown.classList.toggle('active', dropdown === target);
        });

        setDropdownVisibility(true);
    }

    function clearCloseTimer() {
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
    }

    function scheduleClose() {
        clearCloseTimer();
        closeTimer = setTimeout(closeDropdowns, 140);
    }

    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            clearCloseTimer();
            openDropdown(item.dataset.dropdown);
        });

        item.addEventListener('focusin', () => {
            clearCloseTimer();
            openDropdown(item.dataset.dropdown);
        });
    });

    mainHeader.addEventListener('mouseenter', clearCloseTimer);
    dropdownsContainer.addEventListener('mouseenter', clearCloseTimer);
    mainHeader.addEventListener('mouseleave', scheduleClose);

    mainHeader.addEventListener('focusout', (event) => {
        const nextFocused = event.relatedTarget;
        if (!nextFocused || !mainHeader.contains(nextFocused)) {
            scheduleClose();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdowns();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            closeDropdowns();
        }
    });

    dropdownsContainer.setAttribute('aria-hidden', 'true');

    return true;
}

function initMobileHeader() {
    const burgerBtn = document.querySelector('.header__burger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (!burgerBtn || !mobileNav) return false;
    if (mobileNav.dataset.mobileMenuBound === 'true') return true;

    mobileNav.dataset.mobileMenuBound = 'true';

    const overlay = mobileNav.querySelector('.mobile-nav__overlay');
    const closeBtn = mobileNav.querySelector('.mobile-nav__close');
    const mobileLinks = mobileNav.querySelectorAll('.mobile-nav__link');

    function openMenu() {
        mobileNav.classList.add('mobile-nav--open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileNav.classList.remove('mobile-nav--open');
        document.body.style.overflow = '';
    }

    burgerBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openMenu();
    });

    if (overlay) overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => setTimeout(closeMenu, 150));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    return true;
}

function initHeaderFeatures() {
    const dropdownReady = initHeaderDropdown();
    const mobileReady = initMobileHeader();
    return dropdownReady || mobileReady;
}

function startHeaderAutoInit() {
    if (initHeaderFeatures()) return;

    const observer = new MutationObserver(() => {
        if (initHeaderFeatures()) {
            observer.disconnect();
        }
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHeaderAutoInit);
} else {
    startHeaderAutoInit();
}
