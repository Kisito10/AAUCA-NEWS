import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email        = '';
  password     = '';
  errorMessage = '';
  isLoading    = false;
  showPw       = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }
    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        // ✅ Usa el AuthService para redirigir — centralizado y correcto para todos los roles
        this.authService.redirectBasedOnRole();
      },
      error: () => {
        this.isLoading    = false;
        this.errorMessage = 'Credenciales incorrectas. Verifica e inténtalo de nuevo.';
      }
    });
  }
}