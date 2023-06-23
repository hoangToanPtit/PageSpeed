var tracking = false;
var trackingInterval;

var chartData = {
    labels: [],
    datasets: [{
        label: 'Desktop',
        data: [],
        fill: false,
        borderColor: 'rgb(0,102,255)',
        backgroundColor: 'rgb(0,102,255)',
        tension: 0.1,
        pointRadius: 4
    },
    {
        label: 'Mobile',
        data: [],
        fill: false,
        borderColor: 'rgb(204,102,255)',
        backgroundColor: 'rgb(204,102,255)',
        tension: 0.1,
        pointRadius: 4
    }]
};

var speedChart;

function startTracking() {
    if (!tracking) {
        var url = document.getElementById('urlInput').value;
        tracking = true;
        document.getElementById('trackingBtn').innerHTML = "End Tracking";

        if (!speedChart) {
            var intervalControls = document.getElementsByClassName('interval-controls')[0];
            intervalControls.style.display = "block";
            document.getElementById('intervalInput').addEventListener('change', updateInterval);
            speedChart = new Chart(
                document.getElementById('speedChart'),
                {
                    type: 'line',
                    data: chartData,
                    options: {
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    parser: 'YYYY-MM-DDTHH:mm:ss.sssZ', 
                                    unit: 'minute',
                                    displayFormats: {
                                        minute: 'MMM D, h:mm a'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    title: function(context) {
                                        return context[0].label;
                                    },
                                    label: function(context) {
                                        var dataPoint = context.dataset.data[context.dataIndex];
                                        return [
                                            context.dataset.label + ': ' + context.parsed.y,
                                            'FCP: ' + dataPoint.fcP,
                                            'LCP: ' + dataPoint.lcP,
                                            'TBT: ' + dataPoint.tbT,
                                            'CLS: ' + dataPoint.cLS,
                                            'SI: ' + dataPoint.sI
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }
            );
        }

        checkSpeed(url);
        var interval = document.getElementById('intervalInput').value || 1;
        trackingInterval = setInterval(function() {
            checkSpeed(url);
        }, interval*60000); 
    } else {
        tracking = false;
        document.getElementById('trackingBtn').innerHTML = "Start Tracking";
        clearInterval(trackingInterval);
    }
}

function checkSpeed(url) {
    url = url || document.getElementById('urlInput').value;
    Promise.all([
        fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' + url + '&strategy=desktop'),
        fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' + url + '&strategy=mobile')
    ])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(([desktopData, mobileData]) => {
        var now = new Date().toISOString();
        chartData.labels.push(now);
        chartData.datasets[0].data.push({
            x: now,
            y: desktopData.lighthouseResult.categories.performance.score * 100,
            fcP: desktopData.lighthouseResult.audits['first-contentful-paint'].displayValue,
            lcP: desktopData.lighthouseResult.audits['largest-contentful-paint'].displayValue,
            tbT: desktopData.lighthouseResult.audits['total-blocking-time'].displayValue,
            cLS: desktopData.lighthouseResult.audits['cumulative-layout-shift'].displayValue,
            sI: desktopData.lighthouseResult.audits['speed-index'].displayValue
        });
        chartData.datasets[1].data.push({
            x: now,
            y: mobileData.lighthouseResult.categories.performance.score * 100,
            fcP: mobileData.lighthouseResult.audits['first-contentful-paint'].displayValue,
            lcP: mobileData.lighthouseResult.audits['largest-contentful-paint'].displayValue,
            tbT: mobileData.lighthouseResult.audits['total-blocking-time'].displayValue,
            cLS: mobileData.lighthouseResult.audits['cumulative-layout-shift'].displayValue,
            sI: mobileData.lighthouseResult.audits['speed-index'].displayValue
        });

        speedChart.update();

        var desktopScore = Math.round(desktopData.lighthouseResult.categories.performance.score*100);
        var desktopFcp = desktopData.lighthouseResult.audits['first-contentful-paint'].displayValue;
        var desktopLcp = desktopData.lighthouseResult.audits['largest-contentful-paint'].displayValue;
        var desktopTbt = desktopData.lighthouseResult.audits['total-blocking-time'].displayValue;
        var desktopCls = desktopData.lighthouseResult.audits['cumulative-layout-shift'].displayValue;
        var desktopSi = desktopData.lighthouseResult.audits['speed-index'].displayValue;
        
        var mobileScore = Math.round(mobileData.lighthouseResult.categories.performance.score*100);
        var mobileFcp = mobileData.lighthouseResult.audits['first-contentful-paint'].displayValue;
        var mobileLcp = mobileData.lighthouseResult.audits['largest-contentful-paint'].displayValue;
        var mobileTbt = mobileData.lighthouseResult.audits['total-blocking-time'].displayValue;
        var mobileCls = mobileData.lighthouseResult.audits['cumulative-layout-shift'].displayValue;
        var mobileSi = mobileData.lighthouseResult.audits['speed-index'].displayValue;
        
        var desktopResult = document.getElementById('desktop-results');
        desktopResult.style.display = "block";
        var mobileResult = document.getElementById('mobile-results');
        mobileResult.style.display = "block";

        // desktop
        var desktopCircle = document.getElementById('desktop-circle');
        var desktopScoreNumber = document.getElementById('desktop-score-number');
        desktopCircle.setAttribute("stroke-dasharray", `${desktopScore}, 100`);

        var desktopColor;
        if (desktopScore < 50) {
            desktopColor = "#FF3333";
        } else if (desktopScore < 90) {
            desktopColor = "#FFAA33";
        } else {
            desktopColor = "#008800";
        }
        desktopCircle.style.stroke = desktopColor;
        desktopScoreNumber.style.color = desktopColor;
        desktopScoreNumber.parentElement.style.backgroundColor = `${desktopColor}22`;

        desktopScoreNumber.textContent = desktopScore;
        
        document.getElementById('desktop-fcp').getElementsByClassName('result')[0].style.color = getFcpColor(desktopFcp);
        document.getElementById('desktop-fcp').getElementsByClassName('result')[0].textContent = desktopFcp;

        document.getElementById('desktop-lcp').getElementsByClassName('result')[0].style.color = getLcpColor(desktopLcp);
        document.getElementById('desktop-lcp').getElementsByClassName('result')[0].textContent = desktopLcp;

        document.getElementById('desktop-tbt').getElementsByClassName('result')[0].style.color = getTbtColor(desktopTbt);
        document.getElementById('desktop-tbt').getElementsByClassName('result')[0].textContent = desktopTbt;

        document.getElementById('desktop-cls').getElementsByClassName('result')[0].style.color = getClsColor(desktopCls);
        document.getElementById('desktop-cls').getElementsByClassName('result')[0].textContent = desktopCls;

        document.getElementById('desktop-si').getElementsByClassName('result')[0].style.color = getSIColor(desktopSi);
        document.getElementById('desktop-si').getElementsByClassName('result')[0].textContent = desktopSi;

        

        // mobile
        var mobileCircle = document.getElementById('mobile-circle');
        var mobileScoreNumber = document.getElementById('mobile-score-number');
        mobileCircle.setAttribute("stroke-dasharray", `${mobileScore}, 100`);

        var mobileColor;
        if (mobileScore < 50) {
            mobileColor = "#FF3333"; 
        } else if (mobileScore < 90) {
            mobileColor = "#FFAA33"; 
        } else {
            mobileColor = "#008800"; 
        }

        mobileCircle.style.stroke = mobileColor;
        mobileScoreNumber.style.color = mobileColor;
        mobileScoreNumber.parentElement.style.backgroundColor = `${mobileColor}22`;
        mobileScoreNumber.textContent = mobileScore;

        document.getElementById('mobile-fcp').getElementsByClassName('result')[0].style.color = getFcpColor(mobileFcp);
        document.getElementById('mobile-fcp').getElementsByClassName('result')[0].textContent = mobileFcp;

        document.getElementById('mobile-lcp').getElementsByClassName('result')[0].style.color = getLcpColor(mobileLcp);
        document.getElementById('mobile-lcp').getElementsByClassName('result')[0].textContent = mobileLcp;

        document.getElementById('mobile-tbt').getElementsByClassName('result')[0].style.color = getTbtColor(mobileTbt);
        document.getElementById('mobile-tbt').getElementsByClassName('result')[0].textContent = mobileTbt;

        document.getElementById('mobile-cls').getElementsByClassName('result')[0].style.color = getClsColor(mobileCls);
        document.getElementById('mobile-cls').getElementsByClassName('result')[0].textContent = mobileCls;

        document.getElementById('mobile-si').getElementsByClassName('result')[0].style.color = getSIColor(mobileSi);
        document.getElementById('mobile-si').getElementsByClassName('result')[0].textContent = mobileSi;
           

    })
    .catch(error => {
        console.error('Lỗi:', error);
    });
}

function updateInterval() {
    if (tracking) {
        clearInterval(trackingInterval);
        var url = document.getElementById('urlInput').value;
        var interval = document.getElementById('intervalInput').value || 1;
        trackingInterval = setInterval(function() {
            checkSpeed(url);
        }, interval*60000); 
    }
}

function getFcpColor(fcp) {
    var value = parseFloat(fcp);
    if (value <= 1.8) {
        return "#008800";
    } else if (value <= 3) {
        return "#FFAA33";
    } else {
        return "#FF3333";
    }
}

function getLcpColor(lcp) {
    var value = parseFloat(lcp);
    if (value <= 2.5) {
        return "#008800";
    } else if (value <= 4) {
        return "#FFAA33";
    } else {
        return "#FF3333";
    }
}

function getTbtColor(tbt) {
    var value = parseFloat(tbt);
    if (value <= 200) {
        return "#008800";
    } else if (value <= 600) {
        return "#FFAA33";
    } else {
        return "#FF3333";
    }
}

function getClsColor(cls) {
    var value = parseFloat(cls);
    if (value <= 0.1) {
        return "#008800";
    } else if (value <= 0.25) {
        return "#FFAA33";
    } else {
        return "#FF3333";
    }
}

function getSIColor(si) {
    var value = parseFloat(si);
    if (value <= 3.4) {
        return "#008800";
    } else if (value <= 5.8) {
        return "#FFAA33";
    } else {
        return "#FF3333";
    }
}