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
resolver_name=""
resolver_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    resolver_name="$1"
fi

if [ ! -z "$2" ]; then
    resolver_path="$2"
fi

# Prompt user for the resolver name (if not provided)
if [ -z "$resolver_name" ]; then
    display_header "Step 1: Enter the Resolver Name"
    echo "Please enter the name of the Angular resolver:"
    read resolver_name

    # Check if the resolver name is empty
    if [ -z "$resolver_name" ]; then
        echo "You must provide a resolver name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the resolver (if not provided)
if [ -z "$resolver_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular resolver:"
    read resolver_path

    # Check if the path is empty
    if [ -z "$resolver_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the resolver
mkdir -p "$resolver_path/$resolver_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(toCamelCase $resolver_name)

# Create the resolver TypeScript file
cat > "$resolver_path/$resolver_name/$resolver_name.resolver.ts" <<EOL
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ${name_no_dash^}Resolver implements Resolve<any> {

  constructor() { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    // Implement your resolver logic here
    // Example: fetching data before the route is activated
    return new Observable((observer) => {
      // Simulate a data-fetching process
      observer.next({ data: 'Some resolved data' });
      observer.complete();
    });
  }
}
EOL

# Create the resolver test file
cat > "$resolver_path/$resolver_name/$resolver_name.resolver.spec.ts" <<EOL
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ${name_no_dash^}Resolver } from './$resolver_name.resolver';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';

describe('$name_no_dash Resolver', () => {
  let resolver: ${name_no_dash^}Resolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [${name_no_dash^}Resolver]
    });
    resolver = TestBed.inject(${name_no_dash^}Resolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should resolve data', () => {
    const route: ActivatedRouteSnapshot = {} as any;
    const state: RouterStateSnapshot = {} as any;

    // Simulating resolver logic and checking the result
    resolver.resolve(route, state).subscribe(data => {
      expect(data).toEqual({ data: 'Some resolved data' });
    });
  });
});
EOL

# Confirmation message
display_header "Resolver Creation Complete"
echo "Resolver '$resolver_name' has been manually created at '$resolver_path/$resolver_name'."
