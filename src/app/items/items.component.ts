import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {ShoppinglistService} from './shoppinglist.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  id: string;
  newItem: string;
  inputPlaceHolder: string;
  pendingItems = [];
  cartedItems = [];

  @ViewChild('pendingTable') pendingTable: MatTable<any>;
  @ViewChild('cartTable') cartTable: MatTable<any>;

  constructor(private shoppinglistService: ShoppinglistService, private route: ActivatedRoute, private router: Router) {
    this.newItem = '';
    this.setDefaultPlaceholder();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.id = params.id;
      console.log('id from url: ' + this.id);
    });

    if (this.id) {
      console.log('loading data for id : ' + this.id);
      this.shoppinglistService.fetchData(this.id).subscribe((data: any) => {
        console.log('old data received : ' + JSON.stringify(data));
        if (data) {
          this.id = data.id;
          this.cartedItems = data.cart ? data.cart : [];
          this.pendingItems = data.pending ? data.pending : [];
        }
      });

    } else {
      this.shoppinglistService.fetchData(undefined).subscribe((data: any) => {
        console.log('new data received : ' + JSON.stringify(data));
        this.router.navigateByUrl('/home/' + data.id);
        console.log('navigate to new route');
      });
    }
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
