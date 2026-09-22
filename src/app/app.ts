import {Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {AppBarComponent} from './core/app-bar-component/app-bar-component';
import {ToastComponent} from './shared/components/toast/toast.component';
import {NavigationLoadingComponent} from './shared/components/navigation-loading/navigation-loading.component';
import {KeyboardShortcutsDirective} from './shared/directives/keyboard-shortcuts.directive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppBarComponent, ToastComponent, NavigationLoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  hostDirectives: [KeyboardShortcutsDirective],
})
export class App {
}
