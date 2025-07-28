document.addEventListener("DOMContentLoaded", () => {
    // --- Leaflet Map Initialization (from your provided JS) ---
    var map = L.map('map').setView([30.35, 31.25], 10); // Adjust coordinates and zoom level as needed

    // Add base map layer
    L.esri.basemapLayer('Imagery').addTo(map);

    // Load GeoJSON data
    fetch('lands.json') // Make sure the file is in the same directory or provide the correct path
        .then(response => response.json())
        .then(data => {
            var geojsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    var props = feature.properties;
                    var popup = `
                        <strong>المنطقة:</strong> ${props["المنط"]}<br>
                        <strong>الاسم:</strong> ${props["اسم_ا"]}<br>
                        <strong>الوصف:</strong> ${props["وصف_ا"]}<br>
                        <strong>الموقع:</strong> ${props["موقع_"]}<br>
                        <strong>المساحة:</strong> ${props["مساحة"]}<br>
                        <strong>السعر:</strong> ${props["سعر_ا"]} جنيه
                    `;
                    layer.bindPopup(popup);
                },
                style: {
                    color: "#007BFF",
                    weight: 2,
                    fillOpacity: 0.4
                }
            }).addTo(map);

            map.fitBounds(geojsonLayer.getBounds()); // Zoom to fit all lands
        })
        .catch(error => console.error('Error loading GeoJSON:', error)); // Add error handling


    // --- Card Filtering and Animation (adapted from your app.py JS) ---
    const filterButtons = document.querySelectorAll('.tabs button');
    const cardContainer = document.getElementById('cardContainer');
    const allCards = Array.from(document.querySelectorAll('.land-card')); // Get all cards initially

    function filterCards(type) {
        // Remove active class from all buttons
        filterButtons.forEach(button => button.classList.remove('active'));

        // Add active class to the clicked button
        event.currentTarget.classList.add('active'); // Use event.currentTarget for the clicked button

        // Hide all cards first
        allCards.forEach(card => {
            card.style.display = 'none';
        });

        // Show cards that match the selected type, with staggered animation
        let delay = 0;
        allCards.forEach(card => {
            const cardType = card.dataset.type;
            if (type === 'all' || cardType === type) {
                card.style.display = 'flex'; // Show card (using flex for column layout)
                // Re-apply animation for newly displayed cards
                card.style.animation = 'none'; // Reset animation
                void card.offsetWidth; // Trigger reflow
                card.style.animation = `cardPopIn 0.6s ease-out ${delay}s forwards`;
                delay += 0.08; // Stagger delay
            }
        });

        // If no cards match the filter, you might want to show a message.
        // For simplicity, we're just hiding cards here.
    }

    // Initialize the filter to show 'تعليمي' cards on page load
    // You can call filterCards('all') to show all cards initially or
    // filterCards('تعليمي') to show only educational ones as in your buttons HTML
    filterCards('تعليمي'); // Or change to 'all' if you want to see all cards by default

    // Attach event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type; // Get data-type from button
            filterCards(type);
        });
    });

    // Score Counter Animation (exactly as in your app.py)
    const scoreElements = document.querySelectorAll('.card-footer .score');

    const animateScores = () => {
        scoreElements.forEach(scoreElement => {
            const targetScore = parseFloat(scoreElement.dataset.targetScore);
            const duration = 1500; // milliseconds
            const start = performance.now();

            function animateCount(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                // For prices, you might want to adjust the calculation to round better or add currency
                const currentScore = progress * targetScore;
                scoreElement.textContent = currentScore.toFixed(3); // Keep 3 decimal places for consistency

                if (progress < 1) {
                    requestAnimationFrame(animateCount);
                } else {
                    scoreElement.textContent = targetScore.toFixed(3); // Ensure final value is exact
                }
            }
            requestAnimationFrame(animateCount);
        });
    };

    // Run score animation when content is loaded
    animateScores();

    // Re-run score animation when cards are filtered
    // This part requires a slight modification to `filterCards` to ensure scores animate again.
    // The current filterCards function will re-trigger the animation by setting `animation: none` and then back.
    // The score animation is also run on DOMContentLoaded. If you want to re-animate scores
    // every time filterCards is called, you'd need to call `animateScores()` inside `filterCards`
    // or ensure the elements are properly reset. For simplicity, it runs on initial load.
    // If you need the score animation to reset on each filter, you'd integrate `animateScores()`
    // into `filterCards` right after cards are shown.
    
    // Example of integrating score animation with filterCards if needed:
    function filterCards(type) {
        // ... (existing filter logic) ...
        allCards.forEach(card => {
            if (type === 'all' || cardType === type) {
                card.style.display = 'flex';
                card.style.animation = 'none';
                void card.offsetWidth;
                card.style.animation = `cardPopIn 0.6s ease-out ${delay}s forwards`;
                delay += 0.08;
                // Find the score element in this card and re-animate it
                const currentScoreElement = card.querySelector('.card-footer .score');
                if (currentScoreElement) {
                    const targetScore = parseFloat(currentScoreElement.dataset.targetScore);
                    animateSingleScore(currentScoreElement, targetScore); // Helper function
                }
            }
        });
    }

    // Helper for single score animation (if you choose to integrate it into filterCards)
    // function animateSingleScore(scoreElement, targetScore) {
        const duration = 1500;
        const start = performance.now();
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const currentScore = progress * targetScore;
            scoreElement.textContent = currentScore.toFixed(3);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scoreElement.textContent = targetScore.toFixed(3);
            }
        }
        requestAnimationFrame(animate);
    }

);




// Fetch JSON data and populate cards
fetch('lands.json')
  .then(response => response.json())
  .then(data => {
    const cardContainer = document.getElementById('cardContainer');
    
    // Map JSON activity types to tab categories
    const typeMapping = {
      'تعليمى مقترح': 'تعليمي',
      'استصلاح واستزراع': 'زراعي',
      'سكنى مقترح': 'سكني'
    };

    // Store all cards for filtering
    const allCards = [];

    // Create cards dynamically
    data.features.forEach(feature => {
      const props = feature.properties;
      const activityType = props['الأنش'];
      const displayType = typeMapping[activityType] || 'سكني'; // Default to سكني if unmapped
      
      // Create card element
      const card = document.createElement('div');
      card.className = 'land-card';
      card.setAttribute('data-type', displayType);

      // Card content
      card.innerHTML = `
        <div class="card-header">
          <h3>${props['اسم_ا'] || 'أرض فضاء'}</h3>
        </div>
        <div class="card-body">
          <p><strong>الوصف:</strong> ${props['وصف_ا'] || 'غير محدد'}</p>
          <p><strong>الموقع:</strong> ${props['موقع_'] || 'غير محدد'}</p>
          <div class="card-services">
            <h4>تفاصيل إضافية:</h4>
            <ul>
              <li><span class="label">المساحة:</span> ${props['مساحة'] || 'غير محدد'}</li>
            </ul>
          </div>
        </div>
        <div class="card-footer">
          <span>السعر:</span>
          <span class="score" data-target-score="${parseFloat(props['سعر_ا']) || 0}">${(0).toFixed(3)}</span>
        </div>
      `;

      // Add click event to show location on map
      card.addEventListener('click', () => {
        const coords = feature.geometry.coordinates[0][0]; // Get first coordinate of polygon
        map.setView([coords[1], coords[0]], 15); // Center map on land coordinates
        L.marker([coords[1], coords[0]]).addTo(map); // Add marker
      });

      allCards.push(card);
      cardContainer.appendChild(card);
    });

    // Animate prices after cards are created
    document.querySelectorAll('.score').forEach(score => {
      const targetScore = parseFloat(score.getAttribute('data-target-score'));
      let currentScore = 0;
      const increment = targetScore / 100;
      const updateScore = () => {
        if (currentScore < targetScore) {
          currentScore += increment;
          score.textContent = currentScore.toFixed(3);
          requestAnimationFrame(updateScore);
        } else {
          score.textContent = targetScore.toFixed(3);
        }
      };
      updateScore();
    });

    // Initialize with educational cards (max 3)
    filterCards('تعليمي', document.querySelector('.tabs button.active'));
  })
  .catch(error => console.error('Error fetching JSON:', error));

// Tab filtering function
function filterCards(type, button) {
  // Remove 'active' class from all buttons
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add 'active' class to clicked button
  button.classList.add('active');
  
  // Filter cards and limit to 3
  const cards = document.querySelectorAll('.land-card');
  let visibleCount = 0;

  cards.forEach(card => {
    if (type === 'all' || card.getAttribute('data-type') === type) {
      if (visibleCount < 3) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    } else {
      card.style.display = 'none';
    }
  });
}