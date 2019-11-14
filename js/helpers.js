/**************************************************************
 * Viand CS171 final project
 * HELPERS.js 
 * helper functions for main.js
 * include in HTML file before main.js
 *
 ***************************************************************/

// Date parser to convert strings to date objects: database Dates
var parseTime = d3.timeParse("%A, %B %d, %Y");

// format Time does the exact opposite: database Dates
var formatTime = d3.timeFormat('%A, %B %d, %Y');

// formatInputTime gives us the Date object in an HTML input time format
var formatInputTime = d3.timeFormat('%Y-%m-%d');

// parseInputTime gives us the HTML input time format as Date Object
var parseInputTime = d3.timeParse('%Y-%m-%d');


/**************************************************************
 * getSelectedDate gives us the date we want to display to the user
 * getMealTime gives us which meal we should display
 *   => if the day is not today, we display the first meal 
 *
 * To put in main.js => default times:
 *    var breakfastEndTime = new Date().setHours(10, 30, 0),
 *       lunchEndTime = new Date().setHours(14, 45, 0),
 *       dinnerEndTime = new Date().setHours(20, 30, 0),
 ***************************************************************/
function getSelectedDate(_id) {
    var date = parseInputTime(document.getElementById(_id).value);
    return (formatTime(date));
}

function getSelectedMeal(_id) {
    var meal = document.getElementById(_id).value;
    return meal;
}

// returns meal data for a selected meal time
function getMealData(_meal_time, _data) {
    var data = _data;
    var mealTime = _meal_time;

    return data.meals_times.filter(d => d.meal_time == mealTime)[0]
}

// display the meal options in a select box
function displayMealOptions(_id, _data) {
    mealTimes = _data.meals_times;
    var mealOptionsList = mealTimes.map(d => d.meal_time);

    // find and reset the select box
    var selectBox = document.getElementById(_id);
    selectBox.innerHTML = '';

    // iterate over the meal options for that day
    mealOptionsList.forEach(meal =>

        // we do this because: no breakfast on Sunday
        // and special schedules on holidays
        selectBox.innerHTML += '<option value=' + meal + ' >' + meal + '</option>');

}

function displayMealData(_data) {
    var data = _data;
    var categories = data.meal_data;

    // reset the content
    var content = document.getElementById('content');
    content.innerHTML = '';

    for (var i = 0; i < categories.length; i++) {
        var category = categories[i],
            categoryId = "category" + i;
        content.innerHTML += '<div class = "panel-group"><div class ="panel category" id = "' + categoryId + '"></div></div>'
        var categoryContent = document.getElementById(categoryId);

        categoryContent.innerHTML += "<h5 class='panel-heading category-title' data-toggle='collapse' aria-expanded='false' data-target='#food" + categoryId + "'>" +
            category.category + "</h5>";
        var foodList = category.foods;

        displayFoods(foodList, categoryContent, categoryId)
    }
}

function displayFoods(foodList, content, categoryId) {
    content.innerHTML += '<div class="panel-collapse collapse" id = "food' + categoryId + '"><ul class ="food-list list-group"></ul></div>';
    var categoryContent = content.querySelector('.food-list');

    for (var i = 0; i < foodList.length; i++) {
        var food = foodList[i]
        categoryContent.innerHTML += '<li class="list-group-item">' + food +
            '<div class="text-right">' +
            '<button class="btn btn-outline-success"  onclick = "addToTray(this)" value="' +
            food + '"> Add To Tray </button>' +
            '<button class="btn btn-outline-info"  onclick = "getFoodDetails(this)" value="' +
            food + '"> Info </button> </div>' +
            '</li>';
    }
}

function getFoodDetails(food) {
    var foodName = food.value;

    if (foodName.includes('&amp;')) {
        foodName = foodName.replace('&amp;', '&');
    }
    // load the data
    var getData = new Promise(resolve => {
        $.getJSON("https://viand-api.herokuapp.com/api/food/" + foodName, function(data) {
            resolve(data);
        });
    });

    getData.then(data => displayFoodStats(data, foodName, 'food_info'));
}

// display the selected food + all info
function displayFoodStats(foodInfo, foodName, display_id) {
    var container = document.getElementById(display_id);

    container.innerHTML = '<div class ="card">' +
        '<h5 class = "card-header">' + foodName + '</h5>' +
        '<div class="card-body">' + foodInfoDetails(foodInfo.food_info) +
        '</div>' + '</div>'
}

// Display the details about the specific food
function foodInfoDetails(foodInfo) {
    console.log(foodInfo);
    var result = "<p> No information to display. </p>"
    if (Object.keys(foodInfo).length != 0) {
        result = "<p> Allergens: " + foodInfo.allergens + '</p>' +
            "<p> Serving Size: " + foodInfo.serving_size + '</p>' +
            "<p> Calories: " + foodInfo.calories + '</p>' +
            "<p> Calories from Fat: " + foodInfo.calories_from_fat + '</p>' +
            "<p> Protein: " + foodInfo.protein + '</p>' +
            "<p> Total Fat: " + foodInfo.total_fat + '</p>'
    }
    return result;
}

var tray = {};

function addToTray(food) {
    var foodName = food.value;

    if (foodName.includes('&amp;')) {
        foodName = foodName.replace('&amp;', '&');
    }
    if (tray[foodName] != null) {
        tray[foodName] += 1
    } else {
        tray[foodName] = 1;

        var container = document.getElementById('tray');
        var ul = container.querySelector('.food-list');

        ul.innerHTML += '<li id="' + 'tray-' + foodName +
        '" class="list-group-item"></li>'
    }

    var foodContainer = document.getElementById('tray-'+foodName)
    foodContainer.innerHTML = foodName +
        '<div class="text-right"> Quantity: ' + tray[foodName] +
        '</div>';
}

// TODO!!
// decide the default meal time to display to the user
function decideMealTime(currentTime, _data) {
    var breakfastEndTime = new Date().setHours(10, 30, 0),
        lunchEndTime = new Date().setHours(14, 45, 0),
        dinnerEndTime = new Date().setHours(20, 30, 0),
        currentTimeString = formatTime(currentTime),
        data = _data;

    // if dinner has passed
    if (currentTime > dinnerEndTime) {
        var tomorrow = new Date();
        tomorrow.setDate(currentTime.getDate() + 1);
        var meal = data.filter(d => formatTime(d.date) == formatTime(tomorrow))[0].meals_times[0]

        // get the first meal of tomorrow
        return [meal, tomorrow];
    } else {
        // get all meals for today
        var meals = data.filter(d => formatTime(d.date) == currentTimeString)[0].meals_times;
        var meal;

        if (currentTime >= lunchEndTime) {
            meal = meals[meals.length - 1];

            // this way we take into account sunday brunch
        } else if (currentTime < lunchEndTime && currentTime > breakfastEndTime) {
            meal = meals[meals.length - 2];
        } else {
            meal = meals[0];
        }
        return [meal, currentTime];
    }
}