
const SECONDS_IN_DAY = 86400;

const CALL_ID = {
    "GET_STORY_TODAY" : 1,
    "GET_STORY_IN_RANGE" : 2,
    "GET_DEFAULT_FG" : 3,
    "GET_DEFAULT_BG" : 4,
    "GET_STORY_DATE" : 5,
    "REMOVE_WORD_TODAY": 6,
    "REMOVE_WORD": 7,
    "ADD_NORMAL_WORD" : 8,
    "ADD_FANCY_WORD" : 9,
    "REPLACE_WORD" : 10,
    "UPDATE_STORY" : "update"
};

const IconService = window['icon-sdk-js'];

const provider = new IconService.HttpProvider(MAINNET_URL);
const iconService = new IconService(provider);
const IconConverter = IconService.IconConverter;
const IconBuilder = IconService.IconBuilder;



let epoch = Math.round(new Date().getTime() / 1000);
epoch = epoch - epoch % SECONDS_IN_DAY;
let latestEpoch = epoch + 2 * SECONDS_IN_DAY;

let stories;
let isStoryInitialized = false;

let numOfTilesToLoad = 0;

const DECIMAL = 10 ** 18;

Math.clip = function(number, min, max) {
    return Math.max(min, Math.min(number, max));
};

makePostCall = function (data) { // here the data and url are not hardcoded anymore
    console.log("[OWN] Sending JSON call...");
    console.log(data);

    let json_data = JSON.stringify(data);

    return $.ajax({
        type: "POST",
        url: MAINNET_URL,
        data: json_data,
        crossDomain: true,
        dataType: "json",
        contentType: "application/json;charset=utf-8"
    }).done(function(data) {
        console.log("[OWN] Got response: ");
        onJSONsuccess(data);
    }).fail(function(sender, message, details) {
        console.log("makePostCall Error!");
        console.log(message);
        console.log(details);
    });
};

onJSONsuccess = function (data) {
    if(data.result) {
        switch(data.id) {
            case CALL_ID.GET_STORY_TODAY:
                initTodayStory(data);
                break;
            case CALL_ID.GET_STORY_IN_RANGE:
                initStoryInRange(data);
                break;
            case CALL_ID.GET_STORY_DATE:
                break;
            case CALL_ID.GET_DEFAULT_BG:
                break;
            case CALL_ID.GET_DEFAULT_FG:
                break;
            case CALL_ID.ADD_NORMAL_WORD:
                keepTrying(verifyTX, data.result, onNormalWordAdded);
                break;
            default:
                if ((data.id + "").includes(CALL_ID.UPDATE_STORY)) {
                    let arr = data.id.split("_")
                    let index = parseInt(arr[1]);
                    let isInsert = parseInt(arr[2]);
                    updateStoryGraphics(data, index, isInsert);
                }
                break;
        }
    }
};

getStoryToday = function () {
    const callBuilder = new IconBuilder.CallBuilder;
    const call = callBuilder
        .to(scoreAddress)
        .method('getCurrentStory')
        .build();
    const scoreData = {
        "jsonrpc": "2.0",
        "method": "icx_call",
        "params": call,
        "id": CALL_ID.GET_STORY_TODAY
    };
    makePostCall(scoreData);
};

getStoryRange = function (dateFrom, dateTo) {
    const callBuilder = new IconBuilder.CallBuilder;
    const call = callBuilder
        .to(scoreAddress)
        .method('getStoryInRange')
        .params({"fromTimestamp" : IconConverter.toBigNumber(dateFrom), "toTimestamp" : IconConverter.toBigNumber(dateTo)})
        .build();
    const scoreData = {
        "jsonrpc": "2.0",
        "method": "icx_call",
        "params": call,
        "id": CALL_ID.GET_STORY_IN_RANGE
    };
    makePostCall(scoreData);
};

function initTodayStory(data) {
    let story = data.result.story;
    let storyOwner = data.result.storyOwner;
    let storyValue = data.result.storyValue;
    let styleFG = data.result.styleFG;
    let styleBG = data.result.styleBG;

    let length = Object.keys(story).length;

    console.log(data.result);
}

function initStoryInRange(data) {
    console.log(data.result);
    stories = data.result;
    setUpBigStory();
    setUpStoryInRange();
}

function prepareCalendarTile(d, epochInSeconds) {

    let extraClass = "";

    if (epochInSeconds < epoch) {
        extraClass = "old";
    } else if (epochInSeconds > epoch) {
        extraClass = "new";
    } else {
        extraClass = "current";
    }

    let date = ("0" + d.getUTCDate()).slice(-2);

    let words = "";

    let length = Object.keys(stories[epochInSeconds]["story"]).length;

    for (let i = 0; i < length ; i++) {
        let fg = stories[epochInSeconds]["styleFG"][i] + "";
        let bg = stories[epochInSeconds]["styleBG"][i] + "";
        let value = IconService.IconAmount.of(stories[epochInSeconds]["storyValue"][i], IconService.IconAmount.Unit.ICX) / DECIMAL;

        let fontSize = 0;

        if (value === 0) {
            fontSize = 1;
        } else {
            fontSize = Math.min(1 + value / 5, 3);
        }

        let word = stories[epochInSeconds]["story"][i];
        word = unescape(word);

        let arr = calculateStyle(word);



        words += "<div class='miniWord' " +
            "style='background-color: " + COLORS[arr[0]] + " ; " + "color: " + COLORS[arr[1]] + "; font-size:" + fontSize +"vw;' " +
            "data-owner='" + stories[epochInSeconds]["storyOwner"][i] + "' " +
            "data-value='" + value + "' " +
            "data-word='" + IconConverter.fromUtf8(stories[epochInSeconds]["story"][i]) + "' " +
            "data-fg='" + stories[epochInSeconds]["styleFG"][i] + "' " +
            "data-bg='" + stories[epochInSeconds]["styleBG"][i] + "' " +

            " >" + escapeHtml(word) + "</div>";
    }

    if (words === "") {
        let msg = "";
        if (extraClass === "new") {
            msg = "Future is in your hands.".split(" ");
        } else {
            msg = "No one wrote a story on this day.".split(" ");
        }
        let wrappedMsg = "";
        msg.forEach(function(item, i) {
            let styleArr = calculateStyle(item);
            let randSize = randomSize(item);
            wrappedMsg += "<div class='empty' style='background-color: " + COLORS[styleArr[0]] + " ; " +
                "color: " + COLORS[styleArr[1]] + " ; " +
                "font-size: " + randSize + "vw" + ";'>" + item + "</div>"
        });
        words += "<div class='miniNoStory'>" + wrappedMsg + "</div>";
    } else {
        words = "<div class='miniStory'>" + words + "</div>";
    }

    let tempDate = new Date(epochInSeconds * 1000);
    let s = tempDate.getUTCFullYear() + "" + ("0" + (tempDate.getUTCMonth() + 1) ).slice(-2) + ("0" + tempDate.getUTCDate()).slice(-2);

    let onclickAction = " onclick='window.location.href=\"/en/" + s + "\"' ";

    return "<div class='tile tileZoom " + extraClass +"' data-epoch='" + epochInSeconds +"' " + onclickAction + ">" +
        "<div class='tileContent'>" +
        "<div class='tileContentCircle'>" + words + "</div>" +
        "<div class='miniDate'>" + date + "</div>" +
        "</div>" +
        "</div>"
}
function prepareMonthTile(d, dateEpoch) {
    return "<div class='tile' data-epoch='" + dateEpoch + "'>" +
        "<div class='tileContent'>" +
        "<div class='miniMonth'>" + shortMonth[d.getUTCMonth()] + "</div>" +
        "</div>" +
        "</div>"
}

function setUpBigStory() {
    if (!isStoryInitialized) {
        let ic = innerContent;
        ic.empty();
        ic.append($(prepareWord()));
        isStoryInitialized = true;

        anime({
            targets: "#currentstory",
            scale: [0.9, 1],
            translateX: ["-30%", "-50%"],
            translateY: ["-20%",  "-30%"],
            opacity: [0, 1],
            duration: 2000,
            complete: function() {
            }
        });
    }
}

let currentStory = $("#currentstory");
let innerContent = $(".innerContent");



function prepareWord() {
    let length = Object.keys(stories[epoch]["story"]).length;

    let words = "";

    for (let i = 0; i < length ; i++) {
        let fg = stories[epoch]["styleFG"][i] + "";
        let bg = stories[epoch]["styleBG"][i] + "";
        let value = IconService.IconAmount.of(stories[epoch]["storyValue"][i], IconService.IconAmount.Unit.ICX) / DECIMAL;

        let fontSize = 0;

        if (value === 0) {
            fontSize = 3;
        } else {
            fontSize = Math.min(1 + value / 5, 3) * 3;
        }

        let word = stories[epoch]["story"][i];

        word = unescape(word);

        let arr = calculateStyle(word);

        words += "<div class='word' " +
            "style='background-color: " + COLORS[arr[0]] + " ; " + "color: " + COLORS[arr[1]] + "; font-size:" + fontSize +"vw;' " +
            "data-owner='" + stories[epoch]["storyOwner"][i] + "' " +
            "data-value='" + value + "' " +
            "data-word='" + IconConverter.fromUtf8(stories[epoch]["story"][i]) + "' " +
            "data-fg='" + stories[epoch]["styleFG"][i] + "' " +
            "data-bg='" + stories[epoch]["styleBG"][i] + "' " +

            " >" + escapeHtml(word) + "</div>";
    }
    return words;
}

let lpanel = $("#lpanel");

function onScreenResize(forceUpdate) {
    console.log("test");
    if (lpanel.width() > 0) {
        let tile = $(".tile");

        tile.css("opacity", 0);
        let tileWidth = tile.width();
        let y = Math.floor(lpanel.height() / tileWidth);

        if (numOfTilesToLoad !== y * 4 || forceUpdate) {
            numOfTilesToLoad = y * 4;
            anime({
                targets: ".lds-ellipsis",
                opacity : 1,
                duration: 300,
                easing: "easeOutQuad"
            });
            getStoryRange(latestEpoch - numOfTilesToLoad * SECONDS_IN_DAY, latestEpoch);
        } else {

            let t = $(".tile");
            let tileWidth = t.width();

            let margin = Math.floor((lpanel.height() % tileWidth) / (y * 2));
            t.css({
                "margin-top" : margin,
                "margin-bottom" : margin,
                "opacity" : 1
            });
        }
    } else {
        $(".lds-ellipsis").css("opacity", 0);

        if (!isStoryInitialized)
            getStoryRange(epoch - 3 * SECONDS_IN_DAY, epoch);
    }
}

function setUpStoryInRange() {
    if (lpanel.width() > 0) {
        let tileWidth = $(".tile").width();

        let y = Math.floor(lpanel.height() / tileWidth);
        let s = "";
        let epochInSeconds = latestEpoch;
        for (let i = 0; i < y * 4; i++) {


            let d = new Date(epochInSeconds * 1000);
            s = prepareCalendarTile(d, epochInSeconds) + s;
            if (d.getUTCDate() === 1 && i < y * 4 - 1) {
                s = prepareMonthTile(d, epochInSeconds) + s;
                i++;
            }
            epochInSeconds -= SECONDS_IN_DAY;
        }
        lpanel.empty();
        lpanel.append($(s));

        let margin = Math.floor((lpanel.height() % tileWidth) / (y * 2));
        $(".tile").css({
            "margin-top" : margin,
            "margin-bottom" : margin
        });
        $(".tileZoom").hover(function(){
            let t = $(this);
            if (t.css("opacity") >= 1 && !t.hasClass("current")) {
                anime.remove(this);
                anime({
                    targets: this,
                    scale: 1.1,
                    backgroundColor: "#EEE",
                    duration: 800,
                    begin: function (anim) {
                        t.css("z-index", 5);
                    }
                });
            }
        }, function(){
            let t = $(this);
            if (t.css("opacity") >= 1 && !t.hasClass("current")) {
                anime.remove(this);
                anime({
                    targets: this,
                    scale: 1,
                    backgroundColor: "#FFF",
                    duration : 800,
                    begin: function(anim) {
                        t.css("z-index", 1);
                    }
                });
            }
        });

        anime({
            targets: ".tile",
            opacity: 1,
            scale: [1.1, 1],
            delay: anime.stagger(150, {start: 0}),
            duration: 500,
            easing: "easeOutQuad"
        });

        anime({
            targets: ".lds-ellipsis",
            opacity : [1, 0],
            duration: 500,
            easing: "easeOutQuad"
        });
    }
}
// d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);

let month = new Array(12);
month[0] = "January";
month[1] = "February";
month[2] = "March";
month[3] = "April";
month[4] = "May";
month[5] = "June";
month[6] = "July";
month[7] = "August";
month[8] = "September";
month[9] = "October";
month[10] = "November";
month[11] = "December";

let shortMonth = new Array(12);
shortMonth[0] = "JAN";
shortMonth[1] = "FEB";
shortMonth[2] = "MAR";
shortMonth[3] = "APR";
shortMonth[4] = "MAY";
shortMonth[5] = "JUN";
shortMonth[6] = "JUL";
shortMonth[7] = "AUG";
shortMonth[8] = "SEP";
shortMonth[9] = "OCT";
shortMonth[10] = "NOV";
shortMonth[11] = "DEC";


function constructDate() {
    let d = new Date();

    let s = "";
    s += d.getUTCFullYear();
    s += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    s += month[d.getUTCMonth()] + " ";
    s += ('0'+d.getUTCDate()).slice(-2) + " ";
    s += ('0'+d.getUTCHours()).slice(-2) + ":";
    s += ('0'+d.getUTCMinutes()).slice(-2) + ":";
    s += ('0'+d.getUTCSeconds()).slice(-2) + " UTC";
    $("#fulldate").html(s);
}

function constructBigDate() {
    let d = new Date();
    let s = "";
    s += ("" + d.getUTCFullYear()).slice(-2);
    s += ("0" + (parseInt(d.getUTCMonth()) + 1) ).slice(-2);
    s += ("0" + d.getUTCDate()).slice(-2);
    return s;
}

let t = setInterval(constructDate,1000);


$( window ).resize(function() {
    onScreenResize(false);
});



$( window ).on("load", function() {

    anime({
        targets: ["#fulldate"],
        opacity: 1,
        delay: 1000,
        duration: 1000,
    });

    let temp = {
        bigdate : 0
    }

    let bigdateObj = $("#bigdate");

    anime({
        targets: temp,
        bigdate: [0, parseInt(constructBigDate())],
        easing: 'easeOutExpo',
        round: 1,
        update: function() {
            let tempDate = ("000000" + temp.bigdate).slice(-6);
            let formatted = tempDate.slice(0,2) + "." + tempDate.slice(2,4) + "." + tempDate.slice(4,6);
            bigdateObj.text(formatted);
        },
        delay: 1000,
        duration: 2000
    });

    onScreenResize(false);
    $(".uparrow").click(function() {
        latestEpoch = $(".tile").attr("data-epoch");
        onScreenResize(true);
    });
    $(".downarrow").click(function() {
        latestEpoch = parseInt($(".tile:last").attr("data-epoch")) + (numOfTilesToLoad - 1) * SECONDS_IN_DAY;
        onScreenResize(true);
    });
});

