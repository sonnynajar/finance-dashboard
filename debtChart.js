const pointLabelPlugin = {
  id: "pointLabels",
  afterDatasetsDraw(chart, args, options) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((point, index) => {
        const value = dataset.data[index];

        ctx.save();
        ctx.fillStyle = options.color || "#000";
        ctx.font = options.font || "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.fillText(value, point.x, point.y - 6);
        ctx.restore();
      });
    });
  }
};

Chart.register(pointLabelPlugin);

fetch("data.json")
  .then(res => res.json())
  .then(data => {
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

    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.debt.months,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          },
          pointLabels: {
            color: "#334155",
            font: "12px sans-serif"
          }
      }

        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  });




