import { memo, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCountryRisk } from "@/lib/risk-map";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

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
  .leaflet-container {
    background: hsl(var(--background));
  }
  .leaflet-tooltip-pane {
    z-index: 650 !important;
  }
`;

type CountryFeature = Feature<Geometry, Record<string, unknown>>;

function featureCode(feature: CountryFeature): string {
  const props = feature.properties ?? {};
  return String(
    props.iso_a3 ??
      props.ISO_A3 ??
      props.ADM0_A3 ??
      props["ISO3166-1-Alpha-3"] ??
      props["Alpha-3"] ??
      feature.id ??
      "",
  ).toUpperCase();
}

function featureName(feature: CountryFeature): string {
  const props = feature.properties ?? {};
  return String(props.name ?? props.NAME ?? props.ADMIN ?? props.name_long ?? "Unknown Country");
}

function featureRegion(feature: CountryFeature): string {
  const props = feature.properties ?? {};
  return String(props.subregion ?? props.SUBREGION ?? props.continent ?? props.CONTINENT ?? "Global");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function riskFillColor(country?: MapCountryRisk): string {
  if (!country || country.articleCount === 0) return "#64748b";
  if (country.riskScore >= 7) return "#ef4444";
  if (country.riskScore >= 4) return "#eab308";
  return "#10b981";
}

function MapComponent({
  countries,
  onSelect,
  selectedCountryCode,
}: MapComponentProps) {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);

  const riskLookup = useMemo(() => {
    const lookup = new Map<string, MapCountryRisk>();
    for (const country of countries) {
      lookup.set(country.code3.toUpperCase(), country);
    }
    return lookup;
  }, [countries]);

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
      .then((data: FeatureCollection) => {
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

  const getStyle = (feature?: CountryFeature): PathOptions => {
    const cData = feature ? riskLookup.get(featureCode(feature)) : undefined;
    const hasData = !!cData && cData.articleCount > 0;
    const isSelected = !!cData && selectedCountryCode === cData.code;
    const fillOpacity = hasData ? 0.62 : 0.26;

    return {
      fillColor: riskFillColor(cData),
      weight: isSelected ? 2 : 0.75,
      opacity: isSelected ? 1 : 0.75,
      color: isSelected ? "#f8fafc" : "#334155",
      fillOpacity: isSelected ? Math.min(fillOpacity + 0.16, 0.86) : fillOpacity,
    };
  };

  const onEachFeature = (feature: CountryFeature, layer: Layer) => {
    const code = featureCode(feature);
    const cData = riskLookup.get(code);
    const countryName = cData?.name ?? featureName(feature);
    const riskScore = cData ? cData.riskScore : 0;
    const articleCount = cData ? cData.articleCount : 0;
    const factors = cData && cData.topRiskFactors.length > 0
      ? cData.topRiskFactors.join(", ")
      : "None";
    const latestHeadline = cData?.latestHeadline || "No matching feed headline";
    const riskColor = riskScore >= 7 ? "#f87171" : riskScore >= 4 ? "#fbbf24" : "#34d399";

    const tooltipContent = `
      <div style="font-family: inherit;">
        <div style="font-weight: 700; font-size: 12px; margin-bottom: 5px;">${escapeHtml(countryName)}</div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div><span style="color: #94a3b8;">Risk Score:</span> <span style="font-weight: 700; color: ${riskColor};">${riskScore}/10</span></div>
          <div><span style="color: #94a3b8;">Article Count:</span> <span>${articleCount}</span></div>
          <div><span style="color: #94a3b8;">Top Risk Factors:</span> <span>${escapeHtml(factors)}</span></div>
          <div><span style="color: #94a3b8;">Latest Headline:</span> <span>${escapeHtml(latestHeadline)}</span></div>
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
          onSelect({
            code: code.slice(0, 2),
            code3: code,
            name: countryName,
            region: featureRegion(feature),
            x: 0,
            y: 0,
            riskScore: 0,
            band: "low",
            developments: [],
            articleCount: 0,
            topRiskFactors: [],
            latestHeadline: "",
            rawScore: 0,
          });
        }
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: cData?.articleCount ? 0.82 : 0.38,
          weight: 2,
        });
      },
      mouseout: (e) => {
        const l = e.target;
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
        <GeoJSON key={selectedCountryCode || "default"} data={geoJsonData} style={getStyle} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}

export default memo(MapComponent);
