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

const palette = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#0ea5e9", // blue
  "#a855f7", // purple
  "#14b8a6"  // teal
];

function initDebtChart(data) {
  const ctx = document.getElementById("debtChart");

  const datasets = Object.entries(data.debt.cards).map(([name, values]) => ({
    label: name,
    data: values,
    borderWidth: 2,
    tension: 0.3,
    borderColor: palette[i % palette.length],
    backgroundColor: palette[i % palette.length]
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
    tension: 0.3,
    borderColor: "#0f172a",
    backgroundColor: "#0f172a"
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
    btn.classList.add("toggle-btn", "active");

    const color = ds.borderColor;

    // Initial style
    btn.style.borderColor = color;
    btn.style.color = color;
    btn.style.backgroundColor = `${color}15`; // translucent

    btn.onclick = () => {
      const visible = debtChart.isDatasetVisible(index);
      debtChart.setDatasetVisibility(index, !visible);

      btn.classList.toggle("active", !visible);

      if (visible) {
        // OFF
        btn.style.backgroundColor = "#f1f5f9";
        btn.style.color = "#94a3b8";
        btn.style.borderColor = "#cbd5e1";
      } else {
        // ON
        btn.style.backgroundColor = `${color}15`;
        btn.style.color = color;
        btn.style.borderColor = color;
      }

      rescaleYAxis();
      debtChart.update();
    };

    container.appendChild(btn);
  });
}

function rescaleYAxis() {
  const visibleDatasets = debtChart.data.datasets.filter((_, i) =>
    debtChart.isDatasetVisible(i)
  );

  let min = Infinity;
  let max = -Infinity;

  visibleDatasets.forEach(ds => {
    ds.data.forEach(v => {
      if (v === 0) return;
      min = Math.min(min, v);
      max = Math.max(max, v);
    });
  });

  if (min === Infinity) {
    min = 0;
    max = 100;
  }

  debtChart.options.scales.y.min = min * 0.95;
  debtChart.options.scales.y.max = max * 1.05;
}
