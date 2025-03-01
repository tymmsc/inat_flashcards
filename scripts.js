   /* document.getElementById('taxon-search').addEventListener('input', async function() {
        const searchTerm = this.value;
        const suggestions = document.getElementById('suggestions');
        suggestions.innerHTML = '';

        if (searchTerm.length < 3) {
            //suggestions.style.display = 'none';
            return; // Show suggestions only if at least 3 characters are typed
        }

        // Fetch taxon suggestions
        try {
            const response = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${searchTerm}`);
            const data = await response.json();

            data.results.slice(0, 5).forEach(result => {
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = `${result.name} (${result.preferred_common_name || 'No common name'})`;
                suggestionItem.onclick = () => {
                    document.getElementById('taxon-search').value = result.id; // Set taxon ID
                    //suggestions.style.display = 'none';
                };
                suggestions.appendChild(suggestionItem);
            });


        } catch (error) {
            console.error('Error fetching taxon suggestions:', error);
        }
    });*/

    document.getElementById("location-search").addEventListener("input", function () {
        searchINatPlaces(this.value);
    });
    document.getElementById("taxon-search").addEventListener("input", function () {
        searchINatTaxons(this.value);
    });


    document.getElementById('generate').addEventListener('click', async function(event) {
        event.preventDefault();

        const nelat = 26.911318201735867; //document.getElementById('nelat').value;
        const nelng = 128.51032873640148;//document.getElementById('nelng').value;
        const swlat = 25.99658667274922;//document.getElementById('swlat').value;
        const swlng = 127.5407852793702;//document.getElementById('swlng').value;*/
        //const group = document.getElementById('group').value;
        const taxonId = document.getElementById('taxon-search').value;
        const maxPerSpecies = parseInt(document.getElementById('max-per-species').value) || 5; // Default to 5 if not set

        const locId = document.getElementById('location-search').value;
        // Base API URL with query parameters
        let apiUrl = `https://api.inaturalist.org/v1/observations?rank=species&quality_grade=research`;

        //if a specific location is selected, add it to the query
        if (locId) {
            apiUrl += `&place_id=${locId}`;
        }
        else{ //default to specific loc
            apiUrl = `https://api.inaturalist.org/v1/observations?rank=species&nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}&quality_grade=research`;
        }

        // If a specific taxon ID is selected, add it to the query
        if (taxonId) {
            apiUrl += `&taxon_id=${taxonId}`;
        }
        else{
            apiUrl+=`&taxon_id=${20979}`;
        }
        console.log(apiUrl);

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

            const uniqueObservations = filterUniqueSpecies(observations);
            taxonMap = await fetchTaxonDetailsBatch(uniqueObservations);
            const nameToRankMap = {};
            for (const taxonId in taxonMap) {
                const taxon = taxonMap[taxonId];
                nameToRankMap[taxon.name] = {rank: taxon.rank, commonname: taxon.commonname};
            }
            trees = buildTaxonomicTree(uniqueObservations, taxonMap);
            console.log("tree time")
            console.log(trees);
            globalTree = mergeTrees(trees);
            console.log(globalTree);

            //remove the root node from globalTree
            globalTree = Object.values(globalTree)[0];

            searchRank = taxonMap[taxonId].rank;


            const speciesCount = {};
            const flashcards = [];

         // Build flashcards
         species_dict = {};

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

/*
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
*/
        populateSpeciesTable(species_dict);
        // Assuming `globalTree` is your structured taxonomic tree
        document.getElementById("tree-container").innerHTML = createTreeHtml(globalTree,nameToRankMap, searchRank);


        flashcards.sort(() => Math.random() - 0.5);

        // Setup flashcards display
        displayFlashcards(flashcards);

        } catch (error) {
            console.error('Error fetching data from iNaturalist API:', error);
        }
    });

    function populateSpeciesTable(species_dict){
        //sort and get unique from species
        const tbody = document.getElementById('species-tbody');
        allSpecies = Object.keys(species_dict).sort();
        if (tbody) {
          allSpecies.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${result}</td>
              <td>${species_dict[result]}</td>
            `;
            tbody.appendChild(row);
          });
        } else {
          console.error("Error: tbody element not found");
        }
    }


    async function fetchTaxonDetailsBatch(observations) {
        const taxonIdsSet = new Set();
        observations.forEach(obs => obs.ident_taxon_ids.forEach(id => taxonIdsSet.add(id)));
        taxonIds = Array.from(taxonIdsSet);

        if (taxonIds.length === 0) return {}; // Return empty if no IDs provided
        const chunkSize = 20; // iNaturalist API may limit query length
        const taxonMap = {};

        const chunks = [];
        for (let i = 0; i < taxonIds.length; i += chunkSize) {
            chunks.push(taxonIds.slice(i, i + chunkSize));
        }
        // Function to fetch a chunk of taxon IDs
        async function fetchChunk(ids) {
            const url = `https://api.inaturalist.org/v1/taxa?per_page=100&id=${ids.join(',')}`;
            const response = await fetch(url);
            const data = await response.json();

            data.results.forEach(taxon => {
                taxonMap[taxon.id] = {rank: taxon.rank, commonname: taxon.preferred_common_name, name: taxon.name  };
            });
        }

        // Split taxonIds into chunks and fetch in parallel


        await Promise.all(chunks.map(fetchChunk));

        return taxonMap; // Return same structure as before
    }


    async function fetchTaxonDetailsOld(observations) {
        // Collect all unique taxon IDs
        const taxonIds = new Set();
        observations.forEach(obs => obs.ident_taxon_ids.forEach(id => taxonIds.add(id)));

        console.log(taxonIds);
        // Convert to a comma-separated string for batch fetching
        const taxonIdString = Array.from(taxonIds).join(",");

        // Fetch details in one request
        const url = `https://api.inaturalist.org/v1/taxa/${taxonIdString}`;
        const response = await fetch(url);
        const data = await response.json();

        // Build a map of taxon ID → { rank, name }
        const taxonMap = {};
        data.results.forEach(taxon => {
            taxonMap[taxon.id] = { rank: taxon.rank, commonname: taxon.preferred_common_name, name: taxon.name };
        });

        return taxonMap;
    };

    function filterUniqueSpecies(observations) {
        const seenSpecies = new Set();
        return observations.filter(obs => {
            if (!obs.taxon || !obs.taxon.id) return false; // Skip if taxon data is missing
            const speciesId = obs.taxon.id;
            if (seenSpecies.has(speciesId)) {
                return false; // Skip duplicates
            }
            seenSpecies.add(speciesId);
            return true; // Keep the first occurrence of each species
        });
    }


    function buildTaxonomicTree(observations, taxonMap) {
        return observations.map(obs => {
            const tree = {};
            obs.ident_taxon_ids.forEach(taxonId => {
                if (taxonMap[taxonId]) {
                    const { rank, name } = taxonMap[taxonId];
                    tree[rank] = name;
                }
            });
            return { id: obs.id, tree };
        });
    }

    function getUsedRanks(trees) {
        const ranks = new Set();
        trees.forEach(obs => Object.keys(obs.tree).forEach(rank => ranks.add(rank)));
        return Array.from(ranks).sort(); // Sort for consistent order
    }

    function mergeTrees(trees) {
        const globalTree = {};

        trees.forEach(obs => {
            let currentLevel = globalTree;
            Object.entries(obs.tree).forEach(([rank, name]) => {
                if (!currentLevel[name]) {
                    currentLevel[name] = {}; // Create branch if missing
                }
                currentLevel = currentLevel[name]; // Move deeper into tree
            });
        });

        return globalTree;
    }

    function createTreeHtml(tree, nameToRankMap, searchRank, include_toptaxon) {
        html = '';
        if(include_toptaxon) {
          html += '<ul>';
        }
        console.log("tree");
        console.log(tree);
        const rankOrder = [
            'kingdom',       // Kingdom (e.g., Animalia)
            'phylum',        // Phylum (e.g., Chordata)
            'class',         // Class (e.g., Mammalia)
            'order',         // Order (e.g., Carnivora)
            'suborder',      // Suborder (e.g., Serpentes)
            'infraorder',    // Infraorder (e.g., Sauria)
            'superfamily',   // Superfamily (e.g., Musteloidea)
            'family',        // Family (e.g., Felidae)
            'subfamily',     // Subfamily (e.g., Pantherinae)
            'tribe',         // Tribe (e.g., Pantherini)
            'subtribe',      // Subtribe (e.g., Pantherina)
            'genus',         // Genus (e.g., Panthera)
            'species',       // Species (e.g., Panthera leo)
            'subspecies'     // Subspecies (e.g., Panthera leo persica)
          ];
        searchRankIndex = rankOrder.indexOf(searchRank);

        for (const [taxon, children] of Object.entries(tree)) {
            taxonRank = nameToRankMap[taxon]['rank'];
            taxonCommonName = nameToRankMap[taxon]['commonname'];

            include_taxon = rankOrder.indexOf(taxonRank) >= searchRankIndex;
            if (include_taxon) {
                if(taxonRank=="species"){
                    html += `<li><strong>${taxonCommonName} (${taxon})</strong>`;
                }
                else{
                    html += `<li>${taxonCommonName} (${taxonRank} ${taxon})`;
                }
            }
            if (Object.keys(children).length > 0) {
                html += createTreeHtml(children, nameToRankMap, searchRank, include_taxon, true ); // Recursively create sub-trees
            }
            if (include_taxon) {
                html += `</li>`;
            }

        }
        if (include_toptaxon) {
            html += "</ul>";
        }
        return html;
    }

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


    function displayFlashcards(flashcards) {
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
        };

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
        };

        function reset() {
            learned.length = 0;
            toLearn.length = 0;
            flashcardContainer.style.display = "none";
            document.getElementById("results").innerHTML = "";
        };



    }
