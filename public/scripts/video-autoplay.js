document.addEventListener("DOMContentLoaded", function() {
  const video = document.querySelector(".video-trailer");

  if (video) {
    function checkVideoVisibility() {
      const rect = video.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (isVisible) {
        video.play();
      } else {
        video.pause();
      }
    }

    window.addEventListener("scroll", checkVideoVisibility);
    window.addEventListener("resize", checkVideoVisibility);

    checkVideoVisibility();
  } else {
    console.log("Aucune vidéo avec la classe .video-trailer trouvée sur cette page.");
  }
});