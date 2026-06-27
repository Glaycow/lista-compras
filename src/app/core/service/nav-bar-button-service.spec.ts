import {TestBed} from '@angular/core/testing';
import {NavBarButtonService} from './nav-bar-button-service';

describe('NavBarButtonService', () => {
  let service: NavBarButtonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavBarButtonService);
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty buttons, empty title, and null urlBack', () => {
    expect(service.buttons()).toEqual([]);
    expect(service.titleApp()).toBe('');
    expect(service.urlBack()).toBeNull();
  });

  // ────────────────────────────
  //  setTitle / titleApp
  // ────────────────────────────

  it('should update the title via setTitle', () => {
    service.setTitle('Minhas Compras');
    expect(service.titleApp()).toBe('Minhas Compras');
  });

  it('should overwrite the title on consecutive calls', () => {
    service.setTitle('Primeiro');
    service.setTitle('Segundo');
    expect(service.titleApp()).toBe('Segundo');
  });

  // ────────────────────────────
  //  addButton
  // ────────────────────────────

  it('should add a new button', () => {
    const btn = {id: 'btn-1', text: 'Adicionar', icon: 'plus', action: vi.fn()};
    service.addButton(btn);

    expect(service.buttons()).toHaveLength(1);
    expect(service.buttons()[0].id).toBe('btn-1');
    expect(service.buttons()[0].visible).toBe(true); // defaults to true
  });

  it('should use visible=false when explicitly set', () => {
    const btn = {id: 'btn-1', text: 'Oculto', icon: 'x', action: vi.fn(), visible: false};
    service.addButton(btn);

    expect(service.buttons()[0].visible).toBe(false);
  });

  it('should update an existing button when re-adding with same id', () => {
    service.addButton({id: 'btn-1', text: 'Original', icon: 'x', action: vi.fn()});
    service.addButton({id: 'btn-1', text: 'Atualizado', icon: 'y', action: vi.fn(), visible: false});

    expect(service.buttons()).toHaveLength(1);
    expect(service.buttons()[0].text).toBe('Atualizado');
    expect(service.buttons()[0].visible).toBe(false);
  });

  it('should keep existing properties when updating a button partially', () => {
    const originalAction = vi.fn();
    service.addButton({id: 'btn-1', text: 'Original', icon: 'x', action: originalAction, visible: true});
    service.addButton({id: 'btn-1', text: 'Novo texto', icon: 'y', action: vi.fn()});

    expect(service.buttons()).toHaveLength(1);
    expect(service.buttons()[0].text).toBe('Novo texto');
  });

  it('should maintain multiple buttons', () => {
    service.addButton({id: 'a', text: 'A', icon: '', action: vi.fn()});
    service.addButton({id: 'b', text: 'B', icon: '', action: vi.fn()});

    expect(service.buttons()).toHaveLength(2);
  });

  // ────────────────────────────
  //  removeButton
  // ────────────────────────────

  it('should remove a button by id', () => {
    service.addButton({id: 'keep', text: 'Keep', icon: '', action: vi.fn()});
    service.addButton({id: 'remove', text: 'Remove', icon: '', action: vi.fn()});

    service.removeButton('remove');

    expect(service.buttons()).toHaveLength(1);
    expect(service.buttons()[0].id).toBe('keep');
  });

  it('should do nothing when removing a non-existent button', () => {
    service.addButton({id: 'a', text: 'A', icon: '', action: vi.fn()});
    service.removeButton('non-existent');
    expect(service.buttons()).toHaveLength(1);
  });

  // ────────────────────────────
  //  setButtonVisibility
  // ────────────────────────────

  it('should toggle button visibility', () => {
    service.addButton({id: 'btn-1', text: 'Test', icon: '', action: vi.fn(), visible: true});

    service.setButtonVisibility('btn-1', false);
    expect(service.buttons()[0].visible).toBe(false);

    service.setButtonVisibility('btn-1', true);
    expect(service.buttons()[0].visible).toBe(true);
  });

  it('should do nothing when setting visibility on a non-existent button', () => {
    service.setButtonVisibility('non-existent', false);
    expect(service.buttons()).toEqual([]);
  });

  // ────────────────────────────
  //  clearButtons
  // ────────────────────────────

  it('should clear all buttons, title, and urlBack', () => {
    service.addButton({id: 'a', text: 'A', icon: '', action: vi.fn()});
    service.setTitle('Algo');
    service.setarUrlBack('/back');

    service.clearButtons();

    expect(service.buttons()).toEqual([]);
    expect(service.titleApp()).toBe('');
    expect(service.urlBack()).toBeNull();
  });

  // ────────────────────────────
  //  setarUrlBack
  // ────────────────────────────

  it('should set the back url', () => {
    expect(service.urlBack()).toBeNull();
    service.setarUrlBack('/shopping');
    expect(service.urlBack()).toBe('/shopping');
  });
});
