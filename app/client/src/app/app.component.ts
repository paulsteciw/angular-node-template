import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Person} from '../../../dtos/person'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private httpClient: HttpClient) {}
  people$ = this.httpClient.get<Person[]>('/api/people');
}
