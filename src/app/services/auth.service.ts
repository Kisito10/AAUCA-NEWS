import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly apiUrl    = environment.apiUserUrl;
  // ← CORRECCIÓN: público para que perfil.component pueda emitir directamente
  public currentUserSubject  = new BehaviorSubject<User | null>(null);
  public currentUser$        = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    try {
      const raw   = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      if (raw && token) {
        const user: User = JSON.parse(raw);
        this.currentUserSubject.next(user);
      }
    } catch {
      this.clearSession();
    }
  }

  // ─── Autenticación ────────────────────────────────────────────────────────

  login(creds: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, creds).pipe(
      tap(res => {
        localStorage.setItem('token',       res.token);
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshCurrentUser(): Observable<User> {
    const user  = this.getCurrentUser();
    const token = this.getToken();
    if (!user?.id || !token) return throwError(() => new Error('Sin sesión activa'));

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<User>(`${this.apiUrl}/${user.id}`, { headers }).pipe(
      tap(u => {
        localStorage.setItem('currentUser', JSON.stringify(u));
        this.currentUserSubject.next(u); // ← actualiza el BehaviorSubject
      })
    );
  }

  // ─── Método para actualizar el usuario en sesión desde fuera ─────────────
  // Útil para que perfil.component actualice la sesión sin pasar por HTTP
  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // ─── Actualización de perfil ──────────────────────────────────────────────

  updateUser(user: Partial<User>): Observable<User> {
    const token = this.getToken();
    if (!user?.id || !token) return throwError(() => new Error('Sin sesión activa'));

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user, { headers }).pipe(
      tap(u => {
        localStorage.setItem('currentUser', JSON.stringify(u));
        this.currentUserSubject.next(u);
      })
    );
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  getToken(): string | null     { return localStorage.getItem('token');      }
  getCurrentUser(): User | null { return this.currentUserSubject.value;      }
  isLoggedIn(): boolean         { return !!this.getToken();                  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  getRol(): string {
    return this.getCurrentUser()?.rol ?? '';
  }

  private rolEs(...roles: string[]): boolean {
    const rolActual = this.getRol().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return roles.some(r =>
      r.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === rolActual
    );
  }

  isDirector(): boolean  { return this.rolEs('Director', 'DirectorAdjunto', 'Director Adjunto'); }
  isCelador(): boolean   { return this.rolEs('Celador'); }
  isTecnico(): boolean   { return this.rolEs('Tecnico', 'Técnico'); }
  isResidente(): boolean { return this.rolEs('Residente'); }
  isAdmin(): boolean     { return this.isDirector() || this.isCelador() || this.isTecnico(); }

  // ─── Navegación por rol ───────────────────────────────────────────────────

  redirectBasedOnRole(): void {
    if (this.isDirector())  { this.router.navigate(['/director']);  return; }
    if (this.isCelador())   { this.router.navigate(['/admin']);     return; }
    if (this.isTecnico())   { this.router.navigate(['/tecnico']);   return; }
    this.router.navigate(['/residente']);
  }

  // ─── Helper privado ───────────────────────────────────────────────────────

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}