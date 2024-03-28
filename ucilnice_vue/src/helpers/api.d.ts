// Reservations

export interface ReservationsApiReservationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiReservation[];
}

export interface ReservationsApiReservation {
  reason: string;
  start: string;
  end: string;
  owners: any[];
  reservables: number[];
  requirements: any[];
  id: number;
}

// Classrooms

export interface ReservationsApiClassroomsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiClassroom[];
}

export interface ReservationsApiClassroom {
  id: number;
  slug: string;
  type: string;
  name: string;
  nresources_set: ReservationsApiNresourcesSet[];
}

export interface ReservationsApiNresourcesSet {
  id: number;
  resource: ReservationsApiResource;
  n: number;
}

export interface ReservationsApiResource {
  id: number;
  slug: string;
  type: string;
  name: string;
}

// Teachers

export interface ReservationsApiTeachersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiTeacher[];
}

export interface ReservationsApiTeacher {
  id: number;
  slug: string;
  type: string;
  name: string;
  nresources_set: any[];
}
