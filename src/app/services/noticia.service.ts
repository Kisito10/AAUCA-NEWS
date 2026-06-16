import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Noticia } from '../models/noticia.model';
import { AuthService } from './auth.service';

export interface FiltroUsuario {
  usuarioId:     number;
  genero?:       string;
  facultad?:     string;
  seleccion?:    string;
  habitacionId?: number;
  edificioId?:   number;
}

@Injectable({ providedIn: 'root' })
export class NoticiaService {

  private readonly api        = environment.apiNoticiaUrl;
  private readonly apiLectura = environment.apiLecturaUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });
  }

  private multipartHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });
  }

  // ─── Noticias ─────────────────────────────────────────────────────────────

  getNoticias(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.api}/listar`, { headers: this.jsonHeaders() });
  }

  getNoticiasPublicadas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.api}/listar/publicadas`);
  }

  getNoticiasParaUsuario(filtro: FiltroUsuario): Observable<Noticia[]> {
    let params = new HttpParams().set('usuarioId', filtro.usuarioId.toString());
    if (filtro.genero)       params = params.set('genero',       filtro.genero);
    if (filtro.facultad)     params = params.set('facultad',     filtro.facultad);
    if (filtro.seleccion)    params = params.set('seleccion',    filtro.seleccion);
    if (filtro.habitacionId) params = params.set('habitacionId', filtro.habitacionId.toString());
    if (filtro.edificioId)   params = params.set('edificioId',   filtro.edificioId.toString());
    return this.http.get<Noticia[]>(`${this.api}/listar/para-usuario`, { params });
  }

  getNoticiasUrgentes(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.api}/listar/urgentes`);
  }

  getNoticiasDestacadas(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(`${this.api}/listar/destacadas`);
  }

  getNoticiaById(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.api}/${id}`);
  }

  createNoticia(fd: FormData): Observable<any> {
    return this.http.post(`${this.api}/crear`, fd, { headers: this.multipartHeaders() });
  }

  updateNoticia(id: number, fd: FormData): Observable<any> {
    return this.http.put(`${this.api}/actualizar/${id}`, fd, { headers: this.multipartHeaders() });
  }

  patchNoticiaEstado(id: number, cambios: Partial<Noticia>): Observable<any> {
    return this.http.patch(`${this.api}/actualizar/${id}`, cambios, { headers: this.jsonHeaders() });
  }

  publicarNoticia(id: number): Observable<any> {
    return this.http.patch(`${this.api}/publicar/${id}`, {}, { headers: this.jsonHeaders() });
  }

  autorizarNoticia(id: number): Observable<any> {
    return this.http.patch(`${this.api}/autorizar/${id}`, {}, { headers: this.jsonHeaders() });
  }

  archivarNoticia(id: number): Observable<any> {
    return this.http.patch(`${this.api}/archivar/${id}`, {}, { headers: this.jsonHeaders() });
  }

  deleteNoticia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${id}`, { headers: this.jsonHeaders() });
  }

  // ─── Lecturas ─────────────────────────────────────────────────────────────

  registrarLectura(noticiaId: number, duracion?: number): Observable<any> {
    let url = `${this.apiLectura}/${noticiaId}`;
    if (duracion) url += `?duracion=${duracion}`;
    return this.http.post(url, {}, { headers: this.jsonHeaders() });
  }

  yaLeida(noticiaId: number): Observable<{ leida: boolean }> {
    return this.http.get<{ leida: boolean }>(`${this.apiLectura}/${noticiaId}/leida`, { headers: this.jsonHeaders() });
  }

  totalLecturas(noticiaId: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiLectura}/${noticiaId}/total`, { headers: this.jsonHeaders() });
  }
}