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
import {error} from 'selenium-webdriver';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit, OnDestroy {

  serverUrl = 'http://localhost:4200?id=';
  // serverUrl = 'https://quickshoppinglist.com?id=';

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
  syncSuccess = true;
  pendingForPush = [];

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
    });

    if (this.isValidId()) {
      console.log('loading data of list id : ' + this.id);
      this.shoppingListService.fetchLatestList(this.id).subscribe((data: any) => {
        console.log('shopping list from server : ' + JSON.stringify(data));
        this.refreshUiWithLatestDataFromServer(data);
        this.enabledReload();
      });

    } else {
      this.shoppingListService.fetchLatestList(undefined).subscribe((data: any) => {
        console.log('created a shopping list : ' + JSON.stringify(data));
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

    this.newItem = this.capitalizeFirstLetter(this.newItem);
    this.pendingItems.push(this.newItem);
    this.arrangePending();

    this.pushData('ADD', this.newItem);
    this.resetInput();
  }

  cart(item): void {
    const index = this.pendingItems.indexOf(item);
    this.pendingItems.splice(index, 1);
    this.cartedItems.push(item);

    this.arrangePending();
    this.arrangeCart();

    this.pushData('PICKED', item);
  }

  pending(item): void {
    const index = this.cartedItems.indexOf(item);
    this.cartedItems.splice(index, 1);
    this.pendingItems.push(item);

    this.arrangePending();
    this.arrangeCart();

    this.pushData('DROPPED', item);
  }

  remove(item): void {
    const index = this.pendingItems.indexOf(item);
    this.pendingItems.splice(index, 1);
    this.itemsMasterList.push(item);

    this.arrangePending();

    this.pushData('REMOVE', item);
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
    } catch (error) {
      console.log('You shopping list is not shared, reason: ', error);
      this.shareDialog();
    }
  }

  story(): void {
    location.href = 'https://quickshoppinglist.com/story.html';
  }

  private isValidId() {
    return this.id && this.id != undefined && this.id != 'undefined';
  }

  private capitalizeFirstLetter(item): string {
    return this.newItem.charAt(0).toUpperCase() + this.newItem.slice(1);
  }

  private thisLoadItemsAndCategories(): void {
    this.shoppingListService.getCategorizedItems().subscribe((categoyItems: any) => {
      categoyItems.forEach((itemList) => {
        itemList.items.forEach((item) => {
          const itemInLowerCase = item.toLowerCase();
          this.itemsMasterList.push(item);
          this.itemCategories[itemInLowerCase] = itemList.category;
        });
        this.itemsMasterList.sort((a, b) => a.length > b.length ? 1 : -1);
        this.categoryOrder[itemList.category] = itemList.order;
      });
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
    return this.itemsMasterList.filter(option => filterValue.length > 1 && option.toLowerCase().includes(filterValue));
  }

  private enabledReload(): void {
    this.interval = setInterval(() => {
      this.doPendingPushToServer();
      this.pullDataFromServer();
    }, 10000);
  }

  private doPendingPushToServer(): void {
    if (this.isPushPending()) {
      console.log('do pending push');
      this.pushChain(this.pendingForPush[0]);
    }
  }

  private isPushPending() {
    return this.pendingForPush.length > 0;
  }

  private pullDataFromServer(): void {
    if (this.isPushPending()) {
      console.log('skipping reload since push is pending progress');
      return;
    }
    console.log('pull data from server');
    this.shoppingListService.fetchLatestList(this.id).subscribe((data: any) => {
      this.refreshUiWithLatestDataFromServer(data);
      this.syncSuccess = true;
    }, error => {
      this.syncSuccess = false;
    });
  }

  private pushData(action, item): void {
    this.pendingForPush.push({action, item});
    this.pushChain(this.pendingForPush[0]);
  }

  //Order of the actions is important
  private pushChain(actionAndItem) {
    console.log(`pushing  action:${JSON.stringify(actionAndItem)} to server`);
    this.shoppingListService.updateData(this.id, actionAndItem.action, actionAndItem.item).subscribe((data: any) => {
      this.pendingForPush.shift();
      if (this.isPushPending()) {
        console.log('continue push next action');
        this.pushChain(this.pendingForPush[0]);
      } else {
        console.log('No more actions pending. push done');
        this.syncSuccess = true;
      }
    }, (error) => {
      console.log('push failed. stopping push');
      this.syncSuccess = false;
    });
  }

  private refreshUiWithLatestDataFromServer(data: any): void {
    if (data) {
      this.id = data.id;
      this.pendingItems = data.pending;
      data.pending.forEach(item => this.removeItemFromMasterList(item));
      this.arrangePending();

      this.cartedItems = data.cart;
      data.cart.forEach(item => this.removeItemFromMasterList(item));
      this.arrangeCart();
    }
  }

  private removeItemFromMasterList(item): void {
    const index = this.itemsMasterList.indexOf(item);
    this.itemsMasterList.splice(index, 1);
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

  private addAllItemsToCategorizedList(items): Array<object> {
    const categorizedList = [];
    items.forEach(item => {
      const order = this.categoryOrder[this.getItemCategory(item)];
      if (!categorizedList[order]) {
        categorizedList[order] = [];
      }
      categorizedList[order].push(item);
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
