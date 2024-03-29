

    const NID = 1;

    const SECONDS_IN_DAY = 86400;

    const CALL_ID = {
        "GET_STORY_TODAY": 1,
        "GET_STORY_IN_RANGE": 2,
        "GET_DEFAULT_FG": 3,
        "GET_DEFAULT_BG": 4,
        "GET_STORY_DATE": 5,
        "REMOVE_WORD_TODAY": 6,
        "REMOVE_WORD": 7,
        "ADD_NORMAL_WORD": 8,
        "ADD_FANCY_WORD": 9,
        "REPLACE_WORD": 10,
        "UPDATE_STORY": "update",
        "GET_MIN_AMOUNT": 11
    };

    let shouldLoadToday = false;

    let epoch;
    let epochNow;

    let shouldEnterSignVisible = false;

    let realDATE = "";

    // Test date if it makes sense.

    if (DATE === "") {
        shouldLoadToday = true;
        let de = new Date();

        realDATE = de.getUTCFullYear() + ("0" + (de.getUTCMonth() + 1)).slice(-2) + ("0" + de.getUTCDate()).slice(-2);
    } else {
        let m = /^\d{8}$/gm.exec(DATE);
        if (m !== null) {
            let datetimeS = DATE.slice(0, 4) + "-" + DATE.slice(4, 6) + "-" + DATE.slice(6, 8);
            epoch = new Date(datetimeS).getTime();
            if (isNaN(epoch)) {

                shouldLoadToday = true;
                window.location.replace("/en");
            } else {
                epoch = epoch / 1000;
                epochNow = (new Date().getTime() / 1000);
                epochNow = epochNow - epochNow % SECONDS_IN_DAY;
                realDATE = DATE;
                if (epoch === epochNow) {
                    shouldLoadToday = true;
                }
            }
        } else {
            window.location.replace("/en");
        }
    }

    if (realDATE !== "") {
        $("#home").text(realDATE);
    }

    let isICONEX = false;

    const IconService = window['icon-sdk-js'];

    const provider = new IconService.HttpProvider(MAINNET_URL);
    const iconService = new IconService(provider);
    const IconConverter = IconService.IconConverter;
    const IconBuilder = IconService.IconBuilder;


    let fromAddress = "";
    let returnFromAddress = localStorage.getItem("fromAddress");

    let recentlyEditedIndex = 0;

    let storyInitComplete = false;

    let EditingUsers = new Array(16).fill(0);

    const DECIMAL = 10 ** 18;

    let minAmount = 0;

    let elementWaiting;

    let queuedFunction = null;
    let queuedArg = null;


    jQuery.fn.insertAt = function (index, element) {
        let lastIndex = this.children().length;
        if (index < 0) {
            index = Math.max(0, lastIndex + 1 + index);
        }
        this.append(element);
        if (index < lastIndex) {
            this.children().eq(index).before(this.children().last());
        }
        return this;
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
            contentType: "application/json"
        }).done(function (data) {
            console.log("[OWN] Got response: ");
            onJSONsuccess(data);
        }).fail(function (sender, message, details) {
            errorSound.play("ding");
            console.log("makePostCall Error!");
            console.log(message);
            console.log(details);
        });
    };

    let pop = new Howl({
        src: ['/sounds/pop.mp3'],
        sprite: {
            ding: [0, 1000]
        },
        autoplay: false
    });

    let selectSound = new Howl({
        src: ['/sounds/select.mp3'],
        sprite: {
            ding: [0, 1000]
        },
        autoplay: false
    });

    let errorSound = new Howl({
        src: ['/sounds/error.mp3'],
        sprite: {
            ding: [0, 1500]
        },
        autoplay: false
    });

    let successSound = new Howl({
        src: ['/sounds/success.mp3'],
        sprite: {
            ding: [0, 1000]
        },
        autoplay: false
    });

    let missSound = new Howl({
        src: ['/sounds/miss.mp3'],
        sprite: {
            ding: [0, 1000]
        },
        autoplay: false
    });

    let typeSound = new Howl({
        src: ['/sounds/typewriter.mp3'],
        sprite: {
            ding: [0, 1000]
        },
        autoplay: false
    });

    function notifySound() {
        pop.play("ding");
    }

    function setIntervalX(callback, delay, repetitions) {
        var x = 0;
        var intervalID = window.setInterval(function () {

            callback();

            if (++x === repetitions) {
                window.clearInterval(intervalID);
            }
        }, delay);
    }



    let numOfPeople = 0;

    let container = $("#container");


    function generateFaceDivString(dataID) {
        return '<div class="person person-connected" data-id="' + dataID + '" >' +
            '<img class="typing-icon" src="/images/typingicon.png"  alt="typing">' +
            '<img class="person-img" src="/images/smilyface_sm.png"  alt="person">' +
            '</div>'

    }


    initPersonCSS = function (target) {
        let randX = Math.random() * 38 - 19;
        let scaleX = 1;
        if (randX > 0) {
            randX = randX + 70;

        } else {
            randX = randX + 20;
            scaleX = -1;
        }
        let randY = Math.random() * 55 + 5;
        let zIndex = Math.round(100 - randY);

        $(target).css({
            "position": "absolute",
            "right": randX + "vw",
            "bottom": randY + "vh",
            "transform": "scaleX(" + scaleX + ")",
            "z-index": zIndex
        });
    };

    //
    // SOCKETS
    //

    let backgroundDiv = $(".background");

    if (shouldLoadToday) {
        backgroundDiv.css("background-color", "peachpuff");


        $(".add").css("display", "block");

        let socket = io("/" + region);

        // data contains list of socket.id of people who are connected.
        socket.on('init', function (data, editingUsers) {
            console.log(data);
            console.log("Total number of people on server: " + data.length);
            numOfPeople = data.length;

            EditingUsers = editingUsers;

            let string = "";
            for (let i = 0; i < numOfPeople; i++) {
                string += generateFaceDivString(data[i])
            }
            $("#people").append(string);

            $(".person").each(function () {
                initPersonCSS(this);
            });

            anime({
                targets: ".person-connected",
                opacity: 1,
                translateY: [100, 0],
                delay: anime.stagger(150, {start: 1000}),
                duration: 1000,
                changeBegin: function (anim) {
                    setIntervalX(notifySound, 100, numOfPeople);
                },
            });

        });

        socket.on('enter', function (data) {
            console.log("User " + data + " entered!");
            numOfPeople++;
            console.log("Total number of people on server: " + numOfPeople);

            let newlyAdded = $(generateFaceDivString(data)).appendTo("#people");

            initPersonCSS(newlyAdded[0]);

            anime({
                targets: newlyAdded[0],
                opacity: 1,
                translateY: [100, 0],
                duration: 1000,

            });
            notifySound();
        });

        socket.on('exit', function (data, index) {
            console.log("User " + data + " left... ", index);
            numOfPeople--;
            console.log("Total number of people on server: " + numOfPeople);

            let personToRemove = $(".person-connected[data-id=\"" + data + "\"]");
            personToRemove.removeClass("person-connected");
            anime({
                targets: personToRemove[0],
                opacity: 0,
                translateY: [0, 100],
                duration: 500,
                easing: "easeOutCubic",
                complete: function (anim) {
                    personToRemove.remove();
                }
            });

            if (storyInitComplete && index > -1) {
                let indexObj = $(".word");
                let childObj = indexObj.eq(index);
                if (childObj.length > 0) {
                    childObj.removeClass("editing");
                }
            }

        });

        startWriting = function (index) {
            socket.emit("startWriting", index);
            anime({
                targets: ".person-connected[data-id=\"" + socket.id + "\"] .typing-icon",
                opacity: 1,
                translateX: ["-50%", "-50%"],
                translateY: ["20%", 0],
                duration: 300,
                easing: "easeOutQuad"
            });
        };

        socket.on("startWriting", function (id, index) {
            console.log(id + " started writing on " + index);
            anime({
                targets: ".person-connected[data-id=\"" + id + "\"] .typing-icon",
                opacity: 1,
                translateX: ["-50%", "-50%"],
                translateY: ["20%", 0],
                duration: 300,
                easing: "easeOutQuad"
            });

            if (index > -1 && index < 16) {
                if (storyInitComplete) {
                    let indexObj = $(".word");
                    let childObj = indexObj.eq(index);
                    if (childObj.length > 0) {
                        childObj.addClass("editing");
                    }
                } else {
                    EditingUsers[index] = id;
                }
            }
        });

        cancelWriting = function (index) {
            socket.emit("cancelWriting", index);
            anime({
                targets: ".person-connected[data-id=\"" + socket.id + "\"] .typing-icon",
                opacity: 0,
                translateX: ["-50%", "-50%"],
                translateY: [0, "-40%"],
                duration: 300,
                easing: "easeOutQuad"
            });
        };

        socket.on("cancelWriting", function (id, index) {
            console.log(id + "canceled writing on " + index);
            anime({
                targets: ".person-connected[data-id=\"" + id + "\"] .typing-icon",
                opacity: 0,
                translateX: ["-50%", "-50%"],
                translateY: [0, "-40%"],
                duration: 300,
                easing: "easeOutQuad"
            });
            if (index > -1 && index < 16) {
                if (storyInitComplete) {
                    let indexObj = $(".word");
                    let childObj = indexObj.eq(index);
                    if (childObj.length > 0) {
                        childObj.removeClass("editing");
                    }
                } else {
                    EditingUsers[index] = 0;
                }
            }
        });

        finishWriting = function (index, isInsert) {
            socket.emit("finishWriting", index, isInsert);
            anime({
                targets: ".person-connected[data-id=\"" + socket.id + "\"] .typing-icon",
                opacity: 0,
                translateX: ["-50%", "-50%"],
                translateY: [0, "-40%"],
                duration: 300,
                easing: "easeOutCubic"
            });
            updateStory(index, isInsert);
        };


        socket.on("finishWriting", function (id, index, isInsert) {
            anime({
                targets: ".person-connected[data-id=\"" + id + "\"] .typing-icon",
                opacity: 0,
                translateX: ["-50%", "-50%"],
                translateY: [0, "-40%"],
                duration: 300,
                easing: "easeOutCubic"
            });
            updateStory(index, isInsert);
            if (storyInitComplete) {
                let indexObj = $(".word");
                let childObj = indexObj.eq(index);
                if (childObj.length > 0) {
                    childObj.removeClass("editing");
                }
            }
        });
    }

    backgroundDiv.attr("data-bgColor", backgroundDiv.css("background-color"));

    function updateStoryGraphics (data, index, isInsert) {
        console.log(data);
        let s = constructWordString(data.result.wordFG, data.result.wordBG, data.result.word, data.result.wordOwner, data.result.wordValue);
        console.log(s);
        let indexObj = $(".word");
        let wordsLength = indexObj.length;

        if (index < 0)
            index = 0;

        if (isInsert === 1) {
            // Inserted
            if (wordsLength === 0) {
                // its first word of the day
                let inner = $("#inner");
                inner.prepend($(s));
                index = 0;
            } else if (indexObj.eq(index).length > 0) {
                // $(.word)[index] exists
                indexObj.eq(index).before($(s));
            } else {
                // $(.word)[index] does not exist
                indexObj.eq(wordsLength - 1).after($(s));
                index = wordsLength;
            }
        } else {
            if (indexObj.eq(index).length > 0) {
                indexObj.eq(index).replaceWith($(s));
            } else {
                indexObj.eq(wordsLength - 1).after($(s));
                index = wordsLength;
            }
        }

        indexObj = $(".word");

        indexObj.eq(index).css({
            "z-index": index + 1,
            "position": "initial"
        });

        anime({
            targets: indexObj.eq(index)[0],
            opacity: [0, 1],
            duration: 1000
        });

        indexObj.eq(index).off("blur");
        indexObj.eq(index).off("click");

        indexObj.eq(index).on("click", function(){
            onWordFocus(this);
        }).on("blur", function(){
            onWordBlur(this);
        });

        tippy('[data-tippy-content]');
    }

    window.addEventListener("ICONEX_RELAY_RESPONSE", eventHandler, true);

    function eventHandler(event) {
        const type = event.detail.type
        const payload = event.detail.payload
        switch (type) {
            case "RESPONSE_HAS_ACCOUNT":
                if (payload) {
                    isICONEX = payload.hasAccount;
                    console.log("[ICONEX] User has ICONEX installed.");
                    returnUserCheck();
                } else {
                    Swal.fire({
                        type: "info",
                        title: "No account in ICONex",
                        text: "You must create an account in your ICONex wallet to use this service.",
                    });
                }
                break;
            case "RESPONSE_ADDRESS":
                fromAddress = payload;
                localStorage.setItem('fromAddress', fromAddress);
                console.log("[ICONEX] User selected " + fromAddress);
                Swal.close();
                if (queuedFunction !== null) {
                    queuedFunction(queuedArg);
                }
                break;
            case "RESPONSE_JSON-RPC":
                console.log("[ICONEX] Got JSON Response: ");
                onJSONsuccess(payload);
                break;
            case "RESPONSE_HAS_ADDRESS":
                if (payload) {
                    fromAddress = returnFromAddress;
                    console.log("[ICONEX] User returned. Setting address to " + fromAddress);
                }
                break;
            default:
                break;
        }
    }

    let enterSign = $("#enter");

    function placeEnterSign(xx) {
        shouldEnterSignVisible = true;
        let delay = 0;
        if (xx.css("margin-right") === "0px") {
            delay = 300;
            clearInterval(intervalEnterSign);
            intervalEnterSign = setInterval(toggleEnterSignOpacity, 500);
        } else {

        }

        xx.css("margin-right", "10vmin");

        setTimeout(function() {
            if (!shouldEnterSignVisible)
                return;

            let wordBox = xx[0].getBoundingClientRect();

            let leftString = wordBox.right + "px";

            enterSign.css({
                "display": "block",
                "left": leftString,
                "top": wordBox.top + (wordBox.bottom - wordBox.top) / 2 - enterSign.height() / 2 + "px"
            });
        }, delay);
    }

    function hideEnterSign(xx) {
        enterSign.css("display", "none");
        xx.css("margin-right", "0px");
        shouldEnterSignVisible = false;
    }

    function toggleEnterSignOpacity() {
        if (enterSign.css("opacity") === 0 || enterSign.css("opacity") === "0")
            enterSign.css("opacity", 1);
        else {
            enterSign.css("opacity", 0);
        }
    }

    let intervalEnterSign = setInterval(toggleEnterSignOpacity, 500);

    function fullErrorNotice() {
        anime({
            targets: ".background",
            backgroundColor: ["#ff4444", backgroundDiv.attr("data-bgColor")],
            easing: "easeOutCubic",
            duration: 400
        });
        errorSound.play("ding");
    }

    function onWordFocus(x) {
        queuedFunction = onWordFocus;
        queuedArg = x;

        if (!checkForICONex())
            return;

        queuedFunction = null;
        queuedArg = null;

        let xx = $(x);

        if (xx.hasClass("editing")) {

        } else {
            if (xx.hasClass("meEditing")) {
                xx.removeAttr('onblur')  // Removes 'onclick' property if found
                    .off('blur');          // Removes other events if found
                xx.on("blur", function () {
                    onWordBlur(x);
                });

            } else {
                x.contentEditable = true;
                x.focus();
                selectSound.play("ding");

                xx.attr("data-newword", xx.attr("data-word"));
                xx.css("text-decoration", "underline");
                xx.css("position", "initial");
                xx.off("input");
                xx.on('input', function (e) {
                    placeEnterSign(xx);
                    let shouldPlayTypeSound = true;
                    if (xx.text() !== "") {
                        // xx.text(xx.text().replace(/\s/g, ""));
                        if (xx.text().length > 16) {
                            xx.text(xx.text().slice(0, 16));
                            fullErrorNotice();
                            shouldPlayTypeSound = false;
                            placeCaretAtEnd(x);
                        }
                        let arr = calculateStyle(xx.text());
                        xx.css({
                            "background-color": COLORS[arr[0]],
                            "color": COLORS[arr[1]]
                        });
                        if (xx.text() !== xx.attr("data-word")) {
                            xx.attr("data-newword", xx.text());
                        }
                        //
                    }
                    if (shouldPlayTypeSound) {
                        console.log("typeSound");
                        typeSound.rate(Math.random() * 0.5 + 1, typeSound.play("ding"));
                    }


                });
                xx.off("keydown");
                xx.on('keydown', function (e) {
                    if (e.which === 13) {

                        if (xx.text() !== "") {
                            xx.off("blur");
                            elementWaiting = xx;
                            triggerReplaceWord(xx, xx.attr("data-newword"));
                            //Prevent insertion of a return
                            //You could do other things here, for example
                            //focus on the next field
                        }
                        return false;
                    } else if (e.which === 32) {
                        return false;
                    } else if (e.which === 8) {
                        if (xx.text() === "") {
                            fullErrorNotice();
                        }
                    }
                });
                let i = $(".word").index(x);
                $(x).addClass("meEditing");
                startWriting(i);
                //console.log("focus", x);



                placeEnterSign(xx);
            }
        }
    }

    function onWordBlur(x) {
        let jEl = $(x);

        if (jEl.hasClass("meEditing")) {
            let i = $(".word").index(x)
            cancelWriting(i);
            //console.log("blur", x);
            jEl.removeClass("meEditing")
            x.contentEditable = false;

            jEl.text(jEl.attr("data-word"));
            jEl.css({
                "background-color": jEl.attr("data-calculatedBG"),
                "color": jEl.attr("data-calculatedFG")
            });
            jEl.css("text-decoration", "none");
            hideEnterSign(jEl);
            missSound.play("ding");
        }
    }

    function onNewWordCreated(xx) {
        xx.attr('contenteditable', 'true');

        xx.focus();
        selectSound.play("ding");

        xx.css("text-decoration", "underline");
        xx.css("position", "initial");
        xx.off("input");
        xx.on('input', function (e) {
            placeEnterSign(xx);
            let shouldPlayTypeSound = true;
            if (xx.text() !== "") {
                xx.text(xx.text().replace(/\s/g, ""));
                if (xx.text().length > 16) {
                    xx.text(xx.text().slice(0, 16));
                    anime({
                        targets: ".background",
                        backgroundColor: ["#ff4444", backgroundDiv.attr("data-bgColor")],
                        easing: "easeOutCubic",
                        duration: 400
                    });
                    errorSound.play("ding");
                    shouldPlayTypeSound = false;
                }
                let arr = calculateStyle(xx.text());
                xx.css({
                    "background-color": COLORS[arr[0]],
                    "color": COLORS[arr[1]]
                });
                if (xx.text() !== xx.attr("data-word")) {
                    xx.attr("data-newword", xx.text());
                }
                placeCaretAtEnd(xx[0]);
            }

            if (shouldPlayTypeSound) {
                console.log("typeSound");
                typeSound.rate(Math.random() * 0.5 + 1, typeSound.play("ding"));
            }
        });
        xx.off("keydown");
        xx.on('keydown', function (e) {
            if (e.which === 13) {
                if (xx.text() !== "") {
                    xx.off('blur');          // Removes other events if found
                    elementWaiting = xx;

                    triggerAddWord(xx);
                }

                return false;
            } else if (e.which === 32) {
                return false;
            }
        });
        startWriting(100);
        console.log("focus", xx);
        xx.on('blur',
            function () {
                onNewWordBlur(xx);
            });

        placeEnterSign(xx);
    }

    function onNewWordBlur(xx) {
        console.log("blur", xx);
        cancelWriting(100);

        xx.text("");
        xx.css({
            "background-color": "#fff",
            "color": "#000"
        });
        xx.css("text-decoration", "none");
        setTimeout(function () {
            xx.attr("contenteditable", false);
            xx.remove();
            hideEnterSign(xx);
        }, 200);
        hideEnterSign(xx);
        missSound.play("ding");
    }

    triggerReplaceWord = function (xx, newWord) {
        let value = parseInt(xx.attr("data-value"));
        let needValue = value * 1.1001;
        if (needValue === 0)
            needValue = minAmount;

        let replacingWordBlock = "<div class='preview' style='color: " +
            xx.css("color") + " ; background-color: " +
            xx.css("background-color") + " ;'>" + xx.text() +
            "</div><br><br>"

        Swal.fire({
            html: replacingWordBlock + "Would you like to overwrite with this word for <b>" + (needValue / DECIMAL) + " ICX</b>?",
            showCancelButton: true,
            confirmButtonText: 'Yes, replace it',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.value) {
                replaceWord(xx.index(), newWord, needValue);
                hideEnterSign(xx);

            } else if (
                // Read more about handling dismissals
                result.dismiss === Swal.DismissReason.cancel
            ) {


                xx.off("blur");
                xx.on("blur", function () {
                    onWordBlur(xx[0]);
                });
                xx.focus();
            }
        })
    };

    triggerAddWord = function (xx) {

        let addWordBlock = "<div class='preview' style='color: " +
            xx.css("color") + " ; background-color: " +
            xx.css("background-color") + " ;'>" + xx.text() +
            "</div><br><br>"

        Swal.fire({
            html: addWordBlock + "Would you like to add a new word to the story for <b>0 ICX</b>?",
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonText: 'Yes, add it',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.value) {
                addNormalWord(100, xx.text(), 0);
                hideEnterSign(xx);
            } else if (
                // Read more about handling dismissals
                result.dismiss === Swal.DismissReason.cancel
            ) {
                xx.off("blur");
                xx.on("blur", function () {
                    onNewWordBlur(xx);
                });
                xx.focus();
            }
        })
    };


    function constructWordString(fgColor, bgColor, word, owner, value) {
        word = unescape(word);

        owner = "h" + owner.slice(1);

        fgColor = "#" + fgColor.toString(16).substr(2);
        bgColor = "#" + bgColor.toString(16).substr(2);

        let arr = calculateStyle(word);

        let fontSize = 7;

        value = IconService.IconAmount.of(value, IconService.IconAmount.Unit.ICX);

        let padding = 1;
        if (value === 0) {
            fontSize = 5;
        } else {
            fontSize = fontSize + Math.min((value / DECIMAL), 3) * 2;
            padding = fontSize / 10;
        }


        let tippyString = "<a class=\"white\" target=\"_blank\" href=\"https://tracker.icon.foundation/address/" + owner + "\">" + owner + "</a>" +
            "\n" +
            (value / DECIMAL).toFixed(3) + " ICX";

        return "<span spellcheck=\"false\" class='word' " +
            "style='color:" + COLORS[arr[1]] + "; background-color:" + COLORS[arr[0]] + "; opacity: 0; " +
            "font-size: " + fontSize + "vmin; " +
            "padding: " + padding + "vmin; " +
            "line-height:" + fontSize * 0.8 + "vmin;' " +
            "data-owner='" + owner + "' " +
            "data-value='" + value + "' " +
            "data-word='" + word + "' " +
            "data-fg='" + fgColor + "' " +
            "data-bg='" + bgColor + "' " +
            "data-calculatedFG='" + COLORS[arr[1]] + "' " +
            "data-calculatedBG='" + COLORS[arr[0]] + "' " +
            "data-tippy-content='" + tippyString + "' " +
            "data-tippy-interactive=\"true\" " +
            ">"
            + escapeHtml(word)
            + "</span>"
    }


    function initTodayStory(data) {
        let story = data.result.story;
        let storyOwner = data.result.storyOwner;
        let storyValue = data.result.storyValue;
        let styleFG = data.result.styleFG;
        let styleBG = data.result.styleBG;

        let length = Object.keys(story).length;

        let s = "";
        for (let i = 0; i < length; i++) {
            s += constructWordString(styleFG[i], styleBG[i], story[i], storyOwner[i], storyValue[i]);
        }
        $("#inner").empty();
        $(s).appendTo("#inner");
        $(".word").each(function (i) {
            $(this).css("z-index", i + 1);
            if (shouldLoadToday) {
                $(this).on("click", function () {
                    onWordFocus(this);
                }).on("blur", function () {
                    onWordBlur(this);
                });
            } else {
                $(this).on("click", function () {
                    Swal.fire({
                        type: "error",
                        title: "You cannot change the past",
                        html: "You are visiting a past story page. Editing is not allowed."
                    });
                });
            }
        });

        anime({
            targets: ".word",
            opacity: [0, 1],
            delay: anime.stagger(150, {start: 0}),
            duration: 1000,
            complete: function (anim) {
                $(".word").css("position", "initial");

            }
        });

        anime({
            targets: ".add",
            opacity: 1
        });

        anime({
            targets: ".lds-ellipsis",
            opacity: [1, 0],
            duration: 300,
            easing: "easeOutQuad"
        });

        storyInitComplete = true;
        tippy('[data-tippy-content]');
        processEditingUsers();

        if (s === "") {
            if (shouldLoadToday) {
                Swal.fire({
                    type: "info",
                    title: "Nothing here!",
                    html: "No stories have been written yet. You can be the first one to post by clicking on the add sign on the right bottom of the main panel."
                });
            } else {
                if (epoch < epochNow) {
                    Swal.fire({
                        type: "warning",
                        title: "Nothing here!",
                        html: "You cannot change any past stories. Would you like to go to today's story page?",
                        showCancelButton: true,
                        confirmButtonText: 'Yes, take me there',
                        cancelButtonText: 'No',
                    }).then((result) => {
                        if (result.value) {
                            window.location.href = '/en/';
                        }
                    });
                } else if (epoch > epochNow) {
                    Swal.fire({
                        type: "warning",
                        title: "Nothing here!",
                        html: "You cannot change any future stories. Would you like to go to today's story page?",
                        showCancelButton: true,
                        confirmButtonText: 'Yes, take me there',
                        cancelButtonText: 'No',
                    }).then((result) => {
                        if (result.value) {
                            window.location.href = '/en/';
                        }
                    });
                }
            }
        }
    }

    function processEditingUsers() {
        $(".word").each(function (i) {
            if (EditingUsers[i] !== 0) {
                this.addClass("editing");
            }
        });
    }

    function onJSONsuccess(data) {


        if (data.result) {
            switch (data.id) {
                case CALL_ID.GET_STORY_TODAY:
                    initTodayStory(data);
                    break;
                case CALL_ID.GET_STORY_IN_RANGE:
                    break;
                case CALL_ID.GET_STORY_DATE:
                    initTodayStory(data);
                    break;
                case CALL_ID.GET_DEFAULT_BG:
                    break;
                case CALL_ID.GET_DEFAULT_FG:
                    break;
                case CALL_ID.GET_MIN_AMOUNT:
                    minAmount = IconService.IconAmount.of(data.result, IconService.IconAmount.Unit.ICX);
                    break;
                case CALL_ID.REPLACE_WORD:
                    Swal.close();
                    Swal.fire({
                        html: "Pending transaction...<br>txid: " + data.result,
                        allowOutsideClick: false,
                        onBeforeOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    keepTrying(verifyTX, data.result, onReplaceWord);
                    break;
                case CALL_ID.ADD_NORMAL_WORD:
                    Swal.close();
                    Swal.fire({
                        html: "Pending transaction...<br>txid: " + data.result,
                        allowOutsideClick: false,
                        onBeforeOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    keepTrying(verifyTX, data.result, onNormalWordAdded);
                    break;
                case CALL_ID.ADD_FANCY_WORD:
                    Swal.close();
                    Swal.fire({
                        text: "Pending transaction...",
                        footer: "txid: " + data.result,
                        allowOutsideClick: false,
                        onBeforeOpen: () => {
                            Swal.showLoading();
                        }
                    });
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
        console.log(data)
    }

    function keepTrying(f, arg, callback) {
        f(arg).then(response => {
            callback(response);
        }).catch(e => {
            console.log(e);
            if (e.includes("Pending") || e.includes("txHash")) {
                setTimeout(function () {
                    keepTrying(f, arg, callback);
                }, 1000);
            }
        });
    }

    verifyTX = async function (tx) {
        const txresult = await iconService.getTransactionResult(tx).execute();
        return txresult;
    };

    onNormalWordAdded = function (result) {
        Swal.close();
        $("#newword").remove();
        if (result.status === 1) {
            console.log(result);
            finishWriting(recentlyEditedIndex, true);
            Swal.fire({
                type: "success",
                title: "Success!",
                text: "Your word was successfully added.",
                timer: 1500,
                showConfirmButton: false
            });
            successSound.play("ding");
        } else {
            errorSound.play("ding");
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: result.failure.message
            });
        }
    }

    onReplaceWord = function (result) {
        Swal.close();
        if (result.status === 1) {
            console.log("OnReplaceWord");
            console.log(result);
            finishWriting(recentlyEditedIndex, false);
            Swal.fire({
                type: "success",
                title: "Success!",
                text: "Your word was successfully added.",
                timer: 1500,
                showConfirmButton: false
            });
            successSound.play("ding");
        } else {
            console.log(result);
            errorSound.play("ding");
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: result.failure.message
            });
        }
    }

    const checkForICONEX = new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
            type: 'REQUEST_HAS_ACCOUNT'
        }
    });

    const askForAddress = new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
            type: 'REQUEST_ADDRESS'
        }
    });

    // methodType = "icx_sendTransaction" || "icx_call"
    function relayRequest(data) {
        if (!data) {
            errorSound.play("ding");
            Swal.fire({
                type: "error",
                text: 'Check the param data.'
            })
            return;
        } else {
            const parsed = JSON.parse(data);

            if (parsed.method === "icx_sendTransaction" && (fromAddress === "")) {
                errorSound.play("ding");
                Swal.fire({
                    type: 'error',
                    title: "ICX Address not selected",
                    text: 'Please choose your ICX Address from your ICONEX extension.'
                });
                window.dispatchEvent(askForAddress);
                return;
            }

            if (parsed.method === "icx_sendTransaction") {
                Swal.fire({
                    type: 'info',
                    title: "Sending transaction...",
                    text: 'We have requested a transaction. Please follow the instruction and sign the transaction on the ICONex popup.',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel',
                    showConfirmButton: false,
                    allowOutsideClick: false

                }).then((result) => {
                    if (
                        // Read more about handling dismissals
                        result.dismiss === Swal.DismissReason.cancel
                    ) {
                        if (elementWaiting.hasClass("word"))
                            onWordBlur(elementWaiting[0]);
                        else if (elementWaiting.attr("id") === "newword") {
                            onNewWordBlur(elementWaiting);
                        }
                        elementWaiting = null;
                    }
                });
            }

            console.log("[ICONEX] sending json call...")
            console.log(parsed);

            window.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
                detail: {
                    type: 'REQUEST_JSON-RPC',
                    payload: parsed
                }
            }));
        }
    }

    function makeGoodCall(scoreData) {
        if (!isICONEX) {
            makePostCall(scoreData);
        } else {
            relayRequest(JSON.stringify(scoreData));
        }
    }

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
        makeGoodCall(scoreData);
    };

    updateStory = function (index, isInsert) {
        isInsert = isInsert ? 1 : 0;
        const callBuilder = new IconBuilder.CallBuilder;
        const call = callBuilder
            .to(scoreAddress)
            .method('getWord')
            .params({"word_index": IconConverter.toBigNumber(index)})
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_call",
            "params": call,
            "id": CALL_ID.UPDATE_STORY + "_" + index + "_" + isInsert
        };
        makeGoodCall(scoreData);
    };

    getStoryDate = function (date) {
        const callBuilder = new IconBuilder.CallBuilder;
        const call = callBuilder
            .to(scoreAddress)
            .method('getStoryOfDate')
            .params({"date": IconConverter.toBigNumber(date)})
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_call",
            "params": call,
            "id": CALL_ID.GET_STORY_DATE
        };
        makeGoodCall(scoreData);
    };

    getMinAmount = function () {
        const callBuilder = new IconBuilder.CallBuilder;
        const call = callBuilder
            .to(scoreAddress)
            .method('getFancywordsAmount')
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_call",
            "params": call,
            "id": CALL_ID.GET_MIN_AMOUNT
        };
        makeGoodCall(scoreData);
    };

    function checkForICONex() {
        if (fromAddress === "" || fromAddress === null) {
            errorSound.play("ding");
            if (isICONEX) {

                Swal.fire({
                    type: 'warning',
                    title: "ICX Address not selected",
                    text: 'Please choose your ICX Address from your ICONEX extension.'
                });
                window.dispatchEvent(askForAddress);
                return false;
            } else {
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Wallet not detected. Please download ICONex Chrome extension.',
                    footer: '<a href="https://chrome.google.com/webstore/detail/iconex/flpiciilemghbmfalicajoolhkkenfel?hl=en">Download ICONex from Chrome web store</a>'
                })
                return false;
            }
        }
        return true;
    }

    function checkIfICONexHasAddress(addr) {
        const checkForICONEX = new CustomEvent('ICONEX_RELAY_REQUEST', {
            detail: {
                type: 'REQUEST_HAS_ADDRESS',
                payload: addr
            }
        });

        window.dispatchEvent(checkForICONEX);
    }

    getStoryRange = function (dateFrom, dateTo) {
        const callBuilder = new IconBuilder.CallBuilder;
        const call = callBuilder
            .to(scoreAddress)
            .method('getStoryInRange')
            .params({
                "fromTimestamp": IconConverter.toBigNumber(dateFrom),
                "toTimestamp": IconConverter.toBigNumber(dateTo)
            })
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_call",
            "params": call,
            "id": CALL_ID.GET_STORY_IN_RANGE
        };
        makeGoodCall(scoreData);
    };

    addNormalWord = function (wordIndex, word, value) {
        if (!checkForICONex())
            return;

        recentlyEditedIndex = wordIndex;

        const ctBuilder = new IconBuilder.CallTransactionBuilder;
        const calltrans = ctBuilder
            .from(fromAddress)
            .to(scoreAddress)
            .value(value)
            .nid(IconConverter.toBigNumber(NID))
            .timestamp((new Date()).getTime() * 1000)
            .stepLimit(IconConverter.toBigNumber(10000000))
            .version(IconConverter.toBigNumber(3))
            .method('addNormalWord')
            .params({
                "word_index": IconConverter.toBigNumber(wordIndex),
                "word": escape(word)
            })
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_sendTransaction",
            "params": IconConverter.toRawTransaction(calltrans),
            "id": CALL_ID.ADD_NORMAL_WORD
        };
        makeGoodCall(scoreData);
    };

    replaceWord = function (wordIndex, word, value) {
        if (!checkForICONex())
            return;

        recentlyEditedIndex = wordIndex;

        const ctBuilder = new IconBuilder.CallTransactionBuilder;
        const calltrans = ctBuilder
            .from(fromAddress)
            .to(scoreAddress)
            .value(value)
            .nid(IconConverter.toBigNumber(NID))
            .timestamp((new Date()).getTime() * 1000)
            .stepLimit(IconConverter.toBigNumber(10000000))
            .version(IconConverter.toBigNumber(3))
            .method('replaceWord')
            .params({
                "word_index": IconConverter.toBigNumber(wordIndex),
                "word": escape(word),
                "style_fg": "0xffffff",
                "style_bg": "0x000000"
            })
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_sendTransaction",
            "params": IconConverter.toRawTransaction(calltrans),
            "id": CALL_ID.REPLACE_WORD
        };

        makeGoodCall(scoreData);

    };

    addFancyWord = function (wordIndex, word, value, fg, bg) {
        if (!checkForICONex())
            return;

        recentlyEditedIndex = wordIndex;

        const ctBuilder = new IconBuilder.CallTransactionBuilder;
        const calltrans = ctBuilder
            .from(fromAddress)
            .to(scoreAddress)
            .value(value)
            .nid(IconConverter.toBigNumber(NID))
            .timestamp((new Date()).getTime() * 1000)
            .stepLimit(IconConverter.toBigNumber(10000000))
            .version(IconConverter.toBigNumber(3))
            .method('addFancyWord')
            .params({
                "word_index": IconConverter.toBigNumber(wordIndex),
                "word": word,
                "style_fg": fg,
                "style_bg": bg
            })
            .build();
        const scoreData = {
            "jsonrpc": "2.0",
            "method": "icx_sendTransaction",
            "params": IconConverter.toRawTransaction(calltrans),
            "id": CALL_ID.ADD_FANCY_WORD
        };
        makeGoodCall(scoreData);
    }

    function prepareAddNewWord() {
        $("#newword").remove();
        queuedFunction = prepareAddNewWord;
        if (!checkForICONex())
            return;
        queuedFunction = null;
        let xx = $("<span spellcheck=\"false\" id='newword'></span>").appendTo("#inner");
        onNewWordCreated(xx);
    }

    function returnUserCheck() {
        if (returnFromAddress !== null) {
            checkIfICONexHasAddress(returnFromAddress);
        }
    }

    $(window).on("load", function () {


        anime({
            targets: '#container',
            opacity: 1,
            duration: 2000,
            delay: 100,
            easing: "linear"
        });

        anime({
            targets: '#container',
            translateX: ["-3vw", 0],
            translateY: ["-30vh", 0], // from 100 to 250
            duration: 2000,
            rotate: [anime.random(-10, -20), 0],
            delay: 100
        });

        window.dispatchEvent(checkForICONEX);
        getMinAmount();

        if (shouldLoadToday)
            getStoryToday();
        else
            getStoryDate(epoch);

        $(".add").click(function () {
            prepareAddNewWord();
        });


    });
