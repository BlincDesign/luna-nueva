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


// PDP gallery: hover-arrow click handling and the "01 / 05" progress count.
// Drag, swipe and keyboard nav are already provided by the theme's own
// Flickity slideshow; the arrows just call into that same instance via
// Flickity.data(). The count is kept in sync by watching for the
// .is-selected class Flickity's own Cell.select()/unselect() toggles on each
// slide, rather than by binding to a specific Flickity instance directly —
// image-set variant switches destroy and recreate that instance, but the
// slide elements (and their class mutations) persist.
(() => {
  const initGallery = () => {
    document.querySelectorAll('[data-product-photos]').forEach((slider) => {
      const stage = slider.closest('.pdp-gallery__stage');
      if (!stage || stage.dataset.pdpGalleryBound) return;
      stage.dataset.pdpGalleryBound = 'true';

      const prevBtn = stage.querySelector('[data-pdp-nav="prev"]');
      const nextBtn = stage.querySelector('[data-pdp-nav="next"]');

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

  document.addEventListener('DOMContentLoaded', initGallery);
  document.addEventListener('shopify:section:load', initGallery);
})();