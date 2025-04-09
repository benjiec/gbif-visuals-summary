/**
 * Biodiversity Data Visualization
 * 
 * This script creates an interactive visualization of biodiversity data,
 * showing the distribution of species across different biological classifications
 * and geographic locations.
 */

// Configuration object for visualization parameters
const config = {
    width: window.innerWidth * 0.8,  // Width of the visualization
    height: window.innerHeight * 0.8, // Height of the visualization
    margin: { top: 20, right: 20, bottom: 20, left: 20 }, // Margins around the visualization
    barHeight: 30,  // Height of each bar
    spacing: 10,    // Spacing between elements
    detailsSpacing: 50, // Spacing for expanded details
    transitionDuration: 500, // Duration of animations in milliseconds
    maxSpecies: 5,  // Maximum number of species to show
    maxCountries: 5 // Maximum number of countries to show
};

// Data storage objects
let kingdoms = [];  // Array to store kingdom data
let phyla = [];     // Array to store phylum data
let species = [];   // Array to store species data
let countries = []; // Array to store country data
let commonNames = {}; // Object to store common names and descriptions

// SVG container and groups
let svg;           // Main SVG container
let kingdomGroup;  // Group for kingdom elements
let phylumGroup;   // Group for phylum elements
let detailsGroup;  // Group for detail elements

// Scales and axes
let xScale;        // Scale for x-axis (occurrences)
let yScale;        // Scale for y-axis (position)
let colorScale;    // Scale for colors

/**
 * Initialize the visualization
 * Sets up the SVG container, scales, and loads data
 */
async function init() {
    // ... existing code ...
}

/**
 * Create the main visualization
 * Draws the kingdom bars and sets up interactivity
 */
function createVisualization() {
    // ... existing code ...
}

/**
 * Update the total height of the visualization
 * Adjusts the SVG height and positions of elements when details are shown/hidden
 */
function updateTotalHeight() {
    // ... existing code ...
}

/**
 * Toggle the display of phylum details
 * Shows/hides species and country distributions for a selected phylum
 * @param {Object} phylum - The phylum object to show details for
 */
function togglePhylumDetails(phylum) {
    // ... existing code ...
}

/**
 * Create a species bar chart
 * Shows the distribution of species within a phylum
 * @param {Array} speciesData - Array of species data
 * @param {number} total - Total number of observations
 * @param {Object} position - Position to place the chart
 */
function createSpeciesChart(speciesData, total, position) {
    // ... existing code ...
}

/**
 * Create a country pie chart
 * Shows the geographic distribution of observations
 * @param {Array} countryData - Array of country data
 * @param {Object} position - Position to place the chart
 */
function createCountryChart(countryData, position) {
    // ... existing code ...
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    // ... existing code ...
}

/**
 * Calculate percentage
 * @param {number} value - Value to calculate percentage for
 * @param {number} total - Total value
 * @returns {string} Formatted percentage string
 */
function calculatePercentage(value, total) {
    // ... existing code ...
}

// Initialize the visualization when the window loads
window.onload = init;

// Update visualization on window resize
window.onresize = () => {
    config.width = window.innerWidth * 0.8;
    config.height = window.innerHeight * 0.8;
    createVisualization();
}; 