// Enhanced Routing Page JavaScript

// Global variables
let maps = {};
let currentTab = "government-services";
let currentData = {};
let allServices = {};
let userLocation = null;
let routingControl = null;
let heatmapLayer = null;
let measureControl = null;
let drawControl = null;
let servicesChart = null;
let currentRoute = null;
let busStopsData = null;

// Tab configuration with data files and icons
const tabConfig = {
  "government-services": {
    dataFile: "../geo_data/gov_serv.json",
    icon: "../assets/icons/government.png",
    mapId: "map-government",
    name: "الخدمات الحكومية",
  },
  "security-services": {
    dataFile: "../geo_data/police_serv.geojson",
    icon: "../assets/icons/police-station.png",
    mapId: "map-security",
    name: "الخدمات الأمنية",
  },
  "civil-protection": {
    dataFile: "../geo_data/protect_serv.json",
    icon: "../assets/icons/fire-station.png",
    mapId: "map-civil",
    name: "مراكز الحماية المدنية",
  },
  shelters: {
    dataFile: "../geo_data/shelter_serv.json",
    icon: "../assets/icons/guest-house.png",
    mapId: "map-shelters",
    name: "مراكز الإيواء ودور الضيافة",
  },
  documentation: {
    dataFile: "../geo_data/office_serv.json",
    icon: "../assets/icons/policy.png",
    mapId: "map-documentation",
    name: "مراكز التوثيق والشهر العقاري",
  },
  telecommunications: {
    dataFile: "../geo_data/tele_serv.json",
    icon: "../assets/icons/telephone.png",
    mapId: "map-telecommunications",
    name: "مراكز الاتصالات",
  },
};

const administrativeBoundariesFile = "../geo_data/boundry.geojson";

// Path for the public parking layer
const mawqfLayerFile = "../geo_data/mawqf.geojson";

// Initialize the routing page
function initializeRoutingPage() {
  initializeUI();
  loadBusStopsData();
  initializeTab(currentTab);
  setupEventListeners();
  initializeAnalytics();
}

// Load bus stops data from the mawqf.geojson file
async function loadBusStopsData() {
  try {
    const response = await fetch(mawqfLayerFile);
    if (!response.ok) {
      console.warn(`Could not fetch bus stops data: ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Process the GeoJSON data correctly
    if (data.type === "FeatureCollection" && data.features) {
      const qalyubiaBounds = {
        minLat: 30.0,
        maxLat: 30.7,
        minLng: 31.0,
        maxLng: 31.5,
      }; // تقريبي لمدى محافظة القليوبية

      busStopsData = data.features
        .map((feature, index) => {
          const stationName =
            feature.properties.Name ||
            feature.properties.الاسم ||
            feature.properties.name ||
            `محطة رقم ${index + 1}`;
          const lat = feature.geometry.coordinates[1];
          const lng = feature.geometry.coordinates[0];

          // تصفية المواقف خارج نطاق القليوبية
          if (
            lat < qalyubiaBounds.minLat ||
            lat > qalyubiaBounds.maxLat ||
            lng < qalyubiaBounds.minLng ||
            lng > qalyubiaBounds.maxLng
          ) {
            return null;
          }

          return {
            name: stationName,
            lat: lat,
            lng: lng,
            properties: feature.properties,
            id: feature.id || feature.properties.FID,
          };
        })
        .filter((stop) => stop !== null); // إزالة المحطات التي تم تجاهلها

      // Verify data integrity
      const validStations = busStopsData.filter(
        (s) => s.name && s.lat && s.lng
      );

      return busStopsData; // Return the loaded data
    } else {
      throw new Error("تنسيق البيانات غير صحيح - ليس FeatureCollection");
    }
  } catch (error) {
    console.error("خطأ في تحميل بيانات المحطات:", error);
    console.warn("سيتم استخدام البيانات الاحتياطية");

    // Fallback to sample data if file is not available
    busStopsData = [
      { name: "محطة بنها المركزية", lat: 30.4594, lng: 31.1785 },
      { name: "محطة شبرا الخيمة", lat: 30.1218, lng: 31.2442 },
      { name: "محطة القناطر الخيرية", lat: 30.1897, lng: 31.1372 },
      { name: "محطة طوخ", lat: 30.3789, lng: 31.2039 },
      { name: "محطة قها", lat: 30.2897, lng: 31.2897 },
      { name: "محطة كفر شكر", lat: 30.6897, lng: 31.3897 },
      { name: "محطة الخانكة", lat: 30.2123, lng: 31.3654 },
      { name: "محطة قليوب", lat: 30.1789, lng: 31.2065 },
    ];

    return busStopsData; // Return fallback data
  }
}

// Helper function to get icon size based on zoom
function getDynamicIconSize(zoom) {
  if (zoom >= 14) return [56, 56];
  if (zoom >= 12) return [46, 46];
  if (zoom >= 10) return [38, 38];
  if (zoom >= 8) return [34, 34];
  return [10, 10];
}

function updateVisibleServicesCount(count) {
  const el = document.getElementById("visibleServices");
  if (el) {
    el.textContent = Number.isFinite(count) ? count : 0;
  } else {
    console.warn("element #visibleServices not found!");
  }
}

function initializeMap(mapId) {
  try {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) throw new Error(`عنصر الخريطة غير موجود: ${mapId}`);
    mapElement.innerHTML = "";

    const map = L.map(mapId, {
      center: [30.0444, 31.2357],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [21.0, 24.0],
        [32.5, 37.5],
      ],
    });

    map.on("zoomend", function () {
      const currentZoom = map.getZoom();
      const services = allServices[currentTab] || [];
      services.forEach((service) => {
        if (service.marker) {
          const iconUrl = service.marker.options.icon.options.iconUrl;
          const size = getDynamicIconSize(currentZoom);
          const newIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: size,
            iconAnchor: [size[0] / 2, size[1]],
            popupAnchor: [0, -size[1]],
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            shadowSize: [0, 0],
            shadowAnchor: [0, 0],
          });
          service.marker.setIcon(newIcon);
        }
      });
    });
    map.on("moveend", () => {
      filterServices();
    });

    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.control
      .scale({ position: "bottomright", metric: true, imperial: false })
      .addTo(map);

    return map;
  } catch (error) {
    console.error("خطأ في إنشاء الخريطة:", error);
    showErrorState(mapId, "فشل في تهيئة الخريطة");
    return null;
  }
}

async function loadGeoData(map, config, tabId) {
  try {
    // Load mandatory layers first
    await loadAdministrativeBoundaries(map);
    await loadMawqfLayer(map);

    // Load the specific service layer for the current tab
    const response = await fetch(config.dataFile);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    currentData[tabId] = data;

    const initialIconSize = getDynamicIconSize(map.getZoom());
    const customIcon = L.icon({
      iconUrl: config.icon,
      iconSize: initialIconSize,
      iconAnchor: [initialIconSize[0] / 2, initialIconSize[1]],
      popupAnchor: [0, -initialIconSize[1]],
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      shadowSize: [0, 0],
      shadowAnchor: [0, 0],
    });

    if (data.type === "FeatureCollection") {
      processGeoJSONData(map, data, customIcon, tabId);
    } else if (Array.isArray(data)) {
      processJSONArrayData(map, data, customIcon, tabId);
    }

    updateSidebar();
    updateAnalytics();
    filterServices();
    map.fire("zoomend");
  } catch (error) {
    console.error("خطأ في تحميل البيانات:", error);
    showErrorState(config.mapId, "فشل في تحميل البيانات: " + error.message);
  }
}

function processData(map, data, customIcon, tabId, isGeoJSON) {
  const services = [];
  const features = isGeoJSON
    ? data.features
    : data.map((item, idx) => ({
        geometry: {
          type: "Point",
          coordinates: [
            item.longitude || item.lng || item.lon,
            item.latitude || item.lat,
          ],
        },
        properties: item,
        id: item.id || idx,
      }));

  features.forEach((feature) => {
    if (
      feature.geometry &&
      feature.geometry.type === "Point" &&
      feature.geometry.coordinates[0] &&
      feature.geometry.coordinates[1]
    ) {
      const coords = feature.geometry.coordinates;
      const service = {
        id: feature.properties.OBJECTID || feature.id || Math.random(),
        name:
          feature.properties.الاسم ||
          feature.properties.name ||
          feature.properties.اسم_ا ||
          "غير محدد",
        lat: coords[1],
        lng: coords[0],
        properties: feature.properties,
        tabId: tabId,
      };
      services.push(service);
      const marker = L.marker([service.lat, service.lng], { icon: customIcon })
        .bindPopup(createPopupContent(service))
        .addTo(map);
      service.marker = marker;
    }
  });

  allServices[tabId] = services;
  if (services.length > 0) {
    const group = new L.featureGroup(services.map((s) => s.marker));
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      const boundsZoom = map.getBoundsZoom(bounds);
      if (boundsZoom < map.getMinZoom()) {
        map.setView(bounds.getCenter(), map.getMinZoom());
      } else {
        map.fitBounds(bounds.pad(0.1));
      }
    }
  }
}

function processGeoJSONData(map, data, customIcon, tabId) {
  processData(map, data, customIcon, tabId, true);
}

function processJSONArrayData(map, data, customIcon, tabId) {
  processData(map, data, customIcon, tabId, false);
}

function initializeUI() {
  showLoadingOverlay();
  const sidebar = document.getElementById("sidebar");
  const analyticsPanel = document.getElementById("analyticsPanel");
  const navigationPanel = document.getElementById("navigationPanel");

  sidebar.classList.remove("active");
  analyticsPanel.classList.remove("active");
  navigationPanel.classList.remove("active");

  setTimeout(() => {
    hideLoadingOverlay();
  }, 1000);
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Panel controls
  document
    .getElementById("toggleSidebar")
    .addEventListener("click", toggleSidebar);
  document
    .getElementById("toggleAnalytics")
    .addEventListener("click", toggleAnalytics);
  document.getElementById("locateUser").addEventListener("click", locateUser);
  document
    .getElementById("closeSidebar")
    .addEventListener("click", closeSidebar);
  document
    .getElementById("closeAnalytics")
    .addEventListener("click", closeAnalytics);
  document
    .getElementById("closeNavigation")
    .addEventListener("click", closeNavigation);

  // Search and filter
  document
    .getElementById("searchInput")
    .addEventListener("input", filterServices);
  document
    .getElementById("districtFilter")
    .addEventListener("change", filterServices);
  document
    .getElementById("clearFilters")
    .addEventListener("click", clearFilters);

  // Map controls
  document
    .getElementById("measureDistance")
    .addEventListener("click", toggleMeasure);
  document.getElementById("drawArea").addEventListener("click", toggleDraw);
  document
    .getElementById("heatmapToggle")
    .addEventListener("click", toggleHeatmap);
  document.getElementById("printMap").addEventListener("click", printMap);
  document.getElementById("resetView").addEventListener("click", resetView);
  document
    .getElementById("fullscreen")
    .addEventListener("click", toggleFullscreen);
}

function switchTab(tabId) {
  if (currentTab === tabId) return;

  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
  document
    .querySelectorAll(".tab-panel")
    .forEach((panel) => panel.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");

  if (!maps[tabConfig[tabId].mapId]) {
    initializeTab(tabId);
  }

  currentTab = tabId;
  updateSidebar();
  updateAnalytics();
}

function initializeTab(tabId) {
  const config = tabConfig[tabId];
  if (!config) return;

  showLoadingState(config.mapId);
  try {
    const map = initializeMap(config.mapId);
    if (map) {
      maps[config.mapId] = map;
      loadGeoData(map, config, tabId);
    }
  } catch (error) {
    console.error("خطأ في تهيئة التبويب:", error);
    showErrorState(config.mapId, "فشل في تهيئة الخريطة: " + error.message);
  }
}

async function loadAdministrativeBoundaries(map) {
  try {
    const response = await fetch(administrativeBoundariesFile);

    if (!response.ok) return;
    const boundariesData = await response.json();
    L.geoJSON(boundariesData, {
      style: {
        color: "#1d1d1dff",
        weight: 1.5,
        opacity: 0.7,
        fillColor: "#437fbfff",
        fillOpacity: 0.3,
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(
            `<strong>الحدود الإدارية:</strong> ${feature.properties.name}`
          );
        }
      },
    }).addTo(map);
  } catch (error) {
    console.warn("لا يمكن تحميل الحدود الإدارية:", error);
  }
}

// Load the public parking (mawqf) layer
async function loadMawqfLayer(map) {
  try {
    const response = await fetch(mawqfLayerFile);
    if (!response.ok) {
      console.warn(`Could not fetch ${mawqfLayerFile}: ${response.status}`);
      return;
    }
    const mawqfData = await response.json();

    // Store the parking data for navigation purposes but don't display it on the map
    // This keeps the parking layer hidden from the UI while maintaining functionality

    // Optional: Create a hidden layer group that can be toggled if needed in the future
    const hiddenMawqfLayer = L.layerGroup();

    const mawqfIcon = L.icon({
      iconUrl: "../assets/icons/parking.png",
      iconSize: [25, 25],
      iconAnchor: [12, 25],
      popupAnchor: [0, -25],
    });

    L.geoJSON(mawqfData, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: mawqfIcon });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          let popupContent = "<strong>موقف عام</strong>";
          if (feature.properties.Name) {
            popupContent = `<strong>${feature.properties.Name}</strong>`;
          } else if (feature.properties.name) {
            popupContent = `<strong>${feature.properties.name}</strong>`;
          } else if (feature.properties.الاسم) {
            popupContent = `<strong>${feature.properties.الاسم}</strong>`;
          }
          layer.bindPopup(popupContent);
        }
      },
    }).addTo(hiddenMawqfLayer);

    // Store reference to the hidden layer for potential future use
    map.hiddenMawqfLayer = hiddenMawqfLayer;

    // Don't add the layer to the map - keep it hidden
    // .addTo(map); // This line is commented out to hide the layer
  } catch (error) {
    console.warn("لا يمكن تحميل طبقة المواقف العامة:", error);
  }
}

function createPopupContent(service) {
  const config = tabConfig[service.tabId];
  let content = `<div class="custom-popup">
    <div class="popup-header">
      <i class="fas fa-map-marker-alt"></i> ${service.name}
    </div>
    <div class="popup-content">
      <div class="popup-field">
        <span class="popup-label">النوع:</span>
        <span class="popup-value">${config.name}</span>
      </div>
      <div class="popup-field">
        <span class="popup-label">الإحداثيات:</span>
        <span class="popup-value">${service.lat.toFixed(
          4
        )}, ${service.lng.toFixed(4)}</span>
      </div>`;

  Object.keys(service.properties).forEach((key) => {
    if (
      ![
        "OBJECTID",
        "latitude",
        "longitude",
        "lat",
        "lng",
        "name",
        "الاسم",
      ].includes(key)
    ) {
      const value = service.properties[key];
      if (value && value !== "غير محدد") {
        content += `<div class="popup-field">
          <span class="popup-label">${key}:</span>
          <span class="popup-value">${value}</span>
        </div>`;
      }
    }
  });

  content += `</div>
    <div class="popup-actions">
      <button class="popup-btn primary" onclick="getDirections(${service.lat}, ${service.lng}, '${service.name}')">
        <i class="fas fa-route"></i> الاتجاهات
      </button>
      <button class="popup-btn secondary" onclick="focusOnService('${service.id}', '${service.tabId}')">
        <i class="fas fa-crosshairs"></i> تركيز
      </button>
      <button class="popup-btn navigation" onclick="openNavigationGuide(${service.lat}, ${service.lng}, '${service.name}')">
        <i class="fas fa-bus"></i> دليل التنقل
      </button>
    </div>
  </div>`;

  return content;
}

function getDirections(lat, lng, serviceName) {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const userLatLng = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );
      const destLatLng = L.latLng(lat, lng);
      const map = maps[tabConfig[currentTab].mapId];

      if (!map) return;

      if (routingControl) {
        map.removeControl(routingControl);
      }

      routingControl = L.Routing.control({
        waypoints: [userLatLng, destLatLng],
        lineOptions: {
          styles: [{ color: "#3f60cbff", weight: 5, opacity: 0.9 }],
        },
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        createMarker: function () {
          return null;
        },
      }).addTo(map);

      routingControl.on("routesfound", function (e) {
        const route = e.routes[0];
        currentRoute = route;
        updateNavigationPanel(route, serviceName);
        showNavigationPanel();
      });
    },
    function () {
      // alert("تعذر تحديد موقعك الحالي.");
    }
  );
}

function updateNavigationPanel(route, serviceName) {
  document.getElementById("routeDistance").textContent = `${(
    route.summary.totalDistance / 1000
  ).toFixed(2)} كم`;
  document.getElementById("routeDuration").textContent = `${Math.ceil(
    route.summary.totalTime / 60
  )} دقيقة`;
  document.getElementById("routeDestination").textContent = serviceName;

  const instructionsList = document.getElementById("instructionsList");
  instructionsList.innerHTML = "";

  route.instructions.forEach((instruction, index) => {
    const instructionItem = document.createElement("div");
    instructionItem.className = "instruction-item";

    const distance =
      instruction.distance > 0
        ? `${(instruction.distance / 1000).toFixed(1)} كم`
        : "";

    instructionItem.innerHTML = `
      <div class="instruction-number">${index + 1}</div>
      <div class="instruction-text">${instruction.text}</div>
      <div class="instruction-distance">${distance}</div>
    `;

    instructionsList.appendChild(instructionItem);
  });
}

function showNavigationPanel() {
  const navigationPanel = document.getElementById("navigationPanel");
  navigationPanel.classList.add("active");
}

function closeNavigation() {
  const navigationPanel = document.getElementById("navigationPanel");
  navigationPanel.classList.remove("active");

  if (routingControl) {
    const map = maps[tabConfig[currentTab].mapId];
    if (map) {
      map.removeControl(routingControl);
    }
    routingControl = null;
    currentRoute = null;
  }
}

function focusOnService(serviceId, tabId) {
  if (currentTab !== tabId) switchTab(tabId);

  const service = (allServices[tabId] || []).find((s) => s.id == serviceId);
  if (!service || !service.marker) return;

  const map = maps[tabConfig[tabId].mapId];
  if (!map) return;

  map.setView([service.lat, service.lng], 15);
  service.marker.openPopup();
  highlightServiceInSidebar(serviceId);
}

function locateUser() {
  if (!navigator.geolocation) {
    return;
  }

  const btn = document.getElementById("locateUser");
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  navigator.geolocation.getCurrentPosition(
    function (position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const map = maps[tabConfig[currentTab].mapId];
      if (map) {
        if (window.userMarker) map.removeLayer(window.userMarker);

        window.userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          }),
        })
          .bindPopup("موقعك الحالي")
          .addTo(map);

        map.setView([userLocation.lat, userLocation.lng], 12);
      }

      btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    },
    function (error) {
      btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
  if (sidebar.classList.contains("active")) updateSidebar();
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("active");
}

function toggleAnalytics() {
  const panel = document.getElementById("analyticsPanel");
  panel.classList.toggle("active");
  if (panel.classList.contains("active")) updateAnalytics();
}

function closeAnalytics() {
  document.getElementById("analyticsPanel").classList.remove("active");
}

function updateSidebar() {
  const servicesList = document.getElementById("servicesList");
  const services = allServices[currentTab] || [];
  servicesList.innerHTML = "";

  if (services.length === 0) {
    servicesList.innerHTML =
      '<div class="no-services">لا توجد خدمات متاحة</div>';
    return;
  }

  services.forEach((service) => {
    const serviceItem = document.createElement("div");
    serviceItem.className = "service-item";
    serviceItem.setAttribute("data-service-id", service.id);
    serviceItem.innerHTML = `
      <div class="service-name">${service.name}</div>
      <div class="service-type">${tabConfig[service.tabId].name}</div>
      <div class="service-actions">
        <button class="btn-action" onclick="focusOnService('${service.id}', '${
      service.tabId
    }')">
          <i class="fas fa-crosshairs"></i> عرض
        </button>
        <button class="btn-action" onclick="getDirections(${service.lat}, ${
      service.lng
    }, '${service.name}')">
          <i class="fas fa-route"></i> اتجاهات
        </button>
        <button class="btn-action navigation-btn" onclick="openNavigationGuide(${
          service.lat
        }, ${service.lng}, '${service.name}')">
          <i class="fas fa-bus"></i> دليل التنقل
        </button>
      </div>
    `;

    serviceItem.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
        focusOnService(service.id, service.tabId);
      }
    });

    servicesList.appendChild(serviceItem);
  });

  updateDistrictFilter(services);
}

function updateDistrictFilter(services) {
  const districtFilter = document.getElementById("districtFilter");
  const districts = new Set();

  services.forEach((service) => {
    const district =
      service.properties.المنطقة ||
      service.properties.district ||
      service.properties.الحي;
    if (district) districts.add(district);
  });

  districtFilter.innerHTML = '<option value="">جميع المناطق</option>';
  Array.from(districts)
    .sort()
    .forEach((district) => {
      const option = document.createElement("option");
      option.value = district;
      option.textContent = district;
      districtFilter.appendChild(option);
    });
}

function filterServices() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedDistrict = document.getElementById("districtFilter").value;
  const services = allServices[currentTab] || [];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm);
    const districtProp =
      service.properties.المنطقة ||
      service.properties.district ||
      service.properties.الحي;
    const matchesDistrict =
      !selectedDistrict || districtProp === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  updateSidebarWithServices(filteredServices);
  updateMapMarkers(filteredServices);
  updateVisibleServicesCount(filteredServices.length);

  return filteredServices;
}

function updateSidebarWithServices(services) {
  const servicesList = document.getElementById("servicesList");
  servicesList.innerHTML = "";

  if (services.length === 0) {
    servicesList.innerHTML =
      '<div class="no-services">لا توجد نتائج مطابقة</div>';
    return;
  }

  services.forEach((service) => {
    const serviceItem = document.createElement("div");
    serviceItem.className = "service-item";
    serviceItem.setAttribute("data-service-id", service.id);
    serviceItem.innerHTML = `
      <div class="service-name">${service.name}</div>
      <div class="service-type">${tabConfig[service.tabId].name}</div>
      <div class="service-actions">
        <button class="btn-action" onclick="focusOnService('${service.id}', '${
      service.tabId
    }')">
          <i class="fas fa-crosshairs"></i> عرض
        </button>
        <button class="btn-action" onclick="getDirections(${service.lat}, ${
      service.lng
    }, '${service.name}')">
          <i class="fas fa-route"></i> اتجاهات
        </button>
        <button class="btn-action navigation-btn" onclick="openNavigationGuide(${
          service.lat
        }, ${service.lng}, '${service.name}')">
          <i class="fas fa-bus"></i> دليل التنقل
        </button>
      </div>
    `;

    serviceItem.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
        focusOnService(service.id, service.tabId);
      }
    });

    servicesList.appendChild(serviceItem);
  });
}

function updateMapMarkers(visibleServices) {
  const allTabServices = allServices[currentTab] || [];
  const map = maps[tabConfig[currentTab].mapId];
  if (!map) return;

  allTabServices.forEach((service) => {
    if (service.marker) {
      const isVisible =
        Array.isArray(visibleServices) &&
        visibleServices.some((s) => s.id === service.id);

      if (isVisible) {
        if (!map.hasLayer(service.marker)) map.addLayer(service.marker);
      } else {
        if (map.hasLayer(service.marker)) map.removeLayer(service.marker);
      }
    }
  });
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("districtFilter").value = "";
  filterServices();
}

function highlightServiceInSidebar(serviceId) {
  document
    .querySelectorAll(".service-item")
    .forEach((item) => item.classList.remove("active"));
  const itemToHighlight = document.querySelector(
    `.service-item[data-service-id='${serviceId}']`
  );
  if (itemToHighlight) itemToHighlight.classList.add("active");
}

function initializeAnalytics() {
  const ctx = document.getElementById("servicesChart").getContext("2d");
  servicesChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#4f46e5",
            "#06b6d4",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20, usePointStyle: true },
        },
        title: { display: true, text: "توزيع الخدمات حسب النوع" },
      },
    },
  });
}

function updateAnalytics() {
  let totalServices = 0;
  const servicesByType = {};

  Object.keys(allServices).forEach((tabId) => {
    const services = allServices[tabId] || [];
    totalServices += services.length;
    servicesByType[tabConfig[tabId].name] = services.length;
  });

  document.getElementById("totalServices").textContent = totalServices;
  document.getElementById("currentTabServices").textContent = (
    allServices[currentTab] || []
  ).length;

  if (servicesChart) {
    servicesChart.data.labels = Object.keys(servicesByType);
    servicesChart.data.datasets[0].data = Object.values(servicesByType);
    servicesChart.update();
  }
}

function toggleMeasure() {
  // alert("ميزة القياس قيد التطوير");
}

function toggleDraw() {
  // alert("ميزة الرسم ستكون متاحة قريباً");
}

function toggleHeatmap() {
  // alert("ميزة الخريطة الحرارية قيد التطوير");
}

function printMap() {
  window.print();
}

function resetView() {
  const map = maps[tabConfig[currentTab].mapId];
  if (!map) return;

  const services = allServices[currentTab] || [];
  if (services.length > 0) {
    const group = new L.featureGroup(
      services.map((s) => s.marker).filter((m) => m)
    );
    const bounds = group.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
  } else {
    map.setView([30.0444, 31.2357], 7);
  }

  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
    heatmapLayer = null;
    document.getElementById("heatmapToggle").classList.remove("active");
  }

  // Close navigation panel
  closeNavigation();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function showLoadingOverlay() {
  document.getElementById("loadingOverlay").classList.add("active");
}

function hideLoadingOverlay() {
  document.getElementById("loadingOverlay").classList.remove("active");
}

function showLoadingState(mapId) {
  const mapElement = document.getElementById(mapId);
  if (mapElement) {
    mapElement.innerHTML = `
      <div class="map-loading">
        <div class="loading-spinner"></div>
        جاري تحميل بيانات الخريطة...
      </div>
    `;
  }
}

function showErrorState(mapId, message) {
  const mapElement = document.getElementById(mapId);
  if (mapElement) {
    mapElement.innerHTML = `
      <div class="map-loading">
        <p style="color: #dc3545;">خطأ: ${message}</p>
        <button onclick="location.reload()">إعادة المحاولة</button>
      </div>
    `;
  }
}

// Window resize handler
window.addEventListener("resize", () => {
  Object.values(maps).forEach((map) => {
    if (map) setTimeout(() => map.invalidateSize(), 100);
  });
});

// Fullscreen change handler
document.addEventListener("fullscreenchange", () => {
  setTimeout(() => {
    Object.values(maps).forEach((map) => {
      if (map) map.invalidateSize();
    });
  }, 100);
});

// Make functions globally available
window.getDirections = getDirections;
window.focusOnService = focusOnService;
window.initializeRoutingPage = initializeRoutingPage;

// Enhanced Navigation Guide functionality
function openNavigationGuide(serviceLat, serviceLng, serviceName) {
  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع الجغرافي");
    return;
  }

  // Ensure bus stops data is loaded
  if (!busStopsData || busStopsData.length === 0) {
    loadBusStopsData()
      .then(() => {
        openNavigationGuide(serviceLat, serviceLng, serviceName);
      })
      .catch((error) => {
        alert("تعذر تحميل بيانات المحطات. يرجى المحاولة مرة أخرى.");
      });
    return;
  }

  // Show loading modal
  showNavigationModal();

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      calculateNavigationRoute(
        userLat,
        userLng,
        serviceLat,
        serviceLng,
        serviceName
      );
    },
    function (error) {
      console.error("خطأ في تحديد الموقع:", error);
      hideNavigationModal();
      alert("تعذر تحديد موقعك الحالي. يرجى المحاولة مرة أخرى.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function calculateNavigationRoute(
  userLat,
  userLng,
  serviceLat,
  serviceLng,
  serviceName
) {
  // Use real bus stops data if available, otherwise fallback to sample data
  const busStops =
    busStopsData && busStopsData.length > 0
      ? busStopsData
      : [
          { name: "محطة بنها المركزية", lat: 30.4594, lng: 31.1785 },
          { name: "محطة شبرا الخيمة", lat: 30.1218, lng: 31.2442 },
          { name: "محطة القناطر الخيرية", lat: 30.1897, lng: 31.1372 },
          { name: "محطة طوخ", lat: 30.3789, lng: 31.2039 },
          { name: "محطة قها", lat: 30.2897, lng: 31.2897 },
          { name: "محطة كفر شكر", lat: 30.6897, lng: 31.3897 },
          { name: "محطة الخانكة", lat: 30.2123, lng: 31.3654 },
          { name: "محطة قليوب", lat: 30.1789, lng: 31.2065 },
        ];

  // Find nearest bus stop to user
  const nearestToUser = findNearestBusStop(userLat, userLng, busStops);

  // Find nearest bus stop to service
  const nearestToService = findNearestBusStop(serviceLat, serviceLng, busStops);

  // Ensure we have valid station names
  if (!nearestToUser || !nearestToService) {
    console.error("لم يتم العثور على محطات مناسبة");
    hideNavigationModal();
    alert("عذراً، لا توجد محطات باص متاحة في المنطقة المحددة");
    return;
  }

  // Validate station names
  if (!nearestToUser.name || !nearestToService.name) {
    console.error(
      "أسماء المحطات غير صالحة:",
      nearestToUser.name,
      nearestToService.name
    );
    hideNavigationModal();
    alert("عذراً، هناك مشكلة في بيانات المحطات");
    return;
  }

  // Calculate distances and times more accurately
  const distanceToUserStop = calculateDistance(
    userLat,
    userLng,
    nearestToUser.lat,
    nearestToUser.lng
  );
  const distanceFromServiceStop = calculateDistance(
    nearestToService.lat,
    nearestToService.lng,
    serviceLat,
    serviceLng
  );
  const busTravelDistance = calculateDistance(
    nearestToUser.lat,
    nearestToUser.lng,
    nearestToService.lat,
    nearestToService.lng
  );

  // Calculate realistic times
  const walkingSpeed = 5; // km/h average walking speed
  const busSpeed = 25; // km/h average bus speed in city

  const timeToUserStop = Math.ceil((distanceToUserStop / walkingSpeed) * 60); // minutes
  const busTime = Math.ceil((busTravelDistance / busSpeed) * 60); // minutes
  const timeFromServiceStop = Math.ceil(
    (distanceFromServiceStop / walkingSpeed) * 60
  ); // minutes

  // Display navigation instructions
  displayNavigationInstructions({
    serviceName: serviceName,
    userLocation: { lat: userLat, lng: userLng },
    serviceLocation: { lat: serviceLat, lng: serviceLng },
    nearestToUser: nearestToUser,
    nearestToService: nearestToService,
    distanceToUserStop: distanceToUserStop,
    distanceFromServiceStop: distanceFromServiceStop,
    busTravelDistance: busTravelDistance,
    timeToUserStop: timeToUserStop,
    busTime: busTime,
    timeFromServiceStop: timeFromServiceStop,
  });
}

function findNearestBusStop(lat, lng, busStops) {
  if (!busStops || busStops.length === 0) {
    console.error("لا توجد محطات متاحة للبحث");
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  busStops.forEach((stop) => {
    // Ensure stop and its properties are valid
    if (
      stop &&
      typeof stop.lat === "number" &&
      typeof stop.lng === "number" &&
      stop.name
    ) {
      const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = stop;
      }
    }
  });

  // Ensure the returned object has a valid name
  if (!nearest || !nearest.name) {
    console.error("لم يتم العثور على محطة صالحة بالاسم");
    return null;
  }

  return {
    ...nearest,
    distance: minDistance,
    name: nearest.name, // Ensure name is explicitly set
  };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function showNavigationModal() {
  const modal = document.createElement("div");
  modal.id = "navigationModal";
  modal.className = "navigation-modal";
  modal.innerHTML = `
    <div class="navigation-modal-content">
      <div class="navigation-header">
        <h3><i class="fas fa-bus"></i> دليل التنقل الذكي</h3>
        <button class="close-navigation" onclick="closeNavigationModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="navigation-loading">
        <div class="loading-spinner"></div>
        <p>جاري تحديد موقعك الحالي...</p>
        <small>يرجى السماح بالوصول إلى الموقع الجغرافي</small>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add enhanced loading animation
  setTimeout(() => {
    const loadingText = modal.querySelector(".navigation-loading p");
    if (loadingText) {
      loadingText.textContent = "جاري حساب أفضل مسار للوصول...";
    }
  }, 2000);
}

function displayNavigationInstructions(data) {
  const modal = document.getElementById("navigationModal");
  if (!modal) {
    return;
  }

  const totalTime =
    data.timeToUserStop + data.busTime + data.timeFromServiceStop;
  const totalDistance =
    data.distanceToUserStop +
    data.busTravelDistance +
    data.distanceFromServiceStop;

  // Validate station names before displaying with more robust checking
  let userStationName = "محطة غير محددة";
  let serviceStationName = "محطة غير محددة";

  if (
    data.nearestToUser &&
    data.nearestToUser.name &&
    data.nearestToUser.name.trim() !== ""
  ) {
    userStationName = data.nearestToUser.name.trim();
  }

  if (
    data.nearestToService &&
    data.nearestToService.name &&
    data.nearestToService.name.trim() !== ""
  ) {
    serviceStationName = data.nearestToService.name.trim();
  }

  // If we still don't have proper names, try to get them from properties
  if (
    userStationName === "محطة غير محددة" &&
    data.nearestToUser &&
    data.nearestToUser.properties
  ) {
    userStationName =
      data.nearestToUser.properties.Name ||
      data.nearestToUser.properties.name ||
      "محطة غير محددة";
  }

  if (
    serviceStationName === "محطة غير محددة" &&
    data.nearestToService &&
    data.nearestToService.properties
  ) {
    serviceStationName =
      data.nearestToService.properties.Name ||
      data.nearestToService.properties.name ||
      "محطة غير محددة";
  }

  modal.querySelector(".navigation-modal-content").innerHTML = `
    <div class="navigation-header">
      <h3><i class="fas fa-bus"></i> دليل التنقل الذكي</h3>
      <button class="close-navigation" onclick="closeNavigationModal()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="navigation-content">
      <div class="destination-info">
        <h4><i class="fas fa-map-marker-alt"></i> ${data.serviceName}</h4>
        <div class="route-summary">
          <div class="summary-item">
            <i class="fas fa-clock"></i>
            <span>الوقت المتوقع: ${totalTime} دقيقة</span>
          </div>
          <div class="summary-item">
            <i class="fas fa-route"></i>
            <span>المسافة الإجمالية: ${totalDistance.toFixed(1)} كم</span>
          </div>
        </div>
      </div>
      
      <div class="navigation-steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h5><i class="fas fa-walking"></i> توجه إلى محطة الباص</h5>
            <p>امش إلى <strong>${userStationName}</strong></p>
            <div class="step-details">
              <span><i class="fas fa-map-marker-alt"></i> المسافة: ${data.distanceToUserStop.toFixed(
                1
              )} كم</span>
              <span><i class="fas fa-clock"></i> الوقت: ${
                data.timeToUserStop
              } دقيقة مشياً</span>
            </div>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h5><i class="fas fa-bus"></i> اركب الباص</h5>
            <p>من <strong>${userStationName}</strong> إلى <strong>${serviceStationName}</strong></p>
            <div class="step-details">
              <span><i class="fas fa-route"></i> المسافة: ${data.busTravelDistance.toFixed(
                1
              )} كم</span>
              <span><i class="fas fa-clock"></i> الوقت: ${
                data.busTime
              } دقيقة بالباص</span>
            </div>
          </div>
        </div>
        
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h5><i class="fas fa-walking"></i> امش إلى الوجهة</h5>
            <p>من <strong>${serviceStationName}</strong> إلى <strong>${
    data.serviceName
  }</strong></p>
            <div class="step-details">
              <span><i class="fas fa-map-marker-alt"></i> المسافة: ${data.distanceFromServiceStop.toFixed(
                1
              )} كم</span>
              <span><i class="fas fa-clock"></i> الوقت: ${
                data.timeFromServiceStop
              } دقيقة مشياً</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="navigation-actions">
        <button class="btn-primary" onclick="showRouteOnMap(${
          data.userLocation.lat
        }, ${data.userLocation.lng}, ${data.nearestToUser.lat}, ${
    data.nearestToUser.lng
  }, ${data.nearestToService.lat}, ${data.nearestToService.lng}, ${
    data.serviceLocation.lat
  }, ${data.serviceLocation.lng})">
          <i class="fas fa-map"></i> عرض المسار على الخريطة
        </button>
        <button class="btn-secondary" onclick="shareRoute('${
          data.serviceName
        }', ${totalTime}, ${totalDistance.toFixed(1)})">
          <i class="fas fa-share"></i> مشاركة المسار
        </button>
        <button class="btn-secondary" onclick="closeNavigationModal()">
          <i class="fas fa-times"></i> إغلاق
        </button>
      </div>
    </div>
  `;
}

function showRouteOnMap(
  userLat,
  userLng,
  userStopLat,
  userStopLng,
  serviceStopLat,
  serviceStopLng,
  serviceLat,
  serviceLng
) {
  const map = maps[tabConfig[currentTab].mapId];
  if (!map) return;

  // Clear existing route but preserve all original markers
  if (routingControl) {
    map.removeControl(routingControl);
  }

  // Create waypoints for the complete route
  const waypoints = [
    L.latLng(userLat, userLng),
    L.latLng(userStopLat, userStopLng),
    L.latLng(serviceStopLat, serviceStopLng),
    L.latLng(serviceLat, serviceLng),
  ];

  routingControl = L.Routing.control({
    waypoints: waypoints,
    lineOptions: {
      styles: [{ color: "#1e40af", weight: 5, opacity: 0.9 }],
    },
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,
    createMarker: function (i, waypoint, n) {
      const icons = [
        "fas fa-user", // User location
        "fas fa-bus", // User bus stop
        "fas fa-bus", // Service bus stop
        "fas fa-map-marker-alt", // Service location
      ];

      const colors = ["#dc3545", "#28a745", "#28a745", "#007bff"];

      return L.marker(waypoint.latLng, {
        icon: L.divIcon({
          className: "custom-route-marker",
          html: `<div style="background-color: ${colors[i]}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="${icons[i]}"></i></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });
    },
  }).addTo(map);

  closeNavigationModal();
}

function closeNavigationModal() {
  const modal = document.getElementById("navigationModal");
  if (modal) {
    modal.remove();
  }
}

function hideNavigationModal() {
  closeNavigationModal();
}

// Make functions globally available
window.openNavigationGuide = openNavigationGuide;
window.closeNavigationModal = closeNavigationModal;
window.showRouteOnMap = showRouteOnMap;

// Function to share route information
function shareRoute(serviceName, totalTime, totalDistance) {
  const shareText = `🚌 دليل التنقل إلى ${serviceName}
⏱️ الوقت المتوقع: ${totalTime} دقيقة
📍 المسافة: ${totalDistance} كم
🌐 البوابة الجغرافية لمحافظة القليوبية`;

  if (navigator.share) {
    navigator
      .share({
        title: "دليل التنقل الذكي",
        text: shareText,
        url: window.location.href,
      })
      .catch(console.error);
  } else {
    // Fallback for browsers that don't support Web Share API
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          alert("تم نسخ معلومات المسار إلى الحافظة");
        })
        .catch(() => {
          showShareModal(shareText);
        });
    } else {
      showShareModal(shareText);
    }
  }
}

// Function to show share modal for browsers without clipboard API
function showShareModal(shareText) {
  const modal = document.createElement("div");
  modal.className = "share-modal";
  modal.innerHTML = `
    <div class="share-modal-content">
      <h3>مشاركة المسار</h3>
      <textarea readonly>${shareText}</textarea>
      <div class="share-actions">
        <button onclick="copyShareText('${shareText.replace(
          /'/g,
          "\\'"
        )}')">نسخ النص</button>
        <button onclick="closeShareModal()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function copyShareText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  alert("تم نسخ النص");
  closeShareModal();
}

function closeShareModal() {
  const modal = document.querySelector(".share-modal");
  if (modal) {
    modal.remove();
  }
}

// Enhanced error handling for geolocation
function handleGeolocationError(error) {
  let errorMessage = "تعذر تحديد موقعك الحالي. ";

  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage +=
        "يرجى السماح بالوصول إلى الموقع الجغرافي في إعدادات المتصفح.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage += "معلومات الموقع غير متاحة حالياً.";
      break;
    case error.TIMEOUT:
      errorMessage += "انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.";
      break;
    default:
      errorMessage += "حدث خطأ غير معروف.";
      break;
  }

  hideNavigationModal();
  alert(errorMessage);
}

// Add keyboard shortcuts for better accessibility
document.addEventListener("keydown", function (e) {
  // ESC key to close modals
  if (e.key === "Escape") {
    closeNavigationModal();
    closeShareModal();
  }

  // Ctrl+F to focus search
  if (e.ctrlKey && e.key === "f") {
    e.preventDefault();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.focus();
    }
  }
});

// Add loading state management
function setLoadingState(isLoading) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = isLoading ? "flex" : "none";
  }
}

// Enhanced initialization with better error handling
function initializeRoutingPageEnhanced() {
  try {
    setLoadingState(true);
    initializeUI();
    loadBusStopsData()
      .then(() => {
        initializeTab(currentTab);
        setupEventListeners();
        initializeAnalytics();
        setLoadingState(false);
      })
      .catch((error) => {
        console.error("خطأ في تهيئة الصفحة:", error);
        setLoadingState(false);
      });
  } catch (error) {
    console.error("خطأ في تهيئة الصفحة:", error);
    setLoadingState(false);
  }
}
