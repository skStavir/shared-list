import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  newItem: string;
  inputPlaceHolder: string;
  pendingItems = ['Atta'];
  cartedItems = ['Rice'];

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor() {
    this.newItem = '';
    this.setDefaultPlaceholder();
  }

  ngOnInit(): void {
  }

  add(): void {
    if (this.newItem.trim() === '') {
      this.inputPlaceHolder = 'Please enter a valid item';
      return;
    }
    this.pendingItems.push(this.newItem);
    this.resetInput();
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

  doneShopping(): void {
    alert('Thank you for using Quick shopping list. See you again');
    this.pendingItems = [];
    this.cartedItems = [];
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
  }

  private resetInput(): void {
    this.newItem = '';
    this.setDefaultPlaceholder();
  }

  private setDefaultPlaceholder(): void {
    this.inputPlaceHolder = 'Enter an Item';
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
