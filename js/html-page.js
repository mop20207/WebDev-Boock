// Carrusel de artículos destacados de la página HTML.
// El desplazamiento táctil funciona de forma nativa gracias a overflow-x y scroll-snap en CSS.
document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("htmlArticleCarousel");
  const previous = document.getElementById("htmlCarouselPrev");
  const next = document.getElementById("htmlCarouselNext");

  if (!carousel || !previous || !next) return;

  // Avanza aproximadamente una tarjeta; en móviles también se puede deslizar con el dedo.
  const moveCarousel = (direction) => {
    const card = carousel.querySelector(".article-slide");
    if (!card) return;
    const styles = getComputedStyle(carousel);
    const gap = parseFloat(styles.columnGap) || 0;
    carousel.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: "smooth"
    });
  };

  previous.addEventListener("click", () => moveCarousel(-1));
  next.addEventListener("click", () => moveCarousel(1));
});
