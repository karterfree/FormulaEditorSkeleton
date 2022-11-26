import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ITFormulaEditorComponent } from './itformula-editor/itformula-editor.component';
import { ITFormulaEditorCommandLineComponent } from './itformula-editor-command-line/itformula-editor-command-line.component';

@NgModule({
  declarations: [
    AppComponent,
    ITFormulaEditorComponent,
    ITFormulaEditorCommandLineComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
