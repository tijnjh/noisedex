import * as isa from "itunes-store-api";
import type {
  ResultAlbum,
  ResultMusicArtist,
  ResultMusicTrack,
} from "itunes-store-api";

// what a `lookup id, entity: song` call can return: the collection itself
// (when the id is an album) followed by its songs
export type ItunesLookupResult = ResultAlbum | ResultMusicTrack;

/**
 * The iTunes port: the only operations noisedex needs from the store api.
 * Adapters: `directItunes` (calls itunes from wherever it runs) and the
 * server-fn proxy in `#lib/api/platforms/itunes` (for ios).
 */
export interface ItunesClient {
  /** looks up an album or track id, including songs on that album */
  lookupWithSongs(id: number): Promise<ItunesLookupResult[]>;
  searchArtists(term: string): Promise<ResultMusicArtist[]>;
  lookupArtistAlbums(artistId: number): Promise<ResultAlbum[]>;
}

export const directItunes: ItunesClient = {
  async lookupWithSongs(id) {
    const response = await isa.lookup("id", id, {
      media: "music",
      entity: "song",
    });
    return response.results as ItunesLookupResult[];
  },

  async searchArtists(term) {
    const response = await isa.search(term, {
      media: "music",
      entity: "musicArtist",
    });
    return response.results;
  },

  async lookupArtistAlbums(artistId) {
    const response = await isa.lookup("id", artistId, {
      media: "music",
      entity: "album",
    });
    // the first result is the artist itself
    return response.results.filter(
      (result): result is ResultAlbum => result.wrapperType === "collection",
    );
  },
};
