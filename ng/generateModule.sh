#!/bin/bash

# Function to display a header for better formatting
function display_header() {
    echo "===================================================="
    echo "$1"
    echo "===================================================="
}

# Default values for path and name
module_name=""
module_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    module_name="$1"
fi

if [ ! -z "$2" ]; then
    module_path="$2"
fi

# Prompt user for the module name (if not provided)
if [ -z "$module_name" ]; then
    display_header "Step 1: Enter the Module Name"
    echo "Please enter the name of the Angular module:"
    read module_name

    # Check if the module name is empty
    if [ -z "$module_name" ]; then
        echo "You must provide a module name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the module (if not provided)
if [ -z "$module_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular module:"
    read module_path

    # Check if the path is empty
    if [ -z "$module_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the module
mkdir -p "$module_path/$module_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(echo "$module_name" | tr -d '-' | sed -r 's/(^|\w)(\w*)/\U\1\L\2/g')

# Create the module TypeScript file
cat > "$module_path/$module_name/$module_name.module.ts" <<EOL
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [

  ],
  imports: [

  ],
  exports: [

  ]
})
export class ${name_no_dash^}Module { }
EOL

# Create the module test file
cat > "$module_path/$module_name/$module_name.module.spec.ts" <<EOL
import { TestBed } from '@angular/core/testing';
import { ${name_no_dash^}Module } from './$module_name.module';

describe('$name_no_dash Module', () => {
  let module: ${name_no_dash^}Module;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [${name_no_dash^}Module]
    });
    module = TestBed.inject(${name_no_dash^}Module);
  });

  it('should be created', () => {
    expect(module).toBeTruthy();
  });
});
EOL

# Confirmation message
display_header "Module Creation Complete"
echo "Module '$module_name' has been manually created at '$module_path/$module_name'."
