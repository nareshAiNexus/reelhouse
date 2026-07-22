export interface AudioTrack {
  idTrack: string;
  idAlbum: string;
  idArtist: string;
  strTrack: string;
  strAlbum: string;
  strArtist: string;
  strTrackThumb?: string | null;
  intDuration?: string | null;
  strGenre?: string | null;
  intTrackNumber?: string | null;
}

export interface AudioAlbum {
  idAlbum: string;
  idArtist: string;
  strAlbum: string;
  strArtist: string;
  intYearReleased: string;
  strStyle?: string | null;
  strGenre?: string | null;
  strAlbumThumb?: string | null;
  strDescriptionEN?: string | null;
}

export interface AudioArtist {
  idArtist: string;
  strArtist: string;
  strGenre?: string | null;
  strBiographyEN?: string | null;
  strArtistThumb?: string | null;
  strArtistLogo?: string | null;
}
