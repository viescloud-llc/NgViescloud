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
directive_name=""
directive_path=""

# Check if arguments are provided, and if so, assign them to variables
if [ ! -z "$1" ]; then
    directive_name="$1"
fi

if [ ! -z "$2" ]; then
    directive_path="$2"
fi

# Prompt user for the directive name (if not provided)
if [ -z "$directive_name" ]; then
    display_header "Step 1: Enter the Directive Name"
    echo "Please enter the name of the Angular directive:"
    read directive_name

    # Check if the directive name is empty
    if [ -z "$directive_name" ]; then
        echo "You must provide a directive name."
        exit 1
    fi
fi

# Prompt user for the absolute path where they want to create the directive (if not provided)
if [ -z "$directive_path" ]; then
    display_header "Step 2: Enter the Absolute Path"
    echo "Please enter the absolute path where you want to create the Angular directive:"
    read directive_path

    # Check if the path is empty
    if [ -z "$directive_path" ]; then
        echo "You must provide a valid absolute path."
        exit 1
    fi
fi

# Create the directory for the directive
mkdir -p "$directive_path/$directive_name"

# Remove all dashes and capitalize the first letter of each word (camelCase)
name_no_dash=$(toCamelCase $directive_name)

# Create the directive TypeScript file
cat > "$directive_path/$directive_name/$directive_name.directive.ts" <<EOL
import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[app-$directive_name]'
})
export class ${name_no_dash^}Directive {

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', 'yellow');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeStyle(this.el.nativeElement, 'background-color');
  }
}
EOL

# Create the directive test file
cat > "$directive_path/$directive_name/$directive_name.directive.spec.ts" <<EOL
import { ${name_no_dash^}Directive } from './$directive_name.directive';
import { ElementRef, Renderer2 } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

describe('$name_no_dash Directive', () => {
  let directive: ${name_no_dash^}Directive;
  let el: ElementRef;
  let renderer: Renderer2;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ElementRef, Renderer2]
    });
    el = TestBed.inject(ElementRef);
    renderer = TestBed.inject(Renderer2);
    directive = new ${name_no_dash^}Directive(el, renderer);
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });
});
EOL

# Confirmation message
display_header "Directive Creation Complete"
echo "Directive '$directive_name' has been manually created at '$directive_path/$directive_name'."
