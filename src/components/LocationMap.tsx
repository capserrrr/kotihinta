"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = divIcon({
  className: "",
  html: `
    <span style="position:relative;display:block;width:18px;height:18px;">
      <span style="position:absolute;inset:-7px;border-radius:9999px;background:var(--accent);opacity:0.2;"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:var(--accent);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></span>
    </span>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface Props {
  lat: number;
  lon: number;
}

export default function LocationMap({ lat, lon }: Props) {
  return (
    <MapContainer
      key={`${lat}-${lon}`}
      center={[lat, lon]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
      />
      <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
      <Marker position={[lat, lon]} icon={markerIcon} />
    </MapContainer>
  );
}
