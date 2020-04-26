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

const createGenerteData = (t) => (filter) => {
  let { patterns, avgPattern, minMaxPattern, minWeekValue } = calculate(filter);

  const minMaxData = zip(...minMaxPattern);

  return [
    {
      label: t("Buy Price"),
      data: new Array(12).fill(filter[0] || null),
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
      data: Array.from({ length: 12 }, (v, i) => filter[i + 1] || null),
      fill: false,
      backgroundColor: "#EF8341",
      borderColor: "#EF8341",
    },
    {
      label: t("Average"),
      data: avgPattern || new Array(12).fill(null),
      backgroundColor: "#F0E16F",
      borderColor: "#F0E16F",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
    {
      label: t("Maximum"),
      data: minMaxData[1] || new Array(12).fill(null),
      backgroundColor: "#A5D5A5",
      borderColor: "#A5D5A5",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
    {
      label: t("Minimum"),
      data: minMaxData[0] || new Array(12).fill(null),
      backgroundColor: "#88C9A1",
      borderColor: "#88C9A1",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
    ...patterns.reduce((acc, pattern) => {
      const minMaxData = zip(...pattern);
      return [
        ...acc,
        {
          label: "submax",
          data: minMaxData[1] || new Array(12).fill(null),
          backgroundColor: `rgba(165, 213, 165, ${
            pattern.probability * Math.log2(patterns.length + 1)
          })`,
          borderColor: `transparent`,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 3,
        },
        {
          label: "submin",
          data: minMaxData[0] || new Array(12).fill(null),
          backgroundColor: `rgba(136, 201, 161, ${
            pattern.probability * Math.log2(patterns.length + 1)
          })`,
          borderColor: `transparent`,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 3,
        },
      ];
    }, []),
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
    filter: ({ datasetIndex }) => datasetIndex < 6,
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
      filter: ({ text = "" }) => !text.includes("sub"),
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
      datasets: generateData(filters),
      labels: getLabels(),
    },
    options: chartOptions,
  };
  return await canvasRenderService.renderToBuffer(configuration);
};

export { renderToBuffer };
