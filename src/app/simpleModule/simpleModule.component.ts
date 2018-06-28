import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-simpleModule',
  templateUrl: './simpleModule.component.html',
  styleUrls: ['./simpleModule.component.scss']
})
export class SimpleModuleComponent implements OnInit {
  title: string = "Lille Vildmose";
  forbrug: string = "88";
  
  constructor() { }
  
  aNeedForRescale: boolean = true;
  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    var windowWidth = $(window).width();
    if (windowWidth >= 768) {
      this.aNeedForRescale = false;
      var displayRatio = 1920 / 1080;
      var x = $(window).width();
      var y = $(window).height();
      var width;
      var height;
      var a1 = x;
      var a2 = y * displayRatio;
      width = Math.round(Math.min(a1, a2));
      height = Math.round(width / displayRatio);
      var scaleX = width / 100;
      var fontSize = scaleX / 1;
      let container = $(".main-wrapper");
      container.css("fontSize", fontSize + 'pt');
      container.css("position", "absolute");
      container.css("width", width);
      container.css("height", height);
      container.css("left", (x - width) / 2);
      container.css("top", (y - height) / 2);
      container.css("overflow", "hidden");

    } else if (windowWidth < 768) {
      this.aNeedForRescale = true;
    }
  }

  ngOnInit() {
    this.onResize()
  }
}
