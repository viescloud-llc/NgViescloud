#!/bin/bash

# Function to display a header for better formatting
function display_header() {
    echo "===================================================="
    echo "$1"
    echo "===================================================="
}

# Default values for path and name
guard_name=""
guard_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    guard_name="$1"
fi

if [ ! -z "$2" ]; then
    guard_path="$2"
fi

# Prompt user for the guard name (if not provided)
if [ -z "$guard_name" ]; then
    display_header "Step 1: Enter the Guard Name"
    echo "Please enter the name of the Angular guard:"
    read guard_name

    # Check if the guard name is empty
    if [ -z "$guard_name" ]; then
        echo "You must provide a guard name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the guard (if not provided)
if [ -z "$guard_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular guard:"
    read guard_path

    # Check if the path is empty
    if [ -z "$guard_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the guard
mkdir -p "$guard_path/$guard_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(echo "$guard_name" | tr -d '-' | sed -r 's/(^|\w)(\w*)/\U\1\L\2/g')

# Create the guard TypeScript file
cat > "$guard_path/$guard_name/$guard_name.guard.ts" <<EOL
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ${name_no_dash^}Guard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Implement your guard logic here
    // Example: redirecting if not authenticated
    if (/* not authenticated */) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
EOL

# Create the guard test file
cat > "$guard_path/$guard_name/$guard_name.guard.spec.ts" <<EOL
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { ${name_no_dash^}Guard } from './$guard_name.guard';

describe('$name_no_dash Guard', () => {
  let guard: ${name_no_dash^}Guard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [${name_no_dash^}Guard]
    });
    guard = TestBed.inject(${name_no_dash^}Guard);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when condition is met', () => {
    spyOn(guard, 'canActivate').and.returnValue(true);
    expect(guard.canActivate({} as any, {} as any)).toBe(true);
  });

  it('should block access and redirect when condition is not met', () => {
    spyOn(guard, 'canActivate').and.returnValue(false);
    spyOn(router, 'navigate');
    expect(guard.canActivate({} as any, {} as any)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
EOL

# Confirmation message
display_header "Guard Creation Complete"
echo "Guard '$guard_name' has been manually created at '$guard_path/$guard_name'."
