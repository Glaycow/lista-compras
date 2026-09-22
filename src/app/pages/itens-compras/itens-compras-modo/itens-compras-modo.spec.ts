import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {DbConfig} from '../../../shared/db/db-config';
import ItensComprasModo from './itens-compras-modo';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('ItensComprasModo', () => {
  let fixture: ComponentFixture<ItensComprasModo>;
  let component: ItensComprasModo;

  beforeEach(async () => {
    await deleteShoppingDb();
    const db = new DbConfig();
    await db.shopping.add({id: 1, nome: 'Mercado', data: new Date()});
    await db.shoppingItem.add({
      shoppingId: 1, nome: 'Leite', quantidade: 1, valor: 5, itemMarcado: false,
    });

    await TestBed.configureTestingModule({
      imports: [ItensComprasModo],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: () => '1'}}}},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItensComprasModo);
    component = fixture.componentInstance;
  });

  it('should create and load shopping', async () => {
    await component.ngOnInit();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(1));
    expect(component['shopping']()?.nome).toBe('Mercado');
  });

  it('should toggle item in shop mode', async () => {
    await component.ngOnInit();
    await vi.waitFor(() => expect(component['items']()).toHaveLength(1));
    await component['toggleItem'](component['items']()[0]);
    await vi.waitFor(() => expect(component['pendentes']()).toHaveLength(0));
  });

  it('should exit shop mode', async () => {
    await component.ngOnInit();
    const router = (component as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['exitMode']();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping', 1, 'items']);
  });

  it('should navigate home when shopping id is invalid', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ItensComprasModo],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: () => null}}}},
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ItensComprasModo);
    const c = f.componentInstance;
    const router = (c as unknown as { router: { navigate: (path: unknown[]) => Promise<boolean> } }).router;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await c.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
  });
});
