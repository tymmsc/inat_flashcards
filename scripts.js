document.getElementById("generate").addEventListener("click", async function () {
    // Retrieve values from input fields
    const taxon = document.getElementById("taxon").value;
    const nelat = document.getElementById("nelat").value;
    const nelng = document.getElementById("nelng").value;
    const swlat = document.getElementById("swlat").value;
    const swlng = document.getElementById("swlng").value;
    const maxResults = document.getElementById("maxResults").value;
    const maxPerSpecies = document.getElementById("maxPerSpecies").value;
    const searchTerm = document.getElementById("searchTerm").value;

    // Construct the API query URL
    const url = `https://api.inaturalist.org/v1/observations?iconic_taxa=${taxon}&nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}&quality_grade=research&per_page=${maxResults}`;

    try {
        // Fetch data from the iNaturalist API
        const response = await fetch(url);
        const data = await response.json();
        
        // Display the total results
        const totalResults = data.total_results;
        document.getElementById("results").innerHTML = `<p>Total Results: ${totalResults}</p><p>Query URL: ${url}</p>`;
        
        // Extract species from the results
        const observations = data.results;
        const speciesCount = {};
        const flashcards = [];

        // Build flashcards
        for (const observation of observations) {
            const species = observation.species_guess || "Unknown Species";
            const taxonId = observation.taxon_id;
            const photos = observation.photos;

            // Initialize species count if not already done
            if (!speciesCount[species]) {
                speciesCount[species] = 0;
            }

            // Limit observations per species
            if (speciesCount[species] < maxPerSpecies) {
                speciesCount[species]++;
                flashcards.push({
                    species,
                    commonName: observation.common_name || "Unknown Common Name",
                    scientificName: observation.scientific_name || "Unknown Scientific Name",
                    photos: photos.map(photo => photo.url)
                });
            }
        }

        // Shuffle flashcards
        flashcards.sort(() => Math.random() - 0.5);

        // Setup flashcards display
        displayFlashcards(flashcards);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
});

function displayFlashcards(flashcards) {
    let currentCardIndex = 0;
    const learned = [];
    const toLearn = [...flashcards];

    const flashcardContainer = document.getElementById("flashcards-container");
    const flashcardImage = document.getElementById("flashcard-image");
    const flashcardNames = document.getElementById("flashcard-names");
    const progress = document.getElementById("progress");

    flashcardContainer.style.display = "block";
    updateFlashcard();

    document.getElementById("correct").addEventListener("click", () => {
        learned.push(toLearn[currentCardIndex]);
        nextCard();
    });

    document.getElementById("incorrect").addEventListener("click", () => {
        nextCard();
    });

    function nextCard() {
        toLearn.splice(currentCardIndex, 1);
        if (toLearn.length === 0) {
            alert("You've completed the flashcards!");
            reset();
            return;
        }
        currentCardIndex = Math.floor(Math.random() * toLearn.length);
        updateFlashcard();
    }

    function updateFlashcard() {
        const card = toLearn[currentCardIndex];
        flashcardImage.src = card.photos[0]; // Show first photo
        flashcardNames.innerHTML = `<p>${card.species}</p>`;
        progress.innerHTML = `Learned: ${learned.length}, Remaining: ${toLearn.length}`;
    }

    function reset() {
        learned.length = 0;
        toLearn.length = 0;
        flashcardContainer.style.display = "none";
        document.getElementById("results").innerHTML = "";
    }
}
