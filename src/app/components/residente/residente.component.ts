import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NoticiaService, FiltroUsuario } from '../../services/noticia.service';
import { SeccionService } from '../../services/seccion.service';
import { User } from '../../models/user.model';
import { Noticia } from '../../models/noticia.model';
import { Seccion } from '../../models/solicitud.model';
import { PerfilComponent } from '../perfil/perfil.component';

const IMG_BASE = 'http://localhost:9092';

@Component({
  selector: 'app-residente',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PerfilComponent],
  templateUrl: './residente.component.html',
  styleUrls: ['./residente.component.css']
})
export class ResidenteComponent implements OnInit {

  currentUser:       User | null = null;
  noticias:          Noticia[]   = [];
  noticiasFiltradas: Noticia[]   = [];
  selectedNoticia:   Noticia | null = null;
  secciones:         Seccion[]   = [];

  isLoading           = false;
  errorMessage        = '';
  searchTerm          = '';
  seccionSeleccionada = '';
  mostrarPerfil       = false;

  constructor(
    private auth:           AuthService,
    private noticiaService: NoticiaService,
    private seccionService: SeccionService,
    private router:         Router
  ) {}

  ngOnInit(): void {
    this.seccionService.listarActivas().subscribe({
      next:  d => (this.secciones = d),
      error: () => {}
    });
    this.auth.refreshCurrentUser().subscribe({
      next:  user => { this.currentUser = user; this.loadNoticias(); },
      error: ()   => { this.currentUser = this.auth.getCurrentUser(); this.loadNoticias(); }
    });
  }

  loadNoticias(): void {
    this.isLoading    = true;
    this.errorMessage = '';
    const u = this.currentUser;

    if (!u?.id) {
      this.noticiaService.getNoticiasPublicadas().subscribe({
        next:  data => { this.noticias = this.mapImagenes(data); this.filtrarNoticias(); this.isLoading = false; },
        error: ()   => { this.errorMessage = 'Error al cargar noticias'; this.isLoading = false; }
      });
      return;
    }

    const filtro: FiltroUsuario = {
      usuarioId:    u.id,
      genero:       this.normalizar(u.genero),
      facultad:     this.normalizar(u.facultad),
      seleccion:    this.normalizar(u.seleccion),
      habitacionId: u.habitacion?.id ?? u.habitacionId ?? undefined,
      edificioId:   u.edificioId ?? u.habitacion?.edificioId ?? undefined,
    };

    this.noticiaService.getNoticiasParaUsuario(filtro).subscribe({
      next:  data => { this.noticias = this.mapImagenes(data); this.filtrarNoticias(); this.isLoading = false; },
      error: ()   => { this.errorMessage = 'Error al cargar noticias'; this.isLoading = false; }
    });
  }

  private normalizar(valor: string | null | undefined): string | undefined {
    return valor && valor.trim() !== '' ? valor.trim() : undefined;
  }

  private mapImagenes(data: Noticia[]): Noticia[] {
    return data.map(n => ({
      ...n,
      imagen: n.imagen && !n.imagen.startsWith('http')
        ? IMG_BASE + (n.imagen.startsWith('/') ? n.imagen : '/' + n.imagen)
        : n.imagen
    }));
  }

  filtrarNoticias(): void {
    const texto = this.searchTerm.toLowerCase().trim();
    const sId   = this.seccionSeleccionada ? Number(this.seccionSeleccionada) : null;
    const resultado = this.noticias.filter(n =>
      (!texto || n.titulo?.toLowerCase().includes(texto) || n.descripcion?.toLowerCase().includes(texto)) &&
      (!sId   || n.seccionId === sId)
    );
    this.noticiasFiltradas = [
      ...resultado.filter(n =>  this.isUrgente(n)),
      ...resultado.filter(n => !this.isUrgente(n))
    ];
  }

  limpiarBusqueda(): void {
    this.searchTerm = ''; this.seccionSeleccionada = ''; this.filtrarNoticias();
  }

  isUrgente(n: Noticia): boolean { return n.prioridad === 'URGENTE' || n.prioridad === 'DESTACADA'; }

  get noticiasUrgentes(): Noticia[] { return this.noticiasFiltradas.filter(n =>  this.isUrgente(n)); }
  get noticiasNormales(): Noticia[] { return this.noticiasFiltradas.filter(n => !this.isUrgente(n)); }

  getSeccionNombre(id: number | undefined): string {
    if (!id) return '';
    return this.secciones.find(s => s.id === id)?.nombre ?? `Sección ${id}`;
  }

  openNoticiaDetail(noticia: Noticia): void {
    this.selectedNoticia = noticia;
    if (noticia.id) {
      this.noticiaService.registrarLectura(noticia.id).subscribe({
        next: () => this.loadNoticias(), error: () => {}
      });
    }
  }

  closeNoticiaDetail(): void { this.selectedNoticia = null; }

  // Sin avatar por defecto
  fotoUrl(foto?: string | null): string {
    if (!foto) return '';
    const limpia = foto.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + Date.now();
  }

  recargarUsuario(): void {
    this.auth.refreshCurrentUser().subscribe({
      next:  user => this.currentUser = user,
      error: ()   => this.currentUser = this.auth.getCurrentUser()
    });
  }

  onPerfilActualizado(userActualizado: User): void {
    this.currentUser = { ...userActualizado };
  }

  logout(): void { this.auth.logout(); }

  formatDate(d: Date | string | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getFechaDia(): string {
    return new Date().toLocaleDateString('es-ES', { weekday: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }

  getFechaCompleta(): string {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatDateShort(d: Date | string | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getBadgeClase(seccionId: number | undefined): string {
    const nombre = this.getSeccionNombre(seccionId).toLowerCase();
    if (nombre.includes('deport'))   return 'badge-deportes';
    if (nombre.includes('acad'))     return 'badge-academico';
    if (nombre.includes('cultur'))   return 'badge-cultura';
    if (nombre.includes('servic'))   return 'badge-servicios';
    if (nombre.includes('urgenc'))   return 'badge-urgencias';
    return 'badge-default';
  }
}