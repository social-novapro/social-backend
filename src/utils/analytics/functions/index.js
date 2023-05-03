// code from github.com/dkravec/social-analytics

function getParsedTime(d) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const year = d.getFullYear();
    const month = months[d.getMonth()];
    const days = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    return `${month} ${days}, ${year}: ${hours}:${minutes}`;
};

function getTime() {
    const d = new Date();
    const currentTime = d.getTime();
    return currentTime;
};

function getTimeOneWeek() {
    const d = new Date();
    const currentTime = d.getTime();
    
    const dateNowLayout = getDayLayout(currentTime)
    const oneWeekAgoLayout = dateNowLayout - 7
    return oneWeekAgoLayout
};

function getTimeDaysAgo(days) {
    const d = new Date();
    const currentTime = d.getTime();


    const oneDay = 86400000
    
    const amountDays = oneDay * days
    const amountDaysAgo = currentTime - amountDays
    return amountDaysAgo
};

function getDayLayout(date) {
    var d = new Date(Number(date))

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    return `${year}${month}${day}`
} 

// function getDayLayoutNew(date) {return getDayLayout(date)}
function getDayLayoutNew(date) {
    var d = new Date(Number(date))

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    var monthReturn
    if (month.toString().length==1) monthReturn = `0${month.toString()}`
    else monthReturn = month.toString()
    var dayReturn
    if (day.toString().length==1) dayReturn = `0${day.toString()}`
    else dayReturn = day.toString()

    return `${year.toString()}${monthReturn}${dayReturn}`
}

function getDateMonthDay(date) {
    var d = new Date(Number(date))

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const month = months[d.getMonth()];
    const day = d.getDate();

    return `${month} ${day}`;
}

function buildFunction1(data) {
    var points= []

    var pointsXs = [];
    var pointsYs = [];
    var pointsXsWithoutText = [];
    var functionPointsXandY =[];

    var totalX = 0
    var totalY = 0

    var highestx = 0;
    var lowestx = -1;
    var highesty = 0;
    var lowesty = -1;

    var users = 0;
    var currentPoint = 0;

    for (const stat of data) {
        users++;

        functionPointsXandY.push([users, stat.userConnections.length+1])
        pointsXs.push(`User ${users}: ${stat.userConnections.length+1}`)
        points.push({x:`User ${users}: ${stat.userConnections.length+1}`, y: stat.userConnections.length+1})

        pointsXsWithoutText.push(users)
        pointsYs.push(stat.userConnections.length+1)

        totalX++
        totalY += stat.userConnections.length

        highestx = users

        if (highesty < stat.userConnections.length+1) {
            highesty = stat.userConnections.length+1
        };
    }
  
    var functionData = {
        title: "Connections per user",
        points,
        pointsXs,
        pointsYs,
        xDomain: [lowestx, highestx],
        yDomain: [lowesty, highesty],
    }

    return functionData;
}

function buildFunction2(data) {
    var pointsXs = [];
    var pointsYs = [];
    var pointsXsWithoutText = [];
    var totalX = 0
    var totalY = 0
    var functionPointsXandY =[];

    var highestx = 0;
    var lowestx = -1;
    var highesty = 0;
    var lowesty = -1;

    const dates = []

    for (const stat of data) {
        if (highesty < stat.userConnections.length) {
            highesty = stat.userConnections.length
        };

        const oneWeekAgoLayout = getTimeOneWeek()

        
        for (const connection of stat.userConnections) {
            const day = getDayLayoutNew(connection.timestamp)

            if (day <  oneWeekAgoLayout) {
               // console.log(connection)
               // console.log('to old')
            }
            else {
                if (!dates[day]) dates[day] = {amount: 1, timeDate: getDateMonthDay(connection.timestamp)} 
                else dates[day].amount++
                totalY++
            }
        }
    }

    var datesAll = []

    for (var i=10; i>-1; i--) {
        const daysAgo = getTimeDaysAgo(i)
        const layoutDate = getDayLayoutNew(daysAgo)
        if (!dates[layoutDate]) datesAll[layoutDate] = {amount: 0, timeDate: getDateMonthDay(daysAgo)}
        else datesAll[layoutDate] = dates[layoutDate]
    }

    for (const date in datesAll) {
        totalX++
        pointsXs.push(`${datesAll[date].timeDate}: ${datesAll[date].amount}`)
        pointsXsWithoutText.push(totalX)
        pointsYs.push(datesAll[date].amount)
        functionPointsXandY.push([datesAll[date].timeDate, datesAll[date].amount])
    }
  
    var functionData = {
        title: "Connections per day",
        pointsXs,
        pointsXsWithoutText,
        pointsYs,
        xDomain: [lowestx, highestx],
        yDomain: [lowesty, highesty],
    }

    return functionData;
}

// connections per user per day | series of line graphs
function buildFunction3(data) {
    var totalX = 0
    var totalY = 0

    var highestx = 0;
    var lowestx = -1;
    var highesty = 0;
    var lowesty = -1;

    var allUserStats = []

    // x values day (march 25)
        // y value user connections | person 1 (20 connections)
        // y value  user connections | person 2 (5 connecitons)
        // y value user connection | person 3 (24 connections)

    // x value day (march 26)
        // y value user conecntion | person 1 (2 connections)
        // y value user connection | person 2 (4 connections)
        // y value user connection | person 3 (0 connections)
        
    for (const stat of data) {
        const oneWeekAgoLayout = getTimeOneWeek()
    
        var userConnectionsPerDay = {}
        var userDays = {}
        for (const connection of stat.userConnections) {
            const day = getDayLayout(connection.timestamp)
            
            userConnectionsPerDay[day] = userConnectionsPerDay[day] ? userConnectionsPerDay[day] + 1 : 1
            userDays[day] = connection.timestamp
        }

        for (const perDay in userConnectionsPerDay) {
            allUserStats.push({x: perDay, y: userConnectionsPerDay[perDay], time: userDays[perDay], user: stat._id})
        }
    }

    var checkedUsers = {}

    for (const userStat of allUserStats) {
        if (!checkedUsers[userStat.user]) {
            checkedUsers[userStat.user] = [userStat]
        }
        else {
            checkedUsers[userStat.user].push(userStat)
        }
    }

    var dataXs = []
    var dataXsLayout = []
    var dataYs = []
    var YsLone = []
    var pointsXsWithoutText = [];

    for (var i=10; i>-1; i--) {
        const daysAgo = getTimeDaysAgo(i)
        const dateParsed = getDateMonthDay(daysAgo)

        const layoutDate = getDayLayout(daysAgo)
        dataXsLayout.push(layoutDate)

        dataXs.push(dateParsed)
        pointsXsWithoutText.push(i)
    }

    var usersAmount = 0
    var dataSets = []

    for (const userStat in checkedUsers) {
        usersAmount++
        const stats = checkedUsers[userStat]

        var current = {
            fill: false,
            pointRadius: 1,
            borderColor: "rgba(255,0,0,0.5)",
            label: `User ${usersAmount}`,
            data: [ ],
        }
        var currentYs = []

        for (const day of dataXsLayout) {
            var found = false
            for (const stat of stats) {
                if (stat.x === day) {
                    totalY += stat.y
                    found = true
                    dataSets.push({user: usersAmount, days: stat.x, connections: stat.y})
                    current.data.push(stat.y)
                    currentYs.push(stat.y ?? 0)
                }
            }
            if (!found) {
                dataSets.push({user: usersAmount, days: day, connections: 0})
                current.data.push(0)
            }
        }
       
        dataYs.push(current)
        YsLone.push(currentYs)
    }

    var functionData = {
        title: "Connections per day per user",
        lineYs: YsLone,
        pointsXs: dataXs,
        pointsXsWithoutText,
        pointsYs: dataYs,
        xDomain: [lowestx, highestx],
        yDomain: [lowesty, highesty],
    }

    return functionData;
}

function buildFunction4(data) {
    var totalX = 0
    var totalY = 0

    var highestx = 0;
    var lowestx = -1;
    var highesty = 0;
    var lowesty = -1;


    // x values day (march 25)
    // y amount users that day | person 1 (20 connections)
        
    var amountX = {}
    // { day1 : 2, day2: 4, day3: 1}
    var timestamps = []

    for (const stat of data) {

        /*
            ealieest thing for each user
        */
        // console.log(stat.userConnections[0].timestamp)

        var userEarliest = getDayLayoutNew(stat.userConnections[0].timestamp)
        amountX[userEarliest] = amountX[userEarliest] ? amountX[userEarliest] + 1 : 1
        timestamps.push({userEarliest, timestamp: stat.userConnections[0].timestamp })
    }
    var points= [[]]

    var pointsXs = []
    var pointsYs = []
    var pointsYsLone = []
    var pointsXsWithoutText = [];

    var current = {
        fill: false,
        pointRadius: 1,
        borderColor: "rgba(255,0,0,0.5)",
        label: `First Connection of User`,
        data: [ ],
    }
    var currentYs = []

    for (var i=10; i>-1; i--) {
        const daysAgo = getTimeDaysAgo(i)
        const layoutDate = getDayLayoutNew(daysAgo)

        if (!amountX[layoutDate]){
            amountX[layoutDate]=0
            timestamps.push({userEarliest: layoutDate, timestamp: daysAgo})
        }
    }

    for (const day in amountX) {
        totalY+=amountX[day]
        currentYs.push(amountX[day])
        current.data.push(amountX[day])
        const timestamp = timestamps.find(timestamp => timestamp.userEarliest === day).timestamp
        const dateParsed = getDateMonthDay(timestamp)
        pointsXs.push(dateParsed)
        pointsXsWithoutText.push(amountX[day])
    }

    pointsYs.push(current)
    pointsYsLone.push(currentYs)

    var functionData = {
        title: "First Connection of User",
        pointsXs,
        pointsYs: pointsYsLone,
        pointsXsWithoutText,
        // pointsYs,
        xDomain: [lowestx, highestx],
        yDomain: [lowesty, highesty],
    }

    return functionData;
}

module.exports = {
    buildFunction1,
    buildFunction2,
    buildFunction3,
    buildFunction4,
}