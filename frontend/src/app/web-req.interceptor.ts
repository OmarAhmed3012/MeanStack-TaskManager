import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpErrorResponse, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, empty } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebReqInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) { }


  refreshingAccessToken: Boolean

  intercept(request: HttpRequest<any>, next:HttpHandler): Observable<any> {
    request = this.addAuthHeader(request)

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error)

        if(error.status === 401 && !this.refreshingAccessToken) {
          //unauthorized

          //refresh access token
          return this.refreshAccessToken()
            .pipe(
            switchMap(() => {
              request = this.addAuthHeader(request)
              return next.handle(request)
            }), catchError((err: any) => {
              console.log(err)
              this.authService.logout()
              return empty
            })
          )

          
        }

        return throwError(error)
      })
    )
  }


  refreshAccessToken() {
    this.refreshingAccessToken = true

    return this.authService.getNewAccessToken().pipe(
      tap(() => {
        this.refreshingAccessToken = false
        console.log("Access Token Refreshed!")
      })
    )
  }

  addAuthHeader(request: HttpRequest<any>) { 
    const token = this.authService.getAccessToken()

    if (token) {
      return request.clone({
        setHeaders: {
          'x-access-token': token
        }
      })
    }
    return request
  }

}
