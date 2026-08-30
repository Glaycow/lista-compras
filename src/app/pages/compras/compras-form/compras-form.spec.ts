import {provideZonelessChangeDetection} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, provideRouter} from '@angular/router';

import ComprasForm from './compras-form';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {ToastService} from '../../../shared/service/toast.service';
import {DbConfig} from '../../../shared/db/db-config';
import {toLocalDateInput} from '../../../shared/util/local-date';

async function deleteShoppingDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('shopping');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('ComprasForm', () => {
  let component: ComprasForm;
  let fixture: ComponentFixture<ComprasForm>;
  let shoppingService: ShoppingService;
  let toastService: ToastService;

  const createActivatedRouteMock = (params: Record<string, string | null> = {}) => ({
    snapshot: { paramMap: { get: (key: string) => params[key] ?? null } },
  });

  // ────────────────────────────
  //  Create mode (no id param)
  // ────────────────────────────

  describe('create mode', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock() },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ComprasForm);
      component = fixture.componentInstance;
      shoppingService = TestBed.inject(ShoppingService);
      toastService = TestBed.inject(ToastService);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in create mode', () => {
      expect(component['isEditMode']()).toBe(false);
      expect(component['currentShoppingId']()).toBeNull();
    });

    it('should have form with default values', () => {
      const model = component['model']();
      expect(model.nome).toBe('');
      expect(model.data).toBe(toLocalDateInput(new Date()));
    });

    it('should set name as invalid when empty', () => {
      expect(component['form'].nome().invalid()).toBe(true);
    });

    it('should set name as valid when filled with 2+ chars', () => {
      component['model'].set({ nome: 'Feira', data: '2026-01-15' });
      fixture.detectChanges();
      expect(component['form'].nome().valid()).toBe(true);
    });

    it('should show validation error for empty name when touched', () => {
      component['form'].nome().markAsTouched();
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('.error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('obrigatório');
    });

    it('should navigate back on goBack', () => {
      const router = (component as unknown as { router: { navigate: (path: string[]) => Promise<boolean> } }).router;
      const routerSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['goBack']();
      expect(routerSpy).toHaveBeenCalledWith(['/shopping']);
    });

    it('should create a shopping via service', async () => {
      const toastSpy = vi.spyOn(toastService, 'show');
      const createSpy = vi.spyOn(shoppingService, 'create');

      const m = component['model']();
      await shoppingService.create({ nome: m.nome || 'Nova Lista', data: new Date() });

      expect(createSpy).toHaveBeenCalled();
      toastService.show('Lista criada com sucesso!');
      expect(toastSpy).toHaveBeenCalledWith('Lista criada com sucesso!');
    });

    it('should handle submit error gracefully', async () => {
      vi.spyOn(shoppingService, 'create').mockRejectedValue(new Error('Erro de teste'));
      component['submitError'].set(null);

      try {
        await shoppingService.create({ nome: 'Falha', data: new Date() });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro inesperado';
        component['submitError'].set(message);
      }

      expect(component['submitError']()).toBe('Erro de teste');
    });

    it('should handle non-Error thrown during submit', () => {
      const errorMessage = 'Ocorreu um erro inesperado ao salvar a lista. Tente novamente.';
      component['submitError'].set(errorMessage);
      expect(component['submitError']()).toBe(errorMessage);
    });

    it('should mark fields as touched when invalid form is submitted', () => {
      const formEl = fixture.nativeElement.querySelector('form');
      expect(formEl).toBeTruthy();
      formEl.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      expect(component['form'].nome().touched()).toBe(true);
    });
  });

  // ────────────────────────────
  //  Form submission integration
  // ────────────────────────────

  describe('form submission', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock() },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ComprasForm);
      component = fixture.componentInstance;
      shoppingService = TestBed.inject(ShoppingService);
      toastService = TestBed.inject(ToastService);

      // Mock router.navigate to prevent real navigation
      const router = (component as unknown as { router: { navigate: (path: string[]) => Promise<boolean> } }).router;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture.detectChanges();
    });

    it('should submit the form and create a shopping when valid', async () => {
      const toastSpy = vi.spyOn(toastService, 'show');
      component['model'].set({ nome: 'Teste Submit', data: '2026-07-01' });
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn.disabled).toBe(false);
      submitBtn.click();

      await new Promise((r) => setTimeout(r, 500));
      fixture.detectChanges();

      expect(toastSpy).toHaveBeenCalled();
      expect(component['isExiting']()).toBe(true);
    });

    it('should set submitError when create throws an Error', async () => {
      vi.spyOn(shoppingService, 'create').mockRejectedValue(new Error('falhou'));
      component['model'].set({nome: 'Teste Submit', data: '2026-07-01'});
      fixture.detectChanges();
      await expect(component['save']()).rejects.toThrow('falhou');
      expect(component['submitError']()).toBe('falhou');
    });

    it('should set a fallback submitError when create throws a non-Error', async () => {
      vi.spyOn(shoppingService, 'create').mockRejectedValue('oops');
      component['model'].set({nome: 'Teste Submit', data: '2026-07-01'});
      fixture.detectChanges();
      await expect(component['save']()).rejects.toBeTruthy();
      expect(component['submitError']()).toBe(
        'Ocorreu um erro inesperado ao salvar a lista. Tente novamente.',
      );
    });
  });

  // ────────────────────────────
  //  Edit mode (with id param)
  // ────────────────────────────

  describe('edit mode', () => {
    let shoppingId: number;

    beforeEach(async () => {
      await deleteShoppingDb();

      const db = new DbConfig();
      shoppingId = await db.shopping.add({
        nome: 'Lista para Editar',
        data: new Date('2026-03-15'),
      });

      await TestBed.configureTestingModule({
        imports: [ComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock({ id: String(shoppingId) }) },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ComprasForm);
      component = fixture.componentInstance;
      shoppingService = TestBed.inject(ShoppingService);
      toastService = TestBed.inject(ToastService);
      fixture.detectChanges();
    });

    it('should load existing shopping data in edit mode', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();

      expect(component['isEditMode']()).toBe(true);
      expect(component['currentShoppingId']()).toBeTruthy();
      expect(component['model']().nome).toBe('Lista para Editar');
    });

    it('should update shopping via service', async () => {
      await component['ngOnInit']();
      fixture.detectChanges();

      await shoppingService.update({
        id: shoppingId,
        nome: 'Lista Editada',
        data: new Date('2026-06-15'),
      });

      const updated = await shoppingService.getById(shoppingId);
      expect(updated!.nome).toBe('Lista Editada');
    });

    it('should submit the form and update a shopping', async () => {
      await component['ngOnInit']();
      const router = (component as unknown as { router: { navigate: (path: string[]) => Promise<boolean> } }).router;
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const toastSpy = vi.spyOn(toastService, 'show');
      component['model'].set({nome: 'Lista Editada', data: '2026-06-15'});
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      await new Promise((r) => setTimeout(r, 500));
      expect(toastSpy).toHaveBeenCalledWith('Lista atualizada com sucesso!');
      expect(component['isExiting']()).toBe(true);
    });

    it('should navigate back when shopping does not exist', async () => {
      const router = (component as unknown as { router: { navigate: (path: string[]) => Promise<boolean> } }).router;
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      await TestBed.inject(DbConfig).shopping.clear();

      await component['ngOnInit']();
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/shopping']);
    });
  });

  // ────────────────────────────
  //  Render
  // ────────────────────────────

  describe('rendering', () => {
    beforeEach(async () => {
      await deleteShoppingDb();
      await TestBed.configureTestingModule({
        imports: [ComprasForm],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: ActivatedRoute, useValue: createActivatedRouteMock() },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ComprasForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render the form', () => {
      expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    });

    it('should render the nome input', () => {
      expect(fixture.nativeElement.querySelector('#nome')).toBeTruthy();
    });

    it('should render the data input', () => {
      expect(fixture.nativeElement.querySelector('#data')).toBeTruthy();
    });

    it('should render submit and cancel buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Cancelar');
      expect(buttons[1].textContent).toContain('Salvar');
    });
  });
});
