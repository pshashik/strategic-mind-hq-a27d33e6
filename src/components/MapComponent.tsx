import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCountryRisk } from "@/lib/risk-map";

interface MapComponentProps {
  countries: MapCountryRisk[];
  onSelect: (country: MapCountryRisk) => void;
  selectedCountryCode: string | null;
}

const GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson";

// Leaflet styles override to ensure tooltips look premium
const tooltipStyle = `
  .leaflet-tooltip.premium-tooltip {
    background: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 8px !important;
    color: #f8fafc !important;
    font-family: inherit !important;
    font-size: 11px !important;
    padding: 8px 12px !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
    backdrop-filter: blur(4px) !important;
    white-space: normal !important;
    max-width: 200px;
  }
  .leaflet-tooltip-pane {
    z-index: 650 !important;
  }
`;

export default function MapComponent({
  countries,
  onSelect,
  selectedCountryCode,
}: MapComponentProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    // Inject style for tooltip custom rendering
    const styleNode = document.createElement("style");
    styleNode.innerHTML = tooltipStyle;
    document.head.appendChild(styleNode);

    // Fetch GeoJSON world boundaries
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load map data");
        return res.json();
      })
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch((err) => {
        console.error("Failed to load GeoJSON world boundaries:", err);
      });

    return () => {
      document.head.removeChild(styleNode);
    };
  }, []);

  if (!geoJsonData) {
    return (
      <div className="h-[480px] w-full flex flex-col items-center justify-center bg-background/30 border border-border/40 rounded-lg text-sm text-muted-foreground">
        <span className="relative flex size-2 mb-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-primary" />
        </span>
        Loading world boundary mapping...
      </div>
    );
  }

  // Build a lookup map by ISO 3-letter code
  const riskLookup = new Map<string, MapCountryRisk>();
  for (const c of countries) {
    riskLookup.set(c.code3.toUpperCase(), c);
  }

  const getStyle = (feature: any) => {
    const code = (
      feature.properties?.iso_a3 ||
      feature.properties?.ISO_A3 ||
      feature.id ||
      ""
    )
      .toString()
      .toUpperCase();
    const cData = riskLookup.get(code);

    let color = "#334155"; // Gray for no/low risk default
    let fillOpacity = 0.2;

    if (cData && cData.articleCount > 0) {
      fillOpacity = 0.55;
      const score = cData.riskScore;
      if (score >= 7) {
        color = "#ef4444"; // Red (7-10)
      } else if (score >= 4) {
        color = "#eab308"; // Yellow (4-6)
      } else {
        color = "#10b981"; // Green (0-3)
      }
    }

    const isSelected = selectedCountryCode === cData?.code;

    return {
      fillColor: color,
      weight: isSelected ? 2 : 1,
      opacity: 0.8,
      color: isSelected ? "#f8fafc" : "#475569",
      fillOpacity: isSelected ? fillOpacity + 0.15 : fillOpacity,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const code = (
      feature.properties?.iso_a3 ||
      feature.properties?.ISO_A3 ||
      feature.id ||
      ""
    )
      .toString()
      .toUpperCase();
    const cData = riskLookup.get(code);

    // If matching country exists, bind tooltip
    const countryName = feature.properties?.name || feature.properties?.NAME || "Unknown Country";
    const riskScore = cData ? cData.riskScore : 0;
    const articleCount = cData ? cData.articleCount : 0;
    const factors = cData && cData.topRiskFactors.length > 0
      ? cData.topRiskFactors.join(", ")
      : "None";

    const tooltipContent = `
      <div style="font-family: inherit;">
        <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px;">${countryName}</div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div><span style="color: #94a3b8;">Risk Score:</span> <span style="font-weight: 600; color: ${riskScore >= 7 ? "#f87171" : riskScore >= 4 ? "#fbbf24" : "#34d399"};">${riskScore}/10</span></div>
          <div><span style="color: #94a3b8;">Article Count:</span> <span>${articleCount}</span></div>
          <div><span style="color: #94a3b8;">Risk Factors:</span> <span style="font-style: italic;">${factors}</span></div>
        </div>
      </div>
    `;

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      className: "premium-tooltip",
      direction: "auto",
      opacity: 0.95,
    });

    // Handle map clicks
    layer.on({
      click: () => {
        if (cData) {
          onSelect(cData);
        } else {
          // If a country without custom developments is clicked, provide a default object
          onSelect({
            code: code.slice(0, 2),
            code3: code,
            code2: code.slice(0, 2),
            name: countryName,
            region: feature.properties?.subregion || feature.properties?.continent || "Global",
            x: 0,
            y: 0,
            riskScore: 0,
            band: "low",
            developments: [],
            articleCount: 0,
            topRiskFactors: [],
          });
        }
      },
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.75,
          weight: 2,
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        // reset to default style
        l.setStyle(getStyle(feature));
      },
    });
  };

  return (
    <div className="h-[480px] w-full relative rounded-lg overflow-hidden border border-border/40">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1.5}
        maxZoom={8}
        style={{ height: "100%", width: "100%" }}
        className="bg-slate-950/20"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <GeoJSON
          key={selectedCountryCode || "default"}
          data={geoJsonData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
