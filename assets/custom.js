document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('#SiteHeader');
  const sections = document.querySelectorAll('.section--scheme-secondary');

  if (!header || !sections.length) return;

  const checkOverlap = () => {
    const headerRect = header.getBoundingClientRect();

    const overlapping = [...sections].some((section) => {
      const sectionRect = section.getBoundingClientRect();

      return (
        sectionRect.top < headerRect.bottom &&
        sectionRect.bottom > headerRect.top
      );
    });

    header.classList.toggle('header_overlap--secondary', overlapping);
  };

  window.addEventListener('scroll', checkOverlap, { passive: true });
  window.addEventListener('resize', checkOverlap);

  checkOverlap();
});

// PDP gallery hover arrows: click handling only. Drag, swipe and keyboard nav
// are already provided by the theme's own Flickity slideshow; this just wires
// the new stage-overlay buttons to that same instance via Flickity.data().
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
    });
  };

  document.addEventListener('DOMContentLoaded', bindGalleryArrows);
  document.addEventListener('shopify:section:load', bindGalleryArrows);
})();