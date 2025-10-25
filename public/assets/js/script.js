function changeLanguage(lang) {
    const isLocal = window.location.protocol === 'file:';
    if (lang === 'ko') {
        window.location.href = isLocal ? 'index.html' : '/index.html';
    } else {
        window.location.href = isLocal ? `${lang}/index.html` : `/${lang}/`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const dropdowns = document.querySelectorAll('.language-selector');

    dropdowns.forEach(function(dropdown) {
        const btn = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-toggle-content');
        const options = menu.querySelectorAll('a');

        if (!btn || !menu) return;

        const currentLang = document.documentElement.lang || 'ko';
        const currentOption = Array.from(options).find(opt => opt.dataset.lang === currentLang);

        if (currentOption) {
            btn.textContent = currentOption.textContent;
            btn.dataset.lang = currentLang;
            options.forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.lang === currentLang);
            });
        }

        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            dropdowns.forEach(function(otherDropdown) {
                const otherMenu = otherDropdown.querySelector('.dropdown-toggle-content');
                if (otherMenu !== menu) otherMenu.classList.remove('show');
            });

            menu.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            menu.classList.remove('show');
        });

        options.forEach(function(option) {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = option.dataset.lang;
                btn.textContent = option.textContent;
                btn.dataset.lang = selectedLang;
                menu.classList.remove('show');

                options.forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.lang === selectedLang);
                });

                if (typeof changeLanguage === 'function') {
                changeLanguage(selectedLang);
                }
            });
        });
    });
});