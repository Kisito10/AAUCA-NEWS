import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface NoticiaLectura {
  id:            number;
  noticiaId:     number;
  usuarioId:     number;
  nombreUsuario: string;
  rolUsuario:    string;
  fechaLectura:  string;
  duracionSeg:   number | null;
}

export interface LecturasPage {
  noticiaId:     number;
  totalLectores: number;
  totalPaginas:  number;
  pagina:        number;
  lecturas:      NoticiaLectura[];
}

@Injectable({ providedIn: 'root' })
export class LecturaService {

  private readonly api = environment.apiLecturaUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });
  }

  getLectores(noticiaId: number, pagina: number = 0, tamano: number = 20): Observable<LecturasPage> {
    return this.http.get<LecturasPage>(
      `${this.api}/${noticiaId}/lectores?pagina=${pagina}&tamano=${tamano}`,
      { headers: this.headers() }
    );
  }
}