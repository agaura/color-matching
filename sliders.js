import {CSSconvert} from './colors.js';

function initializeSlider(svg, height, min, max, widthAdj, heightAdj, primary, a, g, change) {
    const slider = svg.append('g')
        .attr('transform', `translate(${widthAdj},${heightAdj})`)
        .call(d3.sliderVertical()
            .height(height)
            .min(min)
            .max(max)
            .step(0.01)
            .ticks(4)
            .tickFormat(d3.format('.1f'))
            .default(0.)
            .fill(CSSconvert(0, primary, a, g))
            .handle(d3.symbol()
                .type(d3.symbolCircle)
                .size(150)
            )
            .on('onchange', val => {
                slider.select('.handle').attr('fill', CSSconvert(val, primary, a, g));
                slider.select('.parameter-value').attr('stroke', CSSconvert(val, primary, a, g));
                slider.select('.track-fill').attr('stroke', CSSconvert(val, primary, a, g));
                change(val);
            }));
    slider.select('.handle').attr('fill', CSSconvert(0, primary, a, g));
    slider.select('.parameter-value').attr('stroke', CSSconvert(0, primary, a, g));
}

function fixTicks(svg) {
    svg.selectAll('.tick line')
    .attr('x2', '-11')
    .attr('x1', '-4')
    
    // Select all original tick lines and iterate over them
    svg.selectAll('.tick line').each(function() {
        const originalTick = d3.select(this);
    
        const newX1 = parseFloat(originalTick.attr('x1')) + 29;
        const newX2 = parseFloat(originalTick.attr('x2')) + 29;
    
        // Append a new line to the same parent, duplicating the original and applying the translation
        originalTick.node().parentNode.appendChild(
            d3.create('svg:line')
                .attr('x1', newX1)
                .attr('x2', newX2)
                // Apply any other necessary attributes or styles
                .style('stroke', originalTick.style('stroke')) // Copy the stroke style
                .node()
        );
    });
}

export function initializeSliders(divName, a, g, vec1, vec2) {
    const sliders = d3.select(divName).append('svg')
        .attr('width', 230)
        .attr('height', 140);
    
    const redMax = 2.1230881684358494 / 2.1230881684358494;
    const redMin = -0.493152501716165 / 2.1230881684358494;
    const greenMax = 1.2081507310237678 / 2.1230881684358494;
    const greenMin = 0.00000009820589517473569 / 2.1230881684358494;
    const blueMax = 1.9537069391779407 / 2.1230881684358494;
    const blueMin = -0.009772809704916124 / 2.1230881684358494;
    
    const maxHeight = 100;
    const redHeight = maxHeight;
    const greenHeight = maxHeight * (greenMax - greenMin) / (redMax - redMin);
    const blueHeight = maxHeight * (blueMax - blueMin) / (redMax - redMin);
    
    const regAdj = 20;
    const redAdj = regAdj;
    const greenAdj = regAdj + maxHeight * (1 - greenMax) / (redMax - redMin);
    const blueAdj = regAdj + maxHeight * (1 - blueMax) / (redMax - redMin);
    
    initializeSlider(sliders, redHeight, redMin, redMax, 50, redAdj, [1,0,0], a, g, val => {vec1.setX(val); vec2.setX(val)});
    initializeSlider(sliders, greenHeight, greenMin, greenMax, 125, greenAdj, [0,1,0], a, g, val => {vec1.setY(val); vec2.setY(val)});
    initializeSlider(sliders, blueHeight, blueMin, blueMax, 200, blueAdj, [0,0,1], a, g, val => {vec1.setZ(val); vec2.setZ(val)});
    
    fixTicks(sliders);
}