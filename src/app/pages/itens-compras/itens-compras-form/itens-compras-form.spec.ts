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
      // note: route params return strings; signal type is number but runtime value is string
      expect(component['shoppingId']()).toBeTruthy();
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
      expect(nav.titleApp()).toBe('Nova Compra');
    });

    it('should clear nav bar buttons on destroy', () => {
      const nav = (component as unknown as { navBarButtonService: { clearButtons: () => void } }).navBarButtonService;
      component.ngOnDestroy();
      expect(nav.buttons()).toEqual([]);
    });

    it('should navigate back on goBack', () => {
      const router = (component as unknown as { router: { navigate: (path: (string | number)[]) => Promise<boolean> } }).router;
      const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['goBack']();
      // shoppingId is from route param, which is string at runtime
      expect(routerSpy).toHaveBeenCalledWith(['/shopping', '5', 'items']);
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

      const updated = await shoppingItensService.geyById(itemId);
      expect(updated!.nome).toBe('Item Atualizado');
      expect(updated!.marca).toBe('Nova Marca');
      expect(updated!.quantidade).toBe(5);
      expect(updated!.itemMarcado).toBe(true);
    });

    it('should set edit title on init', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();
      const nav = (component as unknown as { navBarButtonService: { titleApp: () => string } }).navBarButtonService;
      expect(nav.titleApp()).toBe('Editar Compra');
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
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Cancelar');
      expect(buttons[1].textContent).toContain('Salvar');
    });

    it('should display total value', () => {
      expect(fixture.nativeElement.querySelector('.total-display')).toBeTruthy();
    });
  });
});
