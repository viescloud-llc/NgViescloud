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
pipe_name=""
pipe_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    pipe_name="$1"
fi

if [ ! -z "$2" ]; then
    pipe_path="$2"
fi

# Prompt user for the pipe name (if not provided)
if [ -z "$pipe_name" ]; then
    display_header "Step 1: Enter the Pipe Name"
    echo "Please enter the name of the Angular pipe:"
    read pipe_name

    # Check if the pipe name is empty
    if [ -z "$pipe_name" ]; then
        echo "You must provide a pipe name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the pipe (if not provided)
if [ -z "$pipe_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular pipe:"
    read pipe_path

    # Check if the path is empty
    if [ -z "$pipe_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the pipe
mkdir -p "$pipe_path/$pipe_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(toCamelCase $pipe_name)

# Create the pipe TypeScript file
cat > "$pipe_path/$pipe_name/$pipe_name.pipe.ts" <<EOL
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: '${pipe_name^}'
})
export class ${name_no_dash^}Pipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    // Implement your custom pipe logic here
    return value;
  }
}
EOL

# Create the pipe test file
cat > "$pipe_path/$pipe_name/$pipe_name.pipe.spec.ts" <<EOL
import { ${name_no_dash^}Pipe } from './$pipe_name.pipe';

describe('$name_no_dash Pipe', () => {
  let pipe: ${name_no_dash^}Pipe;

  beforeEach(() => {
    pipe = new ${name_no_dash^}Pipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform the value correctly', () => {
    const result = pipe.transform('test');
    expect(result).toBe('test');  # Modify as per your logic
  });
});
EOL

# Confirmation message
display_header "Pipe Creation Complete"
echo "Pipe '$pipe_name' has been manually created at '$pipe_path/$pipe_name'."
