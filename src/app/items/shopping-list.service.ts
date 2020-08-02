import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  private SERVER_URL = 'https://api.quickshoppinglist.com';

  constructor(private httpClient: HttpClient) {
  }

  public fetchData(id): Observable<object> {
    console.log(`fetching data by id: ${id}`);
    if (id === undefined) {
      return this.httpClient.get(`${this.SERVER_URL}`);
    } else {
      return this.httpClient.get(`${this.SERVER_URL}/${id}`);
    }

  }

  public updateData(id, action, item): Observable<object> {

    return this.httpClient.put(`${this.SERVER_URL}`, {id, action, item});

  }
}

