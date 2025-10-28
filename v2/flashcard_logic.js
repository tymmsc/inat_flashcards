function lockScreenToPortrait(){
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("portrait").catch(err => {
      console.log("Orientation lock not supported:", err);
    });
  }
}

//convert inat search address to api 
function convertToApiUrl(webUrl) {
    console.log("URL raw:", JSON.stringify(webUrl));
    let url;
    try {
        url = new URL(webUrl.trim());
    } catch (e) {
        console.log(e);
        throw new Error('Invalid URL');
    }

    // Check hostname
    if (!['www.inaturalist.org', 'inaturalist.org'].includes(url.hostname)) {
        throw new Error('URL is not an iNaturalist URL');
    }

    // Check path
    if (!url.pathname.startsWith('/observations')) {
        throw new Error('URL is not a valid iNaturalist observations URL');
    }

    // Change hostname and path to API endpoint
    url.hostname = 'api.inaturalist.org';
    url.pathname = '/v1/observations';

    url.searchParams.set('rank', 'species');

    // Return the new API URL as string
    return url.toString();
}

function retrieveInatAddress(){
  const radio_selected = document.querySelector('input[name="topFormChoice"]:checked').value;
  errorDiv = document.getElementById('error-text');
  errorDiv.textContent='***';

  if (radio_selected === 'option1') {
      const taxonId = document.getElementById('taxon-search-id').value;
      const locId = document.getElementById('location-search-id').value;
      console.log(taxonId);
      console.log(locId);

      // Base API URL with query parameters
      let apiUrl = `https://api.inaturalist.org/v1/observations?rank=species&quality_grade=research`;

        //if a specific location is selected, add it to the query
        if (locId) {
            apiUrl += `&place_id=${locId}`;
        }
        // If a specific taxon ID is selected, add it to the query
        if (taxonId) {
            apiUrl += `&taxon_id=${taxonId}`;
        }
        return apiUrl;
      }
    else {

      try{
        url_str = document.getElementById('inat-search').value;
        apiUrl = convertToApiUrl(url_str);
        //url.searchParams.get('taxon_id');
        return apiUrl;

      }
      catch (e){
          setError(true);
          errorDiv.textContent = e.message;
      }
    }
}

function setError(isError){
    if(isError){
       errorDiv.classList.add('error-text');
        errorDiv.classList.remove('loading-text');
    }
    else{
        errorDiv.classList.remove('error-text');
        errorDiv.classList.add('loading-text');
    }
}


  //function that generates flashcards 
    document.getElementById('generate-btn').addEventListener('click', async function(event) {
        event.preventDefault();
        lockScreenToPortrait();
        reset();
        try{
          apiUrl = retrieveInatAddress();
        console.log("api url in click that should come from retrieve: ", apiUrl);

          console.log(apiUrl);
          const url_obj = new URL(apiUrl);
          taxonId = url_obj.searchParams.get('taxon_id');
          console.log(taxonId);
        }
        catch(e){
          console.log(e);
            return;
        }
        
        const maxPerSpecies = parseInt(document.getElementById('max-per-species').value) || 5; // Default to 5 if not set

 
        let totalResults = 0;
        let totalObservations = 0;
        let allSpecies = [];
        let page = 1;
        console.log('searching...')
        setError(false);
        errorDiv.textContent = "Generating..."
        try {
              // Remove "disabled" class from all tabs except the first

            let moreResults = true;
 
            const response1 = await fetch(apiUrl + `&per_page=400&page=${1}`);
            const data1 = await response1.json();

            const response2 = await fetch(apiUrl + `&per_page=400&page=${2}`);
            const data2 = await response2.json();

        // Combine results from both pages
            const combinedObservations = [...data1.results, ...data2.results];
            const observations = combinedObservations.sort(() => Math.random() - 0.5);

            //Get all unique species in seenSpecies
            const uniqueObservations = filterUniqueSpecies(observations);
            if(observations.length < 1){
              setError(true);
              errorDiv.textContent = 'No observations found!'
              return;
            }


            taxonMap = await fetchTaxonDetailsBatch(uniqueObservations);

            const nameToRankMap = {};
            for (const taxonId in taxonMap) {
                const taxon = taxonMap[taxonId];
                nameToRankMap[taxon.name] = {rank: taxon.rank, commonname: taxon.commonname};
            }
            trees = buildTaxonomicTree(uniqueObservations, taxonMap);
            globalTree = mergeTrees(trees);

            globalTree = Object.values(globalTree)[0];
            try{
              searchRank = taxonMap[taxonId].rank;
            }
            catch(e){
              setError(true);
              errorDiv.textContent = 'Invalid taxon';
              return;
            }


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

        populateSpeciesTable(species_dict);
        // Assuming `globalTree` is your structured taxonomic tree
        document.getElementById("tree-container").innerHTML = createTreeHtml(globalTree,nameToRankMap, searchRank);


        flashcards.sort(() => Math.random() - 0.5);

        // Setup flashcards display
        displayFlashcards(flashcards);
        document.querySelectorAll('.tab.disabled').forEach(tab => {
        tab.classList.remove('disabled');
              });
                  // Switch active class
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

      const cardsTabBtn = document.getElementById('cards-tab-btn');
      cardsTabBtn.classList.add('active');

      // Switch the content
      document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      document.getElementById('card-tab').style.display = 'flex'; // or 'block' depending on layout
      errorDiv.textContent = '***';

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


let currentCardIndex = 0;
let learned = [];
let toLearn = [];


    function displayFlashcards(flashcards) {
        const showButton = document.getElementById('show-button');
        const correctButton = document.getElementById('correct');
        const incorrectButton = document.getElementById('incorrect');
        correctButton.disabled = true;
        incorrectButton.disabled = true;

        currentCardIndex = 0;
        learned = [];
        incorrect = [];
        toLearn = [...flashcards];

        const flashcardContainer = document.getElementById("flashcards-container");
        const flashcardImages = document.getElementById("flashcard-images");
        const flashcardNames = document.getElementById("flashcard-name");
        const nameContainer = flashcardNames;

        //flashcardContainer.style.display = "block";
        updateFlashcard();

        document.getElementById("correct").addEventListener("click", () => {
            learned.push(toLearn[currentCardIndex]);
            toLearn.splice(currentCardIndex, 1);
            nextCard();
        });

        document.getElementById("incorrect").addEventListener("click", () => {
            incorrect.push(toLearn[currentCardIndex]);
            toLearn.splice(currentCardIndex, 1);
            nextCard();
        });

        function nextCard() {
            //toLearn.splice(currentCardIndex, 1);
            if (toLearn.length === 0) {
                if(incorrect.length === 0){
                     alert("You've completed the flashcards!");
                    reset();
                    return;
                }
                else{
                    incorrect.sort(() => Math.random() - 0.5);
                    toLearn = incorrect;
                    incorrect = [];
                }
            }
            //currentCardIndex = Math.floor(Math.random() * toLearn.length);
            updateFlashcard();
        };

        showButton.onclick = function () {
            nameContainer.style.visibility = 'visible'; // Show the name
            correctButton.disabled = false; // Enable correct button
            incorrectButton.disabled = false; // Enable incorrect button
            showButton.disabled = true; // Disable show button
        };

        function updateFlashcard() {
            correctButton.disabled = true;
            incorrectButton.disabled = true;
            showButton.disabled = false;
            const card = toLearn[currentCardIndex];
            nameContainer.style.visibility = 'hidden';
            //nameContainer.innerHTML = `${card.commonName} (${card.scientificName})`;
            document.getElementById("common-name").textContent = card.commonName;
            document.getElementById("scientific-name").textContent = card.scientificName;

            const numberOfImages = Math.min(card.photos.length, 2);

            flashcardImages.innerHTML = '';
            for (let i = 0; i < numberOfImages; i++) {
                const img = document.createElement('img');
                img.src = card.photos[i];
                img.alt = `Image of ${card.species}`;
                img.style.width = '98%'; // Adjust size as necessary
                img.style.margin = '4%'; // Spacing between images

                flashcardImages.appendChild(img);
                break;
            }

            //flashcardImage.src = card.photos[0]; // Show first photo
            //flashcardNames.innerHTML = `<p>${card.species}</p>`;
            progress.innerHTML = `Remaining: ${toLearn.length+incorrect.length} / ${toLearn.length + incorrect.length + learned.length}`;
        };
    }

function reset() {
    // Clear flashcard progress
        learned = [];
    toLearn = [];
    currentCardIndex = 0;

    // Hide UI pieces
    const flashcardContainer = document.getElementById("flashcards-container");
    if (flashcardContainer) flashcardContainer.style.display = "none";

    const progress = document.getElementById("progress");
    if (progress) progress.innerHTML = "";

    const results = document.getElementById("results");
    if (results) results.innerHTML = "";

    const tbody = document.getElementById('species-tbody');
    if (tbody) tbody.innerHTML = "";

    // Reset globals
    window.currentCardIndex = 0;
    window.flashcards = [];

    const correctButton = document.getElementById("correct");
    const incorrectButton = document.getElementById("incorrect");
    const showButton = document.getElementById("show-button");

    // These must be the same function references used in addEventListener
    correctButton.replaceWith(correctButton.cloneNode(true));
    incorrectButton.replaceWith(incorrectButton.cloneNode(true));
    showButton.replaceWith(showButton.cloneNode(true));
}
