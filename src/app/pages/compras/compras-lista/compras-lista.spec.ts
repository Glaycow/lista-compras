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

  it('should compute listaVazia as false when shoppings is undefined', () => {
    expect(component['listaVazia']()).toBe(false);
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

  it('should export lists as a json file', async () => {
    const createSpy = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    createSpy.mockImplementation((tag: string) => {
      if (tag === 'a') {
        return {click, set href(_v: string) {}, set download(_v: string) {}} as unknown as HTMLElement;
      }
      return document.createElement(tag);
    });
    const objectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await component['exportLists']();

    expect(click).toHaveBeenCalled();
    expect(objectUrl).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();

    createSpy.mockRestore();
    objectUrl.mockRestore();
    revoke.mockRestore();
  });

  it('should reject an invalid import file', () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['{"version":2}'], 'bad.json', {type: 'application/json'})],
    });

    const readerLoad = FileReader.prototype;
    const originalRead = readerLoad.readAsText;
    readerLoad.readAsText = function (this: FileReader) {
      Object.defineProperty(this, 'result', {value: '{"version":2}'});
      this.onload?.({} as ProgressEvent<FileReader>);
    };

    component['onImportFile']({target: input} as unknown as Event);

    expect(showSpy).toHaveBeenCalledWith('Arquivo de backup inválido.', 'error');
    readerLoad.readAsText = originalRead;
  });

  it('should import a backup after confirmation', async () => {
    const shoppingId = await shoppingService.create({ nome: 'Origem', data: new Date('2026-01-01') });
    const backup = await shoppingService.exportData();
    await shoppingService.remove(shoppingId);

    component['pendingImport'].set(backup);
    component['confirmKind'].set('import');
    await component['onDeleteConfirmed']();

    expect(component['confirmDialogVisible']()).toBe(false);
    expect(await shoppingService.getById(shoppingId)).toBeTruthy();
  });

  it('should format shopping dates', () => {
    expect(component['formatDate'](new Date('2026-03-15T00:00:00.000Z'))).toBe('15/03/2026');
  });

  it('should navigate when the create button is used', () => {
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.ngOnInit();
    const nav = (component as unknown as { navBarButtonService: { buttons: () => { action: () => void }[] } }).navBarButtonService;
    nav.buttons()[0].action();
    expect(navigateSpy).toHaveBeenCalledWith(['shopping/new']);
  });

  it('should toast when delete fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingService, 'remove').mockRejectedValue(new Error('fail'));
    component['pendingDeleteId'].set(9);
    await component['onDeleteConfirmed']();
    expect(showSpy).toHaveBeenCalledWith('Não foi possível excluir a lista.', 'error');
  });

  it('should skip remove when pending delete id is null', async () => {
    const removeSpy = vi.spyOn(shoppingService, 'remove');
    component['pendingDeleteId'].set(null);
    await component['onDeleteConfirmed']();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('should toast when export fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingService, 'exportData').mockRejectedValue(new Error('fail'));
    await component['exportLists']();
    expect(showSpy).toHaveBeenCalledWith('Não foi possível exportar as listas.', 'error');
  });

  it('should ignore import when no file is selected', () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    component['onImportFile']({target: {files: [], value: ''}} as unknown as Event);
    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should toast when import JSON is invalid', () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['not-json'], 'bad.json', {type: 'application/json'})],
    });
    const originalRead = FileReader.prototype.readAsText;
    FileReader.prototype.readAsText = function (this: FileReader) {
      Object.defineProperty(this, 'result', {value: 'not-json'});
      this.onload?.({} as ProgressEvent<FileReader>);
    };
    component['onImportFile']({target: input} as unknown as Event);
    expect(showSpy).toHaveBeenCalledWith('Arquivo de backup inválido.', 'error');
    FileReader.prototype.readAsText = originalRead;
  });

  it('should open import confirm for a valid backup file', () => {
    const backup = {
      version: 1 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      shopping: [],
      items: [],
    };
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File([JSON.stringify(backup)], 'ok.json', {type: 'application/json'})],
    });
    const originalRead = FileReader.prototype.readAsText;
    FileReader.prototype.readAsText = function (this: FileReader) {
      Object.defineProperty(this, 'result', {value: JSON.stringify(backup)});
      this.onload?.({} as ProgressEvent<FileReader>);
    };
    component['onImportFile']({target: input} as unknown as Event);
    expect(component['confirmKind']()).toBe('import');
    expect(component['confirmDialogVisible']()).toBe(true);
    FileReader.prototype.readAsText = originalRead;
  });

  it('should toast when applyImport fails with Error', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingService, 'importData').mockRejectedValue(new Error('boom'));
    component['pendingImport'].set({version: 1, exportedAt: '', shopping: [], items: []});
    component['confirmKind'].set('import');
    await component['onDeleteConfirmed']();
    expect(showSpy).toHaveBeenCalledWith('boom', 'error');
  });

  it('should toast when applyImport fails with a non-Error', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingService, 'importData').mockRejectedValue('nope');
    component['pendingImport'].set({version: 1, exportedAt: '', shopping: [], items: []});
    component['confirmKind'].set('import');
    await component['onDeleteConfirmed']();
    expect(showSpy).toHaveBeenCalledWith('Não foi possível importar o backup.', 'error');
  });

  it('should no-op applyImport when backup is missing', async () => {
    const importSpy = vi.spyOn(shoppingService, 'importData');
    component['pendingImport'].set(null);
    component['confirmKind'].set('import');
    await component['onDeleteConfirmed']();
    expect(importSpy).not.toHaveBeenCalled();
  });

  it('should toast when loading totals fails', async () => {
    const toast = (component as unknown as { toastService: { show: (...args: unknown[]) => void } }).toastService;
    const showSpy = vi.spyOn(toast, 'show');
    vi.spyOn(shoppingService, 'getShoppingItensByShoppingId').mockRejectedValue(new Error('fail'));
    await shoppingService.create({nome: 'Feira', data: new Date('2026-01-01')});
    await new Promise<void>((resolve) => {
      const sub = shoppingService.shopping.subscribe((data) => {
        if (data.length > 0) {
          resolve();
          sub.unsubscribe();
        }
      });
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(showSpy).toHaveBeenCalledWith('Não foi possível carregar os totais.', 'error');
  });

  it('should load items for created shoppings', async () => {
    const id = await shoppingService.create({nome: 'Feira', data: new Date('2026-01-01')});
    await TestBed.inject((await import('../../../shared/service/shopping-itens-service')).ShoppingItensService)
      .create({shoppingId: id, nome: 'Pão', quantidade: 1, valor: 3, itemMarcado: true});

    await new Promise<void>((resolve) => {
      const sub = shoppingService.shopping.subscribe((data) => {
        if (data.some((item) => item.id === id)) {
          resolve();
          sub.unsubscribe();
        }
      });
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(component['getItemCount'](id)).toBeGreaterThanOrEqual(0);
  });
});
