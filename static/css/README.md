# CSS Structure Documentation

This file documents the CSS structure of the site to help with maintenance and future development.

## Overview

The site uses a modular CSS structure where each major section has its own dedicated stylesheet, built on top of Bootstrap 5.

## Core Files

### styles.css
- **Purpose**: Base styles for the entire site
- **Contents**: Basic typography, card styling, navbar, theme toggle
- **Used by**: All pages (loaded in base.html)

### game.css
- **Purpose**: Styling for standard game views
- **Contents**: Game board container, game controls
- **Used by**: Regular (non-fullscreen) games
- **Loaded in**: templates/games/base.html

### game-fs.css
- **Purpose**: Styling for fullscreen game views
- **Contents**: Floating control panel, fullscreen layout
- **Used by**: Complex games that benefit from maximum screen space
- **Loaded in**: Individual game templates when needed (e.g., three-body.html)

### blogs.css
- **Purpose**: GitHub-like Markdown styling
- **Contents**: Typography for headers, lists, code blocks, tables
- **Used by**: Blog pages and game pages with blog sections
- **Loaded in**: templates/blogs/single-blog.html and conditionally in game templates

## Additional Resources

### pypigments/
- **Purpose**: Syntax highlighting for code blocks
- **Contents**: Various themes (solarized-light, solarized-dark, etc.)
- **Used by**: Blog pages with code snippets

## Theme Support

The site supports light and dark modes through Bootstrap's theming system (`data-bs-theme` attribute).
The theme-toggle.js script in /static/js handles the toggling and persistence of the theme preference.

## CSS Variables

The site uses CSS variables defined in variables.css for theming (light/dark). Game boards use `--game-board-background` for the default board background.

## Responsive Design

The site is fully responsive with:
- Media queries for navbar adjustments on mobile
- Responsive game board sizing using `vmin` units
- Bootstrap's grid system for layout

## Recommendations for Future Development

1. Consider creating a central CSS variables file for more consistent theming
2. Use BEM or another CSS methodology for more structured class naming
3. Consider using a CSS preprocessor like Sass for more maintainable stylesheets
4. Add more comprehensive dark mode support with dedicated variables 