async function chargerImages(jsonUrl) {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();

    const containers = {
      personnages: document.querySelector('#persos'),
      demons: document.querySelector('#demons'),
      invocations: document.querySelector('#invocs')
    };

    data.forEach(p => {
      const container = containers[p.type];
      if (!container) return;

      const cleanName = p.name.replace(/\.[^/.]+$/, "");

      const div = document.createElement('div');
      div.className = 'gallery-item pictures';
      div.innerHTML = `
        <img src="${p.url}" class="img-fluid rounded" alt="${cleanName}">
        <p>${cleanName}</p>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Erreur de chargement :", error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  chargerImages('/data/images.json');
});
