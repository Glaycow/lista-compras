import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ShoppingService} from '../../../shared/service/shopping-service';

import ComprasLista from './compras-lista';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('ComprasLista', () => {
  let component: ComprasLista;
  let fixture: ComponentFixture<ComprasLista>;
  let shoppingService: ShoppingService;

  beforeEach(async () => {
    await deleteShoppingDb();
    await TestBed.configureTestingModule({
      imports: [ComprasLista],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasLista);
    component = fixture.componentInstance;
    shoppingService = TestBed.inject(ShoppingService);
    fixture.detectChanges();
  });

  // ────────────────────────────
  //  Initial state
  // ────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have undefined shoppings initially (liveQuery not yet emitted)', () => {
    expect(component['shoppings']()).toBeUndefined();
  });

  it('should compute existeShopping as false when shoppings is undefined', () => {
    expect(component['existeShopping']()).toBe(false);
  });

  it('should have totalGeral as 0 initially', () => {
    expect(component['totalGeral']()).toBe(0);
  });

  // ────────────────────────────
  //  ngOnInit / ngOnDestroy
  // ────────────────────────────

  it('should set title and add button on init', () => {
    component.ngOnInit();
    const nav = (component as unknown as { navBarButtonService: { titleApp: () => string; buttons: () => unknown[] } }).navBarButtonService;
    expect(nav.titleApp()).toBe('Compras');
    expect((nav.buttons()[0] as { id: string }).id).toBe('add-compra');
  });

  it('should clear buttons on destroy', () => {
    const nav = (component as unknown as { navBarButtonService: { clearButtons: () => void; buttons: () => unknown[]; titleApp: () => string } }).navBarButtonService;
    component.ngOnDestroy();
    expect(nav.buttons()).toEqual([]);
    expect(nav.titleApp()).toBe('');
  });

  // ────────────────────────────
  //  getItemCount / getTotalMarcados
  // ────────────────────────────

  it('should return 0 for a shopping with no items loaded', () => {
    expect(component['getItemCount'](1)).toBe(0);
    expect(component['getTotalMarcados'](1)).toBe(0);
  });

  // ────────────────────────────
  //  Confirm dialog flow
  // ────────────────────────────

  it('should show confirm dialog when showDeleteConfirm is called', () => {
    const event = new MouseEvent('click');
    vi.spyOn(event, 'stopPropagation');

    component['showDeleteConfirm'](123, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component['pendingDeleteId']()).toBe(123);
    expect(component['confirmDialogVisible']()).toBe(true);
    expect(component['confirmTitle']()).toBe('Excluir lista');
  });

  it('should call shoppingService.remove when deletion is confirmed', async () => {
    const removeSpy = vi.spyOn(shoppingService, 'remove').mockResolvedValue();
    component['pendingDeleteId'].set(123);

    await component['onDeleteConfirmed']();

    expect(removeSpy).toHaveBeenCalledWith(123);
    expect(component['confirmDialogVisible']()).toBe(false);
    expect(component['pendingDeleteId']()).toBe(null);
  });

  it('should NOT call shoppingService.remove when deletion is cancelled', () => {
    const removeSpy = vi.spyOn(shoppingService, 'remove');
    component['pendingDeleteId'].set(123);
    component['confirmDialogVisible'].set(true);

    component['onDeleteCancelled']();

    expect(removeSpy).not.toHaveBeenCalled();
    expect(component['confirmDialogVisible']()).toBe(false);
    expect(component['pendingDeleteId']()).toBe(null);
  });

  // ────────────────────────────
  //  totalGeral / getTotalMarcados computation
  // ────────────────────────────

  it('should compute totalGeral correctly when items are loaded', () => {
    const itemsByShopping = (component as unknown as { itemsByShopping: { set: (_: Map<number, ShoppingItem[]>) => void } }).itemsByShopping;
    itemsByShopping.set(new Map([[1, [
      { shoppingId: 1, nome: 'Item 1', quantidade: 2, valor: 10, itemMarcado: true },
      { shoppingId: 1, nome: 'Item 2', quantidade: 1, valor: 5, itemMarcado: false },
      { shoppingId: 1, nome: 'Item 3', quantidade: 3, valor: 20, itemMarcado: true },
    ] as ShoppingItem[]]]));
    expect(component['totalGeral']()).toBe(80);
  });

  it('should compute getTotalMarcados correctly', () => {
    const itemsByShopping = (component as unknown as { itemsByShopping: { set: (_: Map<number, ShoppingItem[]>) => void } }).itemsByShopping;
    itemsByShopping.set(new Map([[1, [
      { shoppingId: 1, nome: 'Item 1', quantidade: 2, valor: 10, itemMarcado: true },
      { shoppingId: 1, nome: 'Item 2', quantidade: 3, valor: 5, itemMarcado: false },
    ] as ShoppingItem[]]]));
    expect(component['getTotalMarcados'](1)).toBe(20);
  });

  // ────────────────────────────
  //  Rendering
  // ────────────────────────────

  it('should render empty state when shoppings exist but is empty array', async () => {
    // Wait for liveQuery to emit the empty array
    await new Promise<void>((resolve) => {
      const sub = shoppingService.shopping.subscribe((data) => {
        if (data.length === 0) {
          resolve();
          sub.unsubscribe();
        }
      });
    });
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Nenhuma compra encontrada');
  });
});
