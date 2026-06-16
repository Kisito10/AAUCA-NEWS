import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService, ValoresFiltro, Edificio, Habitacion } from '../../services/user.service';
import { NoticiaService } from '../../services/noticia.service';
import { SeccionService } from '../../services/seccion.service';
import { DestinatarioService } from '../../services/destinatario.service';
import { SolicitudService } from '../../services/solicitud.service';
import { LecturaService, NoticiaLectura, LecturasPage } from '../../services/lectura.service';
import { User } from '../../models/user.model';
import { Noticia, TipoDestinatario, NoticiaDestinatario } from '../../models/noticia.model';
import { Seccion, Solicitud } from '../../models/solicitud.model';
import { switchMap } from 'rxjs/operators';
import { iconoPorTipo } from '../../utils/destinatario.utils';
import { environment } from '../../../environments/environment';
import { PerfilComponent } from '../perfil/perfil.component';

type Vista = 'dashboard' | 'noticias' | 'estudiantes' | 'solicitudes';

interface EstudianteRow {
  id?:               number;
  nombre:            string;
  apellidos?:        string;
  email:             string;
  rol:               string;
  foto?:             string;
  activo?:           boolean;
  habitacionId?:     number | null;
  habitacionNumero?: string;
  edificioId?:       number | null;
  edificioNombre?:   string;
  estadoCuenta:      'PENDIENTE' | 'ACTIVO' | 'INACTIVO';
  cargando:          boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, PerfilComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  // ── Vista activa (navegación sidebar) ────────────────────────────────────
  vistaActual: Vista = 'dashboard';

  cambiarVista(vista: Vista): void {
    this.vistaActual = vista;
  }

  currentUser: User | null = null;
  mostrarPerfil = false;

  // ── Noticias ──────────────────────────────────────────────────────────────
  noticias:          Noticia[]      = [];
  borradores:        Noticia[]      = [];
  publicadas:        Noticia[]      = [];
  showModal          = false;
  editingNoticia:    Noticia | null = null;
  noticiaPreview:    string | null  = null;
  selectedImageFile: File   | null  = null;
  noticiaForm: any = this.formVacio();
  erroresNoticia: { [k: string]: string } = {};

  tipos:                TipoDestinatario[] = [];
  tipoSeleccionado:     TipoDestinatario | null = null;
  valorDestinatario   = '';
  valoresFiltro:        ValoresFiltro = { facultades: [], generos: [], selecciones: [] };
  edificios:            Edificio[]    = [];
  habitaciones:         Habitacion[]  = [];
  edificioSeleccionado: number | null = null;
  usuarios:             User[]        = [];

  secciones: Seccion[] = [];
  isLoading = false;
  error     = '';

  /** Últimas 5 noticias para el dashboard */
  get noticiasDashboard(): Noticia[] {
    return [...this.noticias]
      .sort((a, b) => new Date(b.fechaPublicacion ?? 0).getTime() - new Date(a.fechaPublicacion ?? 0).getTime())
      .slice(0, 5);
  }

  // ── Gestión de Estudiantes ────────────────────────────────────────────────
  estudiantes:            EstudianteRow[] = [];
  estudiantesFiltrados:   EstudianteRow[] = [];
  cargandoEstudiantes   = false;
  filtroEstadoEstudiantes = 'TODOS';
  mensajeExito          = '';

  get pendientesCount(): number {
    return this.estudiantes.filter(e => e.estadoCuenta === 'PENDIENTE').length;
  }

  // ── Modal Usuario (editar estudiante) ────────────────────────────────────
  showUserModal               = false;
  editingUser:    EstudianteRow | null = null;
  userForm: any                = {};
  erroresUser: { [k: string]: string } = {};
  habitacionesUsuario:         Habitacion[] = [];
  edificioSeleccionadoUsuario: number | null = null;

  get plantasUsuario(): number[] {
    if (!this.habitacionesUsuario.length) return [];
    return [...new Set(this.habitacionesUsuario.map(h => h.piso ?? 0))].sort((a, b) => a - b);
  }

  habitacionesUsuarioPorPlanta(planta: number): Habitacion[] {
    return this.habitacionesUsuario
      .filter(h => h.piso === planta)
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }

  // ── Solicitudes de Registro ───────────────────────────────────────────────
  solicitudes:          Solicitud[] = [];
  cargandoSolicitudes = false;
  errorSolicitudes    = '';
  exitoSolicitudes    = '';
  cargandoSolicitudMap: Map<number, boolean> = new Map();

  showSolicitudModal               = false;
  solicitudSeleccionada: Solicitud | null = null;

  get solicitudesPendientesCount(): number {
    return this.solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  }

  get urgentesCount(): number {
    return this.publicadas.filter(n => n.prioridad === 'URGENTE').length;
  }

  // ── Lecturas ──────────────────────────────────────────────────────────────
  lectoresModal:        boolean          = false;
  noticiaLecturas:      NoticiaLectura[] = [];
  lecturasPagina:       number           = 0;
  lecturasTotal:        number           = 0;
  lecturasTotalPaginas: number           = 0;
  noticiaSeleccionada:  any              = null;
  loadingLecturas:      boolean          = false;

  constructor(
    private auth:                AuthService,
    private userService:         UserService,
    private noticiaService:      NoticiaService,
    private seccionService:      SeccionService,
    private destinatarioService: DestinatarioService,
    private solicitudService:    SolicitudService,
    private lecturaService:      LecturaService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.seccionService.listarActivas().subscribe({ next: d => this.secciones = d, error: () => {} });
    this.destinatarioService.getTipos().subscribe({
      next: d => {
        this.tipos = d;
        this.tipoSeleccionado = d.find(t => t.nombre === 'TODOS') ?? d[0] ?? null;
      },
      error: () => {}
    });
    this.userService.getValoresFiltro().subscribe({ next: d => this.valoresFiltro = d, error: () => {} });
    this.userService.getEdificios().subscribe({ next: d => this.edificios = d, error: () => {} });
    this.userService.getUsers().subscribe({
      next: (d: any[]) => this.usuarios = d.map(u => ({ ...u, rol: u.rol?.nombre ?? u.rol })),
      error: () => {}
    });
    this.loadNoticias();
    this.loadEstudiantes();
    this.loadSolicitudes();
  }

  // ── Foto de perfil ────────────────────────────────────────────────────────
  private readonly _ts = Date.now();

  fotoUrl(foto?: string | null): string {
    if (!foto) return '';
    const limpia = foto.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + this._ts;
  }

  recargarUsuario(): void { this.currentUser = this.auth.getCurrentUser(); }

  solicitudFotoUrl(ruta?: string | null): string {
    if (!ruta) return '';
    const limpia = ruta.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + this._ts;
  }

  onPerfilActualizado(userActualizado: User): void {
    this.currentUser = { ...userActualizado };
  }

  // ── Noticias ──────────────────────────────────────────────────────────────

  loadNoticias(): void {
    this.noticiaService.getNoticias().subscribe({
      next: data => {
        this.noticias = data
          .filter(n => n.rolCreador?.toLowerCase() === 'celador')
          .map(n => ({
            ...n,
            imagen: n.imagen && !n.imagen.startsWith('http')
              ? environment.imgBase + (n.imagen.startsWith('/') ? n.imagen : '/' + n.imagen)
              : n.imagen
          }));
        this.borradores = this.noticias.filter(n => n.estado === 'BORRADOR');
        this.publicadas  = this.noticias.filter(n => n.estado === 'PUBLICADO');
      },
      error: () => {}
    });
  }

  getSeccionNombre(id: any): string {
    return this.secciones.find(s => s.id === Number(id))?.nombre ?? 'Sin sección';
  }

  get tipoNecesitaValor(): boolean { return this.tipoSeleccionado?.nombre !== 'TODOS'; }
  iconoPorNombre(nombre: string): string { return iconoPorTipo(nombre); }

  seleccionarTipo(tipo: TipoDestinatario): void {
    this.tipoSeleccionado  = tipo;
    this.valorDestinatario = '';
    this.edificioSeleccionado = null;
    this.habitaciones = [];
  }

  onEdificioChange(edificioId: number): void {
    this.edificioSeleccionado = edificioId;
    this.valorDestinatario    = '';
    this.habitaciones         = [];
    this.userService.getHabitaciones(edificioId).subscribe({ next: d => this.habitaciones = d, error: () => {} });
  }

  get plantasDelEdificio(): number[] {
    if (!this.habitaciones.length) return [];
    return [...new Set(this.habitaciones.map(h => h.piso ?? 0))].sort((a, b) => a - b);
  }

  habitacionesPorPlanta(planta: number): Habitacion[] {
    return this.habitaciones
      .filter(h => h.piso === planta)
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }

  openModal(n?: Noticia): void {
    this.editingNoticia       = n || null;
    this.noticiaForm          = n ? { ...n } : this.formVacio();
    this.noticiaPreview       = n?.imagen || null;
    this.selectedImageFile    = null;
    this.valorDestinatario    = '';
    this.tipoSeleccionado     = this.tipos.find(t => t.nombre === 'TODOS') ?? this.tipos[0] ?? null;
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.erroresNoticia       = {};
    this.showModal            = true;
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

  closeModal(): void {
    this.showModal            = false;
    this.editingNoticia       = null;
    this.noticiaPreview       = null;
    this.selectedImageFile    = null;
    this.valorDestinatario    = '';
    this.edificioSeleccionado = null;
    this.habitaciones         = [];
    this.erroresNoticia       = {};
    this.error                = '';
  }

  onFileSelected(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.selectedImageFile = f;
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = (e: any) => { this.noticiaPreview = e.target.result; };
  }

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
    const esUrgente = this.noticiaForm.prioridad === 'URGENTE';

    const fd = new FormData();
    fd.append('titulo',      this.noticiaForm.titulo.trim());
    fd.append('descripcion', this.noticiaForm.descripcion.trim());
    fd.append('seccionId',   String(this.noticiaForm.seccionId));
    fd.append('estado',      esUrgente ? 'PUBLICADO' : 'BORRADOR');
    fd.append('prioridad',   this.noticiaForm.prioridad ?? 'NORMAL');

    if (this.selectedImageFile)
      fd.append('imagen', this.selectedImageFile, this.selectedImageFile.name);
    else if (this.editingNoticia && this.noticiaForm.imagen)
      fd.append('imagenUrl', this.noticiaForm.imagen);

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
        this.closeModal();
        this.isLoading = false;
      },
      error: (e: any) => {
        this.error     = e.error?.message || 'Error al guardar';
        this.isLoading = false;
      }
    });
  }

  deleteNoticia(id: number): void {
    if (!confirm('¿Eliminar esta noticia?')) return;
    this.destinatarioService.deleteByNoticia(id).pipe(
      switchMap(() => this.noticiaService.deleteNoticia(id))
    ).subscribe({
      next:  () => this.loadNoticias(),
      error: (e: any) => this.error = e.error?.message || 'Error al eliminar'
    });
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

  logout(): void { this.auth.logout(); }

  formatDate(d: any): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private formVacio(): any {
    return { titulo: '', descripcion: '', imagen: '', seccionId: undefined, estado: 'BORRADOR', prioridad: 'NORMAL' };
  }

  // ── Gestión de Estudiantes ────────────────────────────────────────────────

  loadEstudiantes(): void {
    this.cargandoEstudiantes = true;
    this.userService.getUsers().subscribe({
      next: (data: any[]) => {
        this.estudiantes = data
          .filter(u => {
            const rol = (u.rol?.nombre ?? u.rol ?? '').toUpperCase();
            return rol === 'RESIDENTE' || rol === 'ESTUDIANTE';
          })
          .map(u => ({
            id:               u.id,
            nombre:           u.nombre,
            apellidos:        u.apellidos,
            email:            u.email,
            rol:              u.rol?.nombre ?? u.rol,
            foto:             u.foto,
            activo:           u.activo,
            habitacionId:     u.habitacion?.id ?? u.habitacionId ?? null,
            habitacionNumero: u.habitacion?.numero ?? u.habitacionNumero ?? null,
            edificioId:       u.habitacion?.edificio?.id ?? u.edificioId ?? null,
            edificioNombre:   u.habitacion?.edificio?.nombre ?? u.edificioNombre ?? null,
            estadoCuenta:     this.resolverEstado(u),
            cargando:         false
          } as EstudianteRow));
        this.filtrarEstudiantes();
        this.cargandoEstudiantes = false;
      },
      error: () => { this.cargandoEstudiantes = false; }
    });
  }

  private resolverEstado(u: any): 'PENDIENTE' | 'ACTIVO' | 'INACTIVO' {
    if (u.activo === false || u.activo === 0) return 'INACTIVO';
    if (u.activo === true  || u.activo === 1) return 'ACTIVO';
    if (u.estado === 'PENDIENTE') return 'PENDIENTE';
    if (u.estado === 'INACTIVO')  return 'INACTIVO';
    return 'ACTIVO';
  }

  filtrarEstudiantes(): void {
    this.estudiantesFiltrados = this.filtroEstadoEstudiantes === 'TODOS'
      ? [...this.estudiantes]
      : this.estudiantes.filter(e => e.estadoCuenta === this.filtroEstadoEstudiantes);
  }

  cambiarEstadoEstudiante(est: EstudianteRow, nuevoEstado: 'ACTIVO' | 'INACTIVO'): void {
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
    if (!confirm(`¿Deseas ${accion} la cuenta de ${est.nombre} ${est.apellidos}?`)) return;
    est.cargando = true;

    const peticion$ = nuevoEstado === 'INACTIVO'
      ? this.userService.desactivarUser(est.id!)
      : this.userService.updateUser(est.id!, { activo: true });

    peticion$.subscribe({
      next: () => {
        est.estadoCuenta = nuevoEstado;
        est.cargando     = false;
        this.filtrarEstudiantes();
        this.mensajeExito = `Cuenta de ${est.nombre} ${est.apellidos} ${nuevoEstado === 'ACTIVO' ? 'activada' : 'desactivada'} correctamente.`;
        setTimeout(() => this.mensajeExito = '', 4000);
      },
      error: (e: any) => {
        est.cargando = false;
        this.error   = e.error?.message || `Error al ${accion} la cuenta`;
      }
    });
  }

  // ── Modal Usuario (editar estudiante) ────────────────────────────────────

  openUserModal(est: EstudianteRow): void {
    this.editingUser  = est;
    this.userForm     = {
      nombre:       est.nombre,
      apellidos:    est.apellidos ?? '',
      email:        est.email,
      activo:       est.activo ?? (est.estadoCuenta === 'ACTIVO'),
      habitacionId: est.habitacionId ?? null
    };
    this.erroresUser  = {};
    this.error        = '';
    this.habitacionesUsuario         = [];
    this.edificioSeleccionadoUsuario = est.edificioId ?? null;

    if (this.edificioSeleccionadoUsuario) {
      this.userService.getHabitaciones(this.edificioSeleccionadoUsuario).subscribe({
        next: d => this.habitacionesUsuario = d,
        error: () => {}
      });
    }

    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal               = false;
    this.editingUser                 = null;
    this.userForm                    = {};
    this.erroresUser                 = {};
    this.habitacionesUsuario         = [];
    this.edificioSeleccionadoUsuario = null;
    this.error                       = '';
  }

  onEdificioUsuarioChange(edificioId: number | null): void {
    this.edificioSeleccionadoUsuario = edificioId;
    this.userForm.habitacionId       = null;
    this.habitacionesUsuario         = [];
    if (edificioId) {
      this.userService.getHabitaciones(edificioId).subscribe({
        next: d => this.habitacionesUsuario = d,
        error: () => {}
      });
    }
  }

  private validarUser(): boolean {
    this.erroresUser = {};
    let ok = true;

    if (!this.userForm.nombre?.trim()) {
      this.erroresUser['nombre'] = 'El nombre es obligatorio.'; ok = false;
    }
    if (!this.userForm.email?.trim()) {
      this.erroresUser['email'] = 'El email es obligatorio.'; ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.userForm.email.trim())) {
      this.erroresUser['email'] = 'El email no tiene un formato válido.'; ok = false;
    }

    return ok;
  }

  saveUser(): void {
    if (!this.editingUser?.id || !this.validarUser()) return;

    this.isLoading = true;
    this.error     = '';

    const payload: any = {
      nombre:       this.userForm.nombre.trim(),
      apellidos:    this.userForm.apellidos?.trim() ?? '',
      email:        this.userForm.email.trim(),
      activo:       this.userForm.activo,
      habitacionId: this.userForm.habitacionId ?? null
    };

    this.userService.updateUser(this.editingUser.id, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeUserModal();
        this.loadEstudiantes();
        this.mensajeExito = `Datos de ${payload.nombre} actualizados correctamente.`;
        setTimeout(() => this.mensajeExito = '', 4000);
      },
      error: (e: any) => {
        this.isLoading = false;
        this.error = e.error?.message || 'Error al actualizar el usuario';
      }
    });
  }

  // ── Solicitudes de Registro ───────────────────────────────────────────────

  isSolicitudCargando(id: number): boolean {
    return this.cargandoSolicitudMap.get(id) === true;
  }

  loadSolicitudes(): void {
    this.cargandoSolicitudes = true;
    this.errorSolicitudes    = '';
    this.solicitudService.obtenerPendientes().subscribe({
      next: d => {
        this.solicitudes         = d;
        this.cargandoSolicitudes = false;
        this.cargandoSolicitudMap.clear();
      },
      error: () => { this.cargandoSolicitudes = false; }
    });
  }

  abrirSolicitudModal(s: Solicitud): void {
    this.solicitudSeleccionada = s;
    this.showSolicitudModal     = true;
  }

  cerrarSolicitudModal(): void {
    this.showSolicitudModal     = false;
    this.solicitudSeleccionada = null;
  }

  aprobarSolicitud(id: number, nombre: string): void {
    if (!confirm(`¿Aprobar la solicitud de ${nombre}? Se creará su cuenta y recibirá las credenciales por email.`)) return;
    this.cargandoSolicitudMap.set(id, true);
    this.solicitudService.aprobar(id).subscribe({
      next: () => {
        this.exitoSolicitudes = `Solicitud de ${nombre} aprobada — credenciales enviadas por email.`;
        setTimeout(() => this.exitoSolicitudes = '', 5000);
        this.cerrarSolicitudModal();
        this.loadSolicitudes();
        this.loadEstudiantes();
      },
      error: (e: any) => {
        this.cargandoSolicitudMap.set(id, false);
        this.errorSolicitudes = e.error?.message || 'Error al aprobar la solicitud.';
      }
    });
  }

  rechazarSolicitud(id: number, nombre: string): void {
    if (!confirm(`¿Rechazar la solicitud de ${nombre}? Se le notificará por email.`)) return;
    this.cargandoSolicitudMap.set(id, true);
    this.solicitudService.rechazar(id).subscribe({
      next: () => {
        this.exitoSolicitudes = `Solicitud de ${nombre} rechazada — notificación enviada.`;
        setTimeout(() => this.exitoSolicitudes = '', 5000);
        this.cerrarSolicitudModal();
        this.loadSolicitudes();
      },
      error: (e: any) => {
        this.cargandoSolicitudMap.set(id, false);
        this.errorSolicitudes = e.error?.message || 'Error al rechazar la solicitud.';
      }
    });
  }
}