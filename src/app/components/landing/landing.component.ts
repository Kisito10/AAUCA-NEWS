// landing.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SolicitudService } from '../../services/solicitud.service';
import { UserService, Edificio, Habitacion } from '../../services/user.service';
import { NoticiaService } from '../../services/noticia.service';
import { Solicitud } from '../../models/solicitud.model';
import { Noticia } from '../../models/noticia.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {

  // ── Slideshow ─────────────────────────────────────────────────────────────
  currentSection  = 'hero';
  currentSlide    = 0;

  /** Candidatas: se prueban todas las variantes de nombre y solo las que
   *  existen pasan al slideshow. Las que faltan se avisan por consola (F12). */
  private readonly slideshowCandidatas: string[] = [
    // residencia (cualquier extensión)
    'assets/images/residencia.png',
    'assets/images/residencia.jpg',
    'assets/images/residencia.jpeg',
    // aauca completo (con guion o con espacio)
    'assets/images/aauca-completo.png',
    'assets/images/aauca completo.png',
    // aauca 2 (con guion o con paréntesis)
    'assets/images/aauca-2.png',
    'assets/images/aauca (2).png',
  ];

  slideshowImages: string[] = [];
  private slideInterval: any;

  // ── UI state ──────────────────────────────────────────────────────────────
  mobileOpen            = false;
  mostrarFormSolicitud  = false;
  solicitudEnviada      = false;
  enviandoSolicitud     = false;
  modalStep             = 0;

  errores: { [key: string]: string } = {};
  errorSolicitud = '';

  formSolicitud: Partial<Solicitud> = this.formVacio();

  fotoFile:    File   | null = null;
  fotoPreview: string | null = null;

  edificios:            Edificio[]   = [];
  habitaciones:         Habitacion[] = [];
  edificioSeleccionado: number | null = null;

  // ── Noticias destacadas (portada pública) ─────────────────────────────────
  noticiasDestacadas: Noticia[] = [];
  cargandoNoticias   = true;
  noticiaGate: Noticia | null = null;

  // ── Dominios de email permitidos ──────────────────────────────────────────
  private readonly DOMINIOS_VALIDOS = [
    'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
    'icloud.com', 'live.com', 'msn.com', 'protonmail.com',
    'hotmail.es', 'yahoo.es', 'outlook.es'
  ];

  constructor(
    private solicitudService: SolicitudService,
    private userService:      UserService,
    private noticiaService:   NoticiaService,
    private router:           Router
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.userService.getEdificios().subscribe({
      next:  d => this.edificios = d,
      error: () => {}
    });
    this.cargarNoticiasDestacadas();
    this.verificarImagenesSlideshow();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  // ── Slideshow ─────────────────────────────────────────────────────────────

  /**
   * Comprueba que cada imagen candidata exista realmente antes de añadirla
   * al slideshow. Las que fallan se descartan y se registra un aviso en la
   * consola del navegador con la ruta exacta que no se encontró.
   */
  private verificarImagenesSlideshow(): void {
    const validas = new Set<string>();
    let pendientes = this.slideshowCandidatas.length;

    const finalizar = () => {
      // Mantiene el orden original de las candidatas
      this.slideshowImages = this.slideshowCandidatas.filter(s => validas.has(s));
      if (this.slideshowImages.length === 0) {
        console.error('[Slideshow] Ninguna imagen encontrada. Revisa src/assets/images/');
      } else {
        console.info('[Slideshow] ✅ Imágenes cargadas:', this.slideshowImages);
      }
      this.currentSlide = 0;
      this.iniciarSlideshow();
    };

    this.slideshowCandidatas.forEach(src => {
      const img = new Image();
      img.onload = () => {
        validas.add(src);
        if (--pendientes === 0) finalizar();
      };
      img.onerror = () => {
        console.warn(`[Slideshow] ❌ No se encontró: ${src}`);
        if (--pendientes === 0) finalizar();
      };
      img.src = src;
    });
  }

  private iniciarSlideshow(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
    if (this.slideshowImages.length > 1) {
      this.slideInterval = setInterval(() => {
        this.currentSlide = (this.currentSlide + 1) % this.slideshowImages.length;
      }, 5000);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    // Reiniciar el temporizador al navegar manualmente
    this.iniciarSlideshow();
  }

  setSection(section: string): void {
    this.currentSection = section;
  }

  // ── Noticias destacadas de la portada ─────────────────────────────────────

  private cargarNoticiasDestacadas(): void {
    const peso: { [k: string]: number } = { URGENTE: 0, DESTACADA: 1, NORMAL: 2 };
    this.noticiaService.getNoticiasPublicadas().subscribe({
      next: lista => {
        this.noticiasDestacadas = (lista ?? [])
          .filter(n => n.activo !== false)
          .sort((a, b) => {
            const pa = peso[a.prioridad ?? 'NORMAL'] ?? 2;
            const pb = peso[b.prioridad ?? 'NORMAL'] ?? 2;
            if (pa !== pb) return pa - pb;
            return new Date(b.fechaPublicacion ?? 0).getTime()
                 - new Date(a.fechaPublicacion ?? 0).getTime();
          })
          .slice(0, 3);
        this.cargandoNoticias = false;
      },
      error: () => { this.cargandoNoticias = false; }
    });
  }

  imagenDe(n: Noticia): string | null {
    if (!n.imagen) return null;
    return n.imagen.startsWith('http') ? n.imagen : environment.imgBase + n.imagen;
  }

  extractoDe(n: Noticia): string {
    const txt = (n.descripcion ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return txt.length > 150 ? txt.slice(0, 150).trim() + '…' : txt;
  }

  fechaDe(n: Noticia): string {
    if (!n.fechaPublicacion) return '';
    return new Date(n.fechaPublicacion)
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Puerta de acceso al pulsar una noticia ────────────────────────────────
  abrirGate(n: Noticia): void  { this.noticiaGate = n; }
  cerrarGate(): void           { this.noticiaGate = null; }
  gateSolicitar(): void        { this.cerrarGate(); this.abrirFormSolicitud(); }
  gateLogin(): void            { this.cerrarGate(); this.navigateToLogin(); }

  get tickerItems(): Noticia[] {
    return [...this.noticiasDestacadas, ...this.noticiasDestacadas];
  }

  etiquetaPrioridad(n: Noticia): string {
    if (n.prioridad === 'URGENTE')   return 'Urgente';
    if (n.prioridad === 'DESTACADA') return 'Destacada';
    return 'Noticia';
  }

  // ── Validaciones ──────────────────────────────────────────────────────────

  private validarEmail(email: string): string | null {
    if (!email) return 'El email es obligatorio.';

    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return 'El formato del email no es válido (ej: nombre@gmail.com).';
    }

    const dominio = email.split('@')[1]?.toLowerCase();
    if (!this.DOMINIOS_VALIDOS.includes(dominio)) {
      return `Dominio no permitido. Usa: ${this.DOMINIOS_VALIDOS.slice(0, 4).join(', ')}…`;
    }

    return null;
  }

  private validarPaso0(): boolean {
    this.errores = {};
    let ok = true;

    if (!this.formSolicitud.nombre?.trim()) {
      this.errores['nombre'] = 'El nombre es obligatorio.';
      ok = false;
    } else if (this.formSolicitud.nombre.trim().length < 2) {
      this.errores['nombre'] = 'El nombre debe tener al menos 2 caracteres.';
      ok = false;
    }

    const emailError = this.validarEmail(this.formSolicitud.email?.trim() ?? '');
    if (emailError) {
      this.errores['email'] = emailError;
      ok = false;
    }

    return ok;
  }

  private validarPaso1(): boolean {
    this.errores = {};
    let ok = true;

    if (!this.formSolicitud.genero?.trim()) {
      this.errores['genero'] = 'Selecciona tu género.';
      ok = false;
    }

    if (!this.formSolicitud.facultad?.trim()) {
      this.errores['facultad'] = 'La facultad o carrera es obligatoria.';
      ok = false;
    } else if (this.formSolicitud.facultad.trim().length < 3) {
      this.errores['facultad'] = 'Introduce un nombre de facultad válido.';
      ok = false;
    }

    return ok;
  }

  private validarPaso2(): boolean {
    this.errores = {};
    let ok = true;

    if (!this.edificioSeleccionado) {
      this.errores['edificio'] = 'Selecciona un edificio.';
      ok = false;
    }

    if (!this.formSolicitud.habitacion?.trim()) {
      this.errores['habitacion'] = 'Selecciona una habitación.';
      ok = false;
    }

    return ok;
  }

  // ── Navegación por pasos del modal ────────────────────────────────────────

  nextStep(): void {
    this.errorSolicitud = '';
    if (this.modalStep === 0 && !this.validarPaso0()) return;
    if (this.modalStep === 1 && !this.validarPaso1()) return;
    this.errores = {};
    this.modalStep++;
  }

  prevStep(): void {
    if (this.modalStep > 0) {
      this.errores = {};
      this.modalStep--;
    }
  }

  // ── Foto ──────────────────────────────────────────────────────────────────

  onFotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errores['foto'] = 'El archivo debe ser una imagen (jpg, png, etc.)';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.errores['foto'] = 'La foto no debe superar 3 MB.';
      return;
    }
    this.errores['foto'] = '';
    this.fotoFile = file;
    const reader  = new FileReader();
    reader.onload = (e: any) => { this.fotoPreview = e.target.result; };
    reader.readAsDataURL(file);
  }

  // ── Edificio / habitación ─────────────────────────────────────────────────

  onEdificioChange(edificioId: number): void {
    this.edificioSeleccionado     = edificioId;
    this.formSolicitud.habitacion = '';
    this.formSolicitud.edificio   = this.edificios.find(e => e.id === edificioId)?.nombre ?? '';
    this.habitaciones             = [];
    this.errores['edificio']      = '';
    this.userService.getHabitaciones(edificioId).subscribe({
      next:  d => this.habitaciones = d,
      error: () => {}
    });
  }

  onHabitacionChange(habitacionId: number): void {
    const h = this.habitaciones.find(h => h.id === habitacionId);
    if (h) {
      this.formSolicitud.habitacion = h.numero;
      this.errores['habitacion']    = '';
    }
  }

  get plantasEdificio(): number[] {
    return [...new Set(this.habitaciones.map(h => h.piso ?? 0))].sort((a, b) => a - b);
  }

  habitacionesPorPlanta(planta: number): Habitacion[] {
    return this.habitaciones
      .filter(h => h.piso === planta)
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  navigateToLogin(): void { this.router.navigate(['/login']); }

  abrirFormSolicitud(): void {
    this.formSolicitud        = this.formVacio();
    this.solicitudEnviada     = false;
    this.errorSolicitud       = '';
    this.errores              = {};
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.modalStep            = 0;
    this.fotoFile             = null;
    this.fotoPreview          = null;
    this.mostrarFormSolicitud = true;
  }

  cerrarFormSolicitud(): void {
    this.mostrarFormSolicitud = false;
    this.solicitudEnviada     = false;
    this.errorSolicitud       = '';
    this.errores              = {};
    this.formSolicitud        = this.formVacio();
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.modalStep            = 0;
    this.fotoFile             = null;
    this.fotoPreview          = null;
  }

  // ── Envío ─────────────────────────────────────────────────────────────────

  enviarSolicitud(): void {
    if (!this.validarPaso2()) return;

    this.enviandoSolicitud = true;
    this.errorSolicitud    = '';

    const fd = new FormData();
    fd.append('nombre', this.formSolicitud.nombre!.trim());
    fd.append('email',  this.formSolicitud.email!.trim());
    if (this.formSolicitud.apellidos?.trim())  fd.append('apellidos', this.formSolicitud.apellidos.trim());
    if (this.formSolicitud.genero?.trim())     fd.append('genero',    this.formSolicitud.genero.trim());
    if (this.formSolicitud.facultad?.trim())   fd.append('facultad',  this.formSolicitud.facultad.trim());
    if (this.formSolicitud.seleccion?.trim())  fd.append('seleccion', this.formSolicitud.seleccion.trim());
    if (this.formSolicitud.edificio?.trim())   fd.append('edificio',  this.formSolicitud.edificio.trim());
    if (this.formSolicitud.habitacion?.trim()) fd.append('habitacion',this.formSolicitud.habitacion.trim());
    if (this.formSolicitud.mensaje?.trim())    fd.append('mensaje',   this.formSolicitud.mensaje.trim());
    if (this.fotoFile) fd.append('foto', this.fotoFile, this.fotoFile.name);

    this.solicitudService.enviarConFoto(fd).subscribe({
      next:  () => { this.enviandoSolicitud = false; this.solicitudEnviada = true; },
      error: (e: any) => {
        this.enviandoSolicitud = false;
        this.errorSolicitud    = e.error?.message || 'Error al enviar. Inténtalo de nuevo.';
      }
    });
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private formVacio(): Partial<Solicitud> {
    return {
      nombre: '', apellidos: '', email: '',
      genero: '', facultad: '', seleccion: '',
      edificio: '', habitacion: '', mensaje: ''
    };
  }
}