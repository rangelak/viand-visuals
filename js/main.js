/*
For main.js to work we need helpers.js d3 and jquery
*/
const today = new Date();

// store the daily data in a variable
var dailyData = []

// set default date to today
var mealDate = document.getElementById('meal_date');
mealDate.value = formatInputTime(today);
mealDate.max = formatInputTime(new Date().setDate(today.getDate() + 6));

// update the meal selection every time the select box is changed.
function updateDay() {
    var selectedDate = getSelectedDate('meal_date');

    // load the data
    var getData = new Promise(resolve => {
        $.getJSON("https://viand-api.herokuapp.com/api/" + selectedDate, function(data) {
            resolve(data);
        });
    });

    // what to do after we get the data
    getData.then(data => {
        // display the possible meal options: usually BLD
        displayMealOptions('select_meal', data);

        // set the daily data equal to data we get
        dailyData = data;
        console.log(dailyData)
        updateMeal();
    });
}

// update the view based on the selected meal
function updateMeal() {
    // find the selected meal
    var selectedMeal = getSelectedMeal('select_meal');

    // get the meal data for the selected meal
    var mealData = getMealData(selectedMeal, dailyData);
    displayMealData(mealData);
}

updateDay();