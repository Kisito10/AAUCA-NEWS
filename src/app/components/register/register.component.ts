import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { SolicitudService, HabitacionDisponibilidad, EstadoEmail } from '../../services/solicitud.service';
import { UserService, Edificio } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  // ── Campos del formulario ─────────────────────────────────────────────────
  nombre     = '';
  apellidos  = '';
  email      = '';
  genero     = '';
  facultad   = '';
  mensaje    = '';

  // ── Estado UI ─────────────────────────────────────────────────────────────
  errorMessage   = '';
  successMessage = '';
  isLoading      = false;

  // ── Foto ──────────────────────────────────────────────────────────────────
  fotoFile:    File   | null = null;
  fotoPreview: string | null = null;

  // ── Edificios ─────────────────────────────────────────────────────────────
  edificios:         Edificio[] = [];
  edificioSeleccionado: Edificio | null = null;
  cargandoEdificios  = false;

  // ── Habitaciones con disponibilidad ──────────────────────────────────────
  habitaciones:        HabitacionDisponibilidad[] = [];
  habitacionElegida:   HabitacionDisponibilidad | null = null;
  cargandoHabitaciones = false;

  // ── Verificación de email ─────────────────────────────────────────────────
  estadoEmail:         EstadoEmail | null = null;
  comprobandoEmail     = false;
  private email$       = new Subject<string>();

  // ── Rectificación detectada ───────────────────────────────────────────────
  fueRectificacion = false;

  constructor(
    private solicitudService: SolicitudService,
    private userService:      UserService,
    private router:           Router
  ) {}

  ngOnInit(): void {
    // Cargar edificios disponibles
    this.cargandoEdificios = true;
    this.userService.todosEdificios().subscribe({
      next:  (eds) => { this.edificios = eds.filter(e => e.activo); this.cargandoEdificios = false; },
      error: ()    => { this.cargandoEdificios = false; }
    });

    // Verificación de email con debounce — espera 600ms tras dejar de escribir
    this.email$.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !email.includes('@')) {
          this.estadoEmail     = null;
          this.comprobandoEmail = false;
          return [];
        }
        this.comprobandoEmail = true;
        return this.solicitudService.estadoEmail(email);
      })
    ).subscribe({
      next:  (res) => { this.estadoEmail = res; this.comprobandoEmail = false; },
      error: ()    => { this.estadoEmail = null; this.comprobandoEmail = false; }
    });
  }

  // ─── Email: emitir al subject para el debounce ────────────────────────────
  onEmailChange(): void {
    this.estadoEmail = null;
    this.email$.next(this.email.trim().toLowerCase());
  }

  // ─── Seleccionar edificio → cargar habitaciones ───────────────────────────
  onEdificioChange(): void {
    this.habitacionElegida = null;
    this.habitaciones      = [];

    if (!this.edificioSeleccionado?.id) return;

    this.cargandoHabitaciones = true;
    this.solicitudService
      .disponibilidadPorEdificio(this.edificioSeleccionado.id!)
      .subscribe({
        next:  (habs) => { this.habitaciones = habs; this.cargandoHabitaciones = false; },
        error: ()     => { this.cargandoHabitaciones = false; }
      });
  }

  // ─── Elegir habitación (solo si está disponible) ──────────────────────────
  elegirHabitacion(hab: HabitacionDisponibilidad): void {
    if (!hab.disponible) return;
    this.habitacionElegida = hab;
  }

  // ─── Agrupa habitaciones por piso para mostrarlas ordenadas ──────────────
  get habitacionesPorPiso(): { piso: number; habs: HabitacionDisponibilidad[] }[] {
    const pisos = new Map<number, HabitacionDisponibilidad[]>();
    for (const h of this.habitaciones) {
      const lista = pisos.get(h.piso) ?? [];
      lista.push(h);
      pisos.set(h.piso, lista);
    }
    return Array.from(pisos.entries())
      .sort(([a], [b]) => a - b)
      .map(([piso, habs]) => ({ piso, habs }));
  }

  // ─── Foto ─────────────────────────────────────────────────────────────────
  onFotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'El archivo debe ser una imagen (jpg, png, etc.)';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.errorMessage = 'La foto no debe superar 3 MB';
      return;
    }
    this.fotoFile    = file;
    const reader     = new FileReader();
    reader.onload    = (e: any) => { this.fotoPreview = e.target.result; };
    reader.readAsDataURL(file);
    this.errorMessage = '';
  }

  // ─── Enviar ───────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.errorMessage   = '';
    this.successMessage = '';
    this.fueRectificacion = false;

    if (!this.nombre.trim() || !this.email.trim()) {
      this.errorMessage = 'Nombre y email son obligatorios';
      return;
    }

    // Bloquear si el email ya tiene cuenta
    if (this.estadoEmail?.tieneCuenta) {
      this.errorMessage = this.estadoEmail.mensaje;
      return;
    }

    // Bloquear si no eligió habitación disponible
    if (!this.habitacionElegida) {
      this.errorMessage = 'Por favor selecciona una habitación disponible.';
      return;
    }

    this.isLoading = true;

    const fd = new FormData();
    fd.append('nombre', this.nombre.trim());
    fd.append('email',  this.email.trim());
    if (this.apellidos.trim())              fd.append('apellidos',  this.apellidos.trim());
    if (this.genero.trim())                 fd.append('genero',     this.genero.trim());
    if (this.facultad.trim())               fd.append('facultad',   this.facultad.trim());
    if (this.mensaje.trim())                fd.append('mensaje',    this.mensaje.trim());
    if (this.edificioSeleccionado?.nombre)  fd.append('edificio',   this.edificioSeleccionado.nombre);
    fd.append('habitacion', this.habitacionElegida.numero);
    if (this.fotoFile) fd.append('foto', this.fotoFile, this.fotoFile.name);

    this.solicitudService.enviarConFoto(fd).subscribe({
      next: (res: any) => {
        this.isLoading        = false;
        const esRect          = (res?.numRectificaciones ?? 0) > 0;
        this.fueRectificacion = esRect;
        this.successMessage   = esRect
          ? `✅ Solicitud rectificada (nº ${res.numRectificaciones}). Tu solicitud anterior fue reemplazada.`
          : '✅ ¡Solicitud enviada! Recibirás un email cuando sea revisada.';
        setTimeout(() => this.router.navigate(['/login']), 3500);
      },
      error: (err: any) => {
        this.isLoading    = false;
        this.errorMessage = err.error?.message
          || 'Error al enviar la solicitud. Inténtalo de nuevo.';
      }
    });
  }
}