import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Solicitud } from '../models/solicitud.model';

export interface HabitacionDisponibilidad {
  id:         number;
  numero:     string;
  piso:       number;
  edificioId: number;
  pendientes: number;
  capacidad:  number;
  disponible: boolean;
  estado:     'Libre' | '1 plaza ocupada' | 'Completa';
}

export interface EstadoEmail {
  tieneCuenta:    boolean;
  tienePendiente: boolean;
  mensaje:        string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private api = environment.apiSolicitudUrl;

  constructor(private http: HttpClient) {}

  enviar(s: Solicitud): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.api, s);
  }

  enviarConFoto(fd: FormData): Observable<any> {
    return this.http.post<any>(`${this.api}/con-foto`, fd);
  }

  obtenerTodas(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(this.api);
  }

  obtenerPendientes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.api}/pendientes`);
  }

  aprobar(id: number, adminId?: number): Observable<any> {
    const params = adminId ? `?adminId=${adminId}` : '';
    return this.http.put(`${this.api}/${id}/aprobar${params}`, {});
  }

  rechazar(id: number, adminId?: number): Observable<any> {
    const params = adminId ? `?adminId=${adminId}` : '';
    return this.http.put(`${this.api}/${id}/rechazar${params}`, {});
  }

  disponibilidadPorEdificio(edificioId: number): Observable<HabitacionDisponibilidad[]> {
    return this.http.get<HabitacionDisponibilidad[]>(
      `${this.api}/disponibilidad/${edificioId}`
    );
  }

  estadoEmail(email: string): Observable<EstadoEmail> {
    return this.http.get<EstadoEmail>(
      `${this.api}/estado-email?email=${encodeURIComponent(email)}`
    );
  }

  fotoUrl(ruta?: string | null): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    return 'http://localhost:9090' + ruta + '?t=' + Date.now();
  }
}