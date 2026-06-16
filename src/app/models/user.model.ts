export interface HabitacionResumen {
  id:          number;
  numero:      string;
  piso?:       number;
  edificioId?: number;
}

export interface User {
  id?:           number;
  nombre:        string;
  apellidos?:    string;
  email:         string;
  password?:     string;
  rol:           string;
  rolNombre?:    string;
  habitacionId?: number;
  habitacion?:   HabitacionResumen;
  edificioId?:   number;
  genero?:       string;
  seleccion?:    string;
  facultad?:     string;
  foto?:         string;
  activo?:       boolean;
  createdAt?:    string;
  deletedAt?:    string;
}

export interface LoginRequest { email: string; password: string; }
export interface AuthResponse { token: string; user: User; }