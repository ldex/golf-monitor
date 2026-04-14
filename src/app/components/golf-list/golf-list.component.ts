import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { GolfService, Golf } from '../../services/golf.service';

@Component({
  selector: 'app-golf-list',
  standalone: true,
  imports: [],
  template: `
    <div class="golf-list-container">
      <div class="controls">
        <h2>Golfs du Québec</h2>

        <div class="control-buttons">
          <button (click)="refresh()" [disabled]="isLoading()">
            {{ isLoading() ? '⟳ Actualisation...' : '🔄 Actualiser' }}
          </button>
        </div>

        <div class="filters">
          <label>
            Trier par:
            <select (change)="changeSortBy($event)">
              <option value="date">Date d'ouverture</option>
              <option value="name">Nom du golf</option>
              <option value="region">Région</option>
            </select>
          </label>

          <label>
            Région:
            <select (change)="changeRegion($event)">
              <option value="">Tous les golfs</option>
              @for (region of regions(); track region) {
                <option [value]="region">
                  {{ region }}
                </option>
              }
            </select>
          </label>
        </div>

        <div class="checkbox-filter">
          <label>
            <input
              type="checkbox"
              (change)="toggleHideUndetermined()"
              [checked]="hideUndetermined()"
            />
            Masquer les golfs sans date d'ouverture
          </label>
        </div>
      </div>

      <div class="golfs-grid">
        @if (displayedGolfs().length === 0) {
          <div class="no-golfs">
            <p>{{ isLoading() ? 'Chargement...' : 'Aucun golf trouvé' }}</p>
          </div>
        }

        @for (golf of displayedGolfs(); track golf.id) {
          <div class="golf-card">
            <div class="golf-header">
              <h3>{{ golf.name }}</h3>
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
              @if (golf.coordinates) {
                <div class="coordinates">
                  <strong>Localisation:</strong>
                  {{ golf.coordinates.lat.toFixed(4) }}, {{ golf.coordinates.lng.toFixed(4) }}
                </div>
              }
            </div>
            <div class="golf-footer">
              <small>Mis à jour: {{ formatDate(golf.scrapedAt) }}</small>
            </div>
          </div>
        }
      </div>

      <div class="total-count">
        Total: <strong>{{ displayedGolfs().length }}</strong> golf(s)
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

      .checkbox-filter input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .golfs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
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
        justify-content: space-between;
        align-items: flex-start;
      }

      .golf-header h3 {
        margin: 0;
        font-size: 1.1rem;
        flex: 1;
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

      .coordinates {
        color: #666;
        font-size: 0.9rem;
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

  isLoading = signal(false);
  sortBy = signal<'date' | 'name' | 'region'>('date');
  selectedRegion = signal('');
  hideUndetermined = signal(false);

  regions = computed(() => this.golfService.getRegions());
  displayedGolfs = computed(() => {
    let golfs = this.golfService.getCurrentGolfs();

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

  ngOnInit() {
    this.golfService.loading$.subscribe((loading) => {
      this.isLoading.set(loading);
    });

    this.golfService.loadRegions().subscribe();
    this.golfService.loadGolfs().subscribe();
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
      const dateOuverture = this.parseFrenchDate(dateString + ' 2026');
      const aujourdhui = new Date();
      return dateOuverture.getTime() <= aujourdhui.getTime();
    } catch {
      return false;
    }
  }

  displayOuverture(dateString: string): string {
    try {
      if (dateString === 'À déterminer') {
        return 'Ouverture à déterminer';
      }
      const dateOuverture = this.parseFrenchDate(dateString + ' 2026');
      const aujourdhui = new Date();

      if (dateOuverture.getTime() === aujourdhui.getTime()) {
        return "Ouvre aujourd'hui !";
      } else if (dateOuverture < aujourdhui) {
        return 'Ouvert depuis le ' + dateString;
      } else {
        return 'Ouverture prévue le ' + dateString;
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
}
