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
        // ✅ On autorise l'accès temporairement
        sessionStorage.setItem('canAccessThanks', '1');
        window.location.href = "/contact/thanks";
      } else {
        alert("Une erreur est survenue. Veuillez réessayer.");
      }
    }).catch(error => {
      console.error('Erreur réseau:', error);
      alert("Impossible d'envoyer votre message. Vérifiez votre connexion.");
    });
  });
}
