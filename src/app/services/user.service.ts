import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

// ── Interfaces exportadas ─────────────────────────────────────────────────────

export interface ValoresFiltro {
  facultades:  string[];
  generos:     string[];
  selecciones: string[];
}

export interface Edificio {
  id?:        number;
  nombre:     string;
  numPlantas: number;
  activo:     boolean;
}

export interface Habitacion {
  id:         number;
  numero:     string;
  piso:       number;
  edificioId: number;
  activo:     boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly api = environment.apiUserUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/listar`, { headers: this.getHeaders() });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  createUser(u: any): Observable<any> {
    return this.http.post(`${this.api}/crear`, u, { headers: this.getHeaders() });
  }

  updateUser(id: number, u: any): Observable<any> {
    return this.http.put(`${this.api}/actualizar/${id}`, u, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${id}`, { headers: this.getHeaders() });
  }

  desactivarUser(id: number): Observable<any> {
    return this.http.patch(`${this.api}/desactivar/${id}`, {}, { headers: this.getHeaders() });
  }

  /**
   * Activa o desactiva la cuenta de un estudiante.
   * Usa el mismo patrón que desactivarUser pero con estado explícito.
   * Endpoint: PATCH /api/users/estado/{id}?estado=ACTIVO|INACTIVO
   *
   * Si tu backend usa body en vez de query param, cambia a:
   *   this.http.patch(`${this.api}/estado/${id}`, { estado }, ...)
   */
  cambiarEstadoUsuario(id: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<any> {
    return this.http.patch(
      `${this.api}/estado/${id}`,
      { estado },
      { headers: this.getHeaders() }
    );
  }

  // ── Perfil (multipart con foto) ───────────────────────────────────────────

  actualizarPerfil(id: number, fd: FormData): Observable<User> {
    return this.http.put<User>(
      `${this.api}/perfil/${id}`,
      fd,
      { headers: this.getAuthHeaders() }
    );
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  getValoresFiltro(): Observable<ValoresFiltro> {
    return this.http.get<ValoresFiltro>(`${this.api}/valores-filtro`, { headers: this.getHeaders() });
  }

  // ── Edificios ─────────────────────────────────────────────────────────────

  getEdificios(): Observable<Edificio[]> {
    return this.http.get<Edificio[]>(`${this.api}/edificios`, { headers: this.getHeaders() });
  }

  todosEdificios(): Observable<Edificio[]> {
    return this.http.get<Edificio[]>(`${this.api}/edificios/todos`, { headers: this.getHeaders() });
  }

  crearEdificio(e: Partial<Edificio>): Observable<Edificio> {
    return this.http.post<Edificio>(`${this.api}/edificios`, e, { headers: this.getHeaders() });
  }

  actualizarEdificio(id: number, e: Partial<Edificio>): Observable<Edificio> {
    return this.http.put<Edificio>(`${this.api}/edificios/${id}`, e, { headers: this.getHeaders() });
  }

  toggleEdificio(id: number): Observable<Edificio> {
    return this.http.patch<Edificio>(`${this.api}/edificios/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  // ── Habitaciones ──────────────────────────────────────────────────────────

  getHabitaciones(edificioId: number): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(`${this.api}/habitaciones/${edificioId}`, { headers: this.getHeaders() });
  }
}