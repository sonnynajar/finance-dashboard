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



