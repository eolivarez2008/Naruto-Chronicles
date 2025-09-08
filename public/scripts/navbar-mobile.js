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

function initNavbarScrollBehavior() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) {
    console.warn("mainNavbar introuvable");
    return;
  }

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      navbar.classList.add('navbar-hidden');
    } else {
      navbar.classList.remove('navbar-hidden');
    }

    lastScrollY = currentScrollY;
  });
}
