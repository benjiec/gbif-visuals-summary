/**
 * Biodiversity Data Visualization
 * 
 * This script creates an interactive visualization of biodiversity data,
 * showing the distribution of species across different biological classifications
 * and geographic locations.
 */

// Configuration object for visualization parameters
const config = {
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    barHeight: 30,
    spacing: 20,
    indentation: 20,
    transitionDuration: 500
};

// Taxonomic levels in order
const TAXONOMY_LEVELS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];

// Data storage
let taxonomyData = {
    kingdom: [],
    phylum: [],
    class: [],
    order: [],
    family: [],
    genus: [],
    species: []
};
let commonNames = {};

// SVG elements
let svg;
let mainGroup;

// Track expanded nodes
let expandedNodes = new Map(); // key: "level:name", value: occurrence_count

// Color management
const colorScheme = d3.schemeTableau10;
let currentColorIndex = 0;
let termColors = new Map(); // Store colors for each term

/**
 * Get color for a term, assigning a new one if not already assigned
 */
function getTermColor(term) {
    if (!termColors.has(term)) {
        termColors.set(term, colorScheme[currentColorIndex]);
        currentColorIndex = (currentColorIndex + 1) % colorScheme.length;
    }
    return termColors.get(term);
}

/**
 * Initialize the visualization
 */
async function init() {
    try {
        // Load all data files
        const [kingdomData, phylaData, classesData, ordersData, familiesData, generaData, speciesData, commonNamesData] = 
            await Promise.all([
                d3.csv('data/kingdom.csv'),
                d3.csv('data/phyla.csv'),
                d3.csv('data/classes.csv'),
                d3.csv('data/orders.csv'),
                d3.csv('data/families.csv'),
                d3.csv('data/genera.csv'),
                d3.csv('data/species.csv'),
                d3.csv('data/common-names.csv')
            ]);

        // Store data
        taxonomyData.kingdom = kingdomData || [];
        taxonomyData.phylum = phylaData || [];
        taxonomyData.class = classesData || [];
        taxonomyData.order = ordersData || [];
        taxonomyData.family = familiesData || [];
        taxonomyData.genus = generaData || [];
        taxonomyData.species = speciesData || [];

        // Convert common names to lookup map
        commonNames = Object.fromEntries(
            (commonNamesData || []).map(row => [row.scientific_name, row.common_name])
        );

        // Create SVG
        svg = d3.select('#visualization')
            .append('svg')
            .attr('width', config.width)
            .attr('height', config.height);

        // Create main group
        mainGroup = svg.append('g')
            .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

        // Create visualization starting with kingdoms
        createVisualization();
    } catch (error) {
        console.error('Error initializing visualization:', error);
        d3.select('#visualization')
            .append('div')
            .style('color', 'red')
            .style('padding', '20px')
            .text(`Error: ${error.message}`);
    }
}

/**
 * Create the main visualization
 */
function createVisualization() {
    // Clear existing elements
    mainGroup.selectAll('*').remove();

    // Start with kingdoms
    renderTaxonomicLevel('kingdom', null, 0);

    // Update SVG height based on content
    const totalHeight = calculateTotalHeight();
    svg.attr('height', Math.max(config.height, totalHeight + config.margin.top + config.margin.bottom));
}

/**
 * Render a taxonomic level
 */
function renderTaxonomicLevel(level, parent, depth) {
    const data = filterTaxonomicData(level, parent);
    if (!data || data.length === 0) return 0;

    const yOffset = calculateYOffset(level, parent, depth);
    const xOffset = depth * config.indentation;

    // Get the occurrence count from the parent level if available
    let totalOccurrences, totalIndividuals;
    if (parent) {
        const parentLevel = getPreviousLevel(level);
        const parentRecord = taxonomyData[parentLevel].find(d => d[parentLevel] === parent);
        if (parentRecord) {
            totalOccurrences = +parentRecord.occurrence_count;
            totalIndividuals = +(parentRecord.individual_count || 0);
        }
    }
    
    // Fallback to sum if parent record not found
    if (!totalOccurrences) {
        totalOccurrences = d3.sum(data, d => +d.occurrence_count);
        totalIndividuals = d3.sum(data, d => +(d.individual_count || 0));
    }

    // Create logarithmic scale for percentages
    const availableWidth = config.width - config.margin.left - config.margin.right - xOffset;
    const logScale = d3.scaleLog()
        .domain([0.01, 100])  // Handle percentages from 0.01% to 100%
        .range([0, availableWidth])  // Full width range
        .clamp(true);  // Clamp values to the range

    // Calculate total width needed for log scale
    const totalLogWidth = d3.sum(data, d => {
        const percentage = (+d.occurrence_count / totalOccurrences) * 100;
        return logScale(Math.max(0.01, percentage));
    });

    // Scale factor to ensure bars fill available width
    const scaleFactor = availableWidth / totalLogWidth;

    // Calculate percentage of parent's total if this is an expanded level
    let percentageOfParent = '';
    if (parent) {
        const parentTotal = expandedNodes.get(`${getPreviousLevel(level)}:${parent}`);
        if (parentTotal) {
            const percentage = ((totalOccurrences / parentTotal) * 100).toFixed(1);
            percentageOfParent = ` (${percentage}%)`;
        }
    }

    // Add level title
    mainGroup.append('text')
        .attr('x', xOffset)
        .attr('y', yOffset - 5)
        .text(parent ? 
            `${getPluralForm(level)} of ${getDisplayName(parent, getPreviousLevel(level))} (${formatNumber(totalOccurrences)} occurrences${percentageOfParent}, ${formatNumber(totalIndividuals)} individuals)` : 
            `${getPluralForm(level)} (${formatNumber(totalOccurrences)} occurrences, ${formatNumber(totalIndividuals)} individuals)`)
        .style('font-size', '14px')
        .style('font-weight', 'bold');

    // Create a single bar group
    const barGroup = mainGroup.append('g')
        .attr('class', `bar-${level}-${parent || 'root'}`)
        .attr('transform', `translate(${xOffset}, ${yOffset})`);

    // Calculate cumulative x positions for segments
    let cumulativeX = 0;
    
    // Add segments within the bar
    const segments = barGroup.selectAll('.segment')
        .data(data)
        .join('g')
        .attr('class', 'segment')
        .attr('transform', d => {
            const x = cumulativeX;
            const percentage = (+d.occurrence_count / totalOccurrences) * 100;
            const width = logScale(Math.max(0.01, percentage)) * scaleFactor;
            cumulativeX += width;
            return `translate(${x}, 0)`;
        });

    // Add rectangles for segments
    segments.append('rect')
        .attr('width', d => {
            const percentage = (+d.occurrence_count / totalOccurrences) * 100;
            return logScale(Math.max(0.01, percentage)) * scaleFactor;
        })
        .attr('height', config.barHeight)
        .attr('fill', d => getTermColor(d[level]))
        .style('cursor', level === 'species' ? 'default' : 'pointer')
        .on('click', (event, d) => {
            if (level !== 'species') {
                toggleExpansion(level, d[level], totalOccurrences);
            }
        })
        .on('mouseover', (event, d) => showTooltip(event, d, level, totalOccurrences))
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

    // Add labels to segments
    segments.append('text')
        .attr('x', 5)
        .attr('y', config.barHeight / 2)
        .attr('dy', '0.35em')
        .text(d => {
            const name = level === 'species' ? getDisplayName(d.species, 'species') : getDisplayName(d[level], level);
            const percentage = ((+d.occurrence_count / totalOccurrences) * 100).toFixed(1);
            return `${name} (${percentage}%)`;
        })
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('cursor', level === 'species' ? 'default' : 'pointer')
        .on('click', (event, d) => {
            if (level !== 'species') {
                toggleExpansion(level, d[level], totalOccurrences);
            }
        })
        .on('mouseover', (event, d) => showTooltip(event, d, level, totalOccurrences))
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

    let totalHeight = yOffset + config.barHeight + config.spacing;

    // Render expanded children
    data.forEach((d, i) => {
        if (isExpanded(level, d[level])) {
            const nextLevel = getNextLevel(level);
            if (nextLevel) {
                const childHeight = renderTaxonomicLevel(nextLevel, d[level], depth + 1);
                totalHeight = Math.max(totalHeight, childHeight);
            }
        }
    });

    return totalHeight;
}

/**
 * Filter taxonomic data based on parent
 */
function filterTaxonomicData(level, parent) {
    if (!parent) {
        return taxonomyData[level].sort((a, b) => +b.occurrence_count - +a.occurrence_count);
    }
    
    const parentLevel = getPreviousLevel(level);
    let filteredData = taxonomyData[level]
        .filter(d => d[parentLevel] === parent)
        .sort((a, b) => +b.occurrence_count - +a.occurrence_count);

    // Add "Other species" category if we're at species level
    if (level === 'species') {
        // Get the parent record to get its total occurrences
        const parentRecord = taxonomyData[parentLevel].find(d => d[parentLevel] === parent);
        if (parentRecord) {
            // Calculate sum of all species occurrences
            const speciesSum = d3.sum(filteredData, d => +d.occurrence_count);
            // If there's a remainder, add it as "Other species"
            const remainder = +parentRecord.occurrence_count - speciesSum;
            if (remainder > 0) {
                filteredData.push({
                    species: 'Other species',
                    occurrence_count: remainder,
                    individual_count: 0,  // We don't have this information for other species
                    [parentLevel]: parent
                });
            }
        }
    }

    return filteredData;
}

/**
 * Calculate Y offset for a level
 */
function calculateYOffset(level, parent, depth) {
    return depth * (config.barHeight + config.spacing) * 2;
}

/**
 * Calculate total visualization height
 */
function calculateTotalHeight() {
    let height = 0;
    const countExpanded = Array.from(expandedNodes.values()).filter(v => v).length;
    height = (countExpanded + 1) * (config.barHeight + config.spacing) * 2;
    return height;
}

/**
 * Toggle expansion of a taxonomic level
 */
function toggleExpansion(level, name, occurrenceCount) {
    const key = `${level}:${name}`;
    const isCurrentlyExpanded = expandedNodes.get(key);
    
    if (isCurrentlyExpanded) {
        // If we're collapsing, remove this node and all its children
        for (const [existingKey] of expandedNodes.entries()) {
            if (existingKey.startsWith(`${level}:${name}`) || 
                TAXONOMY_LEVELS.indexOf(existingKey.split(':')[0]) > TAXONOMY_LEVELS.indexOf(level)) {
                expandedNodes.delete(existingKey);
            }
        }
    } else {
        // If we're expanding, first clear any existing expansions at this level or below
        const currentLevelIndex = TAXONOMY_LEVELS.indexOf(level);
        
        // Remove all expanded nodes at this level or below
        for (const [existingKey] of expandedNodes.entries()) {
            const [existingLevel] = existingKey.split(':');
            const existingLevelIndex = TAXONOMY_LEVELS.indexOf(existingLevel);
            
            if (existingLevelIndex >= currentLevelIndex) {
                expandedNodes.delete(existingKey);
            }
        }
        
        // Store the occurrence count for this expansion
        expandedNodes.set(key, occurrenceCount);
    }
    
    createVisualization();
}

/**
 * Check if a node is expanded
 */
function isExpanded(level, name) {
    return expandedNodes.get(`${level}:${name}`);
}

/**
 * Get the next taxonomic level
 */
function getNextLevel(level) {
    const index = TAXONOMY_LEVELS.indexOf(level);
    return index < TAXONOMY_LEVELS.length - 1 ? TAXONOMY_LEVELS[index + 1] : null;
}

/**
 * Get the previous taxonomic level
 */
function getPreviousLevel(level) {
    const index = TAXONOMY_LEVELS.indexOf(level);
    return index > 0 ? TAXONOMY_LEVELS[index - 1] : null;
}

/**
 * Show tooltip with detailed information
 */
function showTooltip(event, d, level, totalOccurrences) {
    const name = level === 'species' ? getDisplayName(d.species, 'species') : getDisplayName(d[level], level);
    const occurrences = formatNumber(d.occurrence_count);
    const individuals = formatNumber(d.individual_count || 0);
    const percentage = ((+d.occurrence_count / totalOccurrences) * 100).toFixed(1);
    
    d3.select('#tooltip')
        .style('visibility', 'visible')
        .style('background-color', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .html(`${name}<br>Occurrences: ${occurrences}<br>Individuals: ${individuals}<br>Percentage: ${percentage}% of total`);
    
    moveTooltip(event);
}

/**
 * Move tooltip to follow cursor
 */
function moveTooltip(event) {
    d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`);
}

/**
 * Hide tooltip
 */
function hideTooltip() {
    d3.select('#tooltip').style('visibility', 'hidden');
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return (+num).toLocaleString();
}

/**
 * Get display name with common name if available
 */
function getDisplayName(name, level) {
    const commonName = commonNames[name];
    if (commonName) {
        return `${commonName} (${name})`;
    }
    return name;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get plural form of taxonomic level
 */
function getPluralForm(level) {
    const plurals = {
        'kingdom': 'Kingdoms',
        'phylum': 'Phyla',
        'class': 'Classes',
        'order': 'Orders',
        'family': 'Families',
        'genus': 'Genera',
        'species': 'Species'
    };
    return plurals[level] || capitalizeFirst(level + 's');
}

// Initialize visualization
window.onload = init;

// Update on window resize
window.onresize = () => {
    config.width = window.innerWidth * 0.8;
    config.height = window.innerHeight * 0.8;
    svg.attr('width', config.width)
       .attr('height', config.height);
    createVisualization();
};
