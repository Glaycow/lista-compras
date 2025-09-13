import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TuiIcon} from '@taiga-ui/core';
import {TuiAppBar} from '@taiga-ui/layout';
import {NavbarButton} from '../model/nav-bar-button';
import {NavBarButtonService} from '../service/nav-bar-button-service';

@Component({
  selector: 'app-app-bar-component',
  imports: [
    TuiAppBar,
    TuiIcon,
    RouterLink
  ],
  templateUrl: './app-bar-component.html',
  styleUrl: './app-bar-component.less'
})
export class AppBarComponent {
  private readonly nabBarButtonService = inject(NavBarButtonService);
  readonly buttons = this.nabBarButtonService.buttons
  readonly title = this.nabBarButtonService.titleApp;
  readonly urlBack = this.nabBarButtonService.urlBack;

  onButtonClick(button: NavbarButton) {
    button.action();
  }
}
