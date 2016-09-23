import { Component } from '@angular/core';
@Component({
  selector: 'app',
  template: `
<div class="off-canvas-wrapper">
  <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
    <app-menu class="off-canvas position-left" id="offCanvasLeft" data-off-canvas></app-menu>
    <div class="off-canvas-content" data-off-canvas-content>
      <app-header id="app-header"></app-header>
    </div>
  </div>
</div>
  `
})
export class AppComponent { }
