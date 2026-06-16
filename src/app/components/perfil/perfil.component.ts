import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  /**
   * Usuario a editar. Es OPCIONAL: si el panel padre no lo pasa
   * (como admin, residente y técnico), se toma del AuthService.
   * Acepta tanto [user] como [usuario] gracias al alias.
   */
  @Input('usuario') user: User | null = null;

  /** Se emite al cerrar el modal */
  @Output() cerrar = new EventEmitter<void>();

  /** Se emite cuando el perfil se guardó correctamente (nombre que usan TODOS los paneles) */
  @Output() perfilActualizado = new EventEmitter<User>();

  // ── Foto ──────────────────────────────────────────────────────────────────
  fotoActual:  string | null = null;   // foto guardada en el servidor
  fotoPreview: string | null = null;   // preview de la nueva foto elegida
  fotoFile:    File   | null = null;   // archivo nuevo a subir

  // ── Formulario ────────────────────────────────────────────────────────────
  form: any = { nombre: '', apellidos: '', genero: '', facultad: '', seleccion: '', password: '' };

  showPw    = false;
  guardando = false;
  error     = '';
  success   = '';

  constructor(
    private auth:        AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Si el padre no pasó el usuario, lo tomamos del AuthService
    if (!this.user) this.user = this.auth.getCurrentUser();

    if (this.user) {
      this.form = {
        nombre:    this.user.nombre    ?? '',
        apellidos: this.user.apellidos ?? '',
        genero:    this.user.genero    ?? '',
        facultad:  this.user.facultad  ?? '',
        seleccion: this.user.seleccion ?? '',
        password:  ''
      };
      this.fotoActual = this.fotoUrl((this.user as any).foto);
    }
  }

  // ── Helpers de foto ───────────────────────────────────────────────────────

  get inicialNombre(): string {
    return (this.user?.nombre || 'U').charAt(0).toUpperCase();
  }

  private fotoUrl(foto?: string | null): string | null {
    if (!foto) return null;
    const limpia = foto.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + Date.now();
  }

  onFotoSelected(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      this.error = 'La imagen no puede superar los 5 MB.';
      return;
    }

    this.fotoFile = f;
    this.error    = '';
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = (e: any) => { this.fotoPreview = e.target.result; };
  }

  quitarFoto(): void {
    this.fotoFile    = null;
    this.fotoPreview = null;
  }

  // ── Guardar ───────────────────────────────────────────────────────────────

  guardar(): void {
    this.error = '';

    if (!this.form.nombre?.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }
    if (this.form.password?.trim() && this.form.password.trim().length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.user?.id) {
      this.error = 'No se pudo identificar el usuario.';
      return;
    }

    this.guardando = true;

    const fd = new FormData();
    fd.append('nombre',    this.form.nombre.trim());
    fd.append('apellidos', this.form.apellidos?.trim() ?? '');
    fd.append('genero',    this.form.genero ?? '');
    fd.append('facultad',  this.form.facultad?.trim() ?? '');
    fd.append('seleccion', this.form.seleccion?.trim() ?? '');
    if (this.form.password?.trim()) fd.append('password', this.form.password.trim());
    if (this.fotoFile)              fd.append('foto', this.fotoFile, this.fotoFile.name);

    this.userService.actualizarPerfil(this.user.id, fd).subscribe({
      next: (u: any) => {
        this.guardando = false;
        this.success   = '✅ Perfil actualizado correctamente';

        // Usuario actualizado que devolvemos al padre
        const actualizado: User = {
          ...this.user!,
          ...(u || {}),
          nombre:    this.form.nombre.trim(),
          apellidos: this.form.apellidos?.trim() ?? '',
          genero:    this.form.genero ?? '',
          facultad:  this.form.facultad?.trim() ?? '',
          seleccion: this.form.seleccion?.trim() ?? ''
        };

        this.user          = actualizado;
        this.fotoActual    = this.fotoUrl((u as any)?.foto ?? (this.user as any).foto);
        this.fotoPreview   = null;
        this.fotoFile      = null;
        this.form.password = '';

        // Refrescamos la sesión guardada si AuthService tiene ese método
        // (cast a any para no obligar a que exista)
        (this.auth as any).actualizarUsuarioLocal?.(actualizado);

        this.perfilActualizado.emit(actualizado);
        setTimeout(() => { this.success = ''; this.cerrar.emit(); }, 1500);
      },
      error: (e: any) => {
        this.guardando = false;
        this.error = e.error?.message || 'Error al guardar el perfil.';
      }
    });
  }
}