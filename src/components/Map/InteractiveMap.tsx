'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Crosshair, Trash2, MapPin } from 'lucide-react';
import { NetworkNode, NetworkLink, MapStyleMode, NodeType } from '@/types/network';
import { MAP_STYLES, ARGENTINA_CENTER, ARGENTINA_DEFAULT_ZOOM } from '@/data/mockNodes';
import { useNetworkCentral } from '@/context/NetworkCentralContext';

// Configure MapLibre Worker URL explicitly for Next.js / Turbopack environment
if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/lib/maplibre/maplibre-gl-worker.mjs');
  if (maplibregl.config) {
    maplibregl.config.WORKER_URL = '/lib/maplibre/maplibre-gl-worker.mjs';
  }
}

interface InteractiveMapProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  selectedNode: NetworkNode | null;
  onSelectNode: (node: NetworkNode | null) => void;
  currentStyle: MapStyleMode;
  targetCoords?: { coords: [number, number]; zoom?: number; pitch?: number; timestamp: number } | null;
}

const TYPE_COLORS: Record<NodeType, string> = {
  submarine_cable: '#00f2fe',
  datacenter: '#a855f7',
  core_backbone: '#3b82f6',
  '5g_tower': '#f59e0b',
  energy_hub: '#10b981'
};

const TYPE_GRADIENTS: Record<NodeType, { light: string; main: string; dark: string }> = {
  submarine_cable: { light: '#cffafe', main: '#00f2fe', dark: '#0369a1' },
  datacenter: { light: '#f3e8ff', main: '#c084fc', dark: '#7e22ce' },
  core_backbone: { light: '#dbeafe', main: '#38bdf8', dark: '#1d4ed8' },
  '5g_tower': { light: '#fef3c7', main: '#fbbf24', dark: '#b45309' },
  energy_hub: { light: '#d1fae5', main: '#34d399', dark: '#047857' }
};

function createNeonPinSVG(nodeId: string, nodeType: NodeType, nodeColor: string): string {
  const grad = TYPE_GRADIENTS[nodeType] || { light: '#ffffff', main: nodeColor, dark: '#0f172a' };
  const safeId = nodeId.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `
    <svg class="node-marker-svg" viewBox="0 0 32 44" width="30" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pin-grad-${safeId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad.light}" stop-opacity="0.95" />
          <stop offset="42%" stop-color="${grad.main}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${grad.dark}" stop-opacity="1" />
        </linearGradient>
      </defs>
      
      <!-- Main Teardrop Pin Body with Centered Cutout Hole -->
      <path
        d="M 16 43 L 3.77 23.79 A 14.5 14.5 0 1 1 28.23 23.79 L 16 43 Z M 16 9.75 A 6.25 6.25 0 1 0 16 22.25 A 6.25 6.25 0 1 0 16 9.75 Z"
        fill="url(#pin-grad-${safeId})"
        fill-rule="evenodd"
        stroke="rgba(255, 255, 255, 0.85)"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      
      <!-- 3D Shadow Facet (matching reference image) -->
      <path
        d="M 16 22.25 L 16 43 L 28.23 23.79 C 24.8 24.2 19.8 23.6 16 22.25 Z"
        fill="rgba(0, 0, 0, 0.28)"
      />
      
      <!-- Glossy Specular Highlight Crescent (matching reference image) -->
      <path
        d="M 12 5 A 13.5 13.5 0 0 1 27 18"
        stroke="#ffffff"
        stroke-width="2"
        stroke-linecap="round"
        stroke-opacity="0.75"
      />
      
      <!-- Center Hole Rim Glow -->
      <circle
        cx="16"
        cy="16"
        r="6.25"
        fill="none"
        stroke="rgba(255, 255, 255, 0.65)"
        stroke-width="1.2"
      />
    </svg>
  `;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  nodes,
  links,
  selectedNode,
  onSelectNode,
  currentStyle,
  targetCoords,
}) => {
  const {
    isPickingLocation,
    setIsPickingLocation,
    pickedCoords,
    setPickedCoords,
    setIsWizardOpen
  } = useNetworkCentral();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const pickedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markersEpoch, setMarkersEpoch] = useState(0);

  // Helper to construct GeoJSON for links
  const createLinksGeoJSON = useCallback((): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
    return {
      type: 'FeatureCollection',
      features: links.map((link) => ({
        type: 'Feature',
        properties: {
          id: link.id,
          sourceName: link.sourceName,
          targetName: link.targetName,
          capacity: link.capacity,
          latency: link.latency,
          type: link.type,
          status: link.status,
          isSubmarine: link.type === 'submarine' ? 1 : 0
        },
        geometry: {
          type: 'LineString',
          coordinates: link.coordinates
        }
      }))
    };
  }, [links]);

  // Helper to construct GeoJSON for nodes (native WebGL vector point layers)
  const createNodesGeoJSON = useCallback((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    return {
      type: 'FeatureCollection',
      features: nodes.map((node) => ({
        type: 'Feature',
        properties: {
          id: node.id,
          name: node.name,
          city: node.city,
          province: node.province,
          capacity: node.capacity,
          latency: node.latency,
          type: node.type,
          color: TYPE_COLORS[node.type] || '#00f2fe'
        },
        geometry: {
          type: 'Point',
          coordinates: node.coordinates
        }
      }))
    };
  }, [nodes]);

  // Setup layers for lines, glows, and nodes
  const addNetworkLayers = useCallback((map: maplibregl.Map) => {
    const linksGeoData = createLinksGeoJSON();
    const nodesGeoData = createNodesGeoJSON();

    // 1. Source: Network Links
    if (!map.getSource('network-links')) {
      map.addSource('network-links', {
        type: 'geojson',
        data: linksGeoData
      });
    } else {
      (map.getSource('network-links') as maplibregl.GeoJSONSource).setData(linksGeoData);
    }

    // 2. Source: Network Nodes (native vector layer)
    if (!map.getSource('network-nodes')) {
      map.addSource('network-nodes', {
        type: 'geojson',
        data: nodesGeoData
      });
    } else {
      (map.getSource('network-nodes') as maplibregl.GeoJSONSource).setData(nodesGeoData);
    }

    // Outer Glow Layer for Fiber Links
    if (!map.getLayer('network-links-glow')) {
      map.addLayer({
        id: 'network-links-glow',
        type: 'line',
        source: 'network-links',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'submarine', '#00f2fe',
            'primary_fiber', '#38bdf8',
            'secondary_fiber', '#818cf8',
            '#00f2fe'
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            3, 3,
            8, 8,
            12, 12
          ],
          'line-opacity': 0.45,
          'line-blur': 4
        }
      });
    }

    // Core Solid/Dashed Line Layer
    if (!map.getLayer('network-links-core')) {
      map.addLayer({
        id: 'network-links-core',
        type: 'line',
        source: 'network-links',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'submarine', '#00f2fe',
            'primary_fiber', '#60a5fa',
            'secondary_fiber', '#c084fc',
            '#ffffff'
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            3, 1.5,
            8, 3,
            12, 4
          ],
          'line-opacity': 0.95,
          'line-dasharray': [
            'match',
            ['get', 'type'],
            'submarine', ['literal', [2, 1.5]],
            'secondary_fiber', ['literal', [1.5, 2]],
            ['literal', [1, 0]]
          ]
        }
      });
    }

    // Interactive hover & click on lines
    map.on('mouseenter', 'network-links-core', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      if (!e.features || !e.features[0]) return;
      const props = e.features[0].properties;
      if (!props) return;

      const coordinates = e.lngLat;
      const typeLabel = props.type === 'submarine' ? '🌊 Cable Submarino' : '⚡ Troncal Fibra Óptica';

      if (!popupRef.current) {
        popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      }

      popupRef.current
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family: inherit; font-size: 11px;">
            <div style="font-weight: 700; color: #00f2fe; margin-bottom: 2px;">${typeLabel}</div>
            <div style="font-weight: 600; color: #fff; font-size: 12px;">${props.sourceName} ⇄ ${props.targetName}</div>
            <div style="color: #94a3b8; margin-top: 4px; display: flex; gap: 8px;">
              <span>Capacidad: <b style="color: #fff;">${props.capacity}</b></span>
              <span>Latencia: <b style="color: #10b981;">${props.latency} ms</b></span>
            </div>
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'network-links-core', () => {
      map.getCanvas().style.cursor = '';
      if (popupRef.current) {
        popupRef.current.remove();
      }
    });

    // 3. City Labels Layer for Nodes (shows cleanly when zooming closer)
    if (!map.getLayer('network-nodes-labels')) {
      map.addLayer({
        id: 'network-nodes-labels',
        type: 'symbol',
        source: 'network-nodes',
        minzoom: 7.5,
        layout: {
          'text-field': '{city}',
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            7.5, 10,
            10, 13
          ],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#060911',
          'text-halo-width': 2
        }
      });
    }

    // 1. Sanitize standard vector tile labels (Replace Falkland -> Islas Malvinas)
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach((layer) => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          try {
            map.setLayoutProperty(layer.id, 'text-field', [
              'case',
              ['in', 'falkland', ['downcase', ['coalesce', ['get', 'name_en'], ['get', 'name'], '']]],
              'ISLAS MALVINAS',
              ['in', 'malvinas', ['downcase', ['coalesce', ['get', 'name_en'], ['get', 'name'], '']]],
              'ISLAS MALVINAS',
              ['coalesce', ['get', 'name_es'], ['get', 'name_en'], ['get', 'name']]
            ]);
          } catch {
            // Safe fallback for complex formatted text layers
          }
        }
      });
    }

    // 2. Add dedicated prominent label layer for Islas Malvinas
    if (!map.getSource('malvinas-geo-label')) {
      map.addSource('malvinas-geo-label', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'ISLAS MALVINAS',
                subtitle: '(ARGENTINA)'
              },
              geometry: {
                type: 'Point',
                coordinates: [-59.2, -51.75]
              }
            }
          ]
        }
      });
    }

    if (!map.getLayer('malvinas-geo-label-layer')) {
      map.addLayer({
        id: 'malvinas-geo-label-layer',
        type: 'symbol',
        source: 'malvinas-geo-label',
        layout: {
          'text-field': '{name}\n{subtitle}',
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            3, 10,
            6, 13,
            9, 16
          ],
          'text-letter-spacing': 0.12,
          'text-transform': 'uppercase',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#00f2fe',
          'text-halo-color': 'rgba(6, 9, 17, 0.95)',
          'text-halo-width': 2.5
        }
      });
    }
  }, [createLinksGeoJSON, createNodesGeoJSON]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl('/lib/maplibre/maplibre-gl-worker.mjs');
    if (maplibregl.config) {
      maplibregl.config.WORKER_URL = '/lib/maplibre/maplibre-gl-worker.mjs';
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].url,
      center: ARGENTINA_CENTER,
      zoom: ARGENTINA_DEFAULT_ZOOM,
      pitch: 28,
      bearing: 0,
      maxBounds: [
        [-90, -65], // Southwest
        [-40, -15]  // Northeast
      ]
    });

    map.on('error', (e) => {
      console.warn('MapLibre event warning:', e);
    });

    // Add navigation controls (zoom, compass, pitch)
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true
      }),
      'bottom-right'
    );

    map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

    // Función para calcular y actualizar escala proporcional de los punteros según el nivel de zoom
    const updateMarkerScale = () => {
      const currentMap = mapRef.current || map;
      const container = mapContainerRef.current;
      if (!currentMap || !container) return;

      const zoom = currentMap.getZoom();
      let scale = 0.22;
      if (zoom <= 3.0) {
        scale = 0.22;
      } else if (zoom >= 11.0) {
        scale = 1.15;
      } else if (zoom <= 9.0) {
        const t = (zoom - 3.0) / 6.0;
        const smoothT = t * t * (3 - 2 * t);
        scale = 0.22 + smoothT * 0.78;
      } else {
        const t = (zoom - 9.0) / 2.0;
        scale = 1.00 + t * 0.15;
      }

      const scaleStr = scale.toFixed(3);
      container.style.setProperty('--map-marker-scale', scaleStr);
      document.documentElement.style.setProperty('--map-marker-scale', scaleStr);
    };

    map.on('load', () => {
      setMapLoaded(true);
      addNetworkLayers(map);
      updateMarkerScale();
    });

    map.on('zoom', updateMarkerScale);
    map.on('move', updateMarkerScale);

    mapRef.current = map;
    updateMarkerScale();

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // Update map style when currentStyle changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const newStyleUrl = MAP_STYLES[currentStyle].url;
    
    // Style change listener
    const onStyleData = () => {
      if (map.isStyleLoaded()) {
        addNetworkLayers(map);
        // Clear all markers from cache so they are cleanly re-added to the new style DOM
        Object.keys(markersRef.current).forEach(id => {
          try { markersRef.current[id].remove(); } catch {}
          delete markersRef.current[id];
        });
        setMarkersEpoch(e => e + 1);
      }
    };

    map.once('style.load', onStyleData);
    map.setStyle(newStyleUrl);

    return () => {
      map.off('style.load', onStyleData);
    };
  }, [currentStyle, addNetworkLayers]);

  // Update GeoJSON data when nodes, links or mapLoaded change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getSource('network-nodes')) {
      (map.getSource('network-nodes') as maplibregl.GeoJSONSource).setData(createNodesGeoJSON());
    }
    if (map.getSource('network-links')) {
      (map.getSource('network-links') as maplibregl.GeoJSONSource).setData(createLinksGeoJSON());
    } else {
      addNetworkLayers(map);
    }
  }, [mapLoaded, nodes, links, createNodesGeoJSON, createLinksGeoJSON, addNetworkLayers]);

  // Update Markers for filtered nodes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers not in current nodes list
    const currentNodeIds = new Set(nodes.map(n => n.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentNodeIds.has(id)) {
        try { markersRef.current[id].remove(); } catch {}
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const nodeColor = TYPE_COLORS[node.type];

      let marker = markersRef.current[node.id];
      const isAttached = marker && marker.getElement() && marker.getElement().isConnected;

      if (!marker || !isAttached) {
        if (marker) {
          try { marker.remove(); } catch {}
        }

        // Create custom HTML element with neon teardrop pin structure
        const el = document.createElement('div');
        el.className = `node-marker-anchor node-marker-wrapper ${isSelected ? 'selected' : ''}`;
        el.dataset.nodeId = node.id;
        el.style.color = nodeColor;

        el.innerHTML = `
          <div class="node-marker-scaler">
            <div class="node-marker-ground-pulse"></div>
            <div class="node-marker-ground-dot"></div>
            <div class="node-marker-pin">
              ${createNeonPinSVG(node.id, node.type, nodeColor)}
            </div>
          </div>
        `;

        // Hover tooltip popup - positioned above the pin
        const markerPopup = new maplibregl.Popup({
          offset: [0, -36],
          closeButton: false,
          closeOnClick: false
        }).setHTML(`
          <div style="font-family: inherit; font-size: 11px; min-width: 140px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${nodeColor};"></span>
              <span style="font-weight: 700; color: #fff; font-size: 12px;">${node.city}</span>
            </div>
            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 4px;">${node.name}</div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; font-size: 10px;">
              <span style="color: #00f2fe; font-weight: 600;">${node.province}</span>
              <span style="color: #10b981; font-weight: 600;">${node.inventory?.length || 0} materiales</span>
            </div>
          </div>
        `);

        el.addEventListener('mouseenter', () => {
          const currentZoom = map.getZoom();
          let currentScale = 0.22;
          if (currentZoom <= 3.0) currentScale = 0.22;
          else if (currentZoom >= 11.0) currentScale = 1.15;
          else if (currentZoom <= 9.0) {
            const t = (currentZoom - 3.0) / 6.0;
            const smoothT = t * t * (3 - 2 * t);
            currentScale = 0.22 + smoothT * 0.78;
          } else {
            currentScale = 1.00 + ((currentZoom - 9.0) / 2.0) * 0.15;
          }

          const hoverScale = Math.max(currentScale * 1.5, 0.88);
          markerPopup.setOffset([0, -Math.round(44 * hoverScale + 4)]);
          markerPopup.setLngLat(node.coordinates).addTo(map);
        });

        el.addEventListener('mouseleave', () => {
          markerPopup.remove();
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectNode(node);
          map.flyTo({
            center: node.coordinates,
            zoom: Math.max(map.getZoom(), 7.5),
            pitch: 45,
            bearing: 15,
            speed: 1.2,
            curve: 1.4,
            essential: true
          });
        });

        marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(node.coordinates)
          .addTo(map);

        markersRef.current[node.id] = marker;
      } else {
        // Update selection class
        const el = marker.getElement();
        if (isSelected) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      }
    });
  }, [nodes, selectedNode, onSelectNode, markersEpoch]);

  // Handle external flyTo requests (e.g. from sidebar or reset button)
  useEffect(() => {
    if (!targetCoords || !mapRef.current) return;
    mapRef.current.flyTo({
      center: targetCoords.coords,
      zoom: targetCoords.zoom ?? 7.5,
      pitch: targetCoords.pitch ?? 45,
      bearing: 15,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });
  }, [targetCoords]);

  // Handle picking location mode clicks on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isPickingLocation) {
      map.getCanvas().style.cursor = 'crosshair';

      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        const lng = Number(e.lngLat.lng.toFixed(5));
        const lat = Number(e.lngLat.lat.toFixed(5));
        setPickedCoords([lng, lat]);
        setIsPickingLocation(false);
        setIsWizardOpen(true);
      };

      map.on('click', handleMapClick);

      return () => {
        map.off('click', handleMapClick);
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      };
    } else {
      map.getCanvas().style.cursor = '';
    }
  }, [isPickingLocation, setPickedCoords, setIsPickingLocation, setIsWizardOpen]);

  // Handle temporary visual marker for picked coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pickedCoords) {
      if (!pickedMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'node-marker-anchor picked-location-marker';
        el.style.color = '#00f2fe';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.title = 'Punto seleccionado. Haga clic para completar información o descartar.';
        el.onclick = (e) => {
          e.stopPropagation();
          setIsWizardOpen(true);
        };
        el.innerHTML = `
          <div class="node-marker-scaler">
            <div class="node-marker-ground-pulse" style="animation-duration: 1.2s; border-color: #00f2fe; width: 24px; height: 10px;"></div>
            <div class="node-marker-ground-dot" style="background: #00f2fe; box-shadow: 0 0 10px #00f2fe;"></div>
            <div class="node-marker-pin" style="animation: pin-bounce 1.4s ease-in-out infinite;">
              ${createNeonPinSVG('picked-location', 'submarine_cable', '#00f2fe')}
            </div>
          </div>
        `;
        pickedMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(pickedCoords)
          .addTo(map);
      } else {
        pickedMarkerRef.current.setLngLat(pickedCoords);
      }
    } else {
      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.remove();
        pickedMarkerRef.current = null;
      }
    }
  }, [pickedCoords]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Floating Mode Banner when picking location on map */}
      {isPickingLocation && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'rgba(11, 16, 28, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid #00f2fe',
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.35)',
          borderRadius: '14px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 242, 254, 0.4)'
            }}>
              <Crosshair size={18} color="#00f2fe" />
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
                Modo Selección en Mapa Activo
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                Haga clic en cualquier punto del territorio argentino para capturar sus coordenadas exactas.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsPickingLocation(false);
              setIsWizardOpen(true);
            }}
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
            }}
          >
            Cancelar Selección
          </button>
        </div>
      )}

      {/* Floating Banner when a temporary location is picked on the map */}
      {pickedCoords && !isPickingLocation && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'rgba(11, 16, 28, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 242, 254, 0.5)',
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.35)',
          borderRadius: '14px',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00f2fe',
              boxShadow: '0 0 10px #00f2fe',
              animation: 'pulse 1.5s infinite'
            }} />
            <div>
              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
                Punto marcado sin guardar
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                [{pickedCoords[1].toFixed(4)}°, {pickedCoords[0].toFixed(4)}°]
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsWizardOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #0099ff 100%)',
                color: '#060911',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 10px rgba(0, 242, 254, 0.3)'
              }}
            >
              <MapPin size={13} />
              <span>Completar Información</span>
            </button>
            <button
              onClick={() => setPickedCoords(null)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={13} />
              <span>Borrar Punto</span>
            </button>
          </div>
        </div>
      )}
      {/* Background map container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          background: '#060911'
        }}
      />

      {/* Subtle cyberpunk radar sweep overlay */}
      <div className="radar-scan" />

      {/* Latency & Coordinate status tag at bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 10,
        background: 'rgba(11, 16, 28, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '11px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00f2fe' }}></span>
          <span style={{ color: '#cbd5e1' }}>Sistema MapLibre GL v5</span>
        </div>
        <span>•</span>
        <span>Cartografía Vectorial Oficial</span>
      </div>
    </div>
  );
};
