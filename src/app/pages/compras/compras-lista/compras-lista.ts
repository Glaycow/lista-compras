import {CurrencyPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {IconComponent} from '../../../shared/components/icon/icon';
import {isShoppingBackup, ShoppingBackup} from '../../../shared/model/ShoppingBackup';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {ToastService} from '../../../shared/service/toast.service';
import {formatShoppingDate, toLocalDateInput} from '../../../shared/util/local-date';

@Component({
  selector: 'app-compras-lista',
  imports: [
    RouterLink,
    CurrencyPipe,
    ConfirmDialogComponent,
    IconComponent,
  ],
  templateUrl: './compras-lista.html',
  styleUrl: './compras-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ComprasLista implements OnInit, OnDestroy {
  private readonly navBarButtonService = inject(NavBarButtonService);
  private readonly shoppingService = inject(ShoppingService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly shoppings = toSignal<Shopping[] | undefined>(this.shoppingService.shopping);
  protected readonly listaVazia = computed(() => this.shoppings()?.length === 0);

  private readonly itemsByShopping = signal<Map<number, ShoppingItem[]>>(new Map());

  protected readonly confirmDialogVisible = signal(false);
  protected readonly confirmKind = signal<'delete' | 'import'>('delete');
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly pendingImport = signal<ShoppingBackup | null>(null);
  protected readonly confirmTitle = signal('');
  protected readonly confirmMessage = signal('');

  constructor() {
    let generation = 0;
    effect(() => {
      const shops = this.shoppings();
      const current = ++generation;
      if (!shops || shops.length === 0) {
        this.itemsByShopping.set(new Map());
        return;
      }

      const ids = shops.map((s) => s.id!).filter(Boolean);
      if (ids.length === 0) return;

      void Promise.all(ids.map((id) => this.shoppingService.getShoppingItensByShoppingId(id)))
        .then((results) => {
          if (current !== generation) return;
          this.itemsByShopping.set(new Map(ids.map((id, i) => [id, results[i]])));
        })
        .catch(() => {
          if (current !== generation) return;
          this.toastService.show('Não foi possível carregar os totais.', 'error');
        });
    });
  }

  ngOnInit(): void {
    this.setarButtonCreate();
    this.setTitle();
  }

  ngOnDestroy(): void {
    this.navBarButtonService.clearButtons();
  }

  protected readonly totalGeral = computed(() => {
    let total = 0;
    for (const items of this.itemsByShopping().values()) {
      for (const item of items) {
        if (item.itemMarcado) {
          total += item.valor * item.quantidade;
        }
      }
    }
    return total;
  });

  protected getItemCount(shoppingId: number): number {
    return this.itemsByShopping().get(shoppingId)?.length ?? 0;
  }

  protected getTotalMarcados(shoppingId: number): number {
    const items = this.itemsByShopping().get(shoppingId) ?? [];
    return items.reduce(
      (acc, item) => acc + item.valor * item.quantidade * Number(item.itemMarcado),
      0,
    );
  }

  protected formatDate(value: Date | string): string {
    return formatShoppingDate(value);
  }

  protected showDeleteConfirm(id: number, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
    this.pendingImport.set(null);
    this.confirmKind.set('delete');
    this.confirmTitle.set('Excluir lista');
    this.confirmMessage.set('Deseja realmente excluir esta lista de compras? Esta ação não pode ser desfeita.');
    this.confirmDialogVisible.set(true);
  }

  protected async onDeleteConfirmed(): Promise<void> {
    if (this.confirmKind() === 'import') {
      await this.applyImport();
      return;
    }

    const id = this.pendingDeleteId();
    if (id !== null) {
      try {
        await this.shoppingService.remove(id);
      } catch {
        this.toastService.show('Não foi possível excluir a lista.', 'error');
      }
    }
    this.confirmDialogVisible.set(false);
    this.pendingDeleteId.set(null);
  }

  protected onDeleteCancelled(): void {
    this.confirmDialogVisible.set(false);
    this.pendingDeleteId.set(null);
    this.pendingImport.set(null);
  }

  protected async exportLists(): Promise<void> {
    try {
      const data = await this.shoppingService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lista-compras-${toLocalDateInput(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.toastService.show('Backup exportado.');
    } catch {
      this.toastService.show('Não foi possível exportar as listas.', 'error');
    }
  }

  protected onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isShoppingBackup(parsed)) {
          this.toastService.show('Arquivo de backup inválido.', 'error');
          return;
        }
        this.pendingImport.set(parsed);
        this.pendingDeleteId.set(null);
        this.confirmKind.set('import');
        this.confirmTitle.set('Importar backup');
        this.confirmMessage.set('Isso substitui todas as listas atuais. Deseja continuar?');
        this.confirmDialogVisible.set(true);
      } catch {
        this.toastService.show('Arquivo de backup inválido.', 'error');
      }
    };
    reader.readAsText(file);
  }

  private async applyImport(): Promise<void> {
    const backup = this.pendingImport();
    this.confirmDialogVisible.set(false);
    this.pendingImport.set(null);
    if (!backup) return;
    try {
      await this.shoppingService.importData(backup);
      this.toastService.show('Backup importado.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível importar o backup.';
      this.toastService.show(message, 'error');
    }
  }

  private readonly createShopping = (): void => void this.router.navigate(['shopping/new']);

  private setarButtonCreate(): void {
    this.navBarButtonService.addButton({
      text: 'Adicionar Compras',
      id: 'add-compra',
      action: this.createShopping.bind(this),
      icon: 'plus',
      visible: true,
    });
  }

  private setTitle(): void {
    this.navBarButtonService.setTitle('Compras');
  }
}
