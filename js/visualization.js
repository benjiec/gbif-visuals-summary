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
    kingdomHeight: 100,
    phylumBarHeight: 30,
    detailsHeight: 250,
    spacing: 20,
    transitionDuration: 500,
    maxSpecies: 5,
    maxCountries: 5
};

// Data storage
let kingdoms = [];
let phyla = [];
let species = [];
let countries = [];
let commonNames = {};

// SVG elements
let svg;
let kingdomGroup;
let phylumGroup;
let detailsGroup;

// Scales
let xScale;
let colorScale;

// Track expanded phyla
let expandedPhyla = new Set();

/**
 * Initialize the visualization
 */
async function init() {
    try {
        // Load data
        const [kingdomsData, phylaData, speciesData, countriesData, commonNamesData] = await Promise.all([
            d3.csv('data/kingdom.csv'),
            d3.csv('data/phyla.csv'),
            d3.csv('data/species.csv'),
            d3.csv('data/phyla-country.csv'),
            d3.json('data/common-names.json')
        ]);

        console.log('Loaded data:', {
            kingdoms: kingdomsData,
            phyla: phylaData,
            species: speciesData,
            countries: countriesData,
            commonNames: commonNamesData
        });

        // Store data
        kingdoms = kingdomsData || [];
        phyla = phylaData || [];
        species = speciesData || [];
        countries = countriesData || [];
        commonNames = commonNamesData || {};

        // Verify data
        if (!kingdoms.length || !phyla.length) {
            throw new Error('Required data is missing or empty');
        }

        // Create SVG
        svg = d3.select('#visualization')
            .append('svg')
            .attr('width', config.width)
            .attr('height', config.height);

        // Create groups with proper transforms
        kingdomGroup = svg.append('g')
            .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

        phylumGroup = svg.append('g')
            .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

        detailsGroup = svg.append('g')
            .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

        // Create scales
        const maxOccurrences = d3.max(kingdoms, d => +d.occurrence_count);
        console.log('Max occurrences:', maxOccurrences);

        xScale = d3.scaleLinear()
            .domain([0, maxOccurrences])
            .range([0, config.width - config.margin.left - config.margin.right]);

        // Initialize color scale
        const phylumNames = phyla.map(d => d.phylum);
        console.log('Phylum names:', phylumNames);

        if (!phylumNames.length) {
            throw new Error('No valid phylum names found');
        }

        colorScale = d3.scaleOrdinal()
            .domain(phylumNames)
            .range(d3.schemeTableau10);

        // Create visualization
        createVisualization();
    } catch (error) {
        console.error('Error initializing visualization:', error);
        // Add error message to the page
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
    kingdomGroup.selectAll('*').remove();
    phylumGroup.selectAll('*').remove();
    detailsGroup.selectAll('*').remove();

    // Calculate total height needed
    const totalHeight = kingdoms.length * (config.kingdomHeight + config.spacing) +
        (expandedPhyla.size * (config.detailsHeight + config.spacing));

    // Update SVG height
    svg.attr('height', Math.max(config.height, totalHeight + config.margin.top + config.margin.bottom));

    // Create kingdom elements with fixed width
    const kingdomWidth = config.width * 0.8; // Fixed width for all kingdom bars
    const kingdomElements = kingdomGroup.selectAll('.kingdom')
        .data(kingdoms)
        .enter()
        .append('g')
        .attr('class', 'kingdom')
        .attr('transform', (d, i) => {
            // Calculate y position based on expanded phyla before this kingdom
            const expandedBefore = phyla
                .filter(p => expandedPhyla.has(p.phylum))
                .filter(p => {
                    const kingdomIndex = kingdoms.findIndex(k => k.kingdom === p.kingdom);
                    return kingdomIndex < i;
                }).length;
            
            const yOffset = i * (config.kingdomHeight + config.spacing) + 
                (expandedBefore * (config.detailsHeight + config.spacing));
            return `translate(0,${yOffset})`;
        });

    // Add kingdom title and count with hover
    kingdomElements.append('text')
        .attr('class', 'kingdom-title')
        .text(d => `${d.kingdom} (${formatNumber(d.occurrence_count)} occurrences)`)
        .attr('y', 5)
        .on('mouseover', (event, d) => {
            const tooltip = d3.select('#tooltip');
            tooltip.style('visibility', 'visible')
                .style('background-color', '#f8f8f8')
                .style('border', '1px solid #ddd')
                .style('color', '#333')
                .html(`${d.kingdom}<br>${formatNumber(d.occurrence_count)} occurrences`);
            
            tooltip.style('left', `${event.pageX + 10}px`)
                   .style('top', `${event.pageY + 10}px`);
        })
        .on('mousemove', (event) => {
            d3.select('#tooltip')
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY + 10}px`);
        })
        .on('mouseout', () => {
            d3.select('#tooltip').style('visibility', 'hidden');
        });

    // Create phylum bars for each kingdom with fixed width
    kingdomElements.each(function(kingdom) {
        const kingdomPhyla = phyla.filter(d => d.kingdom === kingdom.kingdom)
            .sort((a, b) => +b.occurrence_count - +a.occurrence_count);

        const total = +kingdom.occurrence_count;
        
        // Create kingdom-specific scale with fixed width
        const kingdomXScale = d3.scaleLinear()
            .domain([0, total])
            .range([0, kingdomWidth]);

        let x = 0;

        const phylumBars = d3.select(this)
            .selectAll('.phylum-bar')
            .data(kingdomPhyla)
            .enter()
            .append('g')
            .attr('class', 'phylum-bar')
            .attr('transform', `translate(0,${config.kingdomHeight - config.phylumBarHeight - 50})`);

        // Add rectangles with hover
        const rectangles = phylumBars.append('rect')
            .attr('x', d => {
                const width = kingdomXScale(+d.occurrence_count);
                const result = x;
                x += width;
                return result;
            })
            .attr('width', d => kingdomXScale(+d.occurrence_count))
            .attr('height', config.phylumBarHeight)
            .attr('fill', d => colorScale(d.phylum))
            .on('click', (event, d) => togglePhylumDetails(d))
            .on('mouseover', (event, d) => {
                const name = getDisplayName(d.phylum, 'phylum');
                const percentage = ((+d.occurrence_count / total) * 100).toFixed(1);
                const description = commonNames.phyla[d.phylum]?.description || '';
                const tooltip = d3.select('#tooltip');
                tooltip.style('visibility', 'visible')
                    .style('background-color', '#f8f8f8')
                    .style('border', '1px solid #ddd')
                    .style('color', '#333')
                    .html(`${name}<br>${description}<br>${formatNumber(d.occurrence_count)} occurrences (${percentage}%)`);
                
                tooltip.style('left', `${event.pageX + 10}px`)
                       .style('top', `${event.pageY + 10}px`);
            })
            .on('mousemove', (event) => {
                d3.select('#tooltip')
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`);
            })
            .on('mouseout', () => {
                d3.select('#tooltip').style('visibility', 'hidden');
            });

        // Reset x for labels
        x = 0;

        // Add phylum labels with hover
        phylumBars.append('text')
            .attr('x', d => {
                const width = kingdomXScale(+d.occurrence_count);
                const result = x;
                x += width;
                return result + 5; // Add 5px padding from the left edge
            })
            .attr('y', config.phylumBarHeight / 2)
            .attr('dy', '0.35em')
            .text(d => {
                const name = getDisplayName(d.phylum, 'phylum');
                const percentage = ((+d.occurrence_count / total) * 100).toFixed(1);
                return `${name} (${percentage}%)`;
            })
            .style('fill', 'white')
            .style('font-size', '10px')
            .style('text-anchor', 'start')
            .style('cursor', 'pointer')
            .on('click', (event, d) => togglePhylumDetails(d))
            .on('mouseover', (event, d) => {
                const name = getDisplayName(d.phylum, 'phylum');
                const percentage = ((+d.occurrence_count / total) * 100).toFixed(1);
                const description = commonNames.phyla[d.phylum]?.description || '';
                const tooltip = d3.select('#tooltip');
                tooltip.style('visibility', 'visible')
                    .style('background-color', '#f8f8f8')
                    .style('border', '1px solid #ddd')
                    .style('color', '#333')
                    .html(`${name}<br>${description}<br>${formatNumber(d.occurrence_count)} occurrences (${percentage}%)`);
                
                tooltip.style('left', `${event.pageX + 10}px`)
                       .style('top', `${event.pageY + 10}px`);
            })
            .on('mousemove', (event) => {
                d3.select('#tooltip')
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`);
            })
            .on('mouseout', () => {
                d3.select('#tooltip').style('visibility', 'hidden');
            });
    });

    // Update details if any phyla are expanded
    if (expandedPhyla.size > 0) {
        updateDetails();
    }
}

/**
 * Toggle phylum details
 */
function togglePhylumDetails(phylum) {
    // Check if this phylum is already expanded
    const wasExpanded = expandedPhyla.has(phylum.phylum);
    
    // If clicking on a phylum from the same kingdom, collapse all phyla from that kingdom
    if (!wasExpanded) {
        const kingdom = phylum.kingdom;
        phyla.filter(p => p.kingdom === kingdom)
            .forEach(p => expandedPhyla.delete(p.phylum));
    }
    
    // Toggle this phylum
    if (wasExpanded) {
        expandedPhyla.delete(phylum.phylum);
    } else {
        expandedPhyla.add(phylum.phylum);
    }

    // Update visualization
    createVisualization();
}

/**
 * Update details view
 */
function updateDetails() {
    console.log('Updating details for expanded phyla:', expandedPhyla);
    
    // Clear existing details
    detailsGroup.selectAll('*').remove();

    // Get expanded phyla
    const expanded = phyla.filter(p => expandedPhyla.has(p.phylum));
    console.log('Expanded phyla data:', expanded);

    // Create details for each expanded phylum
    expanded.forEach((phylum, index) => {
        console.log('Processing phylum:', phylum);
        const yOffset = getYOffset(phylum) - 40; // Move details up by 40px
        console.log('Y offset:', yOffset);
        
        // Add phylum title and counts
        const titleGroup = detailsGroup.append('g')
            .attr('transform', `translate(0,${yOffset})`);

        const commonName = getDisplayName(phylum.phylum, 'phylum');
        const scientificName = phylum.phylum;
        const totalOccurrences = formatNumber(phylum.occurrence_count);
        const totalIndividuals = formatNumber(phylum.individual_count);
        const description = commonNames.phyla[phylum.phylum]?.description || '';

        console.log('Phylum details:', {
            commonName,
            scientificName,
            totalOccurrences,
            totalIndividuals,
            description
        });

        titleGroup.append('text')
            .attr('class', 'phylum-title')
            .text(`${commonName} (${scientificName})`)
            .attr('y', 20)
            .style('font-weight', 'bold')
            .style('font-size', '14px');

        titleGroup.append('text')
            .attr('class', 'phylum-description')
            .text(description)
            .attr('y', 40)
            .style('font-size', '12px')
            .style('font-style', 'italic');

        titleGroup.append('text')
            .attr('class', 'phylum-counts')
            .text(`Total Occurrences: ${totalOccurrences} | Total Individuals: ${totalIndividuals}`)
            .attr('y', 60)
            .style('font-size', '12px');

        // Create species chart with more spacing after the counts
        createSpeciesChart(phylum, yOffset + 100); // Increased from 80 to 100 to accommodate description
        
        // Create country chart with more spacing after the counts
        createCountryChart(phylum, yOffset + 100); // Increased from 80 to 100 to accommodate description
    });
}

/**
 * Create species chart
 */
function createSpeciesChart(phylum, yOffset) {
    console.log('Creating species chart for:', phylum.phylum);
    const phylumSpecies = species.filter(s => s.phylum === phylum.phylum)
        .sort((a, b) => +b.occurrence_count - +a.occurrence_count);

    console.log('Filtered species:', phylumSpecies);

    const topSpecies = phylumSpecies.slice(0, config.maxSpecies);
    const topSpeciesSum = topSpecies.reduce((sum, s) => sum + +s.occurrence_count, 0);
    const otherCount = +phylum.occurrence_count - topSpeciesSum;

    console.log('Total phylum occurrences:', phylum.occurrence_count);
    console.log('Top species sum:', topSpeciesSum);
    console.log('Other count:', otherCount);

    const data = [...topSpecies, { species: 'Other', occurrence_count: otherCount }];
    const total = +phylum.occurrence_count;

    console.log('Species chart data:', data);

    const chartWidth = config.width / 2 - config.margin.left - config.margin.right;
    const chartHeight = 150;
    const barHeight = 20;
    const spacing = 5;

    // Center the chart group
    const chartGroup = detailsGroup.append('g')
        .attr('transform', `translate(${config.margin.left},${yOffset})`);

    // Add title
    chartGroup.append('text')
        .attr('class', 'chart-title')
        .text('Top Species')
        .attr('y', -10)
        .style('font-size', '12px');

    // Create log scale for bar widths
    const logScale = d3.scaleLog()
        .domain([1, d3.max(data, d => +d.occurrence_count)])
        .range([0, chartWidth]);

    // Create bars
    const bars = chartGroup.selectAll('.species-bar')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'species-bar')
        .attr('transform', (d, i) => `translate(0,${i * (barHeight + spacing) + 20})`);

    // Add rectangles
    bars.append('rect')
        .attr('width', d => logScale(+d.occurrence_count))
        .attr('height', barHeight)
        .attr('fill', '#4e79a7');

    // Add labels
    bars.append('text')
        .attr('x', 5)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .text(d => {
            const name = d.species === 'Other' ? 'Other' : getDisplayName(d.species, 'species');
            return name.length > 30 ? name.substring(0, 30) + '...' : name;
        })
        .style('fill', 'white')
        .style('font-size', '10px');

    // Add count and percentage
    bars.append('text')
        .attr('x', d => logScale(+d.occurrence_count) - 5)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .text(d => {
            const percentage = ((+d.occurrence_count / total) * 100).toFixed(1);
            return `${formatNumber(d.occurrence_count)} (${percentage}%)`;
        })
        .style('fill', 'white')
        .style('font-size', '10px')
        .style('text-anchor', 'end');
}

/**
 * Create country chart
 */
function createCountryChart(phylum, yOffset) {
    console.log('Creating country chart for:', phylum.phylum);
    const phylumCountries = countries.filter(c => c.phylum === phylum.phylum)
        .sort((a, b) => +b.occurrence_count - +a.occurrence_count);

    console.log('Filtered countries:', phylumCountries);

    const topCountries = phylumCountries.slice(0, config.maxCountries);
    const topCountriesSum = topCountries.reduce((sum, c) => sum + +c.occurrence_count, 0);
    const otherCount = +phylum.occurrence_count - topCountriesSum;

    console.log('Total phylum occurrences:', phylum.occurrence_count);
    console.log('Top countries sum:', topCountriesSum);
    console.log('Other count:', otherCount);

    const data = [...topCountries, { country: 'Other', occurrence_count: otherCount }];
    const total = +phylum.occurrence_count;

    console.log('Country chart data:', data);

    const chartWidth = 200;
    const chartHeight = 150;
    const radius = Math.min(chartWidth, chartHeight) / 2;

    // Center the chart group
    const chartGroup = detailsGroup.append('g')
        .attr('transform', `translate(${config.width / 2 + config.margin.left},${yOffset})`);

    // Add title
    chartGroup.append('text')
        .attr('class', 'chart-title')
        .text('Top Locations')
        .attr('y', -10)
        .style('font-size', '12px');

    // Create pie chart
    const pie = d3.pie()
        .value(d => +d.occurrence_count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcs = chartGroup.selectAll('.arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('transform', `translate(${radius},${radius + 20})`);

    // Add slices
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => d3.schemeCategory10[i])
        .on('mouseover', (event, d) => {
            const percentage = ((d.data.occurrence_count / total) * 100).toFixed(1);
            const tooltip = d3.select('#tooltip');
            tooltip.style('visibility', 'visible')
                .style('background-color', '#f8f8f8')
                .style('border', '1px solid #ddd')
                .style('color', '#333')
                .html(`${d.data.country}<br>${formatNumber(d.data.occurrence_count)} occurrences (${percentage}%)`);
            
            // Get SVG position
            const svgRect = svg.node().getBoundingClientRect();
            const chartRect = chartGroup.node().getBoundingClientRect();
            
            // Calculate position relative to SVG
            const x = event.pageX - svgRect.left + 10;
            const y = event.pageY - svgRect.top + 10;
            
            tooltip.style('left', `${x}px`)
                   .style('top', `${y}px`);
        })
        .on('mousemove', (event) => {
            // Get SVG position
            const svgRect = svg.node().getBoundingClientRect();
            
            // Calculate position relative to SVG
            const x = event.pageX - svgRect.left + 10;
            const y = event.pageY - svgRect.top + 10;
            
            d3.select('#tooltip')
                .style('left', `${x}px`)
                .style('top', `${y}px`);
        })
        .on('mouseout', () => {
            d3.select('#tooltip').style('visibility', 'hidden');
        });

    // Add labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text(d => {
            const percentage = ((d.data.occurrence_count / total) * 100).toFixed(1);
            return `${d.data.country}\n${percentage}%`;
        })
        .style('fill', 'white')
        .style('font-size', '10px');
}

/**
 * Get display name with common name if available
 */
function getDisplayName(name, type) {
    if (type === 'phylum') {
        if (commonNames.phyla && commonNames.phyla[name]) {
            return commonNames.phyla[name].common_name;
        }
        return name; // Return scientific name if no common name
    }
    if (type === 'species' && commonNames.species && commonNames.species[name]) {
        return `${commonNames.species[name].common_name} (${name})`;
    }
    return name;
}

/**
 * Calculate Y offset for details
 */
function getYOffset(phylum) {
    const kingdomIndex = kingdoms.findIndex(k => k.kingdom === phylum.kingdom);
    const baseOffset = kingdomIndex * (config.kingdomHeight + config.spacing);
    
    // Calculate how many phyla are expanded before this one
    const expandedBefore = phyla
        .filter(p => expandedPhyla.has(p.phylum))
        .filter(p => {
            const pKingdomIndex = kingdoms.findIndex(k => k.kingdom === p.kingdom);
            return pKingdomIndex < kingdomIndex || 
                   (pKingdomIndex === kingdomIndex && 
                    phyla.findIndex(ph => ph.phylum === p.phylum) < 
                    phyla.findIndex(ph => ph.phylum === phylum.phylum));
        }).length;
    
    // Add the height of the kingdom, plus the height of all previous details sections
    return baseOffset + config.kingdomHeight + 
           (expandedBefore * (config.detailsHeight + config.spacing));
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return (+num).toLocaleString();
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