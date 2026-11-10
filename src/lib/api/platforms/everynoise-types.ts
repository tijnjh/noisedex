export interface Genre {
  genreName: string;
  positioning: Positioning;
  style: Style;
  preview: Preview;
  elementId: string;
  href: string;
}

export interface GenreMeta {
  genreName: string;
  style?: Style;
  artists: Artist[];
  links: Link[];
  relatedGenres: Genre[];
}

export interface Link {
  text: string;
  href: string;
}

export interface Artist {
  artistName: string;
  positioning: Positioning;
  style: Style;
  preview: Preview;
  elementId: string;
  href: string;
  id: string;
}

export interface ArtistMeta extends Artist {
  genres: string[];
}

export interface Preview {
  url: string;
  title: string;
  trackId: string;
}

export interface Style {
  color: string;
  fontSize: string;
}

export interface Positioning {
  top: number;
  left: number;
}
