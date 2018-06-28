import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { ResponsiveComponent } from './responsive/responsive.component';


import { SpeedometerModule,OdometerModule, StatModule, WeatherModule } from 'evishine-module-lib';
import { SimpleModuleComponent } from './simpleModule/simpleModule.component';
@NgModule({
  declarations: [
    AppComponent,
    ResponsiveComponent,
    SimpleModuleComponent
  ],
  imports: [
    BrowserModule,
    SpeedometerModule,
    OdometerModule,
    StatModule,
    WeatherModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
