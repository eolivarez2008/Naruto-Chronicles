fetch('/components/navbar.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;
    initHamburger();
  });

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const sideMenu = document.getElementById('side-menu');
  if (hamburger && sideMenu) {
    hamburger.addEventListener('click', () => {
      sideMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
  } else {
    console.log('hamburger ou sideMenu introuvable');
  }
}

