export interface TipoDestinatario {
  id:          number;
  nombre:      string;
  descripcion: string;
  activo:      boolean;
}

export interface NoticiaDestinatario {
  id?:              number;
  noticiaId?:       number;
  tipoId:           number;
  valor?:           string | null;
  usuarioRefId?:    number | null;
  habitacionRefId?: number | null;
  tipo?:            TipoDestinatario;
}

export interface Noticia {
  id?:                 number;
  titulo:              string;
  descripcion:         string;
  imagen?:             string;
  seccionId:           number;
  usuarioId?:          number;
  publicadoPor?:       string;
  autorizadoPor?:      string;
  fechaAutorizacion?:  string;
  rolCreador?:         string;
  estado:              string;
  prioridad?:          'NORMAL' | 'URGENTE' | 'DESTACADA' | string;
  activo?:             boolean;
  fechaPublicacion?:   string;
  fechaActualizacion?: string;
  totalLecturas?:      number;
  leida?:              boolean;
  destinatarios?:      NoticiaDestinatario[];
}