import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {DbConfig} from '../../shared/db/db-config';
import Estatisticas from './estatisticas';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('Estatisticas', () => {
  let fixture: ComponentFixture<Estatisticas>;
  let component: Estatisticas;

  beforeEach(async () => {
    await deleteShoppingDb();
    const db = new DbConfig();
    const shoppingId = await db.shopping.add({nome: 'Teste', data: new Date('2026-02-10')});
    await db.shoppingItem.add({
      shoppingId, nome: 'Arroz', quantidade: 1, valor: 10, itemMarcado: true,
    });

    await TestBed.configureTestingModule({
      imports: [Estatisticas],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Estatisticas);
    component = fixture.componentInstance;
  });

  it('should create and load statistics', async () => {
    await component.ngOnInit();
    fixture.detectChanges();
    await vi.waitFor(() => expect(component['isLoading']()).toBe(false));
    expect(component['monthlySpending']().length).toBeGreaterThan(0);
    expect(component['topItems']().length).toBeGreaterThan(0);
  });

  it('should compute bar width relative to max', async () => {
    await component.ngOnInit();
    await vi.waitFor(() => expect(component['isLoading']()).toBe(false));
    expect(component['barWidth'](10)).toBeGreaterThan(0);
    expect(component['barWidth'](0)).toBe(0);
  });

  it('should show empty state when no data', async () => {
    await deleteShoppingDb();
    await component.ngOnInit();
    fixture.detectChanges();
    await vi.waitFor(() => expect(component['isLoading']()).toBe(false));
    expect(component['hasData']()).toBe(false);
  });
});
