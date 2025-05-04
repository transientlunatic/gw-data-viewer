import { Collapse } from 'bootstrap'
import h5wasm from "h5wasm";
import * as d3 from "d3";
const { FS } = await h5wasm.ready;

import "./style.scss";

var file_input = document.getElementById('datafile');
const output = document.getElementById('output');
const urlInput = document.getElementById("urlInput");
const loadFromUrlBtn = document.getElementById("loadFromUrl");



let paramString = window.location.href.split('?')[1];
let queryString = new URLSearchParams(paramString);
const metaurl = queryString.get("metafileurl");


// 2 functions needed for kernel density estimate
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })/X.length/0.2];
    });
  };
}
function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}

function hist(data, property, element){
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
	width = 900 - margin.left - margin.right,
	height = 400 - margin.top - margin.bottom;

    d3.select("#output")
	.selectAll("svg")
	.remove();

    var svg = d3.select("#output")
	.append("svg")
	.attr("id", "plot")
	.attr("class", "col-md-6")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    
    // X axis: scale and draw:
    var x = d3.scaleLinear()
	.domain([d3.min(data, function(d){return +d}),
		 d3.max(data, function(d){return +d})])
	.range([0, width]);
    
    svg.append("g")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x))
	.call(g => g.append("text")
          .attr("x", width - margin.right)
          .attr("y", -6)
          .attr("fill", "#000")
          .attr("text-anchor", "end")
          .attr("font-weight", "bold")
          .text(property));
    ;

    // set the parameters for the histogram
    var histogram = d3.histogram()
	.value(function(d) { return d; })   
	.domain(x.domain())  
	.thresholds(x.ticks(70)); 
    
    // And apply this function to data to get the bins
    var bins = histogram(data);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
	.range([height, 0]);
    
    y.domain([0, 1.2*d3.max(bins, function(d) { return d.length/data.length })]); 

    svg.append("g")
	.call(d3.axisLeft(y));

    svg.append("g")
	.selectAll("rect")
	.data(bins)
	.enter()
	.append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length/data.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) {
	    return height - y(d.length/data.length); })
        .style("fill", "#69b3a2")
    
    // var kde = kernelDensityEstimator(kernelEpanechnikov(.2), x.ticks(70))
    // var density = kde(data)

    // const line = d3.line()
    // 	  .curve(d3.curveBasis)
    // 	  .x(d => x(d[0]))
    // 	  .y(d => y(d[1]));

    // svg.append("path")
    // 	.datum(density)
    // 	.attr("fill", "none")
    // 	.attr("stroke", "#000")
    // 	.attr("stroke-width", 3.5)
    // 	.attr("stroke-linejoin", "round")
    // 	.attr("d", line);
}

function display_parameter_list(file){
    // Display the list of parameters in the file.
    var datasets = file.keys();
    datasets.splice(datasets.indexOf("history"), 1)
    datasets.splice(datasets.indexOf("version"), 1)
 
    const menu = d3.select("#output")
	  .append("div")
	  .attr("class", "col-md-2 d3gw-sidebar")
	  .style("overflow-y", "auto")
    	  .style("max-height", "95vh");

    for (const dataset of datasets){
	const posteriors = file.get(dataset+"/posterior_samples");
	const dataset_menu = menu.append("ul")
	      .attr("class", "list-unstyled ps-0");

	const dataset_menu_button = dataset_menu.append("p")
	      .attr("class", "d-inline-flex align-items-center rounded border-0 btn-collapse")
	      .attr("data-bs-toggle", "collapse")
	      .attr("data-bs-target", "#dataset-"+dataset.replace(":", "_"))
	      .text(dataset);

	var dataset_submenu = dataset_menu.append("div")
	    .style("visibility", "none")
	    .style("overflow-y", "auto")
	    .attr("id", "#dataset-"+dataset.replace(":", "_"))
	    .append("ul")
	    .attr("class", "list-unstyled ps-3 small")
	    .selectAll("li")
    	    .data(posteriors.metadata.compound_type.members)
	    .enter()
	    .append("li")
	    .attr("class", "list-group-item")
	    .attr("data-parameter", (member)=>member.name)
	    .text((member) => member.name)
	    .on("click", (event) => {
		display_samples(file, dataset, event.target.dataset.parameter);
	    });
    }
}

function display_samples(file, dataset="beyond", parameter="mass_1"){
    // Display details of the samples in the hdf5 file.
    const posteriors = file.get(dataset+"/posterior_samples");
    var parameter_map = new Map();
    var i =0;
    for (const member of posteriors.metadata.compound_type.members){
	parameter_map.set(member.name, i);
	i++;
    }

    var parameter_ix = parameter_map.get(parameter);
    var column = posteriors.to_array().map(function(value,index) { return value[parameter_ix]; });

    hist(column, parameter);
    
}

// File Upload
file_input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
	let datafilename = file.name;
	const buffer = await file.arrayBuffer();
	FS.writeFile(datafilename, new Uint8Array(buffer));
	const h5file = new h5wasm.File(datafilename, "r");
	console.log("File uploaded")
	display_parameter_list(h5file);
	// display_samples(h5file, "bilby-roq-cosmo-2");
    } catch (err) {
	console.log(err);
    }
});

// URL Load
if (typeof metaurl != undefined){
    const url = metaurl;
    try {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	FS.writeFile("tmp", new Uint8Array(buffer));
	const h5file = new h5wasm.File("tmp", "r");
	display_parameter_list(h5file, "bilby-roq-cosmo-2");
	display_samples(h5file, "bilby-roq-cosmo-2");
	
    } catch (err) {
	output.textContent = `Error loading from URL: ${err}`;
    }
}

