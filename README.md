# GBIF Visuals Summary

A visualization of GBIF data showing the distribution of species across kingdoms and phyla.

## Features

- Interactive visualization of species distribution
- Kingdom-level overview with occurrence counts
- Expandable phylum details
- Common names and descriptions for species and phyla
- Responsive design that adapts to screen size

## Data Structure

The visualization uses three main data files:
- `kingdoms.csv`: Contains kingdom-level data
- `phyla.csv`: Contains phylum-level data
- `species.csv`: Contains species-level data
- `common-names.json`: Contains common names and descriptions for species and phyla

## Getting Started

1. Make sure you have Python 3 installed
2. Navigate to the project directory
3. Start a simple HTTP server:
   ```bash
   python -m http.server 8000
   ```
4. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

## How to Use

1. The main visualization shows kingdoms as large bars, sorted by total occurrences
2. Click on a kingdom to see its phyla
3. Click on a phylum to see:
   - Common name and description
   - Total number of observations
   - Top species distribution
4. Hover over elements to see detailed information
5. Click again to collapse the details

## Common Names Convention

Common names follow these conventions:
- For recently discovered species (e.g., "JABWCQ01 sp016721565"), scientific names are used as common names
- For established species, descriptive common names are used (e.g., "Sea Gooseberry" for Pleurobrachia pileus)
- For technical phyla, scientific names are used with explanatory descriptions

## Recent Changes

### Spacing Adjustments
- Removed extra spacing between kingdom title and its bar
- Set consistent spacing between kingdom bar and phylum details
- Adjusted phylum bar positioning to be closer to kingdom titles

### Common Names
- Added comprehensive common names and descriptions for all species and phyla
- Included recently discovered species with appropriate descriptions
- Added descriptive common names for established species
- Added technical descriptions for specialized phyla

## Visualization Components

The visualization consists of:
1. Kingdom titles
2. Kingdom bars with occurrence counts
3. Expandable phylum details with common names and descriptions
4. Species details with common names and descriptions

## Technical Details

The visualization is built using:
- D3.js for data visualization
- HTML/CSS for layout and styling
- JavaScript for interactivity
- JSON and CSV for data storage

## Future Improvements

Potential areas for enhancement:
- Add more detailed species information
- Include images for species and phyla
- Add filtering capabilities
- Implement search functionality
- Add more interactive features 