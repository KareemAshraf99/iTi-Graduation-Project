var map = L.map('map').setView([30.0444, 31.2357], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const layersConfig = [
    { name: "Police", url: "/static/data/police_fixed.json", color: "#d62728" },
    { name: "Post Offices", url: "/static/data/post_offices_fixed.json", color: "#1f77b4" },
    { name: "Civil Defense", url: "/static/data/civil_defense_fixed.json", color: "#2ca02c" },
    { name: "Transportation", url: "/static/data/transportation_fixed.json", color: "#ff7f0e" },
    { name: "Real Estate", url: "/static/data/real_estate_registry_fixed.json", color: "#9467bd" },
    { name: "Centrals", url: "/static/data/centrals_fixed.json", color: "#8c564b" },
    { name: "Government Agencies", url: "/static/data/government_agencies_fixed.json", color: "#e377c2" },
    { name: "Nursing Homes", url: "/static/data/nursing_home_fixed.json", color: "#7f7f7f" },
];

const layers = {};
const layerControlsDiv = document.getElementById('layer-controls');
const serviceCounts = {};
let allMarkers = []; // Stores all Leaflet markers with their associated feature data
let geojsonCenters = null;
let allServicePoints = []; // Stores all raw GeoJSON features with service_type and CenterName
const serviceTypes = new Set(); // To keep track of all unique service types

// --- Data Loading and Processing ---

// Load centers first
const loadCentersPromise = fetch("/static/data/local_centers_wgs84_fixed.json")
    .then(res => res.json())
    .then(data => {
        geojsonCenters = data;
        console.log("✅ تم تحميل المراكز:", geojsonCenters);

        // Add centers layer to map immediately
        L.geoJSON(geojsonCenters, {
            style: function (feature) {
                return {
                    color: "#34495e",
                    weight: 1,
                    fillColor: "#2980b9",
                    fillOpacity: 0.1
                };
            },
            onEachFeature: function (feature, layer) {
                const name = feature.properties.Main_City || feature.properties.Name || "مركز غير معروف";
                layer.bindPopup(`<strong>${name}</strong>`);
            }
        }).addTo(map);
    });

// Load all service points
const loadServicePointsPromise = Promise.all(
    layersConfig.map(config =>
        fetch(config.url)
            .then(response => response.json())
            .then(data => {
                serviceCounts[config.name] = data.features.length;
                data.features.forEach(f => {
                    f.properties.service_type = config.name; // Add service_type to each feature
                    allServicePoints.push(f); // Collect all features in one array
                    serviceTypes.add(config.name); // Populate serviceTypes Set
                });
            })
    )
);

// Once all data is loaded, process and display
Promise.all([loadCentersPromise, loadServicePointsPromise])
    .then(() => {
        console.log("✅ تم تحميل كل نقاط الخدمات والمراكز.");
        console.log("📊 أنواع الخدمات المتوفرة:", Array.from(serviceTypes));

        // 1. Link all service points to centers
        linkPointsToCenters();

        // 2. Create Leaflet layers and markers from the processed allServicePoints
        layersConfig.forEach(config => {
            const filteredFeatures = allServicePoints.filter(f => f.properties.service_type === config.name);

            const geoJsonLayer = L.geoJSON(filteredFeatures, {
                onEachFeature: function (feature, layerItem) {
                    const props = feature.properties || {};
                    let popupContent = `<strong>${config.name}</strong><br>`;
                    for (let key in props) {
                        popupContent += `<strong>${key}</strong>: ${props[key]}<br>`;
                    }
                    layerItem.bindPopup(popupContent);
                    layerItem.feature = feature; // Store the feature reference on the layer
                    allMarkers.push(layerItem); // Collect all Leaflet markers
                },
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: config.color,
                        color: "#000",
                        weight: 1,
                        fillOpacity: 0.8
                    });
                }
            });

            layers[config.name] = geoJsonLayer;
            map.addLayer(geoJsonLayer); // Add layer to map initially

            // Create layer control checkboxes
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.id = config.name;
            checkbox.addEventListener('change', (e) => {
                // Layer add/remove logic is now handled by applyFilters
                applyFilters(); // Re-apply filters when layer visibility changes
            });

            const label = document.createElement('label');
            label.htmlFor = config.name;
            label.textContent = config.name;

            const container = document.createElement('div');
            container.appendChild(checkbox);
            container.appendChild(label);
            layerControlsDiv.appendChild(container);
        });

        // 3. Setup charts and filters after all data is ready
        drawChart(); // For service type counts
        drawCenterChart(); // For service counts per center
        setupFilters(); // Populate filter dropdowns
        analyzeServiceGapsByType(); // Analyze gaps (populates window.serviceGapsResult)
        applyFilters(); // Initial filter application (will also update cards)
    })
    .catch(error => {
        console.error("❌ حدث خطأ أثناء تحميل البيانات:", error);
    });

// --- Utility Functions ---

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- Data Processing Functions ---

function linkPointsToCenters() {
    if (!geojsonCenters || !allServicePoints.length) {
        console.warn("⚠️ لم يتم تحميل المراكز أو نقاط الخدمات بعد.");
        return;
    }

    allServicePoints.forEach(pointFeature => {
        const point = turf.point(pointFeature.geometry.coordinates);
        let matched = false;

        geojsonCenters.features.forEach(center => {
            if (center.geometry.type === 'Polygon') {
                const polygon = turf.polygon(center.geometry.coordinates);
                if (turf.booleanPointInPolygon(point, polygon)) {
                    const centerName = (center.properties.Main_City || center.properties.Name || "غير معروف").trim().toLowerCase();
                    pointFeature.properties.CenterName = centerName;
                    matched = true;
                }
            } else if (center.geometry.type === 'MultiPolygon') {
                center.geometry.coordinates.forEach(polyCoords => {
                    const polygon = turf.polygon(polyCoords);
                    if (turf.booleanPointInPolygon(point, polygon)) {
                        const centerName = (center.properties.Main_City || center.properties.Name || "غير معروف").trim().toLowerCase();
                        pointFeature.properties.CenterName = centerName;
                        matched = true;
                    }
                });
            }
        });

        if (!matched) {
            pointFeature.properties.CenterName = "غير معروف";
        }
    });
    console.log("✅ تم الربط بين النقاط والمراكز وتحديث allServicePoints.");
}

// --- Charting Functions ---

function drawChart() {
    const ctx = document.getElementById('serviceChart').getContext('2d');
    const labels = Object.keys(serviceCounts);
    const values = Object.values(serviceCounts);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد النقاط',
                data: values,
                backgroundColor: Object.values(layersConfig).map(l => l.color)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

let centerChartInstance = null;

function drawCenterChart() {
    const centerCounts = {};

    allServicePoints.forEach(f => {
        const center = f.properties.CenterName || "غير معروف";
        if (center !== "غير معروف") {
            centerCounts[center] = (centerCounts[center] || 0) + 1;
        }
    });

    const labels = Object.keys(centerCounts);
    const values = Object.values(centerCounts);

    const ctx = document.getElementById('centerChart')?.getContext('2d');
    if (!ctx) {
        console.error("❌ عنصر canvas id=centerChart غير موجود.");
        return;
    }

    if (centerChartInstance) {
        centerChartInstance.destroy();
    }

    centerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الخدمات في كل مركز',
                data: values,
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${context.parsed}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// --- Filter and Card Update Functions ---

function setupFilters() {
    const typeFilter = document.getElementById("typeFilter");
    const cityFilter = document.getElementById("cityFilter");

    typeFilter.innerHTML = '<option value="all">كل الأنواع</option>';
    cityFilter.innerHTML = '<option value="all">كل المراكز</option>';

    layersConfig.forEach(config => {
        const option = document.createElement("option");
        option.value = config.name;
        option.textContent = config.name;
        typeFilter.appendChild(option);
    });

    if (geojsonCenters && geojsonCenters.features) {
        const centerSet = new Set();
        geojsonCenters.features.forEach(f => {
            const centerName = (f.properties.Main_City || f.properties.Name || "غير معروف").trim().toLowerCase();
            if (centerName !== "غير معروف") {
                centerSet.add(centerName);
            }
        });

        [...centerSet].sort().forEach(center => {
            const option = document.createElement("option");
            option.value = center;
            option.textContent = center;
            cityFilter.appendChild(option);
        });
    }

    typeFilter.addEventListener('change', applyFilters);
    cityFilter.addEventListener('change', applyFilters);

    console.log("✅ تم إعداد الفلاتر.");
}

function applyFilters() {
    const typeVal = document.getElementById("typeFilter").value;
    const cityVal = document.getElementById("cityFilter").value;

    // Remove all existing markers from the map first
    allMarkers.forEach(marker => map.removeLayer(marker));

    let visibleFeatures = []; // To collect features that pass the filters and are visible

    allMarkers.forEach(marker => {
        const props = marker.feature?.properties || {};
        const serviceType = props.service_type || "";
        const centerName = (props.CenterName || "غير معروف").trim().toLowerCase();

        // Check if the layer containing this marker is currently visible (checked in layer controls)
        const layerCheckbox = document.getElementById(serviceType);
        const layerIsVisible = layerCheckbox ? layerCheckbox.checked : true; // Assume true if checkbox not found

        const matchType = typeVal === "all" || serviceType === typeVal;
        const matchCity = cityVal === "all" || centerName === cityVal.toLowerCase();

        if (matchType && matchCity && layerIsVisible) {
            marker.addTo(map);
            visibleFeatures.push(marker.feature); // Add the feature to our collection
        }
    });

    console.log(`📍 تمت الفلترة: نوع الخدمة = ${typeVal}, المركز = ${cityVal}`);

    // Call the function to update the cards with the currently visible data
    updateCardData(visibleFeatures);
}

function updateCardData(filteredFeatures) {
    // Card 1: عدد المباني الحكومية (Number of Government Buildings)
    // Define which service types count as "government buildings"
    const governmentServiceTypes = ["Police", "Post Offices", "Civil Defense", "Transportation", "Real Estate", "Centrals", "Government Agencies", "Nursing Homes"]; // Adjust as per your definition

    let governmentBuildingCount = 0;
    filteredFeatures.forEach(feature => {
        if (governmentServiceTypes.includes(feature.properties.service_type)) {
            governmentBuildingCount++;
        }
    });
    document.querySelector('.dashboard .card:nth-child(1) p').textContent = `${governmentBuildingCount} مبنى`;

    // Card 2: المواقع المستهدفة (Targeted Locations)
    const uniqueCenters = new Set();
    filteredFeatures.forEach(feature => {
        if (feature.properties.CenterName && feature.properties.CenterName !== "غير معروف") {
            uniqueCenters.add(feature.properties.CenterName);
        }
    });
    const targetedLocationsText = uniqueCenters.size > 0 ? Array.from(uniqueCenters).join("، ") : "لا توجد مواقع";
    document.querySelector('.dashboard .card:nth-child(2) p').textContent = targetedLocationsText;


    // Card 3: الاحتياجات الحالية (Current Needs)
    let needsText = "تغطية جيدة";
    const currentCityFilter = document.getElementById("cityFilter").value;

    // Filter serviceGapsResult to only consider visible service types
    const visibleServiceTypesInFilter = new Set(filteredFeatures.map(f => f.properties.service_type));
    const excludedServices = ["Centrals", "Government Agencies"]; // Consistent with analyzeServiceGapsByType

    if (window.serviceGapsResult) { // Ensure serviceGapsResult is available
        let gapsInFilteredView = [];

        if (currentCityFilter !== "all") {
            const gapForSelectedCity = window.serviceGapsResult.find(g => g.center === currentCityFilter);
            if (gapForSelectedCity) {
                // Only show missing services that are part of the currently visible types
                gapsInFilteredView = gapForSelectedCity.missing.filter(m =>
                    (Array.from(serviceTypes).includes(m) && !excludedServices.includes(m))
                );
            }
        } else { // "all" cities selected
            window.serviceGapsResult.forEach(gapRow => {
                // Collect all unique missing services from all centers that are relevant to visible types
                gapRow.missing.forEach(missingType => {
                     if (Array.from(serviceTypes).includes(missingType) && !excludedServices.includes(missingType)) {
                         gapsInFilteredView.push(missingType);
                     }
                });
            });
            gapsInFilteredView = [...new Set(gapsInFilteredView)]; // Get unique missing types across all centers
        }

        if (gapsInFilteredView.length > 0) {
            needsText = `توجد فجوات: ${gapsInFilteredView.join("، ")}`;
        }
    }
    document.querySelector('.dashboard .card:nth-child(3) p').textContent = needsText;


    // Card 4: فرص الاستثمار (Investment Opportunities)
    let opportunitiesText = "فرص عامة للتطوير";
    if (needsText.includes("توجد فجوات")) {
        opportunitiesText = "تطوير مقار، مراكز خدمات جديدة في المناطق الناقصة";
    } else if (governmentBuildingCount > 0) {
        opportunitiesText = "تطوير إداري، مباني ذكية، تحسين كفاءة الخدمات";
    }
    document.querySelector('.dashboard .card:nth-child(4) p').textContent = opportunitiesText;
}


// --- Location and Gaps Analysis Functions ---

let nearestLine = null;
let nearestHighlight = null;
let userMarker = null;

document.getElementById("findNearestBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("المتصفح لا يدعم تحديد الموقع.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);

        if (nearestLine) map.removeLayer(nearestLine);
        if (nearestHighlight) map.removeLayer(nearestHighlight);
        if (userMarker) map.removeLayer(userMarker);

        let closest = null;
        let closestDist = Infinity;

        // Only consider currently visible markers for nearest service
        const visibleMarkers = allMarkers.filter(marker => map.hasLayer(marker));

        visibleMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            const dist = getDistance(userLatLng.lat, userLatLng.lng, markerLatLng.lat, markerLatLng.lng);
            if (dist < closestDist) {
                closestDist = dist;
                closest = marker;
            }
        });

        if (closest) {
            const targetLatLng = closest.getLatLng();

            userMarker = L.circleMarker(userLatLng, {
                radius: 7,
                color: '#2980b9',
                fillColor: '#3498db',
                fillOpacity: 1
            }).bindPopup("📍 موقعك الحالي").addTo(map).openPopup();

            nearestHighlight = L.circleMarker(targetLatLng, {
                radius: 9,
                color: '#e74c3c',
                fillColor: '#e74c3c',
                fillOpacity: 1
            }).addTo(map).bindPopup(`🎯 أقرب خدمة<br>المسافة: ${closestDist.toFixed(2)} كم`).openPopup();

            nearestLine = L.polyline([userLatLng, targetLatLng], {
                color: 'red',
                weight: 3,
                dashArray: '5,5'
            }).addTo(map);

            map.fitBounds([userLatLng, targetLatLng], { padding: [20, 20] });
        } else {
            alert("لم يتم العثور على نقاط خدمات متاحة بناءً على الفلاتر المطبقة.");
        }
    }, () => {
        alert("فشل في تحديد الموقع.");
    });
});


function analyzeServiceGapsByType() {
    const result = [];
    const excludedServices = ["Centrals", "Government Agencies"]; // Services not considered for gaps

    const centers = geojsonCenters.features.map(f =>
        (f.properties.Main_City || f.properties.Name || "غير معروف").trim().toLowerCase()
    ).filter((value, index, self) => self.indexOf(value) === index && value !== "غير معروف"); // Get unique, non-"غير معروف" center names

    // Get all relevant service types for gap analysis
    const types = Array.from(serviceTypes).filter(type => !excludedServices.includes(type));

    centers.forEach(centerName => {
        const servicesInCenter = allServicePoints
            .filter(f => (f.properties.CenterName || "").trim().toLowerCase() === centerName)
            .map(f => f.properties.service_type);

        const missing = types.filter(t => !servicesInCenter.includes(t));

        result.push({ center: centerName, missing });
    });

    console.log("📉 مراكز تفتقد أنواع خدمات:", result);
    window.serviceGapsResult = result; // Make it globally accessible for card updates

    const tbody = document.querySelector("#service-gaps-table tbody");
    if (!tbody) {
        console.error("❌ عنصر tbody id=service-gaps-table غير موجود.");
        return;
    }
    tbody.innerHTML = "";

    result.forEach(row => {
        const tr = document.createElement("tr");

        const tdCenter = document.createElement("td");
        tdCenter.textContent = row.center;

        const tdMissing = document.createElement("td");
        tdMissing.textContent = row.missing.length ? row.missing.join("، ") : "لا توجد فجوات";

        tr.appendChild(tdCenter);
        tr.appendChild(tdMissing);
        tbody.appendChild(tr);
    });
}