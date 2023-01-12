import { GifsService } from './../services/gifs.service';
import { Component, OnInit } from '@angular/core';
import { LinguaResponse } from 'src/app/interface/lingua.interface';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styles: [
  ]
})
export class ResultsComponent implements OnInit {
  wordInfo: LinguaResponse[] = [];
  wordNumber: any[] = [];

  get result() {
    return this.GifsService.result;
  }

  get resultWords() {
    return this.GifsService.resultWords;
  }

  constructor(private GifsService: GifsService) { }

  ngOnInit(): void {
  }

}
