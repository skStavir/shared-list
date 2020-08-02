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
  itemsMasterList = ['rice', 'atta', 'wheat', 'millets', 'maida', 'raagi', 'rava', 'banana', 'apple', 'orange', 'fruits', 'papaya', 'guava', 'grapes', 'pineapple', 'vegetables', 'cucumber', 'carrot', 'beetroot', 'beans', 'pudina', 'mint', 'curry leaves', 'cauliflower', 'tomato', 'potato', 'ginger', 'garlic', 'pen', 'pencil', 'book', 'paper', 'snacks', 'chips', 'icecream', 'bread', 'cake', 'house holds', 'brush', 'paste', 'soap', 'blade', 'trimmer', 'sanitizer', 'hand wash'
  ];
  filteredItems: Observable<string[]>;
  itemInputControl = new FormControl();

  pendingItems = [];
  cartedItems = [];
  interval: number;
  syncInProgress = false;

  // serverUrl = 'http://localhost:4200?id=';
  serverUrl = 'https://quickshoppinglist.com?id=';

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor(private shoppingListService: ShoppingListService, private route: ActivatedRoute, private router: Router,
              private dialog: MatDialog) {
    this.newItem = '';
    this.setDefaultPlaceholder();
  }

  ngOnInit(): void {
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

    this.filteredItems = this.itemInputControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
  }

  add(): void {
    if (this.newItem.trim() === '') {
      this.inputPlaceHolder = 'Please enter a valid item';
      return;
    }
    this.pendingItems.push(this.newItem);
    this.pendingItems.sort((val1, val2) => val1.localeCompare(val2));
    this.pendingTable.renderRows();
    this.syncData('ADD', this.newItem);
    this.resetInput();
  }

  cart(item): void {
    this.cartedItems.push(item);
    this.cartedItems.sort((val1, val2) => val1.localeCompare(val2));
    this.removeItemFromPending(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
    this.syncData('PICKED', item);
  }

  pending(item): void {
    this.pendingItems.push(item);
    this.pendingItems.sort((val1, val2) => val1.localeCompare(val2));
    this.removeItemFromCarted(item);
    this.pendingTable.renderRows();
    this.cartTable.renderRows();
    this.syncData('DROPPED', item);
  }

  remove(item): void {
    const index = this.pendingItems.indexOf(item, 0);
    if (index > -1) {
      this.pendingItems.splice(index, 1);
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
    const shareDialog = this.dialog.open(ShareDialogComponent,
      {data: {shareUrl: this.serverUrl + this.id, appUrl: this.serverUrl}});
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
      console.log('shopping list from server : ' + JSON.stringify(data));
      this.updateDataFromServer(data);
      this.syncInProgress = false;
    });
  }

  private updateDataFromServer(data: any): void {
    if (data) {
      this.id = data.id;
      this.cartedItems = data.cart ? data.cart : [];
      this.pendingItems = data.pending ? data.pending : [];
      this.pendingTable.renderRows();
      this.cartTable.renderRows();
    }
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
