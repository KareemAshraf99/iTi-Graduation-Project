const zoom_value = 9.5;
const [long_val, lat_val] = [31.3, 30.3];

const ul_qsims = document.querySelector(".qsims");
const liIndex = new Map();

const qalyubiaCenters = [
  "مركز القناطر الخيريه",
  "مركز طوخ",
  "مركز كفر شكر",
  "قها",
  "مركز شبين القناطر",
  "مركز الخانكه",
  "الخصوص",
  "قليوب",
  "مركز بنها",
  "قسم اول شبرا الخيمه",
  "قسم ثان شبرا الخيمه",
  "مدينه العبور",
];

const centerInfo = {
  "مركز القناطر الخيريه": { population: "120,000", area: "180 كم²" },
  "مركز طوخ": { population: "150,000", area: "200 كم²" },
  "مركز كفر شكر": { population: "100,000", area: "140 كم²" },
  قها: { population: "50,000", area: "60 كم²" },
  "مركز شبين القناطر": { population: "170,000", area: "210 كم²" },
  "مركز الخانكه": { population: "130,000", area: "190 كم²" },
  الخصوص: { population: "80,000", area: "70 كم²" },
  قليوب: { population: "90,000", area: "100 كم²" },
  "مركز بنها": { population: "200,000", area: "250 كم²" },
  "قسم اول شبرا الخيمه": { population: "110,000", area: "85 كم²" },
  "قسم ثان شبرا الخيمه": { population: "115,000", area: "90 كم²" },
  "مدينه العبور": { population: "160,000", area: "300 كم²" },
};

const normalize = (s) =>
  (s || "")
    .toString()
    .trim()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u064B-\u065F]/g, "");

qalyubiaCenters.forEach((name) => {
  const li = document.createElement("li");
  li.textContent = name;
  li.className = "qsimName";
  li.dataset.name = name;
  ul_qsims.appendChild(li);
  liIndex.set(name, li);
  liIndex.set(normalize(name), li);
});

let view,
  geojsonLayer,
  highlightHandle = null;

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GeoJSONLayer",
  "esri/Graphic",
], (Map, MapView, GeoJSONLayer) => {
  // Function to apply map styles based on CSS variables
  function applyMapStyles() {
    // Get computed style from the body element, which will reflect the data-theme
    const style = getComputedStyle(document.body);

    // Read CSS variables for map styling
    const mapFillColorRgb = style
      .getPropertyValue("--map-fill-color")
      .trim()
      .split(",")
      .map(Number);
    const mapFillOpacity = parseFloat(
      style.getPropertyValue("--map-fill-opacity").trim()
    );
    const mapOutlineColor = style
      .getPropertyValue("--map-outline-color")
      .trim();
    const mapOutlineWidth = parseFloat(
      style.getPropertyValue("--map-outline-width").trim()
    );

    // Read CSS variables for highlight options
    const accentColorHex = style.getPropertyValue("--selection-color").trim();
    const selectionFillOpacity = parseFloat(
      style.getPropertyValue("--selection-fill-opacity").trim()
    );
    const selectionHaloOpacity = parseFloat(
      style.getPropertyValue("--selection-halo-opacity").trim()
    );
    const selectionHaloColor = style
      .getPropertyValue("--selection-halo-color")
      .trim();

    // Update GeoJSONLayer renderer
    if (geojsonLayer) {
      geojsonLayer.renderer = {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [...mapFillColorRgb, mapFillOpacity],
          outline: { color: mapOutlineColor, width: mapOutlineWidth },
        },
      };
    }

    // Update MapView highlight options
    if (view) {
      view.highlightOptions = {
        color: accentColorHex,
        fillOpacity: selectionFillOpacity,
        haloOpacity: selectionHaloOpacity,
        haloColor: selectionHaloColor,
      };
    }
  }

  // Initial setup of geojsonLayer and map (without direct styling)
  geojsonLayer = new GeoJSONLayer({
    url: "geo_data/qsim.geojson",
    outFields: ["*"],
    // Renderer will be set by applyMapStyles initially and on theme change
  });

  const map = new Map({
    basemap: "gray-vector",
    layers: [geojsonLayer],
  });

  view = new MapView({
    container: "viewDiv",
    map,
    center: [long_val, lat_val],
    zoom: zoom_value,
    // Highlight options will be set by applyMapStyles initially and on theme change
  });

  // Apply initial styles immediately after view is created
  applyMapStyles();

  // --- Theme Change Observer ---
  // Create a MutationObserver to watch for changes to the data-theme attribute on the body
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "data-theme"
      ) {
        applyMapStyles(); // Reapply styles when data-theme changes
      }
    });
  });

  // Start observing the body for attribute changes
  observer.observe(document.body, { attributes: true });
  // --- End Theme Change Observer ---

  view.ui.components = ["attribution"];

  ["mouse-wheel", "double-click", "pinch"].forEach((evt) =>
    view.on(evt, (e) => e.stopPropagation())
  );
  view.on("double-click", ["Control"], (e) => e.stopPropagation());
  view.on("drag", (e) => e.button === 2 && e.stopPropagation());
  view.on(
    "key-down",
    (e) => ["+", "-", "Shift", "_", "="].includes(e.key) && e.stopPropagation()
  );

  function showCenter(rawName, feature = null) {
    const norm = normalize(rawName);

    const realName =
      qalyubiaCenters.find((n) => {
        const normN = normalize(n);
        return normN === norm || normN.includes(norm) || norm.includes(normN);
      }) || rawName;

    document
      .querySelectorAll(".qsimName")
      .forEach((el) => el.classList.remove("active"));
    const li = liIndex.get(normalize(realName));
    if (li) {
      li.classList.add("active");
      li.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const matchedKey = Object.keys(centerInfo).find(
      (k) => normalize(k) === normalize(realName)
    );
    const infoBox = document.getElementById("infoBox");
    if (matchedKey) {
      const { population, area } = centerInfo[matchedKey];

      const currentLang = localStorage.getItem("lang") || "ar";
      const getTranslation = (key, fallbackAr = "", fallbackEn = "") => {
        if (
          typeof translations !== "undefined" &&
          currentLang === "en" &&
          translations.en &&
          translations.en[key]
        ) {
          return translations.en[key];
        }
        return currentLang === "ar" ? fallbackAr : fallbackEn;
      };

      const translatedName = getTranslation(realName, realName, realName);
      const populationLabel = getTranslation(
        "map_population_label",
        "عدد السكان:",
        "Population:"
      );
      const areaLabel = getTranslation("map_area_label", "المساحة:", "Area:");
      const populationUnit = getTranslation(
        "map_population_unit",
        "نسمة",
        "residents"
      );

      infoBox.innerHTML = `
        <h3>${translatedName}</h3>
        <p>${populationLabel} <strong>${population}</strong> ${populationUnit}</p>
        <p>${areaLabel} <strong>${area}</strong></p>
      `;
    } else {
      const noDataMessage = getTranslation(
        "map_no_data_available",
        "لا توجد بيانات متوفرة لهذا المركز",
        "No data available for this center"
      );
      infoBox.innerHTML = `<p>${noDataMessage}</p>`;
    }

    if (feature) {
      view.goTo({
        target: feature.geometry.extent.expand(1.2),
        duration: 1000,
      });
      if (highlightHandle) highlightHandle.remove();
      view.whenLayerView(geojsonLayer).then((lv) => {
        highlightHandle = lv.highlight(feature);
      });
    }
  }

  view.whenLayerView(geojsonLayer).then((layerView) => {
    geojsonLayer.queryFeatures().then((res) => {
      const features = res.features;

      document.querySelectorAll(".qsimName").forEach((li) => {
        const name = li.dataset.name;
        const match = features.find(
          (f) => normalize(f.attributes.SEC_NAME) === normalize(name)
        );
        if (match) li.addEventListener("click", () => showCenter(name, match));
      });

      view.on("click", (evt) => {
        view.hitTest(evt).then((hit) => {
          const fr = hit.results.find((r) => r.graphic.layer === geojsonLayer);
          if (fr && fr.graphic.attributes.SEC_NAME) {
            const rawName = fr.graphic.attributes.SEC_NAME;

            const norm = normalize(rawName);
            const realName =
              qalyubiaCenters.find((n) => {
                const normN = normalize(n);
                return (
                  normN === norm || normN.includes(norm) || norm.includes(normN)
                );
              }) || rawName;

            showCenter(realName, fr.graphic);
          } else {
            if (highlightHandle) highlightHandle.remove();
            highlightHandle = null;
            view.goTo({ center: [long_val, lat_val], zoom: zoom_value });
            document
              .querySelectorAll(".qsimName")
              .forEach((el) => el.classList.remove("active"));

            const currentLang = localStorage.getItem("lang") || "ar";
            const getTranslation = (key, fallbackAr = "", fallbackEn = "") => {
              if (
                typeof translations !== "undefined" &&
                currentLang === "en" &&
                translations.en &&
                translations.en[key]
              ) {
                return translations.en[key];
              }
              return currentLang === "ar" ? fallbackAr : fallbackEn;
            };

            const defaultMessage = getTranslation(
              "map_click_instruction",
              "اضغط على مركز لعرض التفاصيل",
              "Click on a center to view details"
            );
            document.getElementById(
              "infoBox"
            ).innerHTML = `<p>${defaultMessage}</p>`;
          }
        });
      });
    });
  });
});

// Function to update map display when language changes
window.updateMapLanguage = function () {
  // Update the default message in infoBox if it's showing the default text
  const infoBox = document.getElementById("infoBox");
  if (
    (infoBox && infoBox.textContent.includes("اضغط على مركز")) ||
    infoBox.textContent.includes("Click on a center")
  ) {
    const currentLang = localStorage.getItem("lang") || "ar";
    const getTranslation = (key, fallbackAr = "", fallbackEn = "") => {
      if (
        typeof translations !== "undefined" &&
        currentLang === "en" &&
        translations.en &&
        translations.en[key]
      ) {
        return translations.en[key];
      }
      return currentLang === "ar" ? fallbackAr : fallbackEn;
    };

    const defaultMessage = getTranslation(
      "map_click_instruction",
      "اضغط على مركز لعرض التفاصيل",
      "Click on a center to view details"
    );
    infoBox.innerHTML = `<p>${defaultMessage}</p>`;
  }
};
