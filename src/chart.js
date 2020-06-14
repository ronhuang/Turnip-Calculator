import zip from "lodash.zip";
import { calculate } from "./utils/patterns";
import i18n from "./i18n";
import { CanvasRenderService } from "chartjs-node-canvas";

const width = 1280; //px
const height = 720; //px
const backgroundColor = "#D8F1E1";
const fontSize = 24;

const canvasRenderService = new CanvasRenderService(
  width,
  height,
  (ChartJS) => {
    ChartJS.defaults.global.defaultFontSize = fontSize;
    ChartJS.plugins.register({
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      },
    });
  }
);

const createGenerteData = (t) => async (filters) => {
  let quantileRange = 75;
  let { minMaxPattern, minWeekValue, quantiles } = await calculate({
    filters,
    quantileRange,
  });

  const minMaxData = zip(...minMaxPattern);

  return [
    {
      label: t("Buy Price"),
      data: new Array(12).fill(filters[0] || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#7B6C53",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [5, 15],
    },
    {
      label: t("Guaranteed Min"),
      data: new Array(12).fill(minWeekValue || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#007D75",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [3, 6],
    },
    {
      label: t("Daily Price"),
      data: Array.from({ length: 12 }, (v, i) => filters[i + 1] || null),
      fill: false,
      backgroundColor: "#EF8341",
      borderColor: "#EF8341",
    },
    {
      label: t("Maximum"),
      data: minMaxData[1] || new Array(12).fill(null),
      backgroundColor: "#88c9a1",
      borderColor: "#88c9a1",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: "+1",
    },
    {
      label: t("Most Likely"),
      data: quantiles[2] || new Array(12).fill(null),
      backgroundColor: "#88b0c9",
      borderColor: "#88b0c9",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: "+1",
    },
    {
      label: "quantile25",
      data: quantiles[0] || new Array(12).fill(null),
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
    {
      label: t("Minimum"),
      data: minMaxData[0] || new Array(12).fill(null),
      backgroundColor: "#c988b0",
      borderColor: "#c988b0",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: "-1",
    },
  ];
};

const createGetLabels = (t) => () => {
  return t("Mon Tue Wed Thu Fri Sat")
    .split(" ")
    .reduce(
      (acc, day) => [...acc, `${day} ${t("AM")}`, `${day} ${t("PM")}`],
      []
    );
};

const chartOptions = {
  maintainAspectRatio: false,
  showLines: true,
  tooltips: {
    intersect: false,
    mode: "index",
    filter: (item, data) => {
      const label = data.datasets[item.datasetIndex].label;
      return label !== "quantile25";
    },
    callbacks: {
      label: (item, data) => {
        const label = data.datasets[item.datasetIndex].label || "";
        let value = item.value;
        if (item.datasetIndex === 4) {
          value = `${data.datasets[5].data[item.index]}-${
            data.datasets[4].data[item.index]
          }`;
        }
        return `${label}: ${value}`;
      },
    },
  },
  scales: {
    y: {
      gridLines: {
        display: true,
      },
      suggestedMin: 0,
      suggestedMax: 400,
    },
  },
  elements: {
    line: {
      cubicInterpolationMode: "monotone",
    },
  },
  legend: {
    labels: {
      filter: ({ text = "" }) => text !== "quantile25",
    },
  },
};

const t = i18n.t.bind(i18n);
const generateData = createGenerteData(t);
const getLabels = createGetLabels(t);

const renderToBuffer = async (filters) => {
  const configuration = {
    type: "line",
    data: {
      datasets: await generateData(filters),
      labels: getLabels(),
    },
    options: chartOptions,
  };
  return await canvasRenderService.renderToBuffer(configuration);
};

export { renderToBuffer };
