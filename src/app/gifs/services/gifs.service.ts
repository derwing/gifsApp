import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Giphy, GiphyData } from 'src/app/interface/giphy.interface';
import { LinguaResponse, Entry } from 'src/app/interface/lingua.interface';

@Injectable({
  providedIn: 'root'
})
export class GifsService {
  //lingua robot
  urlLingua   : string = 'https://lingua-robot.p.rapidapi.com/language/v1/entries/en/';
  apiKeyLingua: string = '28152e3c2amsh195ef21b44dea8cp1ce574jsn03bebaffc99c';
  apiHost     : string = 'lingua-robot.p.rapidapi.com';

  // giphy.com API Key
  private apiKey  : string = 'Kl5uH0TStAlsBlNgp8mHjsU6cCw37rV0';
  url             : string = 'https://api.giphy.com/v1/gifs/';

  public resultWords: Entry[] = [];
  public result: GiphyData[] = [];

  
  private _historial: string[] = [];
  
  get historial() {
    return [...this._historial];
  }

  constructor(
    private http: HttpClient
  ) { }


  searchGifs(query: any) {
    this.result = [];

    query = query.trim().toLocaleLowerCase();

    if (!this._historial.includes(query)) {
      this._historial.unshift(query);
      this._historial = this._historial.slice(0, 9);
    }


    this.http.get<Giphy>(`https://api.giphy.com/v1/gifs/search?api_key=Kl5uH0TStAlsBlNgp8mHjsU6cCw37rV0&limit=6&q=${query}`)
      .subscribe((resp) => {
        this.result = resp.data.slice(0, 6);
        console.log(resp);
      })

    // fetch(`${`${query}`'}`).then(resp => {
    //   resp.json().then(data => console.log(data))
    // });

    console.log('entró  aquí', this._historial);

    this.searchWords(query);
  }

  searchWords(term: string) {
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': 'lingua-robot.p.rapidapi.com',
        'X-RapidAPI-Key': '28152e3c2amsh195ef21b44dea8cp1ce574jsn03bebaffc99c'
      }
    };

    this.http.get<LinguaResponse>(`${this.urlLingua}${term}`, options)
      .subscribe((resp) => {
        this.resultWords = resp.entries;
        console.log('lingua', resp);
      })
  }
}
