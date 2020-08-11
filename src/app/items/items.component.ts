import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ShoppingListService} from './shopping-list.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ShareDialogComponent} from '../share-dialog/share-dialog.component';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';
import {NgNavigatorShareService} from 'ng-navigator-share';

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
  categoryOrder = {other: 0};

  pendingItems = [];
  categorizedPendingItems = [];
  cartedItems = [];
  categorizedCartedItems = [];

  interval: number;
  syncInProgress = false;

  // serverUrl = 'http://localhost:4200?id=';
  serverUrl = 'https://quickshoppinglist.com?id=';

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor(private shoppingListService: ShoppingListService, private route: ActivatedRoute, private router: Router,
              private dialog: MatDialog, private ngNavigatorShareService: NgNavigatorShareService) {
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
        window.location.href = `${this.serverUrl}${data.id}`;
      });
    }

  }

  add(): void {
    if (this.newItem.trim() === '') {
      this.inputPlaceHolder = 'Please enter a valid item';
      return;
    } else if (this.pendingItems.indexOf(this.newItem) > -1) {
      this.inputPlaceHolder = `You already have '${this.newItem}' in list`;
      this.newItem = '';
      return;
    } else if (this.cartedItems.indexOf(this.newItem) > -1) {
      this.inputPlaceHolder = `You already picked '${this.newItem}'`;
      this.newItem = '';
      return;
    }

    this.pendingItems.push(this.newItem);

    this.arrangePending();

    this.syncData('ADD', this.newItem);
    this.resetInput();
  }

  cart(item): void {
    const index = this.pendingItems.indexOf(item);
    this.pendingItems.splice(index, 1);
    this.cartedItems.push(item);

    this.arrangePending();
    this.arrangeCart();

    this.syncData('PICKED', item);
  }

  pending(item): void {
    const index = this.cartedItems.indexOf(item);
    this.cartedItems.splice(index, 1);
    this.pendingItems.push(item);

    this.arrangePending();
    this.arrangeCart();

    this.syncData('DROPPED', item);
  }

  remove(item): void {
    const index = this.pendingItems.indexOf(item);
    this.pendingItems.splice(index, 1);

    this.arrangePending();

    this.syncData('REMOVE', item);
  }

  doneShopping(): void {
    alert('Thank you for using Quick shopping list. See you again');
    // TODO revisit
    window.location.href = this.serverUrl;
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  shareDialog(): void {
    this.dialog.open(ShareDialogComponent, {data: {shareUrl: this.serverUrl + this.id, appUrl: this.serverUrl + '/welcome.html'}});
  }

  // TODO retain the order of items in categorized list
  mailTo(): void {
    location.href = 'mailto:support@onenzeros.in?subject=Quick Shopping List';
  }

  about(): void {
    location.href = 'https://quickshoppinglist.com/about.html';
  }

  help(): void {
    location.href = 'https://www.youtube.com/watch?v=nnIl8pf8oCc';
  }

  share(): void {
    try {
      this.ngNavigatorShareService.share({
        title: 'Quick Shopping List',
        text: 'Here is our shopping list. Manage items or use it for shopping.',
        url: `${this.serverUrl}${this.id}`
      }).then((val) => console.log('success'), (err) => {
        console.log('error');
      });
      this.shareDialog();
    } catch (error) {
      console.log('You shopping list is not shared, reason: ', error);
    }
  }

  private thisLoadItemsAndCategories(): void {
    this.shoppingListService.getCategorizedItems().subscribe((categoyItems: any) => {
      categoyItems.forEach((itemList) => {
        itemList.items.forEach((item) => {
          const itemInLowerCase = item.toLowerCase();
          this.itemsMasterList.push(itemInLowerCase);
          this.itemCategories[itemInLowerCase] = itemList.category;
        });
        this.categoryOrder[itemList.category] = itemList.order;
      });
      console.log('this.categoryOrder' + JSON.stringify(this.categoryOrder));
      this.setUpAutocompleteFilter();
      this.arrangePending();
      this.arrangeCart();
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
    }, 10000);
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
      console.log('save response : ' + JSON.stringify(data));
      this.syncInProgress = false;
    });
  }

  private updateDataFromServer(data: any): void {
    if (data) {
      this.id = data.id;
      this.pendingItems = data.pending;
      this.cartedItems = data.cart;
      this.arrangePending();
      this.arrangeCart();
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

  private reloadItemsFromCategorizedItems(categorizedItems): Array<string> {
    const arrangedItems = [];
    categorizedItems.forEach(items => {
      items.sort();
      items.forEach(item => arrangedItems.push(item));
    });
    return arrangedItems;
  }

  private addItemToCategorizedList(item, category, categorizedList): void {
    const order = this.categoryOrder[category];

    if (!categorizedList[order]) {
      categorizedList[order] = [];
    }
    categorizedList[order].push(item);

    console.log(`updated the list at index ${order} to  ${categorizedList[order]}`);
  }

  private addAllItemsToCategorizedList(items): Array<object> {
    const categorizedList = [];
    items.forEach(item => {
      const order = this.categoryOrder[this.getItemCategory(item)];
      if (!categorizedList[order]) {
        categorizedList[order] = [];
      }
      categorizedList[order].push(item);
      console.log(`updated the list at index ${order} to  ${categorizedList[order]}`);
    });
    return categorizedList;
  }

  private getItemCategory(item): string {
    let category = this.itemCategories[item.toLowerCase()];
    if (!category) {
      category = 'other';
    }
    return category;
  }

  private arrangePending(): void {
    this.categorizedPendingItems = this.addAllItemsToCategorizedList(this.pendingItems);
    this.pendingItems = this.reloadItemsFromCategorizedItems(this.categorizedPendingItems);
    this.pendingTable.renderRows();
  }

  private arrangeCart(): void {
    this.categorizedCartedItems = this.addAllItemsToCategorizedList(this.cartedItems);
    this.cartedItems = this.reloadItemsFromCategorizedItems(this.categorizedCartedItems);
    this.cartTable.renderRows();
  }
}
