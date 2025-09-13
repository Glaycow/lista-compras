import {TuiPlatform} from '@taiga-ui/cdk';
import { TuiRoot } from "@taiga-ui/core";
import {Component, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TuiDynamicHeader} from '@taiga-ui/layout';
import {AppBarComponent} from './core/app-bar-component/app-bar-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, TuiDynamicHeader, TuiPlatform, AppBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected title = 'ListaCompras';
  platform = signal<"android" | "ios" | "web">('web');

  constructor() {
    this.setPlatform();
  }

  private setPlatform(): void {
    const userAgent = window.navigator.userAgent.toLowerCase();

   if (userAgent.includes('android')) {
      this.platform.set('android');
   } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
     this.platform.set('ios');
    } else {
     this.platform.set('web');
    }
  }
}
