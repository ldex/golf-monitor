import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Golf {
  id: string;
  name: string;
  openingDate: string;
  region: string;
  coordinates: { lat: number; lng: number } | null;
  url?: string;
  scrapedAt: string;
}

export interface GolfsResponse {
  count: number;
  lastScrapedAt: string | null;
  data: Golf[];
}

@Injectable({
  providedIn: 'root'
})
export class GolfService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private golfsSubject = new BehaviorSubject<Golf[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private regionsSubject = new BehaviorSubject<string[]>([]);

  golfs$ = this.golfsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  regions$ = this.regionsSubject.asObservable();

  constructor() {
    this.loadGolfs().subscribe();
    this.loadRegions().subscribe();

    // Auto-refresh every 15 minutes
    interval(15 * 60 * 1000)
      .pipe(switchMap(() => this.refreshGolfs()))
      .subscribe();
  }

  /**
   * Load golfs from backend
   */
  loadGolfs(sort: string = 'date', filter?: string) {
    this.loadingSubject.next(true);
    let url = `${this.apiUrl}/golfs?sort=${sort}`;
    if (filter) {
      url += `&filter=${encodeURIComponent(filter)}`;
    }

    return this.http.get<GolfsResponse>(url)
      .pipe(
        tap((response) => {
          this.golfsSubject.next(response.data);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          console.error('Error loading golfs:', error);
          this.loadingSubject.next(false);
          // Try to load mock data or cached data
          return of({ count: 0, lastScrapedAt: null, data: [] });
        })
      );
  }

  /**
   * Refresh golfs from backend
   */
  refreshGolfs() {
    this.loadingSubject.next(true);
    return this.http.post<{
      message: string;
      count: number;
      lastScrapedAt: string;
    }>(`${this.apiUrl}/refresh`, {})
      .pipe(
        tap(() => {
          // Reload the list
          this.loadGolfs().subscribe();
        }),
        catchError((error) => {
          console.error('Error refreshing golfs:', error);
          this.loadingSubject.next(false);
          return of(null);
        })
      );
  }

  /**
   * Load regions
   */
  loadRegions() {
    return this.http.get<string[]>(`${this.apiUrl}/golfs/regions`)
      .pipe(
        tap((regions) => {
          this.regionsSubject.next(regions);
        }),
        catchError((error) => {
          console.error('Error loading regions:', error);
          return of([]);
        })
      );
  }

  /**
   * Get current golfs
   */
  getCurrentGolfs(): Golf[] {
    return this.golfsSubject.value;
  }

  /**
   * Filter golfs by region
   */
  filterByRegion(region: string): Golf[] {
    if (!region) return this.golfsSubject.value;
    return this.golfsSubject.value.filter(g => g.region === region);
  }

  /**
   * Sort golfs
   */
  sortGolfs(sortBy: 'date' | 'name' | 'region', golfs?: Golf[]): Golf[] {
    const golfsList = golfs ? [...golfs] : [...this.golfsSubject.value];

    if (sortBy === 'date') {
      golfsList.sort((a, b) => {
        const parseDate = (str: string): number => {
          if (!str || str === 'À déterminer') return new Date(3000, 0, 0).getTime();
          const months: { [key: string]: number } = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
          };
          const parts = str.toLowerCase().split(/\s+/);
          const day = parseInt(parts[0]) || 1;
          const monthName = parts[1];
          const month = months[monthName] ?? 0;
          const year = parseInt(parts[2]) || 2026;
          return new Date(year, month, day).getTime();
        };
        return parseDate(a.openingDate) - parseDate(b.openingDate);
      });
    } else if (sortBy === 'name') {
      golfsList.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    } else if (sortBy === 'region') {
      golfsList.sort((a, b) => a.region.localeCompare(b.region, 'fr'));
    }

    return golfsList;
  }
}
