import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly defaultDuration = 4000;

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.show(message, 'notif-success');
  }

  error(message: string): void {
    this.show(message, 'notif-error');
  }

  info(message: string): void {
    this.show(message, 'notif-info');
  }

  private show(message: string, panelClass: string): void {
    const config: MatSnackBarConfig = {
      duration: this.defaultDuration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass],
    };
    this.snackBar.open(message, '✕', config);
  }
}
