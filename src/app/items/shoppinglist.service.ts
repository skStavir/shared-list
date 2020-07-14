import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShoppinglistService {

  private SERVER_URL = 'https://api.quickshoppinglist.com';

  constructor(private httpClient: HttpClient) {
  }

  public fetchData(id) {
    console.log(`fetching data by id: ${id}`);
    if (id === undefined) {
      return this.httpClient.get(`${this.SERVER_URL}`);
    } else {
      return this.httpClient.get(`${this.SERVER_URL}/${id}`);
    }

  }

  public updateData(id, pendingItems, cartedItems) {

    return this.httpClient.put(`${this.SERVER_URL}`, {id: id, pending: pendingItems, cart: cartedItems});

  }
}

