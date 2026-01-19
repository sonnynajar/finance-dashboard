fetch("data.json")
  .then(res => res.json())
  .then(data => {
    const linksData = data.cashFlow.categories;

    const nodes = Array.from(
      new Set(linksData.flatMap(d => [d.from, d.to])),
      name => ({ name })
    );

    const links = linksData.map(d => ({
      source: d.from,
      target: d.to,
      value: d.value
    }));

    const width = document.getElementById("sankey").clientWidth;
    const height = 800;

    const svg = d3.select("#sankey")
      .attr("viewBox", [0, 0, width, height]);

    const sankey = d3.sankey()
      .nodeId(d => d.name)
      .nodeWidth(18)
      .nodePadding(32)
      .extent([[1, 1], [width - 1, height - 6]]);

    const graph = sankey({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    const icons = {
      "Income": "💰",
    
      "Home": "🏠",
      "Mortgage": "🏡",
      "HOA": "🏢",
      "Home Insurance": "🛡️",
    
      "Car": "🚗",
      "AAA": "⚠️",
      "Gas": "⛽",
    
      "Bills": "📄",
      "SDGE": "⚡",
      "Water": "💧",
      "WiFi": "📶",
      "Streaming": "🎬",
      "Phone": "📱",
      "Gym": "🏋️",
    
      "Groceries": "🛒",
      "Credit Cards": "💳",
      "Savings": "🏦"
      
    };

    const tooltip = d3.select("#tooltip");

    function showTooltip(event, text) {
      const x = event.clientX + window.scrollX;
      const y = event.clientY + window.scrollY;
    
      tooltip
        .style("opacity", 1)
        .html(text)
        .style("left", x + 12 + "px")
        .style("top", y + 12 - 64 + "px");
    }
    
    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    const linkLayer = svg.append("g");
    const nodeLayer = svg.append("g");
    const labelLayer = svg.append("g");

    nodeLayer
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", "#4f46e5")
      .on("pointermove", (event, d) => {
        showTooltip(
          event,
          `<strong>${d.name}</strong><br>$${d.value.toLocaleString()}`
        );
      })
      .on("pointerleave", hideTooltip);

    labelLayer
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", d =>
        d.x0 < width / 2
          ? d.x1 + 8     // left-side nodes → icon to the right
          : d.x0 - 8     // right-side nodes → icon to the left
      )
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d =>
        d.x0 < width / 2 ? "start" : "end"
      )
      .style("font-size", "14px")
      .text(d => icons[d.name] || "❓")
      .style("pointer-events", "none");

    labelLayer
      .selectAll("text.value")
      .data(graph.nodes)
      .join("text")
      .attr("class", "value")
      .attr("x", d =>
        d.x0 < width / 2
          ? d.x1 + 8
          : d.x0 - 8
      )
      .attr("y", d => (d.y0 + d.y1) / 2 + 20)   // push value below icon
      .attr("dy", "0.35em")
      .attr("text-anchor", d =>
        d.x0 < width / 2 ? "start" : "end"
      )
      .style("font-size", "12px")
      .style("fill", "#334155")
      .text(d => `$${d.value.toLocaleString()}`)
      .style("pointer-events", "none");


    linkLayer
      .attr("fill", "none")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("opacity", 0.6)
      .on("pointermove", (event, d) => {
        showTooltip(
          event,
          `<strong>${d.source.name} → ${d.target.name}</strong><br>$${d.value.toLocaleString()}`
        );
      })
      .on("pointerleave", hideTooltip);

  });





