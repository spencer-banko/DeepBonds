"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import statesTopoJson from "us-atlas/states-10m.json";
import type { CityCluster } from "@/lib/data/map";

const MAX_RADIUS = 22;
const MIN_RADIUS = 5;

export function MapView({ clusters }: { clusters: CityCluster[] }) {
  const [active, setActive] = useState<CityCluster | null>(null);
  const maxCount = Math.max(1, ...clusters.map((c) => c.count));

  function radiusFor(count: number) {
    return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(count / maxCount);
  }

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full">
        <Geographies geography={statesTopoJson as unknown as string}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={0.75}
              />
            ))
          }
        </Geographies>

        {clusters.map((cluster) => (
          <Marker
            key={`${cluster.city}-${cluster.state}`}
            coordinates={[cluster.lng, cluster.lat]}
            onMouseEnter={() => setActive(cluster)}
            onMouseLeave={() => setActive(null)}
          >
            <circle
              r={radiusFor(cluster.count)}
              fill="var(--brand)"
              fillOpacity={0.65}
              stroke="var(--brand)"
              strokeWidth={1}
              className="cursor-pointer"
            />
          </Marker>
        ))}
      </ComposableMap>

      {active && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-[var(--border)] bg-surface px-4 py-3 text-sm shadow-lg">
          <p className="font-medium">
            {active.city}, {active.state}
          </p>
          <p className="text-muted">
            {active.count} alum{active.count === 1 ? "" : "ni"} ·{" "}
            {active.companies.slice(0, 3).join(", ")}
            {active.companies.length > 3 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
