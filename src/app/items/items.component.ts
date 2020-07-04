import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  newItem: string;
  pendingItems = ['Atta'];
  cartedItems = ['Rice'];

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor() {
  }

  ngOnInit(): void {
  }

  add(): void {
    this.pendingItems.push(this.newItem);
    this.newItem = '';
    this.pendingTable.renderRows();
  }

  cart(item): void {
    this.cartedItems.push(item);
    this.removeItemFromPending(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
  }

  pending(item): void {
    this.pendingItems.push(item);
    this.removeItemFromCarted(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
  }

  remove(item): void {
    const index = this.pendingItems.indexOf(item, 0);
    if (index > -1) {
      this.pendingItems.splice(index, 1);
      this.pendingTable.renderRows();
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
