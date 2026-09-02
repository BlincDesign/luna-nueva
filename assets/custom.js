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