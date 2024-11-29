// Js pour le menu hamburger

document.addEventListener("DOMContentLoaded", function () {

  const hamburger = document.getElementById('hamburger');
  const sideMenu = document.getElementById('side-menu');

  if (hamburger && sideMenu) {
    hamburger.addEventListener('click', () => {
      sideMenu.classList.toggle('active'); 
      hamburger.classList.toggle('active'); 
    });
  } else {
    console.log("Menu hamburger ou side-menu introuvable sur cette page.");
  }
});

// JS pour la vidéo trailer

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


// JS pour le formulaire de contact

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const form = this;

        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'Accept': 'application/json',
            }
        }).then(response => {
            if (response.ok) {
                window.location.href = "./merci.html";
            } else {
                alert("Une erreur est survenue. Veuillez réessayer.");
            }
        }).catch(error => {
            console.error('Erreur réseau:', error);
            alert("Impossible d'envoyer votre message. Vérifiez votre connexion.");
        });
    });
}