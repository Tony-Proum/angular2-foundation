import {Component} from '@angular/core';
@Component({
  selector: 'app-header',
  template: '<div class="title-bar dark">' +
  '<div class="title-bar-left">' +
  '<button class="menu-icon" type="button" data-open="offCanvasLeft"></button>' +
  '<span class="title-bar-title">Responsive</span>' +
  '</div>' +
  '</div>'+
  '<app-menu class="top-bar dark"></app-menu>'
})
export class Header {}
