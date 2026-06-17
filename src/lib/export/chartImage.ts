const CHART_COLORS = [
    "#1B4332",
    "#2D6A4F",
    "#40916C",
    "#52B788",
    "#C5A059",
    "#D4A373",
    "#74C69D",
    "#95D5B2",
];

async function loadChart() {
    const { Chart, registerables } = await import("chart.js");
    Chart.register(...registerables);
    return Chart;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export async function createBarChartImage(options: {
    title: string;
    labels: string[];
    values: number[];
    maxValue?: number;
    horizontal?: boolean;
    valueLabel?: string;
}): Promise<string> {
    const Chart = await loadChart();
    const canvas = createCanvas(760, 420);

    const chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: options.labels,
            datasets: [
                {
                    label: options.valueLabel || "Score",
                    data: options.values,
                    backgroundColor: options.labels.map(
                        (_, index) => CHART_COLORS[index % CHART_COLORS.length]
                    ),
                    borderRadius: 6,
                },
            ],
        },
        options: {
            indexAxis: options.horizontal ? "y" : "x",
            responsive: false,
            animation: false,
            plugins: {
                title: {
                    display: true,
                    text: options.title,
                    font: { size: 16, weight: "bold" },
                    color: "#1B4332",
                    padding: { bottom: 16 },
                },
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: options.horizontal ? options.maxValue : options.maxValue,
                    grid: { color: "#E8E4D8" },
                    ticks: { color: "#1B4332" },
                },
                y: {
                    beginAtZero: true,
                    max: options.horizontal ? undefined : options.maxValue,
                    grid: { color: "#E8E4D8" },
                    ticks: { color: "#1B4332" },
                },
            },
        },
    });

    chart.update("none");
    const dataUrl = canvas.toDataURL("image/png");
    chart.destroy();
    return dataUrl;
}

export async function createDoughnutChartImage(options: {
    title: string;
    labels: string[];
    values: number[];
}): Promise<string> {
    const Chart = await loadChart();
    const canvas = createCanvas(560, 420);

    const chart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: options.labels,
            datasets: [
                {
                    data: options.values,
                    backgroundColor: ["#40916C", "#C5A059", "#2D6A4F", "#D4A373"],
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                },
            ],
        },
        options: {
            responsive: false,
            animation: false,
            plugins: {
                title: {
                    display: true,
                    text: options.title,
                    font: { size: 16, weight: "bold" },
                    color: "#1B4332",
                    padding: { bottom: 12 },
                },
                legend: {
                    position: "bottom",
                    labels: { color: "#1B4332", padding: 16 },
                },
            },
        },
    });

    chart.update("none");
    const dataUrl = canvas.toDataURL("image/png");
    chart.destroy();
    return dataUrl;
}
