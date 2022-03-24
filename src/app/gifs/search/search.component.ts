import { GifsService } from './../services/gifs.service';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styles: [
  ]
})
export class SearchComponent {
  @ViewChild('term') term!: ElementRef<HTMLInputElement>;

  constructor(private GifsService: GifsService) {

  }



  search() {
    const value = this.term.nativeElement.value.trim();

    if (value.trim().length === 0) {
      return;
    }

    this.GifsService.searchGifs(value);

    this.term.nativeElement.value = '';
  }

}
