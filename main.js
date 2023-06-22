var tracking = false;
var trackingInterval;

var chartData = {
    labels: [],
    datasets: [{
        label: 'Desktop',
        data: [],
        fill: false,
        borderColor: 'rgb(11, 163, 87)',
        backgroundColor: 'rgb(11, 163, 87)',
        tension: 0.1,
        pointRadius: 5
    },
    {
        label: 'Mobile',
        data: [],
        fill: false,
        borderColor: 'rgb(232, 37, 37)',
        backgroundColor: 'rgb(232, 37, 37)',
        tension: 0.1,
        pointRadius: 5
    }]
};

var speedChart;

function startTracking() {
    if (!tracking) {
        var url = document.getElementById('urlInput').value;
        tracking = true;
        document.getElementById('trackingBtn').innerHTML = "End Tracking";

        if (!speedChart) {
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

        trackingInterval = setInterval(function() {
            checkSpeed(url);
        }, 60000); 
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
            desktopColor = "#ff0000";
        } else if (desktopScore < 90) {
            desktopColor = "#ffc107";
        } else {
            desktopColor = "#4caf50";
        }
        desktopCircle.style.stroke = desktopColor;
        desktopScoreNumber.style.color = desktopColor;
        desktopScoreNumber.parentElement.style.backgroundColor = `${desktopColor}33`;

        desktopScoreNumber.textContent = desktopScore;
        
        document.getElementById('desktop-fcp').getElementsByClassName('result')[0].textContent = desktopFcp;
        document.getElementById('desktop-lcp').getElementsByClassName('result')[0].textContent = desktopLcp;
        document.getElementById('desktop-tbt').getElementsByClassName('result')[0].textContent = desktopTbt;
        document.getElementById('desktop-cls').getElementsByClassName('result')[0].textContent = desktopCls;
        document.getElementById('desktop-si').getElementsByClassName('result')[0].textContent = desktopSi;
        

        // mobile
        var mobileCircle = document.getElementById('mobile-circle');
        var mobileScoreNumber = document.getElementById('mobile-score-number');
        mobileCircle.setAttribute("stroke-dasharray", `${mobileScore}, 100`);

        var mobileColor;
        if (mobileScore < 50) {
            mobileColor = "#ff0000"; 
        } else if (mobileScore < 90) {
            mobileColor = "#ffc107"; 
        } else {
            mobileColor = "#4caf50"; 
        }

        mobileCircle.style.stroke = mobileColor;
        mobileScoreNumber.style.color = mobileColor;
        mobileScoreNumber.parentElement.style.backgroundColor = `${mobileColor}33`;
        mobileScoreNumber.textContent = mobileScore;

        document.getElementById('mobile-fcp').getElementsByClassName('result')[0].textContent = mobileFcp;
        document.getElementById('mobile-lcp').getElementsByClassName('result')[0].textContent = mobileLcp;
        document.getElementById('mobile-tbt').getElementsByClassName('result')[0].textContent = mobileTbt;
        document.getElementById('mobile-cls').getElementsByClassName('result')[0].textContent = mobileCls;
        document.getElementById('mobile-si').getElementsByClassName('result')[0].textContent = mobileSi;
           

    })
    .catch(error => {
        console.error('Lỗi:', error);
    });
}
