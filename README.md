# Biodiversity Data Visualization

This project visualizes biodiversity data using D3.js, showing the distribution of species across different biological classifications (kingdoms, phyla) and geographic locations.

## Features

- Interactive visualization of biological classification hierarchy
- Kingdom-level overview with total occurrence counts
- Phylum-level details with common names and descriptions
- Species distribution visualization using horizontal bar charts
- Geographic distribution visualization using pie charts
- Interactive tooltips and hover effects
- Responsive design that adapts to window size

## Data Sources

The visualization uses several CSV files:
- `kingdom.csv`: Contains kingdom-level data
- `phyla.csv`: Contains phylum-level data
- `species.csv`: Contains species-level data
- `phyla-country.csv`: Contains geographic distribution data
- `common-names.json`: Contains common names and descriptions for phyla and species

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
   - Top species distribution (horizontal bar chart)
   - Geographic distribution (pie chart)
4. Hover over elements to see detailed information
5. Click again to collapse the details

## Project Structure

- `index.html`: Main HTML file
- `css/style.css`: Styles for the visualization
- `js/visualization.js`: Main visualization code
- `data/`: Directory containing all data files

## Technical Details

The visualization is built using:
- D3.js for data visualization
- JavaScript for interactivity
- CSS for styling and animations

The code uses several D3.js features:
- Scales (linear, logarithmic)
- Axes
- Pie charts
- Bar charts
- Transitions and animations
- Event handling
- Data loading and processing

## Data Processing

The visualization processes the data in several steps:
1. Loads all CSV and JSON files
2. Processes kingdom data to calculate totals
3. Processes phylum data to calculate distributions
4. Processes species data to show top species
5. Processes country data to show geographic distribution
6. Combines with common names and descriptions

## Future Improvements

Potential areas for enhancement:
- Add more interactive features
- Improve mobile responsiveness
- Add more detailed tooltips
- Include more data sources
- Add filtering capabilities
- Improve performance for large datasets 