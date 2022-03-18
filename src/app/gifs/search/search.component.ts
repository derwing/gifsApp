import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styles: [
  ]
})
export class SearchComponent {
  @ViewChild('term') term!: ElementRef<HTMLInputElement>;

  search() {
    const value = this.term.nativeElement.value;
    console.log(value);

    this.term.nativeElement.value = '';
  }

}
