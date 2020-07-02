import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  newItem: string;
  pendingItems = ['Atta'];
  cartedItems = [];

  constructor() {
  }

  ngOnInit(): void {
  }

  add(): void {
    this.pendingItems.push(this.newItem);
    this.newItem = '';
  }

  cart(item): void {
    this.cartedItems.push(item);
    this.removeItemFromPending(item);

  }

  pending(item): void {
    this.pendingItems.push(item);
    this.removeItemFromCarted(item);
  }

  remove(item): void {
    const index = this.pendingItems.indexOf(item, 0);
    if (index > -1) {
      this.pendingItems.splice(index, 1);
    }
  }

  private removeItemFromPending(item): void {
    const index = this.pendingItems.indexOf(item, 0);
    if (index > -1) {
      this.pendingItems.splice(index, 1);
    }
  }

  private removeItemFromCarted(item): void {
    const index = this.cartedItems.indexOf(item, 0);
    if (index > -1) {
      this.cartedItems.splice(index, 1);
    }
  }
}
