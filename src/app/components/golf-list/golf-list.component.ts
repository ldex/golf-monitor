import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';

import { GolfService, Golf } from '../../services/golf.service';

@Component({
  selector: 'app-golf-list',
  imports: [],
  template: `
    <div class="golf-list-container">

      <div class="golfs-section">
        @if (favoriteGolfs().length > 0) {
          <div class="favorites-section">
            <h3 class="section-title">⭐ Favoris ({{ favoriteGolfs().length }})</h3>
            <div class="golfs-grid">
              @for (golf of favoriteGolfs(); track golf.id) {
                <div class="golf-card">
                  <div class="golf-header">
                    <div class="golf-header-title">
                      <h3>{{ golf.name }}</h3>
                      <button class="star-btn favorite" (click)="toggleFavorite(golf.id)" title="Retirer des favoris">
                        ⭐
                      </button>
                    </div>
                    <span class="region-badge">{{ golf.region }}</span>
                  </div>
                  <div class="golf-body">
                    <div
                      class="opening-date"
                      [class.undetermined]="golf.openingDate === 'À déterminer'"
                      [class.opened]="isOpened(golf.openingDate)"
                    >
                      <strong>{{ displayOuverture(golf.openingDate) }}</strong>
                    </div>
                    @if (golf.name && golf.region) {
                      <div class="map-link">
                        <a href="{{ displayMapLink(golf) }}" target="_blank" rel="noopener noreferrer">
                          Ouvrir dans Google Maps
                        </a>
                      </div>
                    }
                  </div>
                  <div class="golf-footer">
                    <small>Mis à jour: {{ formatDate(golf.scrapedAt) }}</small>
                  </div>
                </div>
              }
            </div>
          </div>
        }

      <div class="controls">
        <h3 class="section-title">
          @if(favoriteGolfs().length > 0)
            {Autres golfs}
          @else {Golfs du Québec, saison 2026}
          ({{ otherGolfs().length }})</h3>

        <!-- <div class="control-buttons">
          <button (click)="refresh()" [disabled]="isLoading()">
            {{ isLoading() ? '⟳ Actualisation...' : '🔄 Actualiser' }}
          </button>
        </div> -->

        <div class="filters">
          <label>
            Trier par:
            <select (change)="changeSortBy($event)">
              <option value="date">Date d'ouverture</option>
              <option value="name">Nom du golf</option>
            </select>
          </label>

          <label>
            Région:
            <select #regionSelect (change)="changeRegion($event)" [value]="selectedRegion()">
              <option value="">Tous les golfs</option>
              @for (region of regions(); track region) {
                <option [value]="region" [selected]="region === selectedRegion()">
                  {{ region }}
                </option>
              }
            </select>
          </label>
          <div class="checkbox-filter">
              <label class="inline-checkbox">
                <input
                  type="checkbox"
                  (change)="toggleHideUndetermined()"
                  [checked]="hideUndetermined()"
                />
                Masquer les golfs sans date d'ouverture
              </label>
              </div>
        </div>
      </div>

        @if (otherGolfs().length > 0) {
          <div class="other-section">
            <div class="golfs-grid">
              @for (golf of otherGolfs(); track golf.id) {
                <div class="golf-card">
                  <div class="golf-header">
                    <div class="golf-header-title">
                      <h3>{{ golf.name }}</h3>
                      <button class="star-btn" (click)="toggleFavorite(golf.id)" title="Ajouter aux favoris">
                        ☆
                      </button>
                    </div>
                    <span class="region-badge">{{ golf.region }}</span>
                  </div>
                  <div class="golf-body">
                    <div
                      class="opening-date"
                      [class.undetermined]="golf.openingDate === 'À déterminer'"
                      [class.opened]="isOpened(golf.openingDate)"
                    >
                      <strong>{{ displayOuverture(golf.openingDate) }}</strong>
                    </div>
                    @if (golf.name && golf.region) {
                      <div class="map-link">
                        <a href="{{ displayMapLink(golf) }}" target="_blank" rel="noopener noreferrer">
                          Ouvrir dans Google Maps
                        </a>
                      </div>
                    }
                  </div>
                  <div class="golf-footer">
                    <small>Mis à jour: {{ formatDate(golf.scrapedAt) }}</small>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (displayedGolfs().length === 0) {
          <div class="no-golfs">
            <p>{{ isLoading() ? 'Chargement...' : 'Aucun golf trouvé' }}</p>
          </div>
        }
      </div>

      <div class="total-count">
        Total: <strong>{{ displayedGolfs().length }}</strong> golf@if (displayedGolfs().length > 1) {s}
      </div>
    </div>
  `,
  styles: [
    `
      .golf-list-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .controls {
        margin-bottom: 2rem;
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
      }

      .controls h2 {
        margin: 0 0 1rem 0;
        color: #333;
      }

      .control-buttons {
        margin-bottom: 1rem;
      }

      .control-buttons button {
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.3s;
      }

      .control-buttons button:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .control-buttons button:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .filters {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .filters label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-weight: 600;
        color: #666;
      }

      .filters select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
        background: white;
      }

      .checkbox-filter {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #ddd;
      }

      .checkbox-filter label {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #666;
        cursor: pointer;
      }

      .golfs-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .favorites-section {
        background: #fffbeb;
        padding: 1.5rem;
        border-radius: 8px;
        border-left: 4px solid #fbbf24;
      }

      .other-section {
        flex: 1;
      }

      .section-title {
        margin: 0 0 1.5rem 0;
        color: #333;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .section-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .section-header .section-title {
        margin: 0;
      }

      .inline-checkbox {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #666;
        cursor: pointer;
        white-space: nowrap;
      }

      .inline-checkbox input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .golfs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 0;
      }

      .golf-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .golf-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .golf-header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .golf-header-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }

      .golf-header h3 {
        margin: 0;
        font-size: 1.1rem;
        flex: 1;
      }

      .star-btn {
        background: none;
        border: none;
        font-size: 1.3rem;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.8;
        transition: opacity 0.2s, transform 0.2s;
        flex-shrink: 0;
      }

      .star-btn:hover {
        opacity: 1;
        transform: scale(1.15);
      }

      .star-btn.favorite {
        opacity: 1;
      }

      .region-badge {
        background: rgba(255, 255, 255, 0.3);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      .golf-body {
        padding: 1rem;
      }

      .golf-body > div {
        margin-bottom: 0.75rem;
      }

      .golf-body > div:last-child {
        margin-bottom: 0;
      }

      .opening-date {
        font-size: 1.05rem;
        color: #ffb811;
        font-weight: 500;
      }

      .opening-date.opened {
        color: #059669;
        opacity: 0.7;
      }

      .opening-date.undetermined {
        color: #999;
        opacity: 0.7;
      }

      .map-link a {
        color: #2563eb;
        background-color: #0369a11a;
        text-decoration: none;
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background-color 0.3s, color 0.3s;
      }

      .map-link a:hover {
        color: #1d4ed8;
        background-color: #0369a133;

      }

      .golf-footer {
        background: #f9fafb;
        padding: 0.75rem 1rem;
        border-top: 1px solid #eee;
        color: #999;
      }

      .no-golfs {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #999;
      }

      .total-count {
        text-align: center;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 4px;
        color: #0369a1;
        font-weight: 500;
      }

      @media (max-width: 768px) {
        .filters {
          grid-template-columns: 1fr;
        }

        .golfs-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class GolfListComponent implements OnInit {
  private golfService = inject(GolfService);
  private readonly REGION_STORAGE_KEY = 'selectedGolfRegion';
  private readonly FAVORITES_STORAGE_KEY = 'golfFavorites';

  currentYear = new Date().getFullYear();
  isLoading = signal(false);
  sortBy = signal<'date' | 'name' | 'region'>('date');
  selectedRegion = signal('');
  hideUndetermined = signal(true);
  golfs = signal<Golf[]>([]);
  favoriteIds = signal<Set<string>>(new Set());

  regions = signal<string[]>([]);

  displayedGolfs = computed(() => {
    let golfs = this.golfs();

    // Filter by region if selected
    if (this.selectedRegion()) {
      golfs = golfs.filter((g) => g.region === this.selectedRegion());
    }

    // Filter out undetermined dates if checkbox is checked
    if (this.hideUndetermined()) {
      golfs = golfs.filter((g) => g.openingDate !== 'À déterminer');
    }

    // Apply sorting to the filtered list
    return this.golfService.sortGolfs(this.sortBy(), golfs);
  });

  // Favorites filtered by region only (ignores hideUndetermined)
  favoriteGolfs = computed(() => {
    let golfs = this.golfs();

    // Filter to only favorites
    golfs = golfs.filter((g) => this.favoriteIds().has(g.id));

    // Apply sorting to the filtered list
    return this.golfService.sortGolfs(this.sortBy(), golfs);
  });

  otherGolfs = computed(() => {
    return this.displayedGolfs().filter((g) => !this.favoriteIds().has(g.id));
  });

  ngOnInit() {
    // Load saved region from localStorage
    const savedRegion = localStorage.getItem(this.REGION_STORAGE_KEY);
    if (savedRegion) {
      this.selectedRegion.set(savedRegion);
    }

    // Load saved favorites from localStorage
    this.loadFavorites();

    this.golfService.loading$.subscribe((loading) => {
      this.isLoading.set(loading);
    });

    this.golfService.golfs$.subscribe((golfs) => {
      this.golfs.set(golfs);
    });

    this.golfService.loadRegions().subscribe(
      (regions) => {
        this.regions.set(regions);
      }
    );
  }

  refresh() {
    this.golfService.refreshGolfs().subscribe();
  }

  changeSortBy(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'date' | 'name' | 'region';
    this.sortBy.set(value);
  }

  changeRegion(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRegion.set(value);
    // Save to localStorage
    if (value) {
      localStorage.setItem(this.REGION_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(this.REGION_STORAGE_KEY);
    }
  }

  toggleHideUndetermined() {
    this.hideUndetermined.set(!this.hideUndetermined());
  }

  /**
   * Convertit une chaîne type "12 avril 2026" en objet Date
   */
  parseFrenchDate(dateStr: string): Date {
    // Utilisation d'un Record pour typer l'objet des mois
    const months: Record<string, number> = {
      janvier: 0,
      février: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      août: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      décembre: 11,
    };

    const parts = dateStr.toLowerCase().split(/\s+/); // Gère aussi les espaces multiples

    if (parts.length < 3) {
      throw new Error("Format de date invalide. Attendu: 'jour mois année'");
    }

    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);

    const monthIndex = months[monthName];

    // Vérification que le mois existe dans notre dictionnaire
    if (monthIndex === undefined) {
      throw new Error(`Mois non reconnu : ${monthName}`);
    }

    return new Date(year, monthIndex, day);
  }

  isOpened(dateString: string): boolean {
    try {
      if (dateString === 'À déterminer') {
        return false;
      }
      const dateOuverture = this.parseFrenchDate(dateString + ' ' + this.currentYear);
      const aujourdhui = new Date();
      return dateOuverture.getTime() <= aujourdhui.getTime();
    } catch {
      return false;
    }
  }

  displayMapLink(golf: Golf): string {
     return `https://www.google.com/maps/search/?api=1&query=${golf.name.replace(/\s+/g, '+')},+${golf.region.replace(/\s+/g, '+')},+Québec,+Canada&query_place_id=${golf.id}`;
  }

  displayOuverture(dateString: string): string {
    try {
      if (dateString === 'À déterminer') {
        return 'Ouverture à déterminer';
      }

      const aujourdhui = new Date();
      const dateOuverture = this.parseFrenchDate(dateString + ' ' + aujourdhui.getFullYear());

      if (dateOuverture.getTime() === aujourdhui.getTime()) {
        return "Ouvre aujourd'hui !";
      } else if (dateOuverture < aujourdhui) {
        return 'Ouvert depuis le ' + dateString + ' ' + aujourdhui.getFullYear();
      } else {
        return 'Ouverture prévue le ' + dateString + ' ' + aujourdhui.getFullYear();
      }
    } catch {
      return 'Date non détectée';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-CA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Load favorites from localStorage
   */
  loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.FAVORITES_STORAGE_KEY);
      if (stored) {
        const favoriteArray = JSON.parse(stored);
        this.favoriteIds.set(new Set(favoriteArray));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites(): void {
    try {
      const favoriteArray = Array.from(this.favoriteIds());
      localStorage.setItem(this.FAVORITES_STORAGE_KEY, JSON.stringify(favoriteArray));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  /**
   * Toggle favorite status for a golf
   */
  toggleFavorite(golfId: string): void {
    const current = new Set(this.favoriteIds());
    if (current.has(golfId)) {
      current.delete(golfId);
    } else {
      current.add(golfId);
    }
    this.favoriteIds.set(current);
    this.saveFavorites();
  }

  /**
   * Check if a golf is favorite
   */
  isFavorite(golfId: string): boolean {
    return this.favoriteIds().has(golfId);
  }
}
