var tracking = false;
var trackingInterval;
var maxDesktopScore = 0;
var maxMobileScore = 0;

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
        var nowTime = new Date();
        var now = nowTime.toISOString();
        var dateTime = nowTime.toLocaleString();

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

        //update chart
        chartData.labels.push(now);
        chartData.datasets[0].data.push({
            x: now,
            y: desktopScore,
            fcP: desktopFcp,
            lcP: desktopLcp,
            tbT: desktopTbt,
            cLS: desktopCls,
            sI: desktopSi
        });
        chartData.datasets[1].data.push({
            x: now,
            y: mobileScore,
            fcP: mobileFcp,
            lcP: mobileLcp,
            tbT: mobileTbt,
            cLS: mobileCls,
            sI: mobileSi
        });

        speedChart.update();
        
        //update best result
        var desktopResult = document.getElementById('desktop-results');
        desktopResult.style.display = "block";
        var mobileResult = document.getElementById('mobile-results');
        mobileResult.style.display = "block";
        var bestResultTitle = document.getElementsByClassName('best-result-title')[0];
        bestResultTitle.style.display = "block";

        // desktop
        if (maxDesktopScore <= desktopScore) {
            var desktopTime = document.getElementById("best-result-time-desktop");
            desktopTime.textContent = dateTime;

            maxDesktopScore = desktopScore;
            var desktopCircle = document.getElementById('desktop-circle');
            var desktopScoreNumber = document.getElementById('desktop-score-number');
            desktopCircle.setAttribute("stroke-dasharray", `${desktopScore}, 100`);
    
            var desktopColor = getScoreColor(desktopScore);
            var desktopCircleColor = getScoreCircleColor(desktopScore);
            desktopCircle.style.stroke = desktopCircleColor;
            desktopScoreNumber.style.color = desktopColor;
            desktopScoreNumber.parentElement.style.backgroundColor = `${desktopCircleColor}22`;
    
            desktopScoreNumber.textContent = desktopScore;
            
            var desktopFcpElement = document.getElementById('desktop-fcp');
            var desktopFcpResult = desktopFcpElement.getElementsByClassName('result')[0];
            setFcpColor(desktopFcpElement, desktopFcp);
            desktopFcpResult.textContent = desktopFcp;
    
            var desktopLcpElement = document.getElementById('desktop-lcp');
            var desktopLcpResult = desktopLcpElement.getElementsByClassName('result')[0];
            setLcpColor(desktopLcpElement, desktopLcp);
            desktopLcpResult.textContent = desktopLcp;
    
            var desktopTbtElement = document.getElementById('desktop-tbt');
            var desktopTbtResult = desktopTbtElement.getElementsByClassName('result')[0];
            setTbtColor(desktopTbtElement, desktopTbt);
            desktopTbtResult.textContent = desktopTbt;

            var desktopClsElement = document.getElementById('desktop-cls');
            var desktopClsResult = desktopClsElement.getElementsByClassName('result')[0];
            setClsColor(desktopClsElement, desktopCls);
            desktopClsResult.textContent = desktopCls;

            var desktopSiElement = document.getElementById('desktop-si')
            var desktopSiResult = desktopSiElement.getElementsByClassName('result')[0];
            setSiColor(desktopSiElement, desktopSi);
            desktopSiResult.textContent = desktopSi;
        }

        // mobile
        if (maxMobileScore <= mobileScore) {
            var mobileTime = document.getElementById("best-result-time-mobile");
            mobileTime.textContent = dateTime;

            maxMobileScore = mobileScore;
            var mobileCircle = document.getElementById('mobile-circle');
            var mobileScoreNumber = document.getElementById('mobile-score-number');
            mobileCircle.setAttribute("stroke-dasharray", `${mobileScore}, 100`);
    
            var mobileColor = getScoreColor(mobileScore);
            var mobileCircleColor = getScoreCircleColor(mobileScore);
            mobileCircle.style.stroke = mobileCircleColor;
            mobileScoreNumber.style.color = mobileColor;
            mobileScoreNumber.parentElement.style.backgroundColor = `${mobileCircleColor}22`;
            mobileScoreNumber.textContent = mobileScore;
    
            var mobileFcpElement = document.getElementById('mobile-fcp');
            var mobileFcpResult = mobileFcpElement.getElementsByClassName('result')[0];
            setFcpColor(mobileFcpElement, mobileFcp);
            mobileFcpResult.textContent = mobileFcp;
    
            var mobileLcpElement = document.getElementById('mobile-lcp');
            var mobileLcpResult = mobileLcpElement.getElementsByClassName('result')[0];
            setLcpColor(mobileLcpElement, mobileLcp);
            mobileLcpResult.textContent = mobileLcp;
    
            var mobileTbtElement = document.getElementById('mobile-tbt');
            var mobileTbtResult = mobileTbtElement.getElementsByClassName('result')[0];
            setTbtColor(mobileTbtElement, mobileTbt);
            mobileTbtResult.textContent = mobileTbt;

            var mobileClsElement = document.getElementById('mobile-cls');
            var mobileClsResult = mobileClsElement.getElementsByClassName('result')[0];
            setClsColor(mobileClsElement, mobileCls);
            mobileClsResult.textContent = mobileCls;

            var mobileSiElement = document.getElementById('mobile-si');
            var mobileSiResult = mobileSiElement.getElementsByClassName('result')[0];
            setSiColor(mobileSiElement, mobileSi);
            mobileSiResult.textContent = mobileSi;
        }  
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

function setFcpColor(e, fcp) {
    removeAllResultClass(e);
    var value = parseFloat(fcp);
    if (value <= 1.8) {
        e.classList.add("fast");
    } else if (value <= 3) {
        e.classList.add("moderate");
    } else {
        e.classList.add("slow");
    }
}

function setLcpColor(e, lcp) {
    removeAllResultClass(e);
    var value = parseFloat(lcp);
    if (value <= 2.5) {
        e.classList.add("fast");
    } else if (value <= 4) {
        e.classList.add("moderate");
    } else {
        e.classList.add("slow");
    }
}

function setTbtColor(e, tbt) {
    removeAllResultClass(e);
    var value = parseFloat(tbt);
    if (value <= 200) {
        e.classList.add("fast");
    } else if (value <= 600) {
        e.classList.add("moderate");
    } else {
        e.classList.add("slow");
    }
}

function setClsColor(e, cls) {
    removeAllResultClass(e);
    var value = parseFloat(cls);
    if (value <= 0.1) {
        e.classList.add("fast");
    } else if (value <= 0.25) {
        e.classList.add("moderate");
    } else {
        e.classList.add("slow");
    }
}

function setSiColor(e, si) {
    removeAllResultClass(e);
    var value = parseFloat(si);
    if (value <= 3.4) {
        e.classList.add("fast");
    } else if (value <= 5.8) {
        e.classList.add("moderate");
    } else {
        e.classList.add("slow");
    }
}

function removeAllResultClass(e) {
    e.classList.remove("fast", "moderate", "slow");
}

function getScoreCircleColor(score) {
    if (score <= 50) {
        return "#FF3333";
    } else if (score <= 90) {
        return "#FFAA33";
    } else {
        return "#00CC66";
    }
}

function getScoreColor(score) {
    if (score <= 50) {
        return "#CC0000";
    } else if (score <= 90) {
        return "#C33300";
    } else {
        return "#008800";
    }
}