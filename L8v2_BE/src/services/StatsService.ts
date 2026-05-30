import { StatsRepository } from '../repositories/StatsRepository';

export interface SiteStats {
  eventCount: number;
  venueCount: number;
  bookableArtistCount: number;
  genreCount: number;
  totalEventArtists: number;
}

export class StatsService {
  private statsRepository: StatsRepository;

  constructor() {
    this.statsRepository = new StatsRepository();
  }

  /** Runs the five aggregate counts in parallel (preserving the original behaviour). */
  async getStats(): Promise<SiteStats> {
    const [eventCount, venueCount, bookableArtistCount, genreCount, totalEventArtists] = await Promise.all([
      this.statsRepository.countEvents(),
      this.statsRepository.countVenues(),
      this.statsRepository.countBookableArtists(),
      this.statsRepository.countDistinctGenres(),
      this.statsRepository.countEventArtists(),
    ]);

    return { eventCount, venueCount, bookableArtistCount, genreCount, totalEventArtists };
  }
}
