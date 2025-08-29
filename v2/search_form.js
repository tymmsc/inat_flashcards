


document.getElementById("location-search").addEventListener("input", function () {
    searchINatPlaces(this.value);
});
document.getElementById("taxon-search").addEventListener("input", function () {
    searchINatTaxons(this.value);
});

async function searchINatPlaces(query) {
    if (query.length < 3) return;

    const response = await fetch(`https://api.inaturalist.org/v1/places/autocomplete?q=${query}`);
    const data = await response.json();
    let suggestions = document.getElementById("suggestions-loc");
    suggestions.innerHTML = "";

    data.results.forEach(place => {
        let item = document.createElement("li");
        item.textContent = place.display_name;
        item.onclick = () => {
            document.getElementById("location-search").value = place.id;
            console.log(`Selected: ${place.display_name}, Place ID: ${place.id}`);
            suggestions.innerHTML = ""; // Clear suggestions after selection
        };
        suggestions.appendChild(item);
    });
}

async function searchINatTaxons(query) {
    if (query.length < 3) return;

    const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${query}`);
    const data = await response.json();
    let suggestions = document.getElementById("suggestions");
    suggestions.innerHTML = "";

    data.results.forEach(taxon => {
        let item = document.createElement("li");
        item.textContent = `${taxon.name} (${taxon.preferred_common_name || 'No common name'})`;

        item.onclick = () => {
            document.getElementById("taxon-search").value = taxon.id;
            suggestions.innerHTML = ""; // Clear suggestions after selection
        };
        suggestions.appendChild(item);
    });
}

  const form = document.getElementById('flashcard-form');

  // On load, restore saved values
  window.addEventListener('load', () => {
    Array.from(form.elements).forEach(el => {
      if (el.name && localStorage.getItem(el.name)) {
        el.value = localStorage.getItem(el.name);
        console.log(`loaded: ${el.name}, Place ID: ${el.value}`);
      }
    });
  });

  // On input, save the value
  form.addEventListener('input', e => {
    if (e.target.name) {
      localStorage.setItem(e.target.name, e.target.value);
    }
  });


