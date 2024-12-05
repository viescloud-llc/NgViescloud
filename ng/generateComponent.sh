#!/bin/bash

# Function to display a header for better formatting
function display_header() {
    echo "===================================================="
    echo "$1"
    echo "===================================================="
}

# Default values for path, name, and style
component_name=""
component_path=""
style_choice=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    component_name="$1"
fi

if [ ! -z "$2" ]; then
    component_path="$2"
fi

if [ ! -z "$3" ]; then
    style_choice="$3"
fi

# Prompt user for the component name (if not provided)
if [ -z "$component_name" ]; then
    display_header "Step 1: Enter the Component Name"
    echo "Please enter the name of the Angular component:"
    read component_name

    # Check if the component name is empty
    if [ -z "$component_name" ]; then
        echo "You must provide a component name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the component (if not provided)
if [ -z "$component_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular component:"
    read component_path

    # Check if the path is empty
    if [ -z "$component_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Prompt user to select the style format (if not provided)
if [ -z "$style_choice" ]; then
    display_header "Step 3: Select the Style Format"
    echo "Please select the style format for the component (you can either enter a number or style name):"
    echo "1. CSS"
    echo "2. SCSS"
    echo "3. LESS"
    echo "4. None (No styling)"
    read -p "Enter your choice (1/2/3/4 or css/scss/less/none): " style_choice
fi

# Normalize the style input to lowercase for comparison
style_choice=$(echo "$style_choice" | tr '[:upper:]' '[:lower:]')

# Set the file extension based on the selected style format
case $style_choice in
    1|css)
        style_extension="css"
        ;;
    2|scss)
        style_extension="scss"
        ;;
    3|less)
        style_extension="less"
        ;;
    4|none)
        style_extension="none"
        ;;
    *)
        echo "Invalid choice. Defaulting to CSS."
        style_extension="css"
        ;;
esac

# Create the directory for the component
mkdir -p "$component_path/$component_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(echo "$component_name" | tr -d '-' | sed -r 's/(^|\w)(\w*)/\U\1\L\2/g')

# Create the component TypeScript file
cat > "$component_path/$component_name/$component_name.component.ts" <<EOL
import { Component } from '@angular/core';

@Component({
  selector: 'app-$component_name',
  templateUrl: './$component_name.component.html',
  styleUrls: ['./$component_name.component.$style_extension']
})
export class ${name_no_dash^}Component {
  constructor() { }
}
EOL

# Create the component HTML file
cat > "$component_path/$component_name/$component_name.component.html" <<EOL
<p>
  $component_name works!
</p>
EOL

# Create the style file if selected (CSS, SCSS, LESS, or None)
if [ "$style_extension" != "none" ]; then
    cat > "$component_path/$component_name/$component_name.component.$style_extension" <<EOL
/* Add your component styles here */
EOL
fi

# Create the component test file
cat > "$component_path/$component_name/$component_name.component.spec.ts" <<EOL
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${name_no_dash^}Component } from './$component_name.component';

describe('$name_no_dash Component', () => {
  let component: ${name_no_dash^}Component;
  let fixture: ComponentFixture<${name_no_dash^}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${name_no_dash^}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${name_no_dash^}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
EOL

# Confirmation message
display_header "Component Creation Complete"
echo "Component '$component_name' has been manually created at '$component_path/$component_name'."
