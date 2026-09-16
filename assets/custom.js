document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('#SiteHeader');
  const sections = document.querySelectorAll('.shopify-section > .section--scheme-secondary');

  if (!header || !sections.length) return;

  const baseScheme = header.dataset.scheme;
  let currentScheme = baseScheme;

  const updateHeader = () => {
    const shouldBeFixed = window.scrollY > 0;

    header.classList.toggle('fixed', shouldBeFixed);

    if (!shouldBeFixed) {
      header.classList.remove('header_overlap--secondary');

      if (currentScheme !== baseScheme) {
        if (currentScheme) header.classList.remove(currentScheme);
        if (baseScheme) header.classList.add(baseScheme);

        currentScheme = baseScheme;
      }

      return;
    }

    const headerRect = header.getBoundingClientRect();

    const overlappingSection = [...sections].find((section) => {
      const sectionRect = section.getBoundingClientRect();

      return (
        sectionRect.top < headerRect.bottom &&
        sectionRect.bottom > headerRect.top
      );
    });

    header.classList.toggle(
      'header_overlap--secondary',
      !!overlappingSection
    );

    const sectionScheme = overlappingSection
      && [...overlappingSection.classList].find((cls) =>
        cls.startsWith('color-scheme-')
      );

    const nextScheme = sectionScheme || baseScheme;

    if (nextScheme !== currentScheme) {
      if (currentScheme) header.classList.remove(currentScheme);
      if (nextScheme) header.classList.add(nextScheme);

      currentScheme = nextScheme;
    }
  };

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

  if (window.location.href.includes('/products')) {
    updateHeader();
  }
});


(() => {
  const bindGalleryArrows = () => {
    document.querySelectorAll('[data-product-photos]').forEach((slider) => {
      const stage = slider.closest('.pdp-gallery__stage');
      if (!stage || stage.dataset.pdpNavBound) return;

      const prevBtn = stage.querySelector('[data-pdp-nav="prev"]');
      const nextBtn = stage.querySelector('[data-pdp-nav="next"]');
      if (!prevBtn && !nextBtn) return;

      const goTo = (direction) => {
        const flkty = window.Flickity && window.Flickity.data(slider);
        if (!flkty) return;
        flkty[direction]();
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (event) => {
          event.preventDefault();
          goTo('previous');
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (event) => {
          event.preventDefault();
          goTo('next');
        });
      }

      stage.dataset.pdpNavBound = 'true';

      const countEl = stage.querySelector('[data-pdp-count]');
      const slides = slider.querySelectorAll('.product-main-slide');

      if (countEl && slides.length > 1) {
        const pad = (n) => String(n).padStart(2, '0');
        const total = slides.length;

        const updateCount = () => {
          const activeIndex = Array.from(slides).findIndex((slide) => slide.classList.contains('is-selected'));
          countEl.textContent = `${pad(activeIndex > -1 ? activeIndex + 1 : 1)} / ${pad(total)}`;
        };

        updateCount();

        const observer = new MutationObserver(updateCount);
        slides.forEach((slide) => {
          observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
        });
      }
    });
  };

  document.addEventListener('DOMContentLoaded', bindGalleryArrows);
  document.addEventListener('shopify:section:load', bindGalleryArrows);
})();