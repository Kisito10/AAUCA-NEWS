import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NoticiaService } from '../../services/noticia.service';
import { Noticia } from '../../models/noticia.model';

interface Seccion {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './noticias.component.html',
  styleUrls: ['./noticias.component.css']
})
export class NoticiasComponent implements OnInit {

  noticias:          Noticia[] = [];
  noticiasFiltradas: Noticia[] = [];
  selectedNoticia:   Noticia | null = null;
  isLoading      = false;
  errorMessage   = '';

  searchTerm           = '';
  seccionSeleccionada  = '';
  secciones:           Seccion[] = [];

  private seccionUrl = 'http://localhost:9091/api/seccion';

  constructor(
    private noticiaService: NoticiaService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadSecciones();
    this.loadNoticias();
  }

  loadSecciones(): void {
    this.http.get<Seccion[]>(`${this.seccionUrl}/listar`).subscribe({
      next:  data => { this.secciones = data; },
      error: () => {}
    });
  }

  loadNoticias(): void {
    this.isLoading = true;
    this.noticiaService.getNoticias().subscribe({
      next: data => {
        this.noticias = data
          .filter(n => (n as any).estado === 'PUBLICADO')
          .map(n => {
            let imagenUrl = n.imagen;
            if (imagenUrl && !imagenUrl.startsWith('http')) {
              if (!imagenUrl.startsWith('/')) imagenUrl = '/' + imagenUrl;
              imagenUrl = `http://localhost:9092${imagenUrl}`;
            }
            return { ...n, imagen: imagenUrl };
          });
        this.filtrarNoticias();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar las noticias.';
        this.isLoading    = false;
      }
    });
  }

  filtrarNoticias(): void {
    const term      = this.searchTerm.toLowerCase().trim();
    const seccionId = this.seccionSeleccionada ? Number(this.seccionSeleccionada) : null;

    const filtradas = this.noticias.filter(n => {
      const coincideBusqueda =
        !term ||
        n.titulo?.toLowerCase().includes(term) ||
        n.descripcion?.toLowerCase().includes(term);
      const coincideSeccion = seccionId === null || n.seccionId === seccionId;
      return coincideBusqueda && coincideSeccion;
    });

    // Urgentes primero
    const urgentes = filtradas.filter(n => this.isUrgente(n));
    const normales  = filtradas.filter(n => !this.isUrgente(n));
    this.noticiasFiltradas = [...urgentes, ...normales];
  }

  limpiarBusqueda(): void {
    this.searchTerm          = '';
    this.seccionSeleccionada = '';
    this.filtrarNoticias();
  }

  // ── FIX: comprueba prioridad en vez de .urgente (que no existe en el modelo)
  isUrgente(n: Noticia): boolean {
    return (n as any).prioridad === 'URGENTE';
  }

  get noticiasUrgentes(): Noticia[] {
    return this.noticiasFiltradas.filter(n => this.isUrgente(n));
  }

  get noticiasNormales(): Noticia[] {
    return this.noticiasFiltradas.filter(n => !this.isUrgente(n));
  }

  getSeccionNombre(seccionId: number | undefined): string {
    if (!seccionId) return '';
    const s = this.secciones.find(sec => sec.id === seccionId);
    return s ? s.nombre : `Sección ${seccionId}`;
  }

  openDetail(noticia: Noticia): void { this.selectedNoticia = noticia; }
  closeDetail(): void                { this.selectedNoticia = null;    }

  onImageError(event: Event, noticia: Noticia): void { noticia.imagen = undefined; }
  onImageLoad(noticia: Noticia): void {}

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}