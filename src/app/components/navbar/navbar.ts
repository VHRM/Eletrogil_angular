import { Component, inject, signal, type OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit{
  readonly user = signal('');

  constructor (private authService: AuthService) {}

  ngOnInit(): void {
    this.user.set(this.authService.getUser());
  }
}
