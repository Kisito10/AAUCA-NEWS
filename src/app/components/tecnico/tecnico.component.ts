import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { PerfilComponent } from '../perfil/perfil.component';

@Component({
  selector: 'app-tecnico',
  standalone: true,
  imports: [CommonModule, FormsModule, PerfilComponent],
  templateUrl: './tecnico.component.html',
  styleUrls: ['./tecnico.component.css']
})
export class TecnicoComponent implements OnInit {

  currentUser: User | null = null;
  horaActual  = '';
  success     = '';
  error       = '';
  activeTab   = 'backups';
  mostrarPerfil = false;

  realizandoBackup = false;
  historialBackups: any[] = [];

  cargandoStats = false;
  estadisticas:  any[] = [];

  filtroLog    = 'todos';
  cargandoLogs = false;
  logsFiltrados: any[] = [];

  cuentasBloqueadas: any[] = [];
  desbloqueando = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 1000);
    this.cargarHistorial();
    this.refrescarEstadisticas();
    this.refrescarLogs();
    this.cargarCuentasBloqueadas();
  }

  private actualizarHora(): void {
    this.horaActual = new Date().toLocaleString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  // ✅ Sin avatar por defecto
  fotoUrl(foto?: string | null): string {
    if (!foto) return '';
    const limpia = foto.split('?')[0];
    const base   = limpia.startsWith('http') ? limpia : 'http://localhost:9090' + limpia;
    return base + '?t=' + Date.now();
  }

  recargarUsuario(): void { this.currentUser = this.auth.getCurrentUser(); }

  onPerfilActualizado(userActualizado: User): void {
    this.currentUser = { ...userActualizado };
  }

  logout(): void { this.auth.logout(); }

  showSuccess(msg: string): void { this.success = msg; setTimeout(() => this.success = '', 4000); }
  showError(msg: string): void   { this.error   = msg; setTimeout(() => this.error   = '', 5000); }

  cargarHistorial(): void {
    const guardado = localStorage.getItem('aauca_backups');
    this.historialBackups = guardado ? JSON.parse(guardado) : [];
  }

  realizarBackupBD(): void {
    this.realizandoBackup = true;
    setTimeout(() => {
      this.historialBackups.push({ fecha: new Date().toLocaleString(), tipo: 'BD', estado: 'OK', tamanio: '2.3 MB', duracion: '1.2s' });
      localStorage.setItem('aauca_backups', JSON.stringify(this.historialBackups));
      this.realizandoBackup = false;
      this.showSuccess('Backup de BD realizado correctamente');
    }, 2000);
  }

  realizarBackupArchivos(): void {
    this.realizandoBackup = true;
    setTimeout(() => {
      this.historialBackups.push({ fecha: new Date().toLocaleString(), tipo: 'Archivos', estado: 'OK', tamanio: '45 MB', duracion: '3.1s' });
      localStorage.setItem('aauca_backups', JSON.stringify(this.historialBackups));
      this.realizandoBackup = false;
      this.showSuccess('Backup de archivos realizado correctamente');
    }, 2000);
  }

  realizarBackupCompleto(): void {
    this.realizandoBackup = true;
    setTimeout(() => {
      this.historialBackups.push({ fecha: new Date().toLocaleString(), tipo: 'Completo', estado: 'OK', tamanio: '47.3 MB', duracion: '5.8s' });
      localStorage.setItem('aauca_backups', JSON.stringify(this.historialBackups));
      this.realizandoBackup = false;
      this.showSuccess('Backup completo realizado correctamente');
    }, 3000);
  }

  exportarHistorial(): void {
    const csv = 'Fecha,Tipo,Estado,Tamaño,Duración\n' +
      this.historialBackups.map(b => `${b.fecha},${b.tipo},${b.estado},${b.tamanio ?? ''},${b.duracion ?? ''}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'historial_backups.csv'; a.click();
    window.URL.revokeObjectURL(url);
  }

  limpiarHistorial(): void {
    this.historialBackups = [];
    localStorage.removeItem('aauca_backups');
    this.showSuccess('Historial de backups limpiado');
  }

  refrescarEstadisticas(): void {
    this.cargandoStats = true;
    setTimeout(() => {
      this.estadisticas = [
        { icono: '🖥️', valor: 'Online',   label: 'Servidor',    color: 'success' },
        { icono: '📡', valor: 'Activo',   label: 'Red',         color: 'info'    },
        { icono: '💾', valor: '68%',      label: 'Disco',       color: 'warning' },
        { icono: '🧠', valor: '42%',      label: 'Memoria RAM', color: 'primary' },
      ];
      this.cargandoStats = false;
    }, 1500);
  }

  refrescarLogs(): void {
    this.cargandoLogs = true;
    setTimeout(() => {
      const logs = [
        { hora: '10:00', nivel: 'INFO',  mensaje: 'Sistema iniciado correctamente' },
        { hora: '10:05', nivel: 'WARN',  mensaje: 'Uso de memoria por encima del 80%' },
        { hora: '10:10', nivel: 'ERROR', mensaje: 'Fallo en conexión al microservicio de noticias' },
        { hora: '10:15', nivel: 'INFO',  mensaje: 'Reconexión exitosa' },
      ];
      this.logsFiltrados = this.filtroLog === 'todos'
        ? logs : logs.filter(l => l.nivel === this.filtroLog);
      this.cargandoLogs = false;
    }, 1000);
  }

  badgeLog(nivel: string): string {
    const map: Record<string, string> = { INFO: 'bg-info', WARN: 'bg-warning text-dark', ERROR: 'bg-danger' };
    return map[nivel] ?? 'bg-secondary';
  }

  cargarCuentasBloqueadas(): void {
    this.cuentasBloqueadas = [];
  }

  desbloquearCuenta(id: number, nombre: string): void {
    this.desbloqueando = true;
    setTimeout(() => {
      this.cuentasBloqueadas = this.cuentasBloqueadas.filter(c => c.id !== id);
      this.desbloqueando = false;
      this.showSuccess(`Cuenta de ${nombre} desbloqueada`);
    }, 1500);
  }
}