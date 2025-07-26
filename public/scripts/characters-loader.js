async function chargerPersonnages(jsonUrl, containerSelector) {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();
    const container = document.querySelector(containerSelector);

    data.characters.forEach(p => {
      const div = document.createElement('div');
      div.className = 'gallery-item pictures';
      div.innerHTML = `
        <img src="${p.image}" class="img-fluid rounded" alt="${p.name}">
        <p>${p.name}</p>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Erreur de chargement :", error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  chargerPersonnages('/data/personnages.json', '#persos');
  chargerPersonnages('/data/demons.json', '#demons');
  chargerPersonnages('/data/invocations.json', '#invocs');
});
