import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TilokMap({
  latitude = 0.4738,
  longitude = 101.3826,
  radius = 100, // 100 meters geofencing radius
  userDistance = 14, // 14 meters away
  locationName = 'Gedung Instalasi RSJ Tampan - Pekanbaru',
}) {
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [mapZoom, setMapZoom] = useState(16);

  // Generate self-contained Leaflet HTML with OpenStreetMap tiles & exact geofence circle
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .pulse-dot {
      width: 14px;
      height: 14px;
      background: #0284c7;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.4);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(2, 132, 199, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 11.5px;
      padding: 2px 4px;
    }
    .custom-label {
      background: rgba(15, 23, 42, 0.9);
      color: #38bdf8;
      border: 1px solid #0284c7;
      border-radius: 6px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .leaflet-control-zoom a {
      font-size: 14px !important;
      line-height: 24px !important;
      width: 26px !important;
      height: 26px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const center = [${latitude}, ${longitude}];
    const map = L.map('map', {
      center: center,
      zoom: ${mapZoom},
      zoomControl: true,
      attributionControl: true
    });

    // OpenStreetMap Tile Layer (Jl. HR. Soebrantas, RSJ Tampan, Pekanbaru)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; Leaflet | OpenStreetMap'
    }).addTo(map);

    // Red / Pink Geofencing Radius Circle (sesuai tampilan SIAP RSJ Tampan asli)
    const radiusCircle = L.circle(center, {
      color: '#e11d48',
      fillColor: '#f43f5e',
      fillOpacity: 0.28,
      weight: 2.5,
      radius: ${currentRadius}
    }).addTo(map);

    // Titik Lokasi Resmi (Tilok) RS Jiwa Tampan
    const tilokMarker = L.marker(center).addTo(map);
    tilokMarker.bindPopup("<b>RS Jiwa Tampan</b><br>Titik Lokasi (Tilok) Absensi Pegawai").openPopup();

    // User Current GPS Location (berada di dalam radius Tilok 14m)
    const userPos = [${latitude + 0.0001}, ${longitude - 0.00008}];
    const userIcon = L.divIcon({
      className: 'user-marker-wrap',
      html: '<div class="pulse-dot"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    const userMarker = L.marker(userPos, { icon: userIcon }).addTo(map);
    userMarker.bindTooltip("Posisi Anda (${userDistance}m)", {
      permanent: true,
      direction: 'top',
      className: 'custom-label'
    });
  </script>
</body>
</html>
  `.trim();

  return (
    <View style={mapStyles.container}>
      {/* Header Info Peta & Tilok */}
      <View style={mapStyles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Text style={{ fontSize: 16 }}>📍</Text>
          <View>
            <Text style={mapStyles.title}>Peta Tilok & Radius Presensi</Text>
            <Text style={mapStyles.subTitle}>RS Jiwa Tampan - Pekanbaru</Text>
          </View>
        </View>
        <View style={mapStyles.badgeRadius}>
          <Text style={mapStyles.badgeRadiusText}>Radius: {currentRadius}m</Text>
        </View>
      </View>

      {/* Interactive Leaflet Map Container */}
      <View style={mapStyles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`map-${currentRadius}-${mapZoom}`}
            title="Peta Radius Tilok RSJ Tampan"
            srcDoc={leafletHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 12,
            }}
          />
        ) : (
          <View style={mapStyles.fallbackMap}>
            <Text style={{ fontSize: 36 }}>🗺️</Text>
            <Text style={mapStyles.fallbackText}>Peta Tilok RSJ Tampan</Text>
            <Text style={mapStyles.fallbackSub}>Koordinat: {latitude}° N, {longitude}° E</Text>
          </View>
        )}

        {/* Legend Overlay on Top-Right */}
        <View style={mapStyles.legendBox}>
          <View style={mapStyles.legendItem}>
            <View style={mapStyles.legendCircleRed} />
            <Text style={mapStyles.legendText}>Radius Tilok</Text>
          </View>
          <View style={mapStyles.legendItem}>
            <View style={mapStyles.legendDotBlue} />
            <Text style={mapStyles.legendText}>Posisi Anda ({userDistance}m)</Text>
          </View>
        </View>
      </View>

      {/* Geofence Status Indicator */}
      <View style={mapStyles.statusCard}>
        <View style={mapStyles.statusLeft}>
          <View style={mapStyles.validIconWrap}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mapStyles.statusTitle}>Radius Tilok Terverifikasi (Valid)</Text>
            <Text style={mapStyles.statusDesc}>
              Jarak ke titik pusat: <Text style={{ fontWeight: '800', color: '#047857' }}>{userDistance} meter</Text> (Maks: {currentRadius}m)
            </Text>
          </View>
        </View>

        {/* Radius Selector Options */}
        <View style={mapStyles.radiusChips}>
          {[50, 100, 150].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setCurrentRadius(r)}
              style={[
                mapStyles.chip,
                currentRadius === r && mapStyles.chipActive,
              ]}
            >
              <Text
                style={[
                  mapStyles.chipText,
                  currentRadius === r && mapStyles.chipTextActive,
                ]}
              >
                {r}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Koordinat & Akurasi GPS */}
      <View style={mapStyles.coordsRow}>
        <Text style={mapStyles.coordText}>
          📍 Koordinat: {latitude}° N, {longitude}° E
        </Text>
        <Text style={mapStyles.accuracyText}>Akurasi GPS: ±4m</Text>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 16px -4px rgba(0, 0, 0, 0.08)',
        }
      : { elevation: 3 }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  badgeRadius: {
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fda4af',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeRadiusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#e11d48',
  },
  mapFrame: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  fallbackMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  fallbackSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  legendBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    gap: 4,
    zIndex: 1000,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }
      : {}),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCircleRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#e11d48',
    backgroundColor: 'rgba(244, 63, 94, 0.35)',
  },
  legendDotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
  },
  legendText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
  },
  statusCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  validIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  statusDesc: {
    fontSize: 10.5,
    color: '#047857',
    marginTop: 1,
  },
  radiusChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  coordText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  accuracyText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
  },
});
