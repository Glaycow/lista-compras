import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, provideRouter} from '@angular/router';

import ItensComprasForm from './itens-compras-form';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {ToastService} from '../../../shared/service/toast.service';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {DbConfig} from '../../../shared/db/db-config';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('ItensComprasForm', () => {
  let component: ItensComprasForm;
  let fixture: ComponentFixture<ItensComprasForm>;
  let shoppingItensService: ShoppingItensService;
  let toastService: ToastService;

  const createActivatedRouteMock = (params: Record<string, string | null> = {}) => ({
    snapshot: { paramMap: { get: (key: string) => params[key] ?? null } },
  });

  // ────────────────────────────
  //  Create mode
  // ────────────────────────────

  describe('create mode', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ItensComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock({ shoppingId: '5' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ItensComprasForm);
      component = fixture.componentInstance;
      shoppingItensService = TestBed.inject(ShoppingItensService);
      toastService = TestBed.inject(ToastService);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in create mode with correct shoppingId', async () => {
      await component['ngOnInit']();
      expect(component['isEditMode']()).toBe(false);
      expect(component['shoppingId']()).toBe(5);
      expect(component['currentItemId']()).toBeNull();
    });

    it('should have form with default values', () => {
      const model = component['model']();
      expect(model.nome).toBe('');
      expect(model.marca).toBe('');
      expect(model.quantidade).toBe(1);
      expect(model.valor).toBe(0);
    });

    it('should compute totalValue correctly', () => {
      component['model'].set({ nome: 'Item', marca: '', quantidade: 3, valor: 10.5, itemMarcado: false });
      expect(component['totalValue']()).toBe(31.5);
    });

    it('should compute totalValue as 0 when quantidade or valor is 0', () => {
      component['model'].set({ nome: 'Item', marca: '', quantidade: 0, valor: 10, itemMarcado: false });
      expect(component['totalValue']()).toBe(0);
      component['model'].set({ nome: 'Item', marca: '', quantidade: 5, valor: 0, itemMarcado: false });
      expect(component['totalValue']()).toBe(0);
    });

    it('should show validation error for empty name when touched', () => {
      component['form'].nome().markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.error');
      expect(error).toBeTruthy();
      expect(error.textContent).toContain('obrigatório');
    });

    it('should create an item via service', async () => {
      const toastSpy = vi.spyOn(toastService, 'show');

      const item: ShoppingItem = {
        shoppingId: 5, nome: 'Arroz', marca: 'Tio João', quantidade: 2, valor: 28.9, itemMarcado: false,
      };
      await shoppingItensService.create(item);

      const items = await shoppingItensService['db'].shoppingItem
        .where('shoppingId').equals(5).toArray();
      expect(items).toHaveLength(1);
      expect(items[0].nome).toBe('Arroz');
      expect(items[0].marca).toBe('Tio João');

      toastService.show('Item adicionado com sucesso!');
      expect(toastSpy).toHaveBeenCalledWith('Item adicionado com sucesso!');
    });

    it('should create an item without marca when marca is empty', async () => {
      const item: ShoppingItem = {
        shoppingId: 5, nome: 'Feijão', quantidade: 1, valor: 8.5, itemMarcado: false,
      };
      await shoppingItensService.create(item);

      const items = await shoppingItensService['db'].shoppingItem
        .where('shoppingId').equals(5).toArray();
      expect(items).toHaveLength(1);
      expect(items[0].marca).toBeUndefined();
    });

    it('should handle submit error gracefully', () => {
      component['submitError'].set('Erro ao salvar');
      expect(component['submitError']()).toBe('Erro ao salvar');
    });

    it('should set title on init', async () => {
      const nav = (component as unknown as { navBarButtonService: { titleApp: () => string } }).navBarButtonService;
      await component['ngOnInit']();
      expect(nav.titleApp()).toBe('Novo item');
    });

    it('should clear nav bar buttons on destroy', () => {
      const nav = (component as unknown as { navBarButtonService: { clearButtons: () => void; buttons: () => unknown[] } }).navBarButtonService;
      component.ngOnDestroy();
      expect(nav.buttons()).toEqual([]);
    });

    it('should navigate back on goBack', () => {
      const router = (component as unknown as { router: { navigate: (path: (string | number)[]) => Promise<boolean> } }).router;
      const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['goBack']();
      expect(routerSpy).toHaveBeenCalledWith(['/shopping', 5, 'items']);
    });

    it('should submit a new item', async () => {
      await component['ngOnInit']();
      const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const toastSpy = vi.spyOn(toastService, 'show');
      component['model'].set({
        nome: 'Arroz', marca: 'Tio João', quantidade: 2, valor: 10, itemMarcado: false,
      });
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      await new Promise((r) => setTimeout(r, 500));
      expect(toastSpy).toHaveBeenCalledWith('Item adicionado com sucesso!');
      expect(component['isExiting']()).toBe(true);
    });

    it('should submit a new item without marca', async () => {
      await component['ngOnInit']();
      const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['model'].set({
        nome: 'Feijão', marca: '', quantidade: 1, valor: 8, itemMarcado: false,
      });
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      await new Promise((r) => setTimeout(r, 500));
      expect(component['isExiting']()).toBe(true);
    });

    it('should set submitError when create throws an Error', async () => {
      await component['ngOnInit']();
      vi.spyOn(shoppingItensService, 'create').mockRejectedValue(new Error('falhou'));
      component['model'].set({
        nome: 'Arroz', marca: '', quantidade: 1, valor: 10, itemMarcado: false,
      });
      fixture.detectChanges();
      await expect(component['save']()).rejects.toThrow('falhou');
      expect(component['submitError']()).toBe('falhou');
    });

    it('should set a fallback submitError when create throws a non-Error', async () => {
      await component['ngOnInit']();
      vi.spyOn(shoppingItensService, 'create').mockRejectedValue('oops');
      component['model'].set({
        nome: 'Arroz', marca: '', quantidade: 1, valor: 10, itemMarcado: false,
      });
      fixture.detectChanges();
      await expect(component['save']()).rejects.toBeTruthy();
      expect(component['submitError']()).toBe(
        'Ocorreu um erro inesperado ao salvar o item. Tente novamente.',
      );
    });

    it('should mark fields as touched when invalid form is submitted', () => {
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      expect(component['form'].nome().touched()).toBe(true);
    });
  });

  // ────────────────────────────
  //  Edit mode
  // ────────────────────────────

  describe('edit mode', () => {
    let itemId: number;

    beforeEach(async () => {
      await deleteShoppingDb();

      // Create test data using DbConfig directly
      const db = new DbConfig();
      itemId = await db.shoppingItem.add({
        shoppingId: 10, nome: 'Item Original', marca: 'Marca X', quantidade: 3, valor: 45.9, itemMarcado: false,
      });

      await TestBed.configureTestingModule({
        imports: [ItensComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: createActivatedRouteMock({
              shoppingId: '10',
              itemId: String(itemId),
            }),
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ItensComprasForm);
      component = fixture.componentInstance;
      shoppingItensService = TestBed.inject(ShoppingItensService);
      toastService = TestBed.inject(ToastService);
      fixture.detectChanges();
    });

    it('should load existing item data in edit mode', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();

      expect(component['isEditMode']()).toBe(true);
      expect(component['currentItemId']()).toBeTruthy();
      expect(component['model']().nome).toBe('Item Original');
      expect(component['model']().marca).toBe('Marca X');
      expect(component['model']().quantidade).toBe(3);
      expect(component['model']().valor).toBe(45.9);
    });

    it('should update item via service', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();

      await shoppingItensService.update({
        id: itemId, shoppingId: 10, nome: 'Item Atualizado', marca: 'Nova Marca',
        quantidade: 5, valor: 99.9, itemMarcado: true,
      });

      const updated = await shoppingItensService.getById(itemId);
      expect(updated!.nome).toBe('Item Atualizado');
      expect(updated!.marca).toBe('Nova Marca');
      expect(updated!.quantidade).toBe(5);
      expect(updated!.itemMarcado).toBe(true);
    });

    it('should set edit title on init', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();
      const nav = (component as unknown as { navBarButtonService: { titleApp: () => string } }).navBarButtonService;
      expect(nav.titleApp()).toBe('Editar item');
    });

    it('should submit an updated item', async () => {
      await component['ngOnInit']();
      const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const toastSpy = vi.spyOn(toastService, 'show');
      component['model'].set({
        nome: 'Item Editado', marca: 'Y', quantidade: 2, valor: 20, itemMarcado: true,
      });
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      await new Promise((r) => setTimeout(r, 500));
      expect(toastSpy).toHaveBeenCalledWith('Item atualizado com sucesso!');
    });

    it('should navigate back when the item does not exist', async () => {
      const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      await shoppingItensService.remove(itemId);
      await component['ngOnInit']();
      expect(navigateSpy).toHaveBeenCalledWith(['/shopping', 10, 'items']);
    });

    it('should load an item without marca as empty string', async () => {
      const id = await shoppingItensService.create({
        shoppingId: 10, nome: 'Sem marca', quantidade: 1, valor: 1, itemMarcado: false,
      });
      await component['loadItem'](id);
      expect(component['model']().marca).toBe('');
    });
  });

  // ────────────────────────────
  //  Rendering
  // ────────────────────────────

  describe('rendering', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ItensComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock({ shoppingId: '5' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ItensComprasForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render the form', () => {
      expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    });

    it('should render nome input', () => {
      expect(fixture.nativeElement.querySelector('#nome')).toBeTruthy();
    });

    it('should render marca input', () => {
      expect(fixture.nativeElement.querySelector('#marca')).toBeTruthy();
    });

    it('should render quantidade input', () => {
      expect(fixture.nativeElement.querySelector('#quantidade')).toBeTruthy();
    });

    it('should render submit and cancel buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.form-actions button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Cancelar');
      expect(buttons[1].textContent).toContain('Salvar');
    });

    it('should increment and decrement quantidade', () => {
      expect(component['model']().quantidade).toBe(1);
      component['adjustQuantidade'](1);
      expect(component['model']().quantidade).toBe(2);
      component['adjustQuantidade'](-1);
      expect(component['model']().quantidade).toBe(1);
      component['adjustQuantidade'](-1);
      expect(component['model']().quantidade).toBe(1);
    });

    it('should treat invalid quantidade as 0 when adjusting', () => {
      component['model'].update((m) => ({...m, quantidade: Number.NaN}));
      component['adjustQuantidade'](1);
      expect(component['model']().quantidade).toBe(1);
    });

    it('should display total value', () => {
      expect(fixture.nativeElement.querySelector('.total-display')).toBeTruthy();
    });
  });

  describe('invalid shopping route', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ItensComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock({ shoppingId: 'abc' }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ItensComprasForm);
      component = fixture.componentInstance;
    });

    it('should navigate home when shoppingId is invalid', async () => {
      const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      await component['ngOnInit']();
      expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
    });
  });
});
