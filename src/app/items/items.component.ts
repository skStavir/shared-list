import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ShoppingListService} from './shopping-list.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ShareDialogComponent} from '../share-dialog/share-dialog.component';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit, OnDestroy {
  id: string;
  newItem: string;
  inputPlaceHolder: string;
  itemsMasterList = [];
  filteredItems: Observable<string[]>;
  itemInputControl = new FormControl();
  itemCategories = {};

  pendingItems = [];
  categorizedPendingItems = [];
  cartedItems = [];
  categorizedCarteditems = [];
  interval: number;
  syncInProgress = false;

  serverUrl = 'http://localhost:4200?id=';
  // serverUrl = 'https://quickshoppinglist.com?id=';

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor(private shoppingListService: ShoppingListService, private route: ActivatedRoute, private router: Router,
              private dialog: MatDialog) {
    this.newItem = '';
    this.setDefaultPlaceholder();
  }

  ngOnInit(): void {

    this.thisLoadItemsAndCategories();

    this.route.queryParams.subscribe(params => {
      this.id = params.id;
      console.log('id from url: ' + this.id);
    });

    if (this.id) {
      console.log('loading data of list id : ' + this.id);
      this.shoppingListService.fetchData(this.id).subscribe((data: any) => {
        console.log('shopping list from server : ' + JSON.stringify(data));
        this.updateDataFromServer(data);
        this.enabledReload();
      });

    } else {
      this.shoppingListService.fetchData(undefined).subscribe((data: any) => {
        console.log('created a shopping list : ' + JSON.stringify(data));
        console.log('navigating to new shopping list');
        window.location.href = this.serverUrl + data.id;
      });
    }

  }

  add(): void {
    if (this.newItem.trim() === '') {
      this.inputPlaceHolder = 'Please enter a valid item';
      return;
    }

    this.addItemToCategorizedList(this.newItem, this.getItemCategory(this.newItem), this.categorizedPendingItems);
    this.reloadPendingItemsFromCategorizedPendingItemsList();

    this.pendingTable.renderRows();
    this.syncData('ADD', this.newItem);
    this.resetInput();
  }

  cart(item): void {
    this.addItemToCategorizedList(item, this.getItemCategory(item), this.categorizedCarteditems);
    this.reloadCartFromCategorizedCartedItemsList();

    this.removeItemFromPending(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
    this.syncData('PICKED', item);
  }

  pending(item): void {
    this.addItemToCategorizedList(item, this.getItemCategory(item), this.categorizedPendingItems);
    this.reloadPendingItemsFromCategorizedPendingItemsList();
    this.removeItemFromCarted(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
    this.syncData('DROPPED', item);
  }

  remove(item): void {
    const category = this.getItemCategory(item);
    const index = this.categorizedPendingItems[category].indexOf(item, 0);
    if (index > -1) {
      this.categorizedPendingItems[category].splice(index, 1);
      this.reloadPendingItemsFromCategorizedPendingItemsList();
      this.pendingTable.renderRows();
      this.syncData('REMOVE', item);
    }
  }

  doneShopping(): void {
    alert('Thank you for using Quick shopping list. See you again');
    this.pendingItems = [];
    this.cartedItems = [];
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
    window.location.href = this.serverUrl;
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  shareDialog(): void {
    this.dialog.open(ShareDialogComponent, {data: {shareUrl: this.serverUrl + this.id, appUrl: this.serverUrl}});
  }

  private reloadPendingItemsFromCategorizedPendingItemsList(): void {
    this.pendingItems = [];
    Object.keys(this.categorizedPendingItems).forEach((categoryEntry) => {
      console.log(`categoryEntry:${categoryEntry}`);
      this.categorizedPendingItems[categoryEntry].forEach(categoryItem => this.pendingItems.push(categoryItem));
    });
  }

  private addItemToCategorizedList(item, category, categorizedList): void {
    if (!categorizedList[category]) {
      categorizedList[category] = [];
    }
    categorizedList[category].push(item);
    console.log(`addItemToCategorizedList: category: ${category} categorizedList: ${categorizedList}`);
  }

  private getItemCategory(item): string {
    let category = this.itemCategories[item];
    if (!category) {
      category = 'other';
    }
    console.log(`category:${category}`);
    return category;
  }

  private thisLoadItemsAndCategories(): void {
    this.shoppingListService.getCategorizedItems().subscribe((data: any) => {
      data.forEach((entry) => {
        entry.items.forEach((item) => {
          this.itemsMasterList.push(item);
          this.itemCategories[item] = entry.category;
        });
      });
      this.setUpAutocompleteFilter();
    });
  }

  private setUpAutocompleteFilter(): void {
    this.filteredItems = this.itemInputControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.itemsMasterList.filter(option => option.toLowerCase().includes(filterValue));
  }

  private enabledReload(): void {
    this.interval = setInterval(() => {
      this.reloadData();
    }, 100000);
  }

  private reloadData(): void {
    if (this.syncInProgress) {
      console.log('skipping reload since sync is in progress');
      return;
    }
    console.log('reloading data from server');
    this.shoppingListService.fetchData(this.id).subscribe((data: any) => {
      console.log('shopping list from server : ' + JSON.stringify(data));
      this.updateDataFromServer(data);
    });
  }

  private syncData(action, item): void {
    this.syncInProgress = true;
    console.log(`syncing updated data to server action:${action} item:${item}`);
    this.shoppingListService.updateData(this.id, action, item).subscribe((data: any) => {
      console.log('shopping list from server : ' + JSON.stringify(data));
      this.syncInProgress = false;
    });
  }

  private updateDataFromServer(data: any): void {
    if (data) {
      this.id = data.id;
      data.pending.forEach((pending) => {
        this.addItemToCategorizedList(pending, this.getItemCategory(pending), this.categorizedPendingItems);
      });
      this.reloadPendingItemsFromCategorizedPendingItemsList();
      this.pendingTable.renderRows();

      data.cart.forEach((carted) => {
        this.addItemToCategorizedList(carted, this.getItemCategory(carted), this.categorizedCarteditems);
      });
      this.reloadCartFromCategorizedCartedItemsList();
      this.cartTable.renderRows();
    }
  }

  private resetInput(): void {
    this.newItem = '';
    this.setDefaultPlaceholder();
    this.itemInputControl.setValue('');
  }

  private setDefaultPlaceholder(): void {
    this.inputPlaceHolder = 'Enter an Item';
  }

  private removeItemFromPending(item): void {
    const category = this.getItemCategory(item);
    const itemCategoryList = this.categorizedPendingItems[category];

    const index = itemCategoryList.indexOf(item, 0);
    if (index > -1) {
      itemCategoryList.splice(index, 1);
    }

    this.reloadPendingItemsFromCategorizedPendingItemsList();
  }

  private removeItemFromCarted(item): void {
    const category = this.getItemCategory(item);
    console.log(`removeItemFromCarted - category: ${category}`);
    const itemCategoryList = this.categorizedCarteditems[category];
    console.log(`removeItemFromCarted - itemCategoryList: ${itemCategoryList}`);
    const index = itemCategoryList.indexOf(item, 0);
    if (index > -1) {
      itemCategoryList.splice(index, 1);
    }

    this.reloadCartFromCategorizedCartedItemsList();
  }

  private reloadCartFromCategorizedCartedItemsList(): void {
    this.cartedItems = [];
    Object.keys(this.categorizedCarteditems).forEach((categoryEntry) => {
      console.log(`categoryEntry:${categoryEntry}`);
      this.categorizedCarteditems[categoryEntry].forEach(categoryItem => this.cartedItems.push(categoryItem));
    });
  }
}
