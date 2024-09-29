    document.getElementById('taxon-search').addEventListener('input', async function() {
        const searchTerm = this.value;
        const suggestions = document.getElementById('suggestions');
        suggestions.innerHTML = '';

        if (searchTerm.length < 3) {
            suggestions.style.display = 'none';
            return; // Show suggestions only if at least 3 characters are typed
        }

        // Fetch taxon suggestions
        try {
            const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${searchTerm}`);
            const data = await response.json();

            data.results.slice(0, 5).forEach(result => {
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = `${result.name} (${result.common_name || 'No common name'})`;
                suggestionItem.onclick = () => {
                    document.getElementById('taxon-search').value = result.id; // Set taxon ID
                    suggestions.style.display = 'none';
                };
                suggestions.appendChild(suggestionItem);
            });

            if (suggestions.innerHTML) {
                suggestions.style.display = 'block'; // Show suggestions if there are any
            } else {
                suggestions.style.display = 'none'; // Hide if no suggestions
            }
        } catch (error) {
            console.error('Error fetching taxon suggestions:', error);
        }
    });

    document.getElementById('flashcard-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        const nelat = document.getElementById('nelat').value;
        const nelng = document.getElementById('nelng').value;
        const swlat = document.getElementById('swlat').value;
        const swlng = document.getElementById('swlng').value;
        const group = document.getElementById('group').value;
        const taxonId = document.getElementById('taxon-search').value;
        const maxPerSpecies = parseInt(document.getElementById('max-per-species').value) || Infinity; // Default to Infinity if not set

        // Base API URL with query parameters
        let apiUrl = `https://api.inaturalist.org/v1/observations?iconic_taxa=${group}&nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}&quality_grade=research`;

        // If a specific taxon ID is selected, add it to the query
        if (taxonId) {
            apiUrl += `&taxon_id=${taxonId}`;
        }

        // Display the query URL
        document.getElementById('api-url').innerText = apiUrl;

        let totalResults = 0;
        let totalObservations = 0;
        let allSpecies = [];
        let page = 1;

        try {
            let moreResults = true;
            while (moreResults) {
                // Fetch each page of results
                const response = await fetch(apiUrl + `&per_page=200&page=${page}`);
                const data = await response.json();
                
                if (data.results.length > 0) {
                    totalObservations += data.total_results; // Keep track of total observations
                    allSpecies = allSpecies.concat(data.results);
                }

                // Check if there are more pages
                if (data.results.length < 200) {
                    moreResults = false;
                }
                
                page++;
            }

            // Limit results to a maximum of 100
            const speciesCount = {};
            allSpecies = allSpecies.filter(result => {
                const speciesName = result.species_guess || 'Unknown species';
                speciesCount[speciesName] = (speciesCount[speciesName] || 0) + 1;
                return speciesCount[speciesName] <= maxPerSpecies; // Limit by max per species
            }).slice(0, 100); // Take the first 100 observations after filtering

            totalResults = allSpecies.length;

            // Display the total observations
            document.getElementById('total-observations').innerText = totalObservations;

            // Display the displayed results
            document.getElementById('total-results').innerText = totalResults;

            // Display the message for showing top results
            document.getElementById('showing-message').innerText = `Showing top ${totalResults} results:`;

            // Clear the species list
            const speciesList = document.getElementById('species-list');
            speciesList.innerHTML = '';

            // Populate the species list
            allSpecies.forEach(result => {
                const speciesItem = document.createElement('li');
                speciesItem.textContent = result.species_guess || 'Unknown species';
                speciesList.appendChild(speciesItem);
            });
        } catch (error) {
            console.error('Error fetching data from iNaturalist API:', error);
        }
    });
