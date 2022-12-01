import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ExpressionEditorComponent } from './expression-designer/feature/expression-editor/expression-editor.component';
import { ExpressionCommandLineComponent } from './expression-designer/feature/expression-command-line/expression-command-line.component';

@NgModule({
  declarations: [
    AppComponent,
    ExpressionEditorComponent,
    ExpressionCommandLineComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
