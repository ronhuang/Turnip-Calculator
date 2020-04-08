const { CanvasRenderService } = require("chartjs-node-canvas");
const zip = require("lodash.zip");
const {
  possiblePatterns,
  patternReducer,
  averageReducer,
  minWeekReducer,
} = require("./v2/optimizer");
const i18n = require("./i18n");

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

const generateData = (filter) => {
  let patterns = possiblePatterns(filter);
  const patternCount = patterns.reduce((acc, cur) => acc + cur.length, 0);
  if (patternCount === 0) patterns = possiblePatterns([0, ...filter.slice(1)]);
  const minMaxPattern = patternReducer(patterns);
  const minMaxData = zip(...minMaxPattern);
  const avgPattern = patternReducer(patterns, averageReducer);
  const avgData = zip(...avgPattern);
  const [minWeekValue] = patternReducer(patterns, minWeekReducer);

  return [
    {
      label: i18n.t("Buy Price"),
      data: new Array(12).fill(filter[0] || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#7B6C53",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [5, 15],
    },
    {
      label: i18n.t("Guaranteed Min"),
      data: new Array(12).fill(minWeekValue || null),
      fill: true,
      backgroundColor: "transparent",
      borderColor: "#007D75",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderDash: [3, 6],
    },
    {
      label: i18n.t("Daily Price"),
      data: Array.from({ length: 12 }, (v, i) => filter[i + 1] || null),
      fill: false,
      backgroundColor: "#EF8341",
      borderColor: "#EF8341",
    },
    {
      label: i18n.t("Average"),
      data: avgData[0] ? avgData[0].map(Math.trunc) : new Array(12).fill(null),
      backgroundColor: "#F0E16F",
      borderColor: "#F0E16F",
      pointRadius: 0,
      fill: false,
    },
    {
      label: i18n.t("Maximum"),
      data: minMaxData[1] || new Array(12).fill(null),
      backgroundColor: "#A5D5A5",
      borderColor: "#A5D5A5",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: 3,
    },
    {
      label: i18n.t("Minimum"),
      data: minMaxData[0] || new Array(12).fill(null),
      backgroundColor: "#88C9A1",
      borderColor: "#88C9A1",
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: 3,
    },
  ];
};

const renderToBuffer = async (filter) => {
  const configuration = {
    type: "line",
    data: {
      datasets: generateData(filter),
      labels: i18n
        .t("Mon Tue Wed Thu Fri Sat")
        .split(" ")
        .reduce(
          (acc, day) => [
            ...acc,
            `${day} ${i18n.t("AM")}`,
            `${day} ${i18n.t("PM")}`,
          ],
          []
        ),
    },
    options: {
      maintainAspectRatio: false,
      showLines: true,
      tooltips: {
        intersect: false,
        mode: "index",
      },
      scales: {
        yAxes: [
          {
            gridLines: {
              display: false,
            },
            ticks: {
              suggestedMin: 0,
              suggestedMax: 300,
            },
          },
        ],
      },
      elements: {
        line: {
          cubicInterpolationMode: "monotone",
        },
      },
    },
  };
  return await canvasRenderService.renderToBuffer(configuration);
};

module.exports = {
  renderToBuffer,
};
