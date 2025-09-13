import {Injectable, signal} from '@angular/core';
import {NavbarButton} from '../model/nav-bar-button';

@Injectable({providedIn: 'root'})
export class NavBarButtonService {
  private readonly _buttons =  signal<NavbarButton[]>([]);
  private readonly title = signal<string>('')
  readonly buttons = this._buttons.asReadonly();
  readonly titleApp = this.title;
  readonly urlBack = signal<string | null>(null)

  clearButtons() {
    this._buttons.set([]);
    this.setTitle('');
    this.urlBack.set(null);
  }

  setButtonVisibility(id: string, visible: boolean) {
    this._buttons.update(currentButtons => {
      return currentButtons.map(button =>
        button.id === id ? {...button, visible} : button
      );
    });
  }

  removeButton(id: string) {
    this._buttons.update(currentButtons =>
      currentButtons.filter(button => button.id !== id)
    );
  }

  addButton(newButton: NavbarButton) {
    this._buttons.update(currentButtons => {
      const existingButtonIndex = currentButtons.findIndex(b => b.id === newButton.id);

      if (existingButtonIndex > -1) {
        const updatedButtons = [...currentButtons];
        updatedButtons[existingButtonIndex] = {
          ...updatedButtons[existingButtonIndex],
          ...newButton,
          visible: newButton.visible ?? true // Garante que visible seja true por padrão
        };
        return updatedButtons;
      } else {
        return [...currentButtons, { ...newButton, visible: newButton.visible ?? true }];
      }
    });
  }

  setTitle(newTitle: string) {
    this.title.set(newTitle);
  }

  setarUrlBack(value: string): void {
    this.urlBack.set(value)
  }

}
