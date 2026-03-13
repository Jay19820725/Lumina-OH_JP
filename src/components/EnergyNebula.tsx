import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FiveElement, FiveElementValues, ELEMENT_COLORS } from '../core/types';

interface EnergyNebulaProps {
  weights: FiveElementValues;
  className?: string;
}

export const EnergyNebula: React.FC<EnergyNebulaProps> = ({ weights, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const data = [
      { axis: FiveElement.WOOD, value: weights[FiveElement.WOOD] },
      { axis: FiveElement.FIRE, value: weights[FiveElement.FIRE] },
      { axis: FiveElement.EARTH, value: weights[FiveElement.EARTH] },
      { axis: FiveElement.METAL, value: weights[FiveElement.METAL] },
      { axis: FiveElement.WATER, value: weights[FiveElement.WATER] },
    ];

    const radius = Math.min(width, height) / 2 - 40;
    const angleStep = (Math.PI * 2) / data.length;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw background circles
    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      g.append("circle")
        .attr("r", (radius / levels) * i)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-dasharray", "4,4");
    }

    // Radar line generator
    const line = d3.lineRadial<{ axis: FiveElement; value: number }>()
      .radius(d => d.value * radius * 1.5) // Scale up for visibility
      .angle((d, i) => i * angleStep)
      .curve(d3.curveCardinalClosed.tension(0.4));

    // Create gradient for the nebula
    const defs = svg.append("defs");
    const gradient = defs.append("radialGradient")
      .attr("id", "nebula-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(255, 255, 255, 0.4)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(255, 255, 255, 0)");

    // Draw the nebula shape
    g.append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "url(#nebula-gradient)")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("filter", "blur(8px)")
      .style("opacity", 0.6);

    // Draw points and labels
    data.forEach((d, i) => {
      const x = Math.cos(i * angleStep - Math.PI / 2) * (radius + 20);
      const y = Math.sin(i * angleStep - Math.PI / 2) * (radius + 20);

      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("fill", ELEMENT_COLORS[d.axis])
        .attr("font-size", "14px")
        .attr("font-family", "serif")
        .attr("font-style", "italic")
        .text(d.axis);

      g.append("circle")
        .attr("cx", Math.cos(i * angleStep - Math.PI / 2) * d.value * radius * 1.5)
        .attr("cy", Math.sin(i * angleStep - Math.PI / 2) * d.value * radius * 1.5)
        .attr("r", 4)
        .attr("fill", ELEMENT_COLORS[d.axis])
        .attr("filter", "drop-shadow(0 0 4px " + ELEMENT_COLORS[d.axis] + ")");
    });

  }, [weights]);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg ref={svgRef} width="400" height="400" className="overflow-visible" />
    </div>
  );
};
