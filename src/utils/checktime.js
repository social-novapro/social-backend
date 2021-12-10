function checktime() {
    var d = new Date();
    const timeMS = d.getTime();

    return timeMS;
}

module.exports = { checktime }