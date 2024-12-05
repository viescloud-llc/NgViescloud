#!/bin/bash

# Function to display a header for better formatting
function display_header() {
    echo "===================================================="
    echo "$1"
    echo "===================================================="
}

# Default values for path and name
service_name=""
service_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    service_name="$1"
fi

if [ ! -z "$2" ]; then
    service_path="$2"
fi

# Prompt user for the service name (if not provided)
if [ -z "$service_name" ]; then
    display_header "Step 1: Enter the Service Name"
    echo "Please enter the name of the Angular service:"
    read service_name

    # Check if the service name is empty
    if [ -z "$service_name" ]; then
        echo "You must provide a service name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the service (if not provided)
if [ -z "$service_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular service:"
    read service_path

    # Check if the path is empty
    if [ -z "$service_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the service
mkdir -p "$service_path/$service_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(echo "$service_name" | tr -d '-' | sed -r 's/(^|\w)(\w*)/\U\1\L\2/g')

# Create the service TypeScript file
cat > "$service_path/$service_name/$service_name.service.ts" <<EOL
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ${name_no_dash^}Service {

  constructor() { }
}
EOL

# Create the service test file
cat > "$service_path/$service_name/$service_name.service.spec.ts" <<EOL
import { TestBed } from '@angular/core/testing';
import { ${name_no_dash^}Service } from './$service_name.service';

describe('$name_no_dash Service', () => {
  let service: ${name_no_dash^}Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(${name_no_dash^}Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
EOL

# Confirmation message
display_header "Service Creation Complete"
echo "Service '$service_name' has been manually created at '$service_path/$service_name'."
