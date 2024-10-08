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
            console.log(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${searchTerm}`)
            const data = await response.json();

            data.results.slice(0, 5).forEach(result => {
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = `${result.name} (${result.preferred_common_name || 'No common name'})`;
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

    document.getElementById('generate').addEventListener('click', async function(event) {
        event.preventDefault();

        const nelat = document.getElementById('nelat').value;
        const nelng = document.getElementById('nelng').value;
        const swlat = document.getElementById('swlat').value;
        const swlng = document.getElementById('swlng').value;
        //const group = document.getElementById('group').value;
        const taxonId = document.getElementById('taxon-search').value;
        const maxPerSpecies = parseInt(document.getElementById('max-per-species').value) || Infinity; // Default to Infinity if not set

        // Base API URL with query parameters
        let apiUrl = `https://api.inaturalist.org/v1/observations?rank=species&nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}&quality_grade=research`;

        // If a specific taxon ID is selected, add it to the query
        if (taxonId) {
            apiUrl += `&taxon_id=${taxonId}`;
        }

        // Display the query URL
        //document.getElementById('api-url').innerText = apiUrl;

        let totalResults = 0;
        let totalObservations = 0;
        let allSpecies = [];
        let page = 1;

        try {
            let moreResults = true;
           /* while (moreResults) {
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
            }*/
            const response1 = await fetch(apiUrl + `&per_page=400&page=${1}`);
            const data1 = await response1.json();

            const response2 = await fetch(apiUrl + `&per_page=400&page=${2}`);
            const data2 = await response2.json();

        // Combine results from both pages
            const combinedObservations = [...data1.results, ...data2.results];
            const observations = combinedObservations.sort(() => Math.random() - 0.5);


            const speciesCount = {};
            const flashcards = [];

         // Build flashcards
         species_dict = {};
         console.log(observations);
         for (const observation of observations) {
            const species_sci = observation.taxon.name;
            const species = observation.taxon.preferred_common_name || species_sci || "Unknown Species";
            const taxonId = observation.taxon_id;
            const photos = observation.photos;


            const flashcardPhotos = photos.map(photo => {
                // Try to get the large_url first, then medium_url, and fall back to the default url
                const highResUrl = photo.url.replace("square", "medium");
                return highResUrl;
            });

            // Initialize species count if not already done
            if (!speciesCount[species_sci]) {
                speciesCount[species_sci] = 0;
                species_dict[species_sci] = species;
            }

            // Limit observations per species
            if (speciesCount[species_sci] < maxPerSpecies) {
                speciesCount[species_sci]++;
                flashcards.push({
                    species: species,
                    commonName: species,
                    scientificName: species_sci,
                    photos: flashcardPhotos
                });
            }

        }
        total_species = Object.keys(speciesCount).length;
         // Display the displayed results
         document.getElementById('total-results').innerText = total_species;


         // Clear the species list
         const speciesList = document.getElementById('species-list');
         speciesList.innerHTML = '';

         // Populate the species list
         allSpecies = Object.keys(species_dict).sort();
         allSpecies.forEach(result => {
             const speciesItem = document.createElement('li');
             speciesItem.textContent = result + ": " + species_dict[result]
             speciesList.appendChild(speciesItem);
         });


        console.log(flashcards);
        flashcards.sort(() => Math.random() - 0.5);

        // Setup flashcards display
        displayFlashcards(flashcards);

        } catch (error) {
            console.error('Error fetching data from iNaturalist API:', error);
        }
    });

    function displayFlashcards(flashcards) {
        console.log(flashcards);
        const showButton = document.getElementById('show-button');
        const correctButton = document.getElementById('correct');
        const incorrectButton = document.getElementById('incorrect');

        let currentCardIndex = 0;
        const learned = [];
        const toLearn = [...flashcards];

        const flashcardContainer = document.getElementById("flashcards-container");
        const flashcardImages = document.getElementById("flashcard-images");
        const flashcardNames = document.getElementById("flashcard-name");
        const nameContainer = flashcardNames;

        flashcardContainer.style.display = "block";
        updateFlashcard();

        document.getElementById("correct").addEventListener("click", () => {
            learned.push(toLearn[currentCardIndex]);
            toLearn.splice(currentCardIndex, 1);
            nextCard();
        });

        document.getElementById("incorrect").addEventListener("click", () => {

            nextCard();
        });

        function nextCard() {
            //toLearn.splice(currentCardIndex, 1);
            if (toLearn.length === 0) {
                alert("You've completed the flashcards!");
                reset();
                return;
            }
            currentCardIndex = Math.floor(Math.random() * toLearn.length);
            updateFlashcard();
        }

        showButton.onclick = function () {
            nameContainer.style.display = 'block'; // Show the name
            correctButton.disabled = false; // Enable correct button
            incorrectButton.disabled = false; // Enable incorrect button
            showButton.disabled = true; // Disable show button
        };

        function updateFlashcard() {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            showButton.disabled = false;
            const card = toLearn[currentCardIndex];
            nameContainer.style.display = 'none';
            nameContainer.innerHTML = `${card.commonName} (${card.scientificName})`;

            const numberOfImages = Math.min(card.photos.length, 2);

            flashcardImages.innerHTML = '';
            for (let i = 0; i < numberOfImages; i++) {
                const img = document.createElement('img');
                img.src = card.photos[i];
                img.alt = `Image of ${card.species}`;
                img.style.width = '45%'; // Adjust size as necessary
                img.style.margin = '2.5%'; // Spacing between images

                flashcardImages.appendChild(img);
            }

            //flashcardImage.src = card.photos[0]; // Show first photo
            //flashcardNames.innerHTML = `<p>${card.species}</p>`;
            progress.innerHTML = `Learned: ${learned.length}, Remaining: ${toLearn.length}`;
        }

        function reset() {
            learned.length = 0;
            toLearn.length = 0;
            flashcardContainer.style.display = "none";
            document.getElementById("results").innerHTML = "";
        }
    }
