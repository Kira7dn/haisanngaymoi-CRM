export interface Location {
  lat: number;
  lng: number;
}

export interface Station {
  id: number;
  name: string;
  image?: string;
  address: string;
  location: Location;
  createdAt?: Date;
  updatedAt?: Date;
}
