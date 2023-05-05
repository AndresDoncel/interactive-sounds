import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AudioVisualizerComponent } from './audio-visualizer/audio-visualizer.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AudioVisualizerComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
