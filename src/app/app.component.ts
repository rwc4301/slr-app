import { Component, HostListener, NgZone, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { BehaviorSubject, take } from 'rxjs';

export interface IReferenceID {
  DOI?: string;
  EID?: string;
  UID?: string;
  URL?: string;
}

export class Reference {
  ID: IReferenceID;
  Title: string;
  Authors: string;
  Journal: string;
  Year: string;
  Abstract: string;
  Keywords: string;
  Citations: string;
  Details?: string;
  Selection?: string;

  constructor() {
    this.ID = {};
    this.Title = '';
    this.Authors = '';
    this.Journal = '';
    this.Year = '';
    this.Abstract = '';
    this.Keywords = '';
    this.Citations = '';
    this.Details = '';
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ RouterOutlet, CommonModule, FormsModule, MatButtonModule, MatButtonToggleModule, MatListModule, MatToolbarModule, MatSidenavModule, MatInputModule, MatFormFieldModule, MatIconModule, MatProgressBarModule ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected title = 'slr-app';
  protected items: BehaviorSubject<Reference[]> = new BehaviorSubject<Reference[]>([]);
  protected selectedItem: Reference;
  protected selectedIndex: number; 

  protected criteria: string[] = ['I', 'E1', 'E2', 'E3'];

  constructor(private _ngZone: NgZone) {}

  @ViewChild('autosize') autosize: CdkTextareaAutosize;

  triggerResize() {
    // Wait for changes to be applied, then trigger textarea resize.
    this._ngZone.onStable.pipe(take(1)).subscribe(() => this.autosize.resizeToFitContent(true));
  }

  readCSV(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const csv = e.target?.result;
        const json = this.csvToJson(csv);
        
        console.log(json);
        this.items.next(json);

        this.selectItem(0);
    };

    reader.readAsText(file);
  }

  csvToJson(csv: any) {
    const lines = csv.split('\n');
    const result: any[] = []; // Specify the type of the result array as an array of objects
    const headers = lines[0].split('\",\"');

    for (let i = 1; i < lines.length; i++) {
      const obj: Reference = new Reference();
      const currentLine = lines[i].split('\",\"');

      for (var key of Object.keys(obj)) {
        var j = headers.findIndex(header => header.toLowerCase().includes(key.toLowerCase()));

        // Some fields may not be present or may be named differently
        if (j === -1) {
          if (key === 'Journal') {
            j = headers.findIndex(header => header.toLowerCase().includes('source title'));
          }
        }

        // Remove the quotes from the string
        if (j !== -1) {
          //currentLine[j] = currentLine[j].replace(/"/g, '');
        }

        obj[key] = currentLine[j];
      }
      
      result.push(obj);
    }

    return result;
  }

  exportCSV() {
    const items = this.items.value;
    const headers = Object.keys(items[0]);
    const csv = items.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','));
    csv.unshift(headers.join(','));

    const csvArray = csv.join('\r\n');
    const a = document.createElement('a');
    const blob = new Blob([csvArray], {type: 'text/csv'});

    a.href = window.URL.createObjectURL(blob);
    a.download = 'export.csv';
    a.click();
  }

  selectItem(index: number) {
    this.selectedIndex = index;
    this.selectedItem = this.items.value[index];

    console.log(this.selectedItem);
  }

  back() {
    this.selectItem(Math.max(0, this.selectedIndex - 1));
  }

  forward() {
    this.selectItem(Math.min(this.items.value.length - 1, this.selectedIndex + 1));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.items.value) {
      $event.returnValue = true;
    }
  }
}
