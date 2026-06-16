import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Seccion } from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SeccionService {

  private readonly api = environment.apiSeccionUrl;

  constructor(private http: HttpClient) {}

  listar(): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.api}/listar`)
      .pipe(catchError(this.handleError));
  }

  listarActivas(): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.api}/listar/activas`)
      .pipe(catchError(this.handleError));
  }

  crear(s: Partial<Seccion>): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.api}/crear`, s)
      .pipe(catchError(this.handleError));
  }

  actualizar(id: number, s: Partial<Seccion>): Observable<Seccion> {
    return this.http.put<Seccion>(`${this.api}/actualizar/${id}`, s)
      .pipe(catchError(this.handleError));
  }

  desactivar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.api}/desactivar/${id}`, {})
      .pipe(catchError(this.handleError));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/eliminar/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.message ?? error?.message ?? 'Error en SeccionService';
    console.error('[SeccionService]', msg, error);
    return throwError(() => new Error(msg));
  }
}