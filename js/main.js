var dataSet = []
// load the data
var getData = new Promise(resolve => {
    $.getJSON("https://viand-api.herokuapp.com/api/today", function(data) {
        dataSet = data;
        console.log("dataset: ");
        console.log(dataSet)
        resolve();
    });
});