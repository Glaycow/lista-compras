import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import Aura from '@primeng/themes/aura';
import {PrimeNG} from 'primeng/config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'listaCompras';

  constructor(private readonly primeng: PrimeNG) {
    this.primeng.theme.set({
      preset: Aura,
      options: {
        cssLayer: {
          name: 'primeng',
          order: 'tailwind-base, primeng, tailwind-utilities'
        },
        darkModeSelector: false,
      }
    })
  }
}
