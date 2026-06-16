// ─── Solicitud de registro ────────────────────────────────────────────────────
export interface Solicitud {
  id?:        number;
  nombre:     string;
  apellidos?: string;
  email:      string;
  genero?:    string;
  facultad?:  string;
  seleccion?: string;
  habitacion?: string;
  edificio?:  string;
  mensaje?:   string;
  foto?:      string;   // ← URL de la foto del solicitante
  estado?:    'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt?: string;
}

// ─── Sección ──────────────────────────────────────────────────────────────────
export interface Seccion {
  id?:          number;
  nombre:       string;
  slug?:        string;
  descripcion?: string;
  activo?:      boolean;
}

// ─── Edificio ─────────────────────────────────────────────────────────────────
export interface Edificio {
  id?:         number;
  nombre:      string;
  numPlantas?: number;
  activo?:     boolean;
  createdAt?:  string;
  updatedAt?:  string;
}

// ─── Habitación ───────────────────────────────────────────────────────────────
export interface Habitacion {
  id?:         number;
  numero:      string;
  piso?:       number;
  edificioId?: number;
  activo?:     boolean;
}