const margin = {top: 30, right: 100, bottom: 30, left: 100},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const svg = d3.select('.graph[data-graph-type="line"] svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("color", "white");

const x = d3.scaleLinear()
    .domain([2011, 2022])
    .range([0, width]);

const y = d3.scaleLinear()
    .domain([0, 324.16])
    .range([height, 0]);

const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")  
    .style("font-size", "18px")
    .style("fill","white");

const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', 'white')
    .style('border', '1px solid #000')
    .style('padding', '10px')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

let companyColors = {};

async function requestData() {
    const data = await d3.csv("data/revenue_filtered2.csv", d => ({
        year: +d.Year,
        ...Object.fromEntries(Object.entries(d).slice(1).map(([key, value]) => [key, +value]))
    }));

    const yAxis = svg.append("g")
    .call(d3.axisLeft(y).tickFormat(value => `${value}B`))
    .selectAll("text")  
    .style("font-size", "18px")
    .style("fill","white");

    const excludedKeys = new Set(['year', 'Year']);
    const companies = Object.keys(data[0]).filter(k => !excludedKeys.has(k));
    let selectedCompanies = companies;

    companies.forEach(function(d, i){
        companyColors[d] = colorScale(i)
    });

    const checkboxesContainer = d3.select("#checkboxes-container");
    checkboxesContainer.selectAll("*").remove();

    const checkboxes = checkboxesContainer.selectAll("div").data(companies)
                                            .join("div") 
                                            .attr("class", "checkbox-item")
                                            .style("padding", "10px 15px")
                                            .style("display", "flex")
                                            .style("align-items", "center");

    checkboxes.append("input")
                    .attr("type", "checkbox")
                    .attr("id", d => d)
                    .attr("value", d => d)
                    .property("checked", (d, i) => i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 5)
                    .style("height", "20px")
                    .style("width", "20px")
                    .style("accent-color", d => companyColors[d])
                    .on("change", function(event, d) {
                    handleCheckboxChange(event)
                    });

    checkboxes.append("label")
                    .attr("for", d => d)
                    .attr("class", "checkbox-label")
                    .text(d => d)
                    .style("color", d => companyColors[d]);
        

    companies.forEach((company, index) => {
        const companyData = data.map(d => ({year: d.year, value: d[company]}));

        svg.append("path")
            .datum(companyData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", colorScale(index))
            .attr("stroke-width", 4)
            .attr("stroke-opacity", 0.4)
            .attr("d", d3.line()
                .x(d => x(d.year))
                .y(d => y(d.value))
                .curve(d3.curveLinear))
            .attr("data-company", company)
            .attr("visibility", "hidden");
    });

function update(selectedCompanies) {
    d3.selectAll("[data-company]").attr("visibility", function() {
        const company = this.getAttribute("data-company");
        return (selectedCompanies.includes('all') || selectedCompanies.includes(company)) 
        ? "visible" : "hidden";
    })
}

    function handleCheckboxChange(event) {
        const companyName = event.target.value;

        if (event.target.checked) {
            event.target.checked = true;
            selectedCompanies.push(companyName);
        } else {
            selectedCompanies = selectedCompanies.filter(company => company !== companyName)
        }

        update(selectedCompanies);
    }

    update('all'); 
}

async function requestBarChartData() {
const svg = d3.select('.graph[data-graph-type="premiumbar"] svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("color", "white");

const tooltip = d3.select('.tooltip');

const data = await d3.csv("data/NHE_per_person.csv");  
const x = d3.scaleBand()
    .range([0, width])
    .padding(0.1)
    .domain(data.map(d => d.Year));
const y = d3.scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(data, d => +d['Average annual premiums for single coverage'])]);

svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text") 
    .style("font-size", "18px")
    .style("fill","white");
svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")  
    .style("font-size", "18px")
    .style("fill","white");

let currentlySelectedYear = null;

svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.Year))
    .attr("y", d => y(+d['Average annual premiums for single coverage']))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(+d['Average annual premiums for single coverage']))
    .attr("fill", "white")
    .attr("opacity", 1)  
    .on('mouseover', function(event, d) {
    tooltip.transition()
        .duration(100)
        .style('opacity', 1);

    d3.select(this)
        .style('cursor', 'pointer');

    tooltip.html(`Year: ${d.Year}<br>Premium: $${d['Average annual premiums for single coverage']}`)
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function(d) {
        tooltip.transition()
            .style('opacity', 0);

        d3.select(this)
            .style('cursor', 'default');
    })
    .on('click', function(event, d) {
        if (currentlySelectedYear === d.Year) {
            svg.selectAll(".bar").attr("opacity", 1); 
            d3.selectAll('.graph[data-graph-type="line"] circle').attr("opacity", 1);
            currentlySelectedYear = null; 
        } else {
            currentlySelectedYear = d.Year;
            svg.selectAll(".bar")
                .attr("opacity", b => b.Year === d.Year ? 1 : 0.3);
            d3.selectAll('.graph[data-graph-type="line"] circle')
                .attr("opacity", dCircle => dCircle.year == d.Year ? 1 : 0.3);
        }
}); }


requestData();
requestBarChartData();