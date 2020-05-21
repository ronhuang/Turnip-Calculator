import React, { useRef, useCallback, useEffect } from "react";
import { arrayOf, number } from "prop-types";
import Chart from "chart.js";
import zip from "lodash.zip";
import merge from "lodash.merge";
import { Box } from "@material-ui/core";
import { useDebounce } from "react-use";
import { useTranslation } from "react-i18next";
import { calculate } from "../utils";

Chart.defaults.defaultFontFamily = "Arial Rounded MT Bold";

const createGenerteData = (t) => async (filter) => {
  let { minMaxPattern, minWeekValue, quantiles } = await calculate(filter);

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
        display: false,
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

const ChartComponent = ({ filters }) => {
  const canvas = useRef();
  const chart = useRef();
  const { t } = useTranslation();
  const generateData = useCallback(createGenerteData(t), [t]);
  const getLabels = useCallback(createGetLabels(t), [t]);

  // onMount effect
  useEffect(() => {
    (async () => {
      const ctx = canvas.current.getContext("2d");
      chart.current = new Chart(ctx, {
        type: "line",
        data: {
          datasets: await generateData(filters),
          labels: getLabels(),
        },
        options: chartOptions,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language labels chart effect
  useEffect(() => {
    if (!chart.current) return;
    // this is necessary, or else labels won't change language until reload
    const newLabels = getLabels();
    merge(chart.current.data.labels, newLabels);
    chart.current.update();
  }, [getLabels]);

  // Filters / Data effect
  useDebounce(
    async () => {
      if (!chart.current) return;
      // regerates chart in the new
      const newData = await generateData(filters, t);
      merge(chart.current.data.datasets, newData);
      chart.current.data.datasets.length = newData.length;
      chart.current.update();
    },
    500,
    [filters, generateData]
  );

  // Fix for mobile tooltip
  const tooltipTimeout = useRef();
  const onTouchEnd = useCallback(() => {
    clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      if (!chart.current) return;
      chart.current.options.tooltips.enabled = false;
      chart.current.update();
    }, 3000);
  }, []);
  const onTouchStart = useCallback(() => {
    if (!chart.current) return;
    chart.current.options.tooltips.enabled = true;
    chart.current.update();
  }, []);
  // Clear timeout if unmount
  useEffect(() => {
    return () => {
      clearTimeout(tooltipTimeout.current);
    };
  }, []);

  return (
    <Box
      p={[0.5, 1, 2]}
      mt={2}
      borderRadius={16}
      bgcolor="bkgs.chart"
      width={1}
      height={400}
    >
      <canvas
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        unselectable={"on"}
        ref={canvas}
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
      />
    </Box>
  );
};

ChartComponent.propTypes = {
  filters: arrayOf(number).isRequired,
};

export default ChartComponent;
