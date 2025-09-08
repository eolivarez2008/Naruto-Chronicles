function includeComponent(id, file, callback) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Élément #${id} introuvable`);
    return;
  }

  element.style.visibility = "hidden";
  element.style.opacity = "0";

  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Erreur lors du chargement de ${file}`);
      return response.text();
    })
    .then(data => {
      element.innerHTML = data;

      requestAnimationFrame(() => {
        element.style.transition = "opacity 0.3s ease";
        element.style.visibility = "visible";
        element.style.opacity = "1";
      });

      if (typeof callback === 'function') {
        callback();
      }
    })
    .catch(error => {
      console.error("Erreur d'inclusion de composant :", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  includeComponent("navbar", "/components/navbar.html", () => {
    if (typeof initHamburger === 'function') initHamburger();
    if (typeof initNavbarScrollBehavior === 'function') initNavbarScrollBehavior();
  });

  includeComponent("footer", "/components/footer.html");
});
