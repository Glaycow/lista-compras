import {CurrencyPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {HlmButton} from '@spartan-ng/helm/button';
import {NavBarButtonService} from '../../../core/service/nav-bar-button-service';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {IconComponent} from '../../../shared/components/icon/icon';
import {isShoppingBackup, ShoppingBackup} from '../../../shared/model/ShoppingBackup';
import {Shopping} from '../../../shared/model/Shopping';
import {ShoppingItem} from '../../../shared/model/ShoppingItem';
import {ShoppingService} from '../../../shared/service/shopping-service';
import {ToastService} from '../../../shared/service/toast.service';
import {formatShoppingDate, toLocalDateInput} from '../../../shared/util/local-date';

type ConfirmKind = 'delete' | 'import' | 'import-merge';

@Component({
  selector: 'app-compras-lista',
  imports: [
    RouterLink,
    CurrencyPipe,
    ConfirmDialogComponent,
    IconComponent,
    HlmButton,
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
  protected readonly templates = this.shoppingService.getTemplates();

  private readonly itemsByShopping = signal<Map<number, ShoppingItem[]>>(new Map());

  protected readonly confirmDialogVisible = signal(false);
  protected readonly confirmKind = signal<ConfirmKind>('delete');
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly pendingImport = signal<ShoppingBackup | null>(null);
  protected readonly confirmTitle = signal('');
  protected readonly confirmMessage = signal('');
  protected readonly showTemplates = signal(false);

  private deletedSnapshot: { shopping: Shopping; items: ShoppingItem[] } | null = null;

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

  protected readonly totalGeralMarcado = computed(() => {
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

  protected readonly totalGeralPrevisto = computed(() => {
    let total = 0;
    for (const items of this.itemsByShopping().values()) {
      for (const item of items) {
        total += item.valor * item.quantidade;
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

  protected getTotalPrevisto(shoppingId: number): number {
    const items = this.itemsByShopping().get(shoppingId) ?? [];
    return items.reduce((acc, item) => acc + item.valor * item.quantidade, 0);
  }

  protected formatDate(value: Date | string): string {
    return formatShoppingDate(value);
  }

  protected toggleTemplates(): void {
    this.showTemplates.update((v) => !v);
  }

  protected async createFromTemplate(templateId: string): Promise<void> {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) return;
    try {
      const id = await this.shoppingService.createFromTemplate(template);
      this.showTemplates.set(false);
      this.toastService.show(`Lista "${template.nome}" criada.`);
      void this.router.navigate(['/shopping', id, 'items']);
    } catch {
      this.toastService.show('Não foi possível criar a lista.', 'error');
    }
  }

  protected async duplicateList(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const newId = await this.shoppingService.duplicate(id);
      this.toastService.show('Lista duplicada.');
      void this.router.navigate(['/shopping', newId, 'items']);
    } catch {
      this.toastService.show('Não foi possível duplicar a lista.', 'error');
    }
  }

  protected async exportSingleList(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const data = await this.shoppingService.exportList(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lista-${data.shopping.nome.replace(/\s+/g, '-').toLowerCase()}-${toLocalDateInput(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.toastService.show('Lista exportada.');
    } catch {
      this.toastService.show('Não foi possível exportar a lista.', 'error');
    }
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
    if (this.confirmKind() === 'import' || this.confirmKind() === 'import-merge') {
      await this.applyImport(this.confirmKind() === 'import-merge');
      return;
    }

    const id = this.pendingDeleteId();
    if (id !== null) {
      try {
        const shopping = await this.shoppingService.getById(id);
        const items = await this.shoppingService.getShoppingItensByShoppingId(id);
        if (shopping) {
          this.deletedSnapshot = {shopping, items};
        }
        await this.shoppingService.remove(id);
        this.toastService.showWithAction('Lista excluída.', {
          label: 'Desfazer',
          callback: () => void this.undoDelete(),
        });
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

  protected onImportFile(event: Event, merge = false): void {
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
        this.confirmKind.set(merge ? 'import-merge' : 'import');
        this.confirmTitle.set(merge ? 'Mesclar backup' : 'Importar backup');
        this.confirmMessage.set(
          merge
            ? 'Os dados do backup serão adicionados às listas existentes. Deseja continuar?'
            : 'Isso substitui todas as listas atuais. Deseja continuar?',
        );
        this.confirmDialogVisible.set(true);
      } catch {
        this.toastService.show('Arquivo de backup inválido.', 'error');
      }
    };
    reader.readAsText(file);
  }

  protected onImportListFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        const id = await this.shoppingService.importList(parsed);
        this.toastService.show('Lista importada.');
        void this.router.navigate(['/shopping', id, 'items']);
      } catch {
        this.toastService.show('Arquivo de lista inválido.', 'error');
      }
    };
    reader.readAsText(file);
  }

  private async undoDelete(): Promise<void> {
    if (!this.deletedSnapshot) return;
    try {
      await this.shoppingService.restore(
        this.deletedSnapshot.shopping,
        this.deletedSnapshot.items,
      );
      this.deletedSnapshot = null;
      this.toastService.show('Lista restaurada.');
    } catch {
      this.toastService.show('Não foi possível restaurar a lista.', 'error');
    }
  }

  private async applyImport(merge: boolean): Promise<void> {
    const backup = this.pendingImport();
    this.confirmDialogVisible.set(false);
    this.pendingImport.set(null);
    if (!backup) return;
    try {
      await this.shoppingService.importData(backup, merge);
      this.toastService.show(merge ? 'Backup mesclado.' : 'Backup importado.');
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
