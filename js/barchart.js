/* Rangel Milushev CS171.HW6
 *
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */

BarChart = function(_parentElement, _data, _config, _parent_width, _parent_height) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.config = _config;
    this.displayData = _data;

    this.initVis(_parent_width, _parent_height);
}

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */
BarChart.prototype.initVis = function(w, h) {
    var vis = this;


    // set the margins
    vis.margin = { top: 30, right: 50, bottom: 40, left: 100 };

    // set the width and the height
    vis.width = w - vis.margin.left - vis.margin.right,
        vis.height = h - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement)
    	.append("div")

    	// add the id of the chart
    	.attr('id', vis.config.key)
    	.append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        
        // make chart responsive
        .call(responsivefy)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0, vis.width])

    vis.y = d3.scaleBand()
        .rangeRound([0, vis.height])
        .padding(0.2);

    vis.yAxis = d3.axisLeft(vis.y);

    // title 
    vis.svg.append("text")
        .attr("class", "graph-title")
        .attr("x", -90)
        .attr("y", -10)
        .text(vis.config.title);

    // (Filter, aggregate, modify data)
    vis.wrangleData();
}


/*
 * Data wrangling
 */

BarChart.prototype.wrangleData = function() {
    var vis = this;

    // (1) Group data by key variable (e.g. 'electricity') and count leaves
    vis.count = d3.nest()
        .key(d => d[vis.config.key])
        .rollup((leaves) => leaves.length)
        .entries(vis.displayData);

    // (2) Sort columns descending
    vis.countSorted = vis.count.sort((a, b) => b.value - a.value);

    // Update the visualization
    vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarChart.prototype.updateVis = function() {
    var vis = this;

    const t = d3.transition()
        .duration(800);

    // (1) Update domains
    vis.y.domain(vis.countSorted.map((d) => d.key));
    vis.x.domain([0, d3.max(vis.countSorted.map(d => d.value))])

    vis.svg.append("g")        
        .attr("class", "y-axis axis").transition(t)

    // (2) Draw rectangles
    var rect = vis.svg.selectAll('rect')
        .data(vis.countSorted);

    rect.enter()
        .append('rect')

        // update
        .merge(rect)
        .transition(t)
        .attr('x', 0)
        .attr('y', (d) => vis.y(d.key))
        .attr('width', (d) => vis.x(d.value))
        .attr('height', vis.y.bandwidth())
        .attr('class', 'bar');

    // exit rectangles
    rect.exit().remove();

    // (3) Draw labels
    var labels = vis.svg.selectAll('.label')
        .data(vis.countSorted)

    labels.enter()
        .append('text')

        // update
        .merge(labels).transition(t)

        .attr('class', 'label')
        .attr('x', d => vis.x(d.value) + 5)
        .attr('y', d => vis.y(d.key) + vis.y.bandwidth() / 2)
        .text(d => d.value);

    // exit labels
    labels.exit().remove();

    // Update the y-axis
    vis.svg.select(".y-axis").call(vis.yAxis);
}



/*
 * Filter data when the user changes the selection
 * Example for brushRegion: 07/16/2016 to 07/28/2016
 */

BarChart.prototype.selectionChanged = function(brushRegion) {
    var vis = this;

    // Filter data accordingly without changing the original data
    vis.displayData = vis.data.filter(d => d.survey >= brushRegion[0] & d.survey <= brushRegion[1]);

    // Update the visualization
    vis.wrangleData();
}