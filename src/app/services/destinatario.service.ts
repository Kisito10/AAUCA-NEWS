import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { TipoDestinatario, NoticiaDestinatario } from '../models/noticia.model';

@Injectable({ providedIn: 'root' })
export class DestinatarioService {

  private api = environment.apiDestinatarioUrl;

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

  // ─── Tipos ────────────────────────────────────────────────────────────────

  getTipos(): Observable<TipoDestinatario[]> {
    return this.http.get<TipoDestinatario[]>(
      `${this.api}/tipos`,
      { headers: this.getHeaders() }
    );
  }

  listarTodosTipos(): Observable<TipoDestinatario[]> {
    return this.http.get<TipoDestinatario[]>(
      `${this.api}/tipos/todos`,
      { headers: this.getHeaders() }
    );
  }

  crearTipo(tipo: Partial<TipoDestinatario>): Observable<TipoDestinatario> {
    return this.http.post<TipoDestinatario>(
      `${this.api}/tipos`,
      tipo,
      { headers: this.getHeaders() }
    );
  }

  actualizarTipo(id: number, tipo: Partial<TipoDestinatario>): Observable<TipoDestinatario> {
    return this.http.put<TipoDestinatario>(
      `${this.api}/tipos/${id}`,
      tipo,
      { headers: this.getHeaders() }
    );
  }

  toggleTipo(id: number): Observable<TipoDestinatario> {
    return this.http.patch<TipoDestinatario>(
      `${this.api}/tipos/${id}/toggle`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ─── Destinatarios por noticia ────────────────────────────────────────────

  getByNoticia(noticiaId: number): Observable<NoticiaDestinatario[]> {
    return this.http.get<NoticiaDestinatario[]>(
      `${this.api}/noticia/${noticiaId}`,
      { headers: this.getHeaders() }
    );
  }

  setDestinatarios(noticiaId: number, destinatarios: NoticiaDestinatario[]): Observable<any> {
    return this.http.post(
      `${this.api}/noticia/${noticiaId}`,
      destinatarios,
      { headers: this.getHeaders() }
    );
  }

  deleteByNoticia(noticiaId: number): Observable<any> {
    return this.http.delete(
      `${this.api}/noticia/${noticiaId}`,
      { headers: this.getHeaders() }
    );
  }
}