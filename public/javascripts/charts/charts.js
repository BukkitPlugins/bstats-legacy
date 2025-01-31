$(function () {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts', function (charts) { // Get all charts of the plugin
        for (var chart in charts) {
            if (!charts.hasOwnProperty(chart)) {
                continue;
            }
            switch (charts[chart].type) {
                case 'simple_pie':
                case 'advanced_pie':
                    handlePieChart(chart, charts[chart]);
                    break;
                case 'drilldown_pie':
                    handleDrilldownPieChart(chart, charts[chart]);
                    break;
                case 'single_linechart':
                    handleLineChart(chart, charts[chart]);
                    break;
                case 'simple_bar':
                case 'advanced_bar':
                    handleBarChart(chart, charts[chart]);
                    break;
                case 'simple_map':
                case 'advanced_map':
                    handleMapChart(chart, charts[chart]);
                    break;
                default:
                    break;
            }
        }
    });
});

function handlePieChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {

        if (data.length > 20) { // Make the chart smaller by hiding elements with less than 1%
            var total = 0;
            for (var i = 0; i < data.length; i++) {
                total += data[i].y;
            }
            var otherCount = 0;
            for (var i = data.length - 1; i >= 0; i--) { // We loop backwards because we may remove some elements
                if (data[i].y < total / 200) {
                    otherCount += data[i].y;
                    data.splice(i, 1);
                }
            }
            if (otherCount > 0) {
                data.push({name: "Other", y: otherCount});
            }
        }

        data.sort(function compare(a, b) {
            if (a.y > b.y) {
                return -1;
            } else if (a.y < b.y) {
                return 1;
            }
            return 0;
        });

        $('#' + chartId + 'Pie').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },
            tooltip: {
                headerFormat: '<span style="font-size: 18px"><u><b>{point.key}</b></u></span><br/>',
                pointFormat: '<b>Share</b>: {point.percentage:.1f} %<br><b>Total</b>: {point.y}'
            },
            exporting: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    size: 300,
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: $(window).width() > 600,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                            textOutline: '1px contrast',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }
                    },
                    showInLegend: $(window).width() <= 600
                }
            },
            series: [{
                name: chart.title,
                colorByPoint: true,
                data: data
            }]
        });
    });
}

function handleDrilldownPieChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {

        for (var j = 0; j < data.drilldownData.length; j++) {
            if (data.drilldownData[j].data.length > 20) { // Make the chart smaller by hiding elements with less than 1%
                var total = 0;
                for (var i = 0; i < data.drilldownData[j].data.length; i++) {
                    total += data.drilldownData[j].data[i][1];
                }
                var otherCount = 0;
                for (var i = data.drilldownData[j].data.length - 1; i >= 0; i--) { // We loop backwards because we may remove some elements
                    if (data.drilldownData[j].data[i][1] < total / 200) {
                        otherCount += data.drilldownData[j].data[i][1];
                        data.drilldownData[j].data.splice(i, 1);
                    }
                }
                if (otherCount > 0) {
                    data.drilldownData[j].data.push(["Other", otherCount]);
                }

                data.drilldownData[j].data.sort(function compare(a, b) {
                    if (a[1] > b[1]) {
                        return -1;
                    } else if (a[1] < b[1]) {
                        return 1;
                    }
                    return 0;
                });
            }
        }



        $('#' + chartId + 'Pie').highcharts({
            chart: {
                type: 'pie'
            },
            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },
            subtitle: {
                text: 'Click the slices to view details.'
            },
            plotOptions: {
                pie: {
                    size: 300,
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: $(window).width() > 600,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
                            textOutline: '1px contrast',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }
                    },
                    showInLegend: $(window).width() <= 600
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size: 18px"><u><b>{point.key}</b></u></span><br/>',
                pointFormat: '<b>Share</b>: {point.percentage:.1f} %<br><b>Total</b>: {point.y}'
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: chart.title,
                colorByPoint: true,
                data: data.seriesData
            }],
            drilldown: {
                series: data.drilldownData,
                activeDataLabelStyle: {
                    color: 'white' // Color of the links (drilldown labels)
                }
            }
        });
    });
}

function handleLineChart(chartId, chart) {
    var isMobile = $(window).width() < 600;
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data/?maxElements=' + (2*24*31*1), function (data) {
        if (chartId === 'players') {
            updatePlayersBadge(data);
        } else if (chartId === 'servers') {
            updateServersBadge(data);
        }
        $('#' + chartId + 'LineChart').highcharts('StockChart', {

            chart:{
                zoomType: 'x'
            },

            rangeSelector: {
                buttonTheme: {
                    fill: '#333', // Buttons background color
                    style: { color: 'white' } // Text color of the buttons
                },
                labelStyle: { color: 'white' }, // Title color
                buttons: [{
                    type: 'day',
                    count: 1,
                    text: '1d'
                }, {
                    type: 'day',
                    count: 3,
                    text: '3d'
                }, {
                    type: 'week',
                    count: 1,
                    text: '1w'
                }, {
                    type: 'month',
                    count: 1,
                    text: '1m'
                }, {
                    type: 'month',
                    count: 6,
                    text: '6m'
                }, {
                    type: 'year',
                    count: 1,
                    text: '1y'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                selected: 3,
                inputEnabled: false
            },

            exporting: {
                menuItemDefinitions: {
                    loadFullData: {
                        onclick: function () {
                            $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data/?maxElements=' + (2*24*30*12*2), function (data) {
                                $('#' + chartId + 'LineChart').highcharts().series[0].update({
                                    data: data
                                }, true);
                            });
                        },
                        text: 'Load full data'
                    }
                },
                buttons: {
                    contextButton: {
                        menuItems: ['loadFullData'],
                        theme: {
                            fill: '#333',
                            stroke: '#555',
                            style: { color: 'white' }
                        }
                    }
                }
            },

            xAxis: {
                ordinal: false, 
                labels: {
                    style: {
                        color: 'white', // Color of X axis labels
                        textOutline: '1px contrast',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }
                }
            },

            yAxis: {
                min: 0,
                labels: {
                    formatter: function () {
                        if (this.value % 1 != 0) {
                            return "";
                        } else {
                            return this.value;
                        }
                    }
                }
            },

            scrollbar: {
                barBackgroundColor: '#444444',
                barBorderColor: '#666666',
                buttonArrowColor: 'white',
                buttonBackgroundColor: '#333333',
                rifleColor: 'white',
                trackBackgroundColor: '#222222',
                trackBorderColor: '#444444'
            },

            title : {
                text : '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },

            plotOptions:{
                series: {
                    turboThreshold: 0 // disable the 1000 limit
                }
            },

            series : [{
                name : chart.data.lineName,
                data : data,
                type: 'spline',
                tooltip: {
                    valueDecimals: 0
                }
            }]
        });
    });
}

function handleBarChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        $('#' + chartId + 'Bar').highcharts({
            chart: {
                type: 'bar',
                renderTo: 'container',
                marginTop: 40,
                marginBottom: 80,
                height: data.length * chart.data.barNames.length * (30 + chart.data.barNames.length * 15) + 120 // 20px per data item plus top and bottom margins
            },
            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                },
                series: {
                    pointWidth: 25
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size: 18px"><u><b>{point.key}</b></u></span><br/>',
                pointFormat: '<b>Total</b>: {point.y} ' + chart.data.valueName
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -40,
                y: 80,
                floating: true,
                borderWidth: 1,
                backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                shadow: true
            },
            exporting: {
                enabled: false
            },
            yAxis: {
                min: 0,
                title: {
                    text: chart.data.valueName,
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            xAxis: {
                categories: data.map(d => d.name)
            },
            series: chart.data.barNames.map((barName, index) => ({
                name: barName,
                data: data.map(d => d.data[index])
            }))
        });
    });
}

function handleMapChart(chartId, chart) {
    $.getJSON('/api/v1/plugins/' + getPluginId() + '/charts/' + chartId + '/data', function (data) {
        // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
        $.each(data, function () {
            this.flag = this.code.replace('UK', 'GB').toLowerCase();
        });

        // Initiate the chart
        $('#' + chartId + 'Map').highcharts('Map', {

            title: {
                text: '<a href="#' + chartId + '" style="text-decoration: none; color: inherit;">' + chart.title + '</a>'
            },

            legend: {
                title: {
                    text: chart.data.valueName,
                    style: {
                        color: 'white' // "Servers" text
                    }
                }
            },

            exporting: {
                enabled: false
            },

            mapNavigation: {
                enabled: true,
                enableMouseWheelZoom: false,
                buttonOptions: {
                    verticalAlign: 'bottom',
                     theme: {
                        fill: '#333',
                        style: { color: 'white' }
                    }
                }
            },

            tooltip: {
                backgroundColor: 'none',
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                pointFormat: '<span class="f32"><span class="flag {point.flag}"></span></span>' +
                ' {point.name}: <b>{point.value}</b>',
                positioner: function () {
                    return { x: 0, y: 250 };
                },
                style: {
                    color: 'white' // Legend text color
                }
            },

            colorAxis: {
                min: 1,
                max: 5000,
                type: 'logarithmic',
                minColor: '#FFCDD2',
                maxColor: '#B71C1C',
                labels: {
                    style: {
                        color: 'white' // Axis numbers color
                    }
                }
            },

            series : [{
                data : data,
                mapData: Highcharts.maps['custom/world'],
                joinBy: ['iso-a2', 'code'],
                name: chart.data.valueName,
                color: '#F44336',
                shadow: false,
                states: {
                    hover: {
                        color: '#B71C1C'
                    }
                },
                borderColor: '#444444', // Border of the states
                borderWidth: 0.5, // Border width of the states
            }]
        });
    });
}