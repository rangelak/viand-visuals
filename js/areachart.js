/* Rangel Milushev CS171.HW6
 *
 * AreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

AreaChart = function(_parentElement, _data, _parent_width, _parent_height) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];

    this.initVis(_parent_width, _parent_height);
}


/*
 * Initialize visualization (static content; e.g. SVG area, axes, brush component)
 */
AreaChart.prototype.initVis = function(w, h) {
    var vis = this;

    // set the display data equal to the data
    vis.displayData = vis.data;

    // margins
    vis.margin = { top: 40, right: 0, bottom: 60, left: 50 };

    vis.width = w - vis.margin.left - vis.margin.right,
        vis.height = h - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)

        // make chart responsive
        .call(responsivefy)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scaleTime()
        .range([0, vis.width]);
    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .ticks(4)
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // area layout
    vis.area = d3.area()
        .curve(d3.curveCardinal)
        .x(d => vis.x(new Date(d.key)))
        .y0(vis.height)
        .y1(d => vis.y(d.value));

    // (Filter, aggregate, modify data)
    vis.wrangleData();
}


/*
 * Data wrangling
 */
AreaChart.prototype.wrangleData = function() {
    var vis = this;

    // (1) Group data by date and count survey results for each day
    vis.count = d3.nest()
        .key(d => d.survey)
        .rollup(v => v.length)
        .entries(vis.displayData)

    // (2) Sort data by day => my area chart stayed broken for a long time bacuse of these dates!!
    vis.countSorted = vis.count.sort((a, b) => new Date(a.key) - new Date(b.key));

    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

AreaChart.prototype.updateVis = function() {
    var vis = this;

    // Set domains
    vis.x.domain(d3.extent(vis.countSorted, d => new Date(d.key)));
    vis.y.domain([0, d3.max(vis.countSorted, d => +d.value)]);

    // Draw area by using the path generator
    vis.svg.append("path")
        .datum(vis.countSorted)
        .attr("fill", "#21bfc1")
        .attr("d", vis.area);

    // Initialize brush component
    vis.brush = d3.brushX()
        .extent([
            [0, 0],
            [vis.width, vis.height]
        ])
        .on("brush", brushed);

    // Append brush component here
    vis.svg.append("g")
        .attr("class", "x brush")
        .call(vis.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", vis.height + 7);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    // Update the axes
    vis.svg.select(".y-axis").call(vis.yAxis);
    vis.svg.select(".x-axis").call(vis.xAxis);
}