import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, provideRouter} from '@angular/router';

import ItensComprasLista from './itens-compras-lista';
import {ShoppingItensService} from '../../../shared/service/shopping-itens-service';
import {DbConfig} from '../../../shared/db/db-config';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('ItensComprasLista', () => {
  let component: ItensComprasLista;
  let fixture: ComponentFixture<ItensComprasLista>;
  let shoppingItensService: ShoppingItensService;

  const createActivatedRouteMock = (params: Record<string, string | null> = {}) => ({
    snapshot: { paramMap: { get: (key: string) => params[key] ?? null } },
  });

  beforeEach(async () => {
    await deleteShoppingDb();

    // Create test data using DbConfig directly
    const db = new DbConfig();
    await db.shopping.add({ id: 1, nome: 'Lista Teste', data: new Date('2026-01-15') });

    await TestBed.configureTestingModule({
      imports: [ItensComprasLista],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: createActivatedRouteMock({ id: '1' }) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItensComprasLista);
    component = fixture.componentInstance;
    shoppingItensService = TestBed.inject(ShoppingItensService);
    fixture.detectChanges();
  });

  // ────────────────────────────
  //  Initial state / creation
  // ────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty items signal', () => {
    expect(component['items']()).toEqual([]);
  });

  it('should have shoppingId from route after init', async () => {
    await component['ngOnInit']();
    // Route params return strings; component casts 'as number' but at runtime it's a string
    expect(component['shoppingId']()).toBe(1);
  });

  it('should load shopping data from route', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    expect(component['shopping']()).toBeTruthy();
    expect(component['shopping']()!.nome).toBe('Lista Teste');
  });

  it('should set title with shopping name', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    const nav = (component as unknown as { navBarButtonService: { titleApp: () => string } }).navBarButtonService;
    expect(nav.titleApp()).toBe('Lista de compras Lista Teste');
  });

  it('should set back url to /shopping', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    const nav = (component as unknown as { navBarButtonService: { urlBack: () => string | null } }).navBarButtonService;
    expect(nav.urlBack()).toBe('/shopping');
  });

  it('should add create button on init', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    const nav = (component as unknown as { navBarButtonService: { buttons: () => unknown[] } }).navBarButtonService;
    expect((nav.buttons()[0] as { id: string }).id).toBe('add-compra');
  });

  it('should clear buttons on destroy', () => {
    const nav = (component as unknown as { navBarButtonService: { clearButtons: () => void; buttons: () => unknown[] } }).navBarButtonService;
    component.ngOnDestroy();
    expect(nav.buttons()).toEqual([]);
  });

  // ────────────────────────────
  //  Items management
  // ────────────────────────────

  it('should load items for shopping', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    expect(component['items']()).toEqual([]);
  });

  it('should load items after adding them', async () => {
    await shoppingItensService.create({
      shoppingId: 1, nome: 'Item Teste', quantidade: 2, valor: 15.5, itemMarcado: false,
    });
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(1));
    expect(component['items']()[0].nome).toBe('Item Teste');
  });

  // ────────────────────────────
  //  toggleItemMarcado
  // ────────────────────────────

  it('should toggle item marcado status', async () => {
    const itemId = await shoppingItensService.create({
      shoppingId: 1, nome: 'Item Toggle', quantidade: 1, valor: 10, itemMarcado: false,
    });
    await component['ngOnInit']();
    fixture.detectChanges();

    await component['toggleItemMarcado']({
      id: itemId, shoppingId: 1, nome: 'Item Toggle', quantidade: 1, valor: 10, itemMarcado: false,
    });

    const found = await shoppingItensService.getById(itemId);
    expect(found!.itemMarcado).toBe(true);
  });

  // ────────────────────────────
  //  Confirm dialog flow
  // ────────────────────────────

  it('should show confirm dialog when showDeleteConfirm is called', () => {
    const event = new MouseEvent('click');
    vi.spyOn(event, 'stopPropagation');

    component['showDeleteConfirm'](123, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component['pendingDeleteItemId']()).toBe(123);
    expect(component['confirmDialogVisible']()).toBe(true);
  });

  it('should delete an item when confirmed', async () => {
    const itemId = await shoppingItensService.create({
      shoppingId: 1, nome: 'Deletar', quantidade: 1, valor: 10, itemMarcado: false,
    });
    component['pendingDeleteItemId'].set(itemId);
    component['confirmDialogVisible'].set(true);

    await component['onDeleteConfirmed']();

    expect(await shoppingItensService.getById(itemId)).toBeUndefined();
    expect(component['confirmDialogVisible']()).toBe(false);
    expect(component['pendingDeleteItemId']()).toBe(null);
  });

  it('should NOT delete an item when cancelled', () => {
    const removeSpy = vi.spyOn(shoppingItensService, 'remove');
    component['pendingDeleteItemId'].set(123);
    component['confirmDialogVisible'].set(true);

    component['onDeleteCancelled']();

    expect(removeSpy).not.toHaveBeenCalled();
    expect(component['confirmDialogVisible']()).toBe(false);
    expect(component['pendingDeleteItemId']()).toBe(null);
  });

  // ────────────────────────────
  //  Computed signals
  // ────────────────────────────

  it('should compute valorTotal correctly', async () => {
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 1', quantidade: 2, valor: 10, itemMarcado: false });
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 2', quantidade: 3, valor: 5, itemMarcado: true });
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    expect(component['valorTotal']()).toBe(35);
  });

  it('should compute valorPego correctly (only marcados)', async () => {
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 1', quantidade: 2, valor: 10, itemMarcado: false });
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 2', quantidade: 3, valor: 5, itemMarcado: true });
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    expect(component['valorPego']()).toBe(15);
  });

  // ────────────────────────────
  //  Rendering
  // ────────────────────────────

  it('should render empty state when no items', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Nenhum item adicionado');
  });

  it('should render items when they exist', async () => {
    await shoppingItensService.create({
      shoppingId: 1, nome: 'Arroz', quantidade: 5, valor: 28.9, itemMarcado: false,
    });
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(1));
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.item-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards[0].textContent).toContain('Arroz');
  });

  it('should render summary cards', async () => {
    await component['ngOnInit']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.summary-card')).toBeTruthy();
  });

  it('should compute progresso and marked count', async () => {
    await shoppingItensService.create({shoppingId: 1, nome: 'A', quantidade: 1, valor: 1, itemMarcado: true});
    await shoppingItensService.create({shoppingId: 1, nome: 'B', quantidade: 1, valor: 1, itemMarcado: false});
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    expect(component['itensMarcados']()).toBe(1);
    expect(component['progressoPct']()).toBe(50);
  });

  it('should keep progresso at 0 when there are no items', async () => {
    await component['ngOnInit']();
    expect(component['progressoPct']()).toBe(0);
  });

  it('should toast when toggle fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingItensService, 'updateItemMarcado').mockRejectedValue(new Error('fail'));
    await component['toggleItemMarcado']({
      id: 1, shoppingId: 1, nome: 'X', quantidade: 1, valor: 1, itemMarcado: false,
    });
    expect(showSpy).toHaveBeenCalledWith('Não foi possível atualizar o item.', 'error');
  });

  it('should toast when delete fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingItensService, 'remove').mockRejectedValue(new Error('fail'));
    component['pendingDeleteItemId'].set(1);
    await component['onDeleteConfirmed']();
    expect(showSpy).toHaveBeenCalledWith('Não foi possível excluir o item.', 'error');
  });

  it('should skip delete when pending id is null', async () => {
    const removeSpy = vi.spyOn(shoppingItensService, 'remove');
    component['pendingDeleteItemId'].set(null);
    await component['onDeleteConfirmed']();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('should toast when loadData fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(shoppingItensService, 'getShoppingById').mockRejectedValue(new Error('fail'));
    await component['ngOnInit']();
    expect(showSpy).toHaveBeenCalledWith('Não foi possível carregar os itens.', 'error');
  });

  it('should navigate to new item from the create button', async () => {
    await component['ngOnInit']();
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const nav = (component as unknown as { navBarButtonService: { buttons: () => { action: () => void }[] } }).navBarButtonService;
    nav.buttons()[0].action();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping/1/items/new']);
  });

  it('should filter items by search query', async () => {
    await shoppingItensService.create({shoppingId: 1, nome: 'Arroz', quantidade: 1, valor: 1, itemMarcado: false});
    await shoppingItensService.create({shoppingId: 1, nome: 'Feijão', quantidade: 1, valor: 1, itemMarcado: false});
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    component['searchQuery'].set('arroz');
    expect(component['filteredItems']()).toHaveLength(1);
  });

  it('should enter shop mode', async () => {
    await component['ngOnInit']();
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['enterShopMode']();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping', 1, 'shop']);
  });

  it('should filter pending and marked items', async () => {
    await shoppingItensService.create({shoppingId: 1, nome: 'A', quantidade: 1, valor: 1, itemMarcado: true});
    await shoppingItensService.create({shoppingId: 1, nome: 'B', quantidade: 1, valor: 1, itemMarcado: false});
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    component['setFilter']('pending');
    expect(component['filteredItems']()).toHaveLength(1);
    component['setFilter']('marked');
    expect(component['filteredItems']()).toHaveLength(1);
  });

  it('should detect budget exceeded', async () => {
    const db = new DbConfig();
    await db.shopping.put({id: 1, nome: 'Lista Teste', data: new Date(), orcamento: 10});
    await component['ngOnInit']();
    await shoppingItensService.create({shoppingId: 1, nome: 'Caro', quantidade: 1, valor: 20, itemMarcado: false});
    await vi.waitFor(() => expect(component['items']()).toHaveLength(1));
    expect(component['orcamentoExcedido']()).toBe(true);
  });

  it('should reorder items on drop', async () => {
    await shoppingItensService.create({shoppingId: 1, nome: 'A', quantidade: 1, valor: 1, itemMarcado: false, categoria: 'Outros'});
    const id2 = await shoppingItensService.create({shoppingId: 1, nome: 'B', quantidade: 1, valor: 1, itemMarcado: false, categoria: 'Outros'});
    await component['ngOnInit']();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(2));
    const items = component['items']();
    await component['onDrop']({
      previousIndex: 0,
      currentIndex: 1,
      container: {data: items},
    } as never, 'Outros');
    await vi.waitFor(() => expect(component['items']()[0].id).toBe(id2));
  });

  it('should toast when reorder fails', async () => {
    await component['ngOnInit']();
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingItensService, 'reorderItems').mockRejectedValue(new Error('fail'));
    await component['onDrop']({previousIndex: 0, currentIndex: 0, container: {data: []}} as never, 'Outros');
    expect(showSpy).toHaveBeenCalledWith('Não foi possível reordenar os itens.', 'error');
  });

  it('should undo item delete via toast', async () => {
    const itemId = await shoppingItensService.create({shoppingId: 1, nome: 'Undo', quantidade: 1, valor: 1, itemMarcado: false});
    const toast = (component as unknown as { toastService: { showWithAction: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'showWithAction');
    component['pendingDeleteItemId'].set(itemId);
    await component['onDeleteConfirmed']();
    const callback = showSpy.mock.calls[0][1] as {callback: () => void};
    callback.callback();
    expect(await shoppingItensService.getById(itemId)).toBeTruthy();
  });
});

describe('ItensComprasLista invalid route', () => {
  beforeEach(async () => {
    await deleteShoppingDb();
    await TestBed.configureTestingModule({
      imports: [ItensComprasLista],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'abc' } } },
        },
      ],
    }).compileComponents();
  });

  it('should navigate home when id is invalid', async () => {
    const fixture = TestBed.createComponent(ItensComprasLista);
    const component = fixture.componentInstance;
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await component['ngOnInit']();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
  });
});

describe('ItensComprasLista missing shopping', () => {
  beforeEach(async () => {
    await deleteShoppingDb();
    await TestBed.configureTestingModule({
      imports: [ItensComprasLista],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {snapshot: {paramMap: {get: () => '99'}}},
        },
      ],
    }).compileComponents();
  });

  it('should navigate home when the shopping does not exist', async () => {
    const fixture = TestBed.createComponent(ItensComprasLista);
    const component = fixture.componentInstance;
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await component['ngOnInit']();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
  });
});
