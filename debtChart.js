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

    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.debt.months,
        datasets
      },
      options: {
        responsive: true,
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
