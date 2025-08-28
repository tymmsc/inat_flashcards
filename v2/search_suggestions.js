


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
            document.getElementById("location-search").value = place.display_name;
            document.getElementById("location-search-id").value = place.id;

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
            document.getElementById("taxon-search").value = taxon.name;
            document.getElementById("taxon-search-id").value = taxon.id;

            suggestions.innerHTML = ""; // Clear suggestions after selection
        };
        suggestions.appendChild(item);
    });
}



