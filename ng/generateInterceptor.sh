#!/bin/bash

# Function to display a header for better formatting
function display_header() {
    echo "===================================================="
    echo "$1"
    echo "===================================================="
}

# Function to remove dashes and capitalize each character after a dash and the first character
function toCamelCase() {
    local input_string="$1"
    # Remove dashes and capitalize the next character
    local output_string=$(echo "$input_string" | sed 's/[-]\([a-z]\)/\U\1/g' | sed 's/^\([a-z]\)/\U\1/')
    echo "$output_string"
}

# Default values for path and name
interceptor_name=""
interceptor_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    interceptor_name="$1"
fi

if [ ! -z "$2" ]; then
    interceptor_path="$2"
fi

# Prompt user for the interceptor name (if not provided)
if [ -z "$interceptor_name" ]; then
    display_header "Step 1: Enter the Interceptor Name"
    echo "Please enter the name of the Angular interceptor:"
    read interceptor_name

    # Check if the interceptor name is empty
    if [ -z "$interceptor_name" ]; then
        echo "You must provide an interceptor name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the interceptor (if not provided)
if [ -z "$interceptor_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular interceptor:"
    read interceptor_path

    # Check if the path is empty
    if [ -z "$interceptor_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the interceptor
mkdir -p "$interceptor_path/$interceptor_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(toCamelCase $interceptor_name)

# Create the interceptor TypeScript file
cat > "$interceptor_path/$interceptor_name/$interceptor_name.interceptor.ts" <<EOL
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ${name_no_dash^}Interceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Modify the request or perform actions before the request is sent
    const modifiedReq = req.clone({
      setHeaders: {
        'Authorization': 'Bearer your-token-here'
      }
    });

    // Pass the modified request to the next handler
    return next.handle(modifiedReq);
  }
}
EOL

# Create the interceptor test file
cat > "$interceptor_path/$interceptor_name/$interceptor_name.interceptor.spec.ts" <<EOL
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ${name_no_dash^}Interceptor } from './$interceptor_name.interceptor';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

describe('$name_no_dash Interceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ${name_no_dash^}Interceptor, multi: true }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    const interceptor = TestBed.inject(${name_no_dash^}Interceptor);
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header', () => {
    httpClient.get('/test').subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe('Bearer your-token-here');
    req.flush({});
  });

  afterEach(() => {
    httpMock.verify();
  });
});
EOL

# Confirmation message
display_header "Interceptor Creation Complete"
echo "Interceptor '$interceptor_name' has been manually created at '$interceptor_path/$interceptor_name'."
