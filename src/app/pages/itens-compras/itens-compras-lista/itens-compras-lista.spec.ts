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
    expect(component['shoppingId']()).toBeTruthy();
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
    expect(nav.titleApp()).toBe('lista de compras Lista Teste');
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
    const nav = (component as unknown as { navBarButtonService: { clearButtons: () => void } }).navBarButtonService;
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
    fixture.detectChanges();
    expect(component['items']()).toHaveLength(1);
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

    const found = await shoppingItensService.geyById(itemId);
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

    expect(await shoppingItensService.geyById(itemId)).toBeUndefined();
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
    fixture.detectChanges();
    expect(component['valorTotal']()).toBe(35);
  });

  it('should compute valorPego correctly (only marcados)', async () => {
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 1', quantidade: 2, valor: 10, itemMarcado: false });
    await shoppingItensService.create({ shoppingId: 1, nome: 'Item 2', quantidade: 3, valor: 5, itemMarcado: true });
    await component['ngOnInit']();
    fixture.detectChanges();
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
});
