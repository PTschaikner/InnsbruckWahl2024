const map = L.map('map').setView([47.268, 11.393], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

L.svg({ clickable: true }).addTo(map);
const overlay = d3.select(map.getPanes().overlayPane);
let svg = overlay.select("svg");
if (svg.empty()) {
    svg = overlay.append("svg");
}
let g = svg.select("g.leaflet-zoom-hide");
if (g.empty()) {
    g = svg.append("g").attr("class", "leaflet-zoom-hide");
}

const partyColors = {
    "GRÜNE": "#538430",
    "Georg Willi": "#538430",  // Same color as GRÜNE
    "FPÖ": "#003870",
    "Markus Lassenberger": "#003870",  // Same color as FPÖ
    "TURSKY": "#f18700",
    "Florian Tursky": "#f18700",  // Same color as TURSKY
    "NEOS": "#cc1a66",
    "Julia Seidl": "#cc1a66",  // Same color as NEOS
    "FRITZ": "#ffffff",
    "Andrea Haselwanter-Schneider": "#ffffff",  // Same color as FRITZ
    "GERECHT": "#f15a22",
    "Gerald Depaoli": "#f15a22",  // Same color as GERECHT
    "ALI": "#8e1e82",
    "Mesut Onay": "#8e1e82",  // Same color as ALI
    "SPÖ": "#e42612",
    "Elisabeth Mayr Maga": "#e42612",  // Same color as SPÖ
    "EINIG": "#561a4d",
    "Helmut Reichholf": "#561a4d",  // Same color as EINIG
    "JA": "#ffff87",
    "Johannes Anzengruber": "#ffff87",  // Same color as JA
    "TUN": "#bffbd59",
    "Christian Franz Veber": "#bffbd59",  // Same color as TUN
    "DU-I": "#ffffff",
    "Helmut Buchacher": "#ffffff",  // Same color as DU-I
    "KPÖ": "#e4013b",
    "Pia Tomedi": "#e4013b"  // Same color as KPÖ
};
const colorScale = d3.scaleOrdinal()
    .domain(Object.keys(partyColors))
    .range(Object.values(partyColors));

const tooltip = d3.select('#tooltip');

function getMargins(voteType) {
    const margins = {
        'gemeinderat': { top: 20, right: 20, bottom: 50, left: 40 },
        'burgermeister': { top: 20, right: 20, bottom: 120, left: 40 },
        'burgermeister_stichwahl': { top: 25, right: 25, bottom: 95, left: 45 }  // Specific margins for the runoff election
    };
    // Return the specific margins for the given voteType, defaulting to 'gemeinderat' if not explicitly defined
    return margins[voteType] || margins['gemeinderat'];
}

function showTooltip(event, d, results) {
    const result = results.find(r => r.Sprengel_Nr === d.properties.WSP);
    const selectedVote = document.getElementById("voteType").value;
    const margin = getMargins(selectedVote);  // Get dynamic margins based on the selection

    tooltip.style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html('');

    if (result) {
        const data = Object.entries(result).slice(1, -1);
        const tooltipSvg = tooltip.append('svg')
            .attr('width', 300)
            .attr('height', 200);

        const width = +tooltipSvg.attr('width') - margin.left - margin.right,
            height = +tooltipSvg.attr('height') - margin.top - margin.bottom;

        const x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
            y = d3.scaleLinear().rangeRound([height, 0]);

        const gTooltip = tooltipSvg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        x.domain(data.map(d => d[0]));
        y.domain([0, Math.ceil(d3.max(data, d => parseFloat(d[1])) / 10) * 10]);

        gTooltip.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSizeOuter(0)) // Add tickSizeOuter(0) to remove the end ticks
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        gTooltip.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .attr('text-anchor', 'end')
            .text('Percentage');

        gTooltip.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d[0]))
            .attr('y', d => y(parseFloat(d[1])))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(parseFloat(d[1])))
            .style('stroke', 'black')
            .style('fill', d => colorScale(d[0]));
    } else {
        tooltip.html('No data available');
    }
}

function hideTooltip() {
    tooltip.style('display', 'none');
    tooltip.selectAll('svg').remove(); // Clear the SVG to avoid duplicate tooltips
}

function loadData() {
    var selectedVote = document.getElementById("voteType").value;
    var dataFile = 'data/ergebnis_partei.csv'; // Default data file

    // Determine which data file to load based on the dropdown selection
    if (selectedVote === "gemeinderat") {
        dataFile = 'data/ergebnis_partei.csv';
    } else if (selectedVote === "burgermeister") {
        dataFile = 'data/ergebnis_bgm.csv';
    } else if (selectedVote === "burgermeister_stichwahl") {  // New condition for the new option
        dataFile = 'data/ergebnis_bgm_stichwahl.csv';
    }

    d3.csv(dataFile).then(results => {
        g.selectAll("*").remove(); // Clear the previous SVG elements

        // Further implementation unchanged
        g.selectAll('path')
            .data(areas)
            .enter().append('path')
            // Additional implementation to bind data to map
            .attr("fill", d => {
                const result = results.find(r => r.Sprengel_Nr === d.properties.WSP);
                return result ? colorScale(result.Gewinner) : '#ccc';
            })
            .attr("d", d3.geoPath().projection(d3.geoTransform({
                point: function (x, y) {
                    const point = map.latLngToLayerPoint(new L.LatLng(y, x));
                    return this.stream.point(point.x, point.y);
                }
            })))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.5)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.9);
                showTooltip(event, d, results);
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 0.5);
                hideTooltip();
            });

        // Attach the update function to the map 'moveend' event
        map.on("moveend", update);

        // Call update initially to ensure everything is positioned correctly
        update();
    });
}


// Load areas once and use them in loadData
d3.json('data/wahlspr.json').then(data => {
    areas = data.features;
    loadData();  // Load initial data
});

document.getElementById('voteType').addEventListener('change', loadData);