import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService, ValoresFiltro, Edificio, Habitacion } from '../../services/user.service';
import { NoticiaService } from '../../services/noticia.service';
import { SolicitudService } from '../../services/solicitud.service';
import { SeccionService } from '../../services/seccion.service';
import { DestinatarioService } from '../../services/destinatario.service';
import { LecturaService, NoticiaLectura, LecturasPage } from '../../services/lectura.service';
import { User } from '../../models/user.model';
import { Noticia, TipoDestinatario, NoticiaDestinatario } from '../../models/noticia.model';
import { Solicitud, Seccion } from '../../models/solicitud.model';
import { switchMap } from 'rxjs/operators';
import { iconoPorTipo } from '../../utils/destinatario.utils';
import { environment } from '../../../environments/environment';
import { PerfilComponent } from '../perfil/perfil.component';

@Component({
  selector: 'app-director',
  standalone: true,
  imports: [CommonModule, FormsModule, PerfilComponent],
  templateUrl: './director.component.html',
  styleUrls: ['./director.component.css']
})
export class DirectorComponent implements OnInit, OnDestroy {

  currentUser: User | null = null;
  activeTab = 'dashboard';

  mostrarPerfil = false;
  fotoNavbar = '';

  // ── Noticias ──────────────────────────────────────────────────────────────
  noticias:          Noticia[]      = [];
  showNoticiaModal = false;
  editingNoticia:    Noticia | null = null;
  noticiaPreview:    string | null  = null;
  selectedImageFile: File   | null  = null;
  noticiaForm: any = this.noticiaFormVacio();
  erroresNoticia: { [k: string]: string } = {};

  // ── Destinatarios ─────────────────────────────────────────────────────────
  tipos:                TipoDestinatario[] = [];
  tipoSeleccionado:     TipoDestinatario | null = null;
  valorDestinatario   = '';
  valoresFiltro:        ValoresFiltro = { facultades: [], generos: [], selecciones: [] };
  edificios:            Edificio[]    = [];
  habitaciones:         Habitacion[]  = [];
  edificioSeleccionado: number | null = null;

  // ── Tipos destinatario ────────────────────────────────────────────────────
  todosTipos:      TipoDestinatario[] = [];
  showTipoModal  = false;
  editingTipo:     TipoDestinatario | null = null;
  tipoForm: any  = { nombre: '', descripcion: '', activo: true };
  erroresTipo: { [k: string]: string } = {};

  // ── Edificios ─────────────────────────────────────────────────────────────
  todosEdificios:     Edificio[] = [];
  showEdificioModal = false;
  editingEdificio:    Edificio | null = null;
  edificioForm: any = { nombre: '', numPlantas: 3, activo: true };
  erroresEdificio: { [k: string]: string } = {};

  // ── Usuarios ──────────────────────────────────────────────────────────────
  usuarios:         User[]      = [];
  showUserModal   = false;
  editingUser:      User | null = null;
  userForm: any   = this.userFormVacio();
  busquedaUsuario = '';
  erroresUser: { [k: string]: string } = {};

  habitacionesUsuario:          Habitacion[]  = [];
  edificioSeleccionadoUsuario:  number | null = null;

  // ── Secciones ─────────────────────────────────────────────────────────────
  secciones:       Seccion[]      = [];
  showSeccionModal = false;
  editingSeccion:  Seccion | null = null;
  seccionForm: any = { nombre: '', descripcion: '' };
  erroresSeccion: { [k: string]: string } = {};

  // ── Solicitudes ───────────────────────────────────────────────────────────
  solicitudes:            Solicitud[] = [];
  solicitudesPendientes = 0;
  busquedaSolicitud     = '';
  filtroEstado          = '';
  loadingSolicitudes    = false;   // ← NUEVO: spinner propio
  errorSolicitudes      = '';      // ← NUEVO: error aislado de la tabla

  // ── Lecturas ──────────────────────────────────────────────────────────────
  lectoresModal:        boolean          = false;
  noticiaLecturas:      NoticiaLectura[] = [];
  lecturasPagina:       number           = 0;
  lecturasTotal:        number           = 0;
  lecturasTotalPaginas: number           = 0;
  noticiaSeleccionada:  any              = null;
  loadingLecturas:      boolean          = false;

  private refreshInterval: any = null;

  isLoading = false;
  error     = '';
  success   = '';

  // ── Dominios permitidos para email ────────────────────────────────────────
  private readonly DOMINIOS_VALIDOS = [
    'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
    'icloud.com', 'live.com', 'msn.com', 'protonmail.com',
    'hotmail.es', 'yahoo.es', 'outlook.es'
  ];

  constructor(
    private auth:                AuthService,
    private userService:         UserService,
    private noticiaService:      NoticiaService,
    private solicitudService:    SolicitudService,
    private seccionService:      SeccionService,
    private destinatarioService: DestinatarioService,
    private lecturaService:      LecturaService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.fotoNavbar  = this.fotoUrl(this.currentUser?.foto);
    this.destinatarioService.getTipos().subscribe({
      next: d => {
        this.tipos = d;
        this.tipoSeleccionado = d.find(t => t.nombre === 'TODOS') ?? d[0] ?? null;
      },
      error: () => {}
    });
    this.userService.getValoresFiltro().subscribe({ next: d => this.valoresFiltro = d, error: () => {} });
    this.userService.getEdificios().subscribe({ next: d => this.edificios = d, error: () => {} });
    this.loadAll();
    this.refreshInterval = setInterval(() => this.loadNoticias(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ── Perfil ────────────────────────────────────────────────────────────────

  fotoUrl(foto?: string | null): string {
    if (!foto) return '';
    const limpia = foto.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + Date.now();
  }

  recargarUsuario(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.fotoNavbar  = this.fotoUrl(this.currentUser?.foto);
  }

  onPerfilActualizado(u: User): void {
    this.currentUser = { ...u };
    this.fotoNavbar  = this.fotoUrl((u as any).foto);
  }

  // ── Carga general ─────────────────────────────────────────────────────────

  loadAll(): void {
    this.loadNoticias(); this.loadUsuarios(); this.loadSolicitudes();
    this.loadSecciones(); this.loadTipos(); this.loadTodosEdificios();
  }

  loadNoticias(): void {
    this.noticiaService.getNoticias().subscribe({
      next: d => this.noticias = d.map(n => ({
        ...n,
        imagen: n.imagen && !n.imagen.startsWith('http')
          ? environment.imgBase + (n.imagen.startsWith('/') ? n.imagen : '/' + n.imagen)
          : n.imagen
      })),
      error: () => {}
    });
  }

  get noticiasPendientes(): Noticia[] {
    return this.noticias.filter(n => n.estado === 'BORRADOR' && n.rolCreador === 'celador');
  }

  get noticiasPublicadas(): Noticia[] {
    return this.noticias.filter(n => n.estado === 'PUBLICADO');
  }

  get noticiasBorradores(): Noticia[] {
    return this.noticias.filter(n => n.estado === 'BORRADOR');
  }

  get noticiasRecientes(): Noticia[] {
    return this.noticias.slice(0, 6);
  }

  autorizarNoticia(n: Noticia): void {
    this.noticiaService.autorizarNoticia(n.id!).subscribe({
      next:  () => { this.showSuccess('Noticia autorizada y publicada'); this.loadNoticias(); },
      error: (e: any) => this.error = e.error?.message || 'Error al autorizar'
    });
  }

  devolverBorrador(n: Noticia): void {
    this.noticiaService.patchNoticiaEstado(n.id!, { estado: 'BORRADOR' } as any).subscribe({
      next:  () => { this.showSuccess('Noticia devuelta a borrador'); this.loadNoticias(); },
      error: (e: any) => this.error = e.error?.message || 'Error al devolver'
    });
  }

  openNoticiaModal(n?: Noticia): void {
    this.editingNoticia       = n || null;
    this.noticiaForm          = n ? { ...n } : this.noticiaFormVacio();
    this.noticiaPreview       = n?.imagen || null;
    this.selectedImageFile    = null;
    this.valorDestinatario    = '';
    this.tipoSeleccionado     = this.tipos.find(t => t.nombre === 'TODOS') ?? this.tipos[0] ?? null;
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.erroresNoticia       = {};
    this.showNoticiaModal     = true;
    this.error                = '';

    if (n?.id) {
      this.destinatarioService.getByNoticia(n.id).subscribe({
        next: d => {
          if (d.length > 0) {
            this.tipoSeleccionado  = this.tipos.find(t => t.id === d[0].tipoId) ?? this.tipoSeleccionado;
            this.valorDestinatario = d[0].valor ?? '';
          }
        },
        error: () => {}
      });
    }
  }

  closeNoticiaModal(): void {
    this.showNoticiaModal     = false;
    this.editingNoticia       = null;
    this.noticiaPreview       = null;
    this.selectedImageFile    = null;
    this.valorDestinatario    = '';
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.erroresNoticia       = {};
    this.error                = '';
  }

  // ── Validación noticia ────────────────────────────────────────────────────

  private validarNoticia(): boolean {
    this.erroresNoticia = {};
    let ok = true;

    if (!this.noticiaForm.titulo?.trim()) {
      this.erroresNoticia['titulo'] = 'El título es obligatorio.'; ok = false;
    } else if (this.noticiaForm.titulo.trim().length < 5) {
      this.erroresNoticia['titulo'] = 'El título debe tener al menos 5 caracteres.'; ok = false;
    }

    if (!this.noticiaForm.descripcion?.trim()) {
      this.erroresNoticia['descripcion'] = 'La descripción es obligatoria.'; ok = false;
    } else if (this.noticiaForm.descripcion.trim().length < 10) {
      this.erroresNoticia['descripcion'] = 'La descripción debe tener al menos 10 caracteres.'; ok = false;
    }

    if (!this.noticiaForm.seccionId) {
      this.erroresNoticia['seccionId'] = 'Debes seleccionar una sección.'; ok = false;
    }

    if (this.tipoNecesitaValor && !this.valorDestinatario?.toString().trim()) {
      this.erroresNoticia['destinatario'] = `Debes indicar el valor para "${this.tipoSeleccionado?.nombre}".`; ok = false;
    }

    return ok;
  }

  saveNoticia(): void {
    if (!this.validarNoticia()) return;

    this.isLoading = true;
    this.error     = '';

    const fd = new FormData();
    fd.append('titulo',      this.noticiaForm.titulo.trim());
    fd.append('descripcion', this.noticiaForm.descripcion.trim());
    fd.append('seccionId',   String(this.noticiaForm.seccionId));
    fd.append('estado',      this.noticiaForm.estado    ?? 'PUBLICADO');
    fd.append('prioridad',   this.noticiaForm.prioridad ?? 'NORMAL');

    if (!this.editingNoticia)
      fd.append('publicadoPor', this.currentUser?.nombre ?? 'sistema');

    if (this.selectedImageFile) {
      fd.append('imagen', this.selectedImageFile, this.selectedImageFile.name);
    } else if (this.editingNoticia && this.noticiaForm.imagen) {
      fd.append('imagenUrl', this.noticiaForm.imagen);
    }

    const obs = this.editingNoticia
      ? this.noticiaService.updateNoticia(this.editingNoticia.id!, fd)
      : this.noticiaService.createNoticia(fd);

    obs.subscribe({
      next: (res: any) => {
        const noticiaId = res?.id ?? res?.noticia?.id ?? this.editingNoticia?.id;
        if (noticiaId && this.tipoSeleccionado) {
          const dest: NoticiaDestinatario = {
            tipoId: this.tipoSeleccionado.id,
            valor:  this.tipoNecesitaValor ? this.valorDestinatario.toString().trim() : null
          };
          this.destinatarioService.setDestinatarios(noticiaId, [dest]).subscribe({ error: () => {} });
        }
        this.loadNoticias();
        this.closeNoticiaModal();
        this.isLoading = false;
        this.showSuccess(this.editingNoticia ? 'Noticia actualizada' : 'Noticia creada');
      },
      error: (e: any) => { this.error = e.error?.message || 'Error al guardar'; this.isLoading = false; }
    });
  }

  deleteNoticia(id: number): void {
    if (!confirm('¿Eliminar esta noticia?')) return;
    this.destinatarioService.deleteByNoticia(id).pipe(
      switchMap(() => this.noticiaService.deleteNoticia(id))
    ).subscribe({
      next:  () => { this.loadNoticias(); this.showSuccess('Noticia eliminada'); },
      error: (e: any) => this.error = e.error?.message || 'Error al eliminar'
    });
  }

  onFileSelected(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.selectedImageFile = f;
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = (e: any) => { this.noticiaPreview = e.target.result; };
  }

  descargarNoticiaPDF(n: Noticia): void {
    fetch('/assets/images/AAUCA.png')
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .then(base64 => this.abrirPDF(n, base64))
      .catch(() => this.abrirPDF(n, null));
  }

  private abrirPDF(n: Noticia, logoBase64: string | null): void {
    const prioridadColor: Record<string, string> = { URGENTE: '#dc3545', DESTACADA: '#d97706', NORMAL: '#6c757d' };
    const prioridadLabel: Record<string, string> = { URGENTE: 'URGENTE', DESTACADA: 'DESTACADA', NORMAL: 'NORMAL' };
    const color        = prioridadColor[n.prioridad ?? 'NORMAL'] ?? '#6c757d';
    const label        = prioridadLabel[n.prioridad ?? 'NORMAL'] ?? 'NORMAL';
    const fecha        = this.formatDate(n.fechaPublicacion);
    const seccion      = this.getSeccionNombre(n.seccionId);
    const publicadoPor = n.publicadoPor ?? 'Redacción AAUCA';
    const generadoEl   = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${n.titulo}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;color:#1a1a2e;background:#fff}
.header{background:#1a1a2e;padding:22px 40px;display:flex;align-items:center;gap:18px;border-bottom:4px solid #ffc107}
.header-logo{width:76px;height:76px;object-fit:contain;border-radius:50%;background:#fff;padding:4px}
.header-logo-placeholder{width:76px;height:76px;border:2px solid #ffc107;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffc107;font-size:22px;font-weight:bold}
.header-info h1{font-size:24px;font-weight:bold;letter-spacing:3px;color:#ffc107;margin-bottom:3px}
.header-info h1 span{color:#fff}.header-info p{font-size:10px;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px}
.stripe{height:6px;background:linear-gradient(to right,#ffc107,#1a1a2e)}.body{padding:32px 40px 20px}
.meta-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.badge{padding:4px 14px;border-radius:20px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.8px;color:#fff}
.badge-prioridad{background:${color}}.badge-seccion{background:#0d6efd}
.meta-fecha{font-size:11px;color:#888;margin-left:auto;font-style:italic}
.titulo{font-size:28px;font-weight:bold;color:#1a1a2e;line-height:1.25;border-left:5px solid #ffc107;padding-left:14px;margin-bottom:6px}
.subtitulo{font-size:12px;color:#888;padding-left:19px;margin-bottom:24px;font-style:italic}
.divider-gold{height:2px;background:linear-gradient(to right,#ffc107 30%,transparent);margin:0 0 24px}
.img-wrapper{text-align:center;margin:0 0 24px}.img-wrapper img{max-width:100%;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,.1)}
.contenido{font-size:15px;line-height:1.9;color:#374151;text-align:justify}
.footer{margin-top:40px;border-top:3px solid #1a1a2e;padding:14px 40px;background:#f8f9fa;display:flex;justify-content:space-between;align-items:center;gap:10px}
.footer-left{font-size:11px;color:#555}.footer-left strong{color:#1a1a2e}
.footer-center{font-size:14px;font-weight:bold;letter-spacing:2px;color:#1a1a2e}.footer-center span{color:#ffc107}
.footer-right{font-size:10px;color:#aaa;text-align:right}
.watermark{position:fixed;bottom:80px;right:40px;font-size:60px;font-weight:bold;color:rgba(26,26,46,.04);letter-spacing:4px;pointer-events:none;user-select:none}
@page{margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="header">${logoBase64 ? `<img class="header-logo" src="${logoBase64}" alt="Logo AAUCA">` : `<div class="header-logo-placeholder">A</div>`}
<div class="header-info"><h1>AAUCA<span>NEWS</span></h1><p>Afro-American University of Central Africa</p><p>Sistema de Comunicación Institucional</p></div></div>
<div class="stripe"></div><div class="body">
<div class="meta-row"><span class="badge badge-prioridad">${label}</span><span class="badge badge-seccion">${seccion}</span><span class="meta-fecha">📅 ${fecha}</span></div>
<div class="titulo">${n.titulo}</div><div class="subtitulo">Publicado por <strong>${publicadoPor}</strong></div>
<div class="divider-gold"></div>${n.imagen ? `<div class="img-wrapper"><img src="${n.imagen}" alt="${n.titulo}"></div>` : ''}
<div class="contenido">${n.descripcion}</div></div>
<div class="watermark">AAUCA</div>
<div class="footer"><div class="footer-left">Sección: <strong>${seccion}</strong><br>Autor: <strong>${publicadoPor}</strong></div>
<div class="footer-center"><span>AAUCA</span>NEWS</div>
<div class="footer-right">Generado el ${generadoEl}<br>Documento oficial AAUCA</div></div></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => { w.print(); }, 800); }
  }

  // ── Lecturas ──────────────────────────────────────────────────────────────

  verLectores(n: Noticia): void {
    this.noticiaSeleccionada  = n;
    this.lecturasPagina       = 0;
    this.noticiaLecturas      = [];
    this.lecturasTotal        = 0;
    this.lecturasTotalPaginas = 0;
    this.lectoresModal        = true;
    this.cargarLectores();
  }

  cargarLectores(): void {
    if (!this.noticiaSeleccionada) return;
    this.loadingLecturas = true;
    this.lecturaService.getLectores(this.noticiaSeleccionada.id, this.lecturasPagina).subscribe({
      next: (d: LecturasPage) => {
        this.noticiaLecturas      = d.lecturas;
        this.lecturasTotal        = d.totalLectores;
        this.lecturasTotalPaginas = d.totalPaginas;
        this.loadingLecturas      = false;
      },
      error: () => { this.loadingLecturas = false; }
    });
  }

  lecturasPaginaAnterior(): void {
    if (this.lecturasPagina > 0) { this.lecturasPagina--; this.cargarLectores(); }
  }

  lecturasPaginaSiguiente(): void {
    if (this.lecturasPagina < this.lecturasTotalPaginas - 1) { this.lecturasPagina++; this.cargarLectores(); }
  }

  cerrarLectoresModal(): void {
    this.lectoresModal       = false;
    this.noticiaSeleccionada = null;
    this.noticiaLecturas     = [];
    this.lecturasTotal       = 0;
  }

  formatDateTime(d: any): string {
    if (!d) return '';
    return new Date(d).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ── Destinatarios ─────────────────────────────────────────────────────────

  get tipoNecesitaValor(): boolean { return this.tipoSeleccionado?.nombre !== 'TODOS'; }
  iconoPorNombre(nombre: string): string { return iconoPorTipo(nombre); }

  seleccionarTipo(tipo: TipoDestinatario): void {
    this.tipoSeleccionado = tipo; this.valorDestinatario = '';
    this.edificioSeleccionado = null; this.habitaciones = [];
  }

  onEdificioChange(edificioId: number): void {
    this.edificioSeleccionado = edificioId; this.valorDestinatario = ''; this.habitaciones = [];
    this.userService.getHabitaciones(edificioId).subscribe({ next: d => this.habitaciones = d, error: () => {} });
  }

  getNombreEdificio(id: number): string {
    return this.edificios.find(e => e.id === id)?.nombre ?? `Edificio ${id}`;
  }

  get plantasDelEdificio(): number[] {
    if (!this.habitaciones.length) return [];
    return [...new Set(this.habitaciones.map(h => h.piso ?? 0))].sort((a, b) => a - b);
  }

  habitacionesPorPlanta(planta: number): Habitacion[] {
    return this.habitaciones.filter(h => h.piso === planta).sort((a, b) => a.numero.localeCompare(b.numero));
  }

  onEdificioUsuarioChange(edificioId: number): void {
    this.edificioSeleccionadoUsuario = edificioId; this.userForm.habitacionId = null; this.habitacionesUsuario = [];
    this.userService.getHabitaciones(edificioId).subscribe({ next: d => this.habitacionesUsuario = d, error: () => {} });
  }

  get plantasUsuario(): number[] {
    if (!this.habitacionesUsuario.length) return [];
    return [...new Set(this.habitacionesUsuario.map(h => h.piso ?? 0))].sort((a, b) => a - b);
  }

  habitacionesUsuarioPorPlanta(planta: number): Habitacion[] {
    return this.habitacionesUsuario.filter(h => h.piso === planta).sort((a, b) => a.numero.localeCompare(b.numero));
  }

  // ── Tipos ─────────────────────────────────────────────────────────────────

  loadTipos(): void {
    this.destinatarioService.listarTodosTipos().subscribe({ next: d => this.todosTipos = d, error: () => {} });
  }

  openTipoModal(t?: TipoDestinatario): void {
    this.editingTipo   = t || null;
    this.tipoForm      = t ? { nombre: t.nombre, descripcion: t.descripcion, activo: t.activo } : { nombre: '', descripcion: '', activo: true };
    this.erroresTipo   = {};
    this.showTipoModal = true;
    this.error         = '';
  }

  closeTipoModal(): void { this.showTipoModal = false; this.editingTipo = null; this.erroresTipo = {}; this.error = ''; }

  private validarTipo(): boolean {
    this.erroresTipo = {};
    let ok = true;
    if (!this.tipoForm.nombre?.trim()) {
      this.erroresTipo['nombre'] = 'El nombre es obligatorio.'; ok = false;
    } else if (!/^[A-Z_]+$/.test(this.tipoForm.nombre.trim())) {
      this.erroresTipo['nombre'] = 'Solo mayúsculas y guiones bajos (ej: GRUPO_ESPECIAL).'; ok = false;
    }
    if (!this.tipoForm.descripcion?.trim()) {
      this.erroresTipo['descripcion'] = 'La descripción es obligatoria.'; ok = false;
    }
    return ok;
  }

  saveTipo(): void {
    if (!this.validarTipo()) return;
    this.isLoading = true;
    const obs = this.editingTipo
      ? this.destinatarioService.actualizarTipo(this.editingTipo.id, this.tipoForm)
      : this.destinatarioService.crearTipo(this.tipoForm);
    obs.subscribe({
      next: () => {
        this.loadTipos();
        this.destinatarioService.getTipos().subscribe({ next: d => this.tipos = d, error: () => {} });
        this.closeTipoModal(); this.isLoading = false; this.showSuccess('Tipo guardado');
      },
      error: (e: any) => { this.error = e.error?.message || 'Error al guardar'; this.isLoading = false; }
    });
  }

  toggleTipo(t: TipoDestinatario): void {
    this.destinatarioService.toggleTipo(t.id).subscribe({
      next: () => {
        this.loadTipos();
        this.destinatarioService.getTipos().subscribe({ next: d => this.tipos = d, error: () => {} });
        this.showSuccess('Tipo actualizado');
      },
      error: () => {}
    });
  }

  // ── Edificios ─────────────────────────────────────────────────────────────

  loadTodosEdificios(): void {
    this.userService.todosEdificios().subscribe({ next: d => this.todosEdificios = d, error: () => {} });
  }

  openEdificioModal(e?: Edificio): void {
    this.editingEdificio   = e || null;
    this.edificioForm      = e ? { nombre: e.nombre, numPlantas: e.numPlantas, activo: e.activo } : { nombre: '', numPlantas: 3, activo: true };
    this.erroresEdificio   = {};
    this.showEdificioModal = true;
    this.error             = '';
  }

  closeEdificioModal(): void { this.showEdificioModal = false; this.editingEdificio = null; this.erroresEdificio = {}; this.error = ''; }

  private validarEdificio(): boolean {
    this.erroresEdificio = {};
    let ok = true;
    if (!this.edificioForm.nombre?.trim()) {
      this.erroresEdificio['nombre'] = 'El nombre del edificio es obligatorio.'; ok = false;
    }
    if (!this.edificioForm.numPlantas || this.edificioForm.numPlantas < 1) {
      this.erroresEdificio['numPlantas'] = 'Indica un número de plantas válido (mínimo 1).'; ok = false;
    }
    return ok;
  }

  saveEdificio(): void {
    if (!this.validarEdificio()) return;
    this.isLoading = true;
    const obs = this.editingEdificio
      ? this.userService.actualizarEdificio(this.editingEdificio.id!, this.edificioForm)
      : this.userService.crearEdificio(this.edificioForm);
    obs.subscribe({
      next: () => {
        this.loadTodosEdificios();
        this.userService.getEdificios().subscribe({ next: d => this.edificios = d, error: () => {} });
        this.closeEdificioModal(); this.isLoading = false;
        this.showSuccess('Edificio guardado' + (!this.editingEdificio ? ' — habitaciones generadas automáticamente' : ''));
      },
      error: (e: any) => { this.error = e.error?.message || 'Error al guardar'; this.isLoading = false; }
    });
  }

  toggleEdificio(e: Edificio): void {
    this.userService.toggleEdificio(e.id!).subscribe({
      next: () => {
        this.loadTodosEdificios();
        this.userService.getEdificios().subscribe({ next: d => this.edificios = d, error: () => {} });
        this.showSuccess('Edificio actualizado');
      },
      error: () => {}
    });
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────

  loadUsuarios(): void {
    this.userService.getUsers().subscribe({
      next: (d: any[]) => this.usuarios = d.map(u => ({ ...u, rol: u.rol?.nombre ?? u.rol })),
      error: () => {}
    });
  }

  get usuariosFiltrados(): User[] {
    const q = this.busquedaUsuario.trim().toLowerCase();
    if (!q) return this.usuarios;
    return this.usuarios.filter(u =>
      u.nombre?.toLowerCase().includes(q) || u.apellidos?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)  || (u.rol as string)?.toLowerCase().includes(q)
    );
  }

  openUserModal(u?: User): void {
    this.editingUser = u || null;
    this.edificioSeleccionadoUsuario = null;
    this.habitacionesUsuario = [];
    this.erroresUser = {};
    this.userForm = u
      ? { nombre: u.nombre, apellidos: u.apellidos ?? '', email: u.email, password: '',
          rolNombre: u.rol, genero: u.genero ?? '', facultad: u.facultad ?? '',
          seleccion: u.seleccion ?? '', activo: u.activo ?? true,
          habitacionId: (u as any).habitacionId ?? null }
      : this.userFormVacio();
    if ((u as any)?.habitacion?.edificioId) {
      this.edificioSeleccionadoUsuario = (u as any).habitacion.edificioId;
      this.userService.getHabitaciones((u as any).habitacion.edificioId)
          .subscribe({ next: d => this.habitacionesUsuario = d, error: () => {} });
    }
    this.showUserModal = true;
    this.error         = '';
  }

  closeUserModal(): void {
    this.showUserModal = false; this.editingUser = null;
    this.edificioSeleccionadoUsuario = null; this.habitacionesUsuario = [];
    this.erroresUser = {}; this.error = '';
  }

  private validarEmail(email: string): string | null {
    if (!email) return 'El email es obligatorio.';
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email))
      return 'El formato del email no es válido (ej: nombre@gmail.com).';
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!this.DOMINIOS_VALIDOS.includes(dominio))
      return `Dominio no permitido. Usa: ${this.DOMINIOS_VALIDOS.slice(0, 4).join(', ')}…`;
    return null;
  }

  private validarUsuario(): boolean {
    this.erroresUser = {};
    let ok = true;

    if (!this.userForm.nombre?.trim()) {
      this.erroresUser['nombre'] = 'El nombre es obligatorio.'; ok = false;
    }

    const emailError = this.validarEmail(this.userForm.email?.trim() ?? '');
    if (emailError) { this.erroresUser['email'] = emailError; ok = false; }

    if (!this.editingUser && !this.userForm.password?.trim()) {
      this.erroresUser['password'] = 'La contraseña es obligatoria para usuarios nuevos.'; ok = false;
    } else if (this.userForm.password?.trim() && this.userForm.password.trim().length < 6) {
      this.erroresUser['password'] = 'La contraseña debe tener al menos 6 caracteres.'; ok = false;
    }

    if (!this.userForm.rolNombre) {
      this.erroresUser['rolNombre'] = 'Selecciona un rol.'; ok = false;
    }

    return ok;
  }

  saveUser(): void {
    if (!this.validarUsuario()) return;
    this.isLoading = true;
    const obs = this.editingUser
      ? this.userService.updateUser(this.editingUser.id!, this.userForm)
      : this.userService.createUser(this.userForm);
    obs.subscribe({
      next:  () => { this.loadUsuarios(); this.closeUserModal(); this.isLoading = false; this.showSuccess('Usuario guardado'); },
      error: (e: any) => { this.error = e.error?.message || 'Error al guardar usuario'; this.isLoading = false; }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.userService.deleteUser(id).subscribe({
      next:  () => { this.loadUsuarios(); this.showSuccess('Usuario eliminado'); },
      error: (e: any) => this.error = e.error?.message || 'Error al eliminar'
    });
  }

  getNombreGenero(g: string): string {
    const map: Record<string, string> = { M: 'Masculino', F: 'Femenino', NB: 'No binario' };
    return map[g] ?? g ?? '—';
  }

  get totalDirectores(): number  { return this.usuarios.filter(u => (u.rol as string)?.toLowerCase() === 'director').length; }
  get totalCeladores(): number   { return this.usuarios.filter(u => (u.rol as string)?.toLowerCase() === 'celador').length; }
  get totalResidentes(): number  { return this.usuarios.filter(u => (u.rol as string)?.toLowerCase() === 'residente').length; }

  // ── Secciones ─────────────────────────────────────────────────────────────

  loadSecciones(): void { this.seccionService.listar().subscribe({ next: d => this.secciones = d, error: () => {} }); }

  openSeccionModal(s?: Seccion): void {
    this.editingSeccion   = s || null;
    this.seccionForm      = s ? { ...s } : { nombre: '', descripcion: '' };
    this.erroresSeccion   = {};
    this.showSeccionModal = true;
    this.error            = '';
  }

  closeSeccionModal(): void { this.showSeccionModal = false; this.editingSeccion = null; this.erroresSeccion = {}; this.error = ''; }

  private validarSeccion(): boolean {
    this.erroresSeccion = {};
    let ok = true;
    if (!this.seccionForm.nombre?.trim()) {
      this.erroresSeccion['nombre'] = 'El nombre de la sección es obligatorio.'; ok = false;
    } else if (this.seccionForm.nombre.trim().length < 3) {
      this.erroresSeccion['nombre'] = 'El nombre debe tener al menos 3 caracteres.'; ok = false;
    }
    return ok;
  }

  saveSeccion(): void {
    if (!this.validarSeccion()) return;
    this.isLoading = true;
    const obs = this.editingSeccion
      ? this.seccionService.actualizar(this.editingSeccion.id!, this.seccionForm)
      : this.seccionService.crear(this.seccionForm);
    obs.subscribe({
      next:  () => { this.loadSecciones(); this.closeSeccionModal(); this.isLoading = false; this.showSuccess('Sección guardada'); },
      error: (e: any) => { this.error = e.error?.message || 'Error al guardar sección'; this.isLoading = false; }
    });
  }

  deleteSeccion(id: number): void {
    if (!confirm('¿Eliminar esta sección?')) return;
    this.seccionService.eliminar(id).subscribe({
      next:  () => { this.loadSecciones(); this.showSuccess('Sección eliminada'); },
      error: (e: any) => this.error = e.error?.message || 'Error al eliminar'
    });
  }

  toggleSeccion(s: Seccion): void {
    this.seccionService.desactivar(s.id!).subscribe({
      next: () => { this.loadSecciones(); this.showSuccess('Sección actualizada'); },
      error: () => {}
    });
  }

  getSeccionNombre(id: any): string {
    return this.secciones.find(s => s.id === Number(id))?.nombre ?? 'Sin sección';
  }

  // ── Solicitudes ───────────────────────────────────────────────────────────

  loadSolicitudes(): void {
    this.loadingSolicitudes = true;
    this.errorSolicitudes   = '';

    this.solicitudService.obtenerTodas().subscribe({
      next: (d: any[]) => {
        this.solicitudes = (d || []).map((s: any) => ({
          ...s,
          // Normaliza tanto {nombre:'PENDIENTE'} como 'PENDIENTE' directo
          estado: (s.estado?.nombre ?? s.estado ?? '').toString().toUpperCase()
        }));
        this.solicitudesPendientes = this.solicitudes.filter(s => s.estado === 'PENDIENTE').length;
        this.loadingSolicitudes    = false;
      },
      error: (e: any) => {
        const status = e.status ?? '?';
        if (status === 401 || status === 403) {
          this.errorSolicitudes = `Sin permisos para cargar solicitudes (error ${status}). Verifica que el token del director sea válido.`;
        } else if (status === 0) {
          this.errorSolicitudes = 'No se pudo conectar con el servidor. ¿Está arrancado el backend en el puerto 9090?';
        } else {
          this.errorSolicitudes = `Error ${status} al cargar solicitudes: ${e.error?.message || e.message || 'Sin detalle'}`;
        }
        this.solicitudes           = [];
        this.solicitudesPendientes = 0;
        this.loadingSolicitudes    = false;
      }
    });
  }

  get solicitudesFiltradas(): Solicitud[] {
    let lista = this.solicitudes;
    if (this.filtroEstado) lista = lista.filter(s => s.estado === this.filtroEstado);
    const q = this.busquedaSolicitud.trim().toLowerCase();
    if (q) lista = lista.filter(s =>
      s.nombre?.toLowerCase().includes(q)    || s.apellidos?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)     || s.facultad?.toLowerCase().includes(q)  ||
      s.edificio?.toLowerCase().includes(q)  || s.habitacion?.toLowerCase().includes(q)
    );
    return lista;
  }

  contarPorEstado(estado: string): number { return this.solicitudes.filter(s => s.estado === estado).length; }
  setFiltroEstado(estado: string): void   { this.filtroEstado = this.filtroEstado === estado ? '' : estado; }

  aprobarSolicitud(id: number): void {
    if (!confirm('¿Aprobar esta solicitud? Se enviarán las credenciales por email.')) return;
    this.solicitudService.aprobar(id).subscribe({
      next: () => {
        this.showSuccess('✅ Solicitud aprobada — credenciales enviadas por email');
        this.loadSolicitudes(); this.loadUsuarios();
      },
      error: (e: any) => this.error = e.error?.message || 'Error al aprobar'
    });
  }

  rechazarSolicitud(id: number): void {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    this.solicitudService.rechazar(id).subscribe({
      next: () => {
        this.showSuccess('❌ Solicitud rechazada — notificación enviada por email');
        this.loadSolicitudes();
      },
      error: (e: any) => this.error = e.error?.message || 'Error al rechazar'
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  showSuccess(msg: string): void { this.success = msg; setTimeout(() => this.success = '', 3500); }
  logout(): void { this.auth.logout(); }

  formatDate(d: any): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private noticiaFormVacio(): any {
    return { titulo: '', descripcion: '', imagen: '', seccionId: undefined, estado: 'PUBLICADO', prioridad: 'NORMAL' };
  }

  private userFormVacio(): any {
    return { nombre: '', apellidos: '', email: '', password: '', rolNombre: 'Residente',
             genero: '', facultad: '', seleccion: '', activo: true, habitacionId: null };
  }
  // ═══════════════════════════════════════════════════════════════════
// PROPIEDADES NUEVAS — añadir en la clase del componente
// ═══════════════════════════════════════════════════════════════════

// Filtros de la sección Noticias
filtroEstadoNoticias: string = '';
filtroSeccionNoticias: string | number = '';

// Lista filtrada para la tabla de Noticias (reemplaza el uso directo de `noticias`)
noticiasFiltradas: any[] = [];   // mismo tipo que noticias[]

// Control del checkbox "seleccionar todas"
todasSeleccionadas: boolean = false;
get todasNoticiasFiltradas(): boolean {
  return this.noticiasFiltradas.length > 0;
}


// ═══════════════════════════════════════════════════════════════════
// MÉTODOS NUEVOS — añadir en la clase del componente
// ═══════════════════════════════════════════════════════════════════

/** Inicializar noticiasFiltradas cuando se cargan las noticias.
 *  Llamar también tras cada carga/recarga de noticias. */
inicializarFiltrosNoticias(): void {
  this.noticiasFiltradas = [...this.noticias];
}

/** Aplica los filtros seleccionados */
aplicarFiltrosNoticias(): void {
  this.noticiasFiltradas = this.noticias.filter(n => {
    const cumpleEstado = !this.filtroEstadoNoticias
      || n.estado === this.filtroEstadoNoticias;
    const cumpleSeccion = !this.filtroSeccionNoticias
      || n.seccionId == this.filtroSeccionNoticias;
    return cumpleEstado && cumpleSeccion;
  });
  this.todasSeleccionadas = false;
}

/** Limpia los filtros y muestra todas las noticias */
limpiarFiltrosNoticias(): void {
  this.filtroEstadoNoticias = '';
  this.filtroSeccionNoticias = '';
  this.noticiasFiltradas = [...this.noticias];
  this.todasSeleccionadas = false;
}

/** Selecciona / deselecciona todas las filas visibles */
toggleSeleccionarTodasNoticias(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  this.todasSeleccionadas = checked;
  this.noticiasFiltradas.forEach(n => (n as any).seleccionada = checked);
}

/** Actualiza el estado del checkbox global al cambiar uno individual */
onNoticiaSeleccionadaChange(): void {
  this.todasSeleccionadas = this.noticiasFiltradas.every(n => (n as any).seleccionada);
}


// ═══════════════════════════════════════════════════════════════════
// EN ngOnInit o donde cargues las noticias — añadir esta línea:
// ═══════════════════════════════════════════════════════════════════
// this.inicializarFiltrosNoticias();
//
// Y también al final de cualquier método que recargue noticias
// (loadNoticias, saveNoticia, deleteNoticia, autorizarNoticia…):
// this.inicializarFiltrosNoticias();


// ═══════════════════════════════════════════════════════════════════
// EJEMPLO — cómo puede verse el método loadNoticias actualizado:
// ═══════════════════════════════════════════════════════════════════
/*
loadNoticias(): void {
  this.noticiaService.getNoticias().subscribe({
    next: (data) => {
      this.noticias = data;
      this.inicializarFiltrosNoticias();   // <-- añadir esta línea
    },
    error: (err) => { this.error = 'Error al cargar noticias'; }
  });
}
*/
}