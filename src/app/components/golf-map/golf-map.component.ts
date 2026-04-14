import { Component, OnInit, inject, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GolfService, Golf } from '../../services/golf.service';

// Leaflet types
declare const L: any;

@Component({
  selector: 'app-golf-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div class="map-header">
        <h2>Carte des golfs</h2>
        <div class="map-info">
          <p>{{ golfs().length }} golfs avec localisation</p>
        </div>
      </div>
      <div #mapElement class="map" id="golf-map"></div>
    </div>
  `,
  styles: [`
    .map-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .map-header {
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #ddd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .map-header h2 {
      margin: 0;
      color: #333;
    }

    .map-info {
      color: #666;
      margin-top: 0.5rem;
    }

    .map-info p {
      margin: 0;
      font-size: 0.9rem;
    }

    .map {
      flex: 1;
      border: none;
    }

    :global(.leaflet-container) {
      font-family: system-ui, -apple-system, sans-serif;
    }

    :global(.golf-marker-icon) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    :global(.golf-popup) {
      font-family: system-ui, -apple-system, sans-serif;
    }

    :global(.golf-popup-content) {
      padding: 0.5rem 0;
    }

    :global(.golf-popup-name) {
      font-weight: 600;
      font-size: 1.05rem;
      color: #333;
    }

    :global(.golf-popup-region) {
      color: #666;
      font-size: 0.9rem;
    }

    :global(.golf-popup-date) {
      color: #059669;
      font-weight: 500;
      margin-top: 0.25rem;
    }
  `]
})
export class GolfMapComponent implements OnInit, AfterViewInit {
  private golfService = inject(GolfService);
  private map: any = null;
  private markers: any[] = [];

  golfs = signal<Golf[]>([]);

  ngOnInit() {
    this.golfService.golfs$.subscribe(golfs => {
      this.golfs.set(golfs);
      if (this.map) {
        this.updateMarkers();
      }
    });
  }

  ngAfterViewInit() {
    // Wait for Leaflet to be loaded
    const waitForLeaflet = setInterval(() => {
      if (typeof L !== 'undefined') {
        clearInterval(waitForLeaflet);
        this.initMap();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(waitForLeaflet);
      if (typeof L === 'undefined') {
        console.error('Leaflet failed to load');
      }
    }, 5000);
  }

  private initMap() {
    // Initialize map centered on Quebec
    this.map = L.map('golf-map').setView([46.8139, -71.2080], 6);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Fix Leaflet default icon issue
    const DefaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.setIcon(DefaultIcon);

    this.updateMarkers();
  }

  private updateMarkers() {
    if (!this.map) return;

    // Remove old markers
    this.markers.forEach(marker => {
      this.map?.removeLayer(marker);
    });
    this.markers = [];

    // Add new markers
    this.golfs().forEach(golf => {
      if (golf.coordinates) {
        const marker = L.marker(
          [golf.coordinates.lat, golf.coordinates.lng],
          {
            title: golf.name
          }
        );

        const popupContent = `
          <div class="golf-popup-content">
            <div class="golf-popup-name">${golf.name}</div>
            <div class="golf-popup-region">${golf.region}</div>
            <div class="golf-popup-date">📅 ${golf.openingDate}</div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(this.map!);
        this.markers.push(marker);
      }
    });

    // Fit bounds if markers exist
    if (this.markers.length > 0) {
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }
}
