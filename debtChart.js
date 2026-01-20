const pointLabelPlugin = {
  id: "pointLabels",
  afterDatasetsDraw(chart, args, options) {
    const { ctx } = chart;

    const drawnLabels = []; // track previous label positions

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((point, index) => {
        const value = dataset.data[index];

        // Skip zero values
        if (value === 0) return;

        const text = String(value);

        ctx.save();
        ctx.font = options.font || "12px sans-serif";

        // Use dataset border color for label text
        const labelColor = dataset.borderColor || "#000";

        // Measure text
        const paddingX = 6;
        const paddingY = 3;
        const textWidth = ctx.measureText(text).width;
        const textHeight = 12;

        let x = point.x;
        let y = point.y - 10;

        // --- Prevent overlap ---
        let collision = true;
        while (collision) {
          collision = false;

          for (const prev of drawnLabels) {
            const tooClose =
              Math.abs(y - prev.y) < textHeight + paddingY * 2 &&
              Math.abs(x - prev.x) < textWidth;

            if (tooClose) {
              y -= textHeight + 6; // push upward
              collision = true;
              break;
            }
          }
        }

        drawnLabels.push({ x, y });

        // Draw background pill
        const radius = 4;
        const rectX = x - textWidth / 2 - paddingX;
        const rectY = y - textHeight - paddingY;
        const rectWidth = textWidth + paddingX * 2;
        const rectHeight = textHeight + paddingY * 2;

        ctx.fillStyle = options.backgroundColor || "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
        ctx.lineTo(rectX + radius, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.fill();

        // Draw text
        ctx.fillStyle = labelColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(text, x, y);

        ctx.restore();
      });
    });
  }
};

Chart.register(pointLabelPlugin);

let debtChart;
let rawDebtData;

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    rawDebtData = data;
    initDebtChart(data);
    buildDebtToggles();
  });

function initDebtChart(data) {
  const ctx = document.getElementById("debtChart");

  const datasets = Object.entries(data.debt.cards).map(([name, values]) => ({
    label: name,
    data: values,
    borderWidth: 2,
    tension: 0.3
  }));

   // Compute monthly totals
  const cardArrays = Object.values(data.debt.cards);
  const monthlyTotals = data.debt.months.map((_, i) =>
    cardArrays.reduce((sum, arr) => sum + arr[i], 0)
  );

  // Add totals dataset
  datasets.push({
    label: "Total Debt",
    data: monthlyTotals,
    borderWidth: 3,
    tension: 0.3
  });

  debtChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.debt.months,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, // ⛔ disable legend clicks
          pointLabels: {
            color: "#334155",
            font: "12px sans-serif",
            backgroundColor: "rgba(255,255,255,0.85)"
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }

function buildDebtToggles() {
  const container = document.getElementById("debtToggles");

  debtChart.data.datasets.forEach((ds, index) => {
    const btn = document.createElement("button");
    btn.textContent = ds.label;
    btn.classList.add("active");

    btn.onclick = () => {
      const visible = debtChart.isDatasetVisible(index);
      debtChart.setDatasetVisibility(index, !visible);

      btn.classList.toggle("active", !visible);

      rescaleYAxis();
      debtChart.update();
    };

    container.appendChild(btn);
  });
}
