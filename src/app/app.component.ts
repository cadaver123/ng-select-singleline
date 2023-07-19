import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgSelectComponent, NgSelectModule} from "@ng-select/ng-select";
import {CommonModule} from "@angular/common";
import {distinct, Subject, throttleTime} from "rxjs";

@Component({
  selector: 'app-root',
  template: `
      <div class="container">
          <ng-select
                  [items]="items"
                  [multiple]="true"
                  [closeOnSelect]="false"
                  [searchable]="false"
                  placeholder="Select people"
                  [(ngModel)]="selectedItems"
          >
              <ng-template ng-multi-label-tmp let-items="items" let-clear="clear">
                  <div class="items-container">
                      <div class="items">
                          <div class="ng-value" *ngFor="let item of items" #item>
                              <span class="ng-value-icon left" (click)="clear(item);">×</span>
                              <span class="ng-value-label">{{item}}</span>
                          </div>
                      </div>
                      <div class="placeholder"></div>
                      <div class="ng-value" *ngIf="hiddenItems > 0">
                          <span class="ng-value-label">+{{hiddenItems}}</span>
                      </div>
                  </div>
              </ng-template>
          </ng-select>
      </div>
  `,
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(NgSelectComponent, {static: true, read: ElementRef})
  selectContainer: ElementRef<HTMLElement>;

  @ViewChildren('item')
  valueElements: QueryList<ElementRef<HTMLElement>>;

  selectedItems = ['Martha', 'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver',];
  items = ['Martha', 'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Charlotte', 'James', 'Amelia', 'Elijah', 'Sophia', 'William', 'Isabella', 'Henry', 'Ava', 'Lucas', 'Mia', 'Benjamin', 'Evelyn', 'Theodore', 'Luna']
  hiddenItems = this.selectedItems.length;

  _widthChangeSubject = new Subject<number>();

  constructor(private _changeDetector: ChangeDetectorRef,
              private zone: NgZone) {
  }

  ngAfterViewInit(): void {
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        this.zone.run(() => {
          this._widthChangeSubject.next(entry.contentRect.width)
        });
      });
    });

    observer.observe(this.selectContainer.nativeElement);

    this._widthChangeSubject
      .pipe(distinct(), throttleTime(20, undefined, {leading: true, trailing: true}))
      .subscribe((width: number) => {
        this._calculateHiddenItems(width);
      });

    this.valueElements.changes.subscribe(() => this._calculateHiddenItems(this.selectContainer.nativeElement.getBoundingClientRect().width));
  }


  private _calculateHiddenItems(width: number) {
    let widthAcc = 0;

    this.hiddenItems = 0;
    for (let i = 0; i < this.selectedItems.length; i++) {
      const el = this.valueElements.get(i)?.nativeElement;

      if (el) {
        el.style.display = 'inline-block';
        widthAcc += this._getAbsoluteWidth(el);

        if (widthAcc > width - 85) {
          el.style.display = 'none';
          this.hiddenItems++;
        }
      }
    }

    setTimeout(() => this._changeDetector.markForCheck(), 0) //due to using observable from @ViewChildren
  }

  private _getAbsoluteWidth(el: HTMLElement): number {
    const styles = window.getComputedStyle(el);
    const margin = parseFloat(styles['marginLeft']) +
      parseFloat(styles['marginRight']);

    return Math.ceil(el.offsetWidth + margin);
  }
}
