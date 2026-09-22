import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// Previous / Next + page size for server-paged lists. Pages are 0-based.
@Component({
  selector: 'app-server-pager',
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="pager">
      <button matButton (click)="pageChange.emit(page() - 1)" [disabled]="page() <= 0 || loading()" type="button">Previous</button>
      <span class="status">
        @if (total() === 0) { No results } @else {
          {{ page() * size() + 1 }}–{{ min((page() + 1) * size(), total()) }} of {{ total() }}
        }
      </span>
      <button matButton (click)="pageChange.emit(page() + 1)" [disabled]="(page() + 1) * size() >= total() || loading()" type="button">Next</button>
      <mat-form-field appearance="outline" class="size">
        <mat-label>Per page</mat-label>
        <mat-select [value]="size()" (selectionChange)="sizeChange.emit($event.value)">
          @for (s of sizes; track s) { <mat-option [value]="s">{{ s }}</mat-option> }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .pager { display: flex; gap: 0.75rem; align-items: center; justify-content: center; margin-top: 0.75rem; flex-wrap: wrap; }
    .status { font-size: 0.9rem; opacity: 0.85; min-width: 120px; text-align: center; }
    .size { width: 110px; margin-left: 0.5rem; }
  `]
})
export class ServerPagerComponent {
  page = input<number>(0);
  size = input<number>(25);
  total = input<number>(0);
  loading = input<boolean>(false);
  pageChange = output<number>();
  sizeChange = output<number>();
  readonly sizes = [10, 25, 50, 100];
  min(a: number, b: number) { return Math.min(a, b); }
}
