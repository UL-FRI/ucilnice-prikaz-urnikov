/*
 * Created by GregorS
 *
 * version: v6.4.2 beta publicDemo6 - 25/02/2017. - deeper code redesign,..
 * version: v6.4 beta publicDemo6 - 25/02/2017. - code cleanup,..
 *
 * version: v6.3 beta publicDemo6.3 - 28/11/2016... testing ...
 * version: v6 beta publicDemo6 - 28/11/2016. delete expirated data (default next day) and hide main panel
 * version: v5 beta publicDemo5 - 26/11/2016. glede na ip doloci prikaz podatkov neke ucilnice
 * version: v4 beta publicDemo4 - 16/11/2016. v timetable so vrinjeni tudi prosti termini
 * version: v3 beta publicDemo3 - 16/11/2016.
 * version: v1.0 beta publicDemo - 27/9/2016.
 *
 * TODO: read TODO.txt !!!
 *-----------------------------------------------------------------------------------
 *
 * Main JS =   dataAPI & functionality & graphicUI manipulation
 -----------------------------------------------------------------------------------*/


//### GLOBAL VARIABLEs ###

///remote config
//!will cause auto reload page on all devices - can cause infinity reload loop if not set correctly!!

var selectedRoom;
var selectedRoomSlug;
var selectedDate;
var selectedTime;
var urlTimeSet = false;
var urlDateSet = false;

var dataReservations; //ajax response;
var dataReservations_tmp; // new attempt to cennect to server, if anything ok then data=data_tmp;

//var tomorrowDT = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

var currentDT; // =date or based on url parameters
var lastSuccessfulDataServerConnectionTime; // Urnik API
var dataServerFailedConnAttempts_max=3; // SHOW ERROR  old data  ... refreshDataInterval_showPageErrorAfterNfailedAttempts
var dataServerFailedConnAttempts_counter=0; // ... till refreshDataInterval_showPageErrorAfterNfailedAttempts refreshDataInterval_counterOfFailedConnAttempts


var expirationOfData_DT; //do not change, it is auto calculated . //= new Date(lastSuccessfulDataServerConnectionTime.getFullYear(), lastSuccessfulDataServerConnectionTime.getMonth(), lastSuccessfulDataServerConnectionTime.getDate()+expirationOfData_inDays);
var expirationOfData_inDays = 1; // change only if you loaded enough of data in advance, default is 1 day

var dataTimeOffset;

var pageUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
var indexFileUrl = location.protocol + "//" + location.hostname + location.pathname; //"http://cid.fri1.uni-lj.si/demo6/index.html"
var originalDataApiUrl = "https://urnik.fri.uni-lj.si/reservations/";
var dataUrl = "https://rezervacije.fri.uni-lj.si/";
var classroomsUrl = dataUrl + "sets/rezervacije_fri/types/classroom/reservables/?format=json";
var teachersUrl = dataUrl + "sets/rezervacije_fri/types/teacher/reservables/?format=json";

var refreshDataInterval = 5 * 60 * 1000; //every 60s x 5= 5min   |  page -> data.php -> data server
var refreshUIInterval = 30 * 1000; //every 30s
var refreshFullPageInterval= 6 * 60 * 60 * 1000; // every 6 hours 

var ajaxTimeout = 20000;//3000; // sets ajax timeout to 20 seconds

var roomsBySlug = Object.create(null);//= {};;
var reservablesById = Object.create(null);

var status_dataServer = false;
var status_pageServer = false;

var dataCache_tmp = Object.create(null);//= {};  // clean at least once a day ! | store almost static data like rooms(id+name) and organisers(id+names)

//### INIT ###
$(document).ready(function () {
    lastSuccessfulDataServerConnectionTime = new Date();

    //// get DATE
    // date from url -  ?room=3137&date=2016-09-12&time=12:00
    selectedDate = getURLParameter('date');//2016-09-12
    selectedTime = getURLParameter('time');//12:00

    //or current device date - Date()
    var d = new Date();

    if (selectedDate == null) {
        selectedDate = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);//"2016-05-16"; //
        urlDateSet = false;
    } else {
        urlDateSet = true;
    }

    if (selectedTime == null) {
        selectedTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);//+ ":" + ('0' + d.getSeconds()).slice(-2);;
        urlTimeSet = false;
    } else {
        urlTimeSet = true;
    }


    dataTimeOffset = new Date().getTimezoneOffset() * 60000; // !! podatki (urnik API) so zapisani na UTC 00, v resnici pa so v casovnem pasu  +1 oz +2!!!!!!!!


    /// get current Room Id and Name
    //via IP
    //via Url atribut  !! url attribut overwrites if not empty !!


    currentDT = new Date(new Date(selectedDate + "T" + selectedTime).getTime() + dataTimeOffset);
    selectedRoomSlug = getURLParameter('room');

    setInterval(reloadPage, refreshFullPageInterval);

        //  refresh Data & UI periodically
    setInterval(refreshData, refreshDataInterval);
    setInterval(showClassroomsOrUI, refreshUIInterval);

    refreshData();
});//end init



//###  ESSENTIAL functions ###//

function showClassroomsOrUI(){
    if (selectedRoom == null){
        showClassrooms();
    } else {
        refreshUI();
    }
}

function reloadPage(){
    location.reload(true);//(true);         //FORCE PAGE RELOAD if app version changed!!
}


function refreshData() {
    // refresh room name
    loadReservables(function(){
        if (selectedRoom != null){
            loadReservations(showClassroomsOrUI);
        } else {
            showClassroomsOrUI();
        }
    });
}


function refreshUI() {
    var d = new Date();
    // update TIME
    if (urlTimeSet == false) { // if false use current time if true use url time
        selectedTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);//+ ":" + ('0' + d.getSeconds()).slice(-2);;
    }

    // update Date
    if (urlDateSet == false) { // if false use current date if true use url time
        selectedDate = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);//"2016-05-16"; //
    }

    // var currentDate = ;//"2016-05-16T11:01:00";//"2016-04-12T16:01:00";//"2016-09-12T14:15:00";///TEST!!
    currentDT = new Date(new Date(selectedDate + "T" + selectedTime).getTime() + dataTimeOffset);
    var currentDTFormat = ('0' + currentDT.getDate()).slice(-2) + "/" + ('0' + (currentDT.getMonth() + 1)).slice(-2) + "/" + currentDT.getFullYear() + " " + ('0' + currentDT.getHours()).slice(-2) + ":" + ('0' + currentDT.getMinutes()).slice(-2);//+ ":" + ('0' + currentDT.getSeconds()).slice(-2);
    $('#currentDateAndTime').html(currentDTFormat);

//        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali podatkovnega strežnika.");//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
    if (dataReservations == null){
        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku. ");

        $('#message_errorData').show();
    }

    if (selectedRoom.name != "" && dataReservations != null) {   //dataReservations -uporabi zadnje shranjene podatke
        $('#logo-container').html("Učilnica " + selectedRoom.name + " / Seznam rezervacij");

        //show time table
        $('#work').show();
        $('#loading').hide();
        rebuildUI();

    } else {
        //$('#logo-container').html("Room info loading...");
        $('#work').hide();
        $('#loading').show();
    }

}




//###  SUB-ESSENTIAL functions ###//
function loadReservables(done_fn){
    //getExternalData_UrnikAPI_AllClassrooms_IDsAndNames_sync(urlGDOC);
    var tmp = new Array();
    rooms_done_callback = function(rooms){
        $.each(rooms, function(i, room){
            roomsBySlug[room.slug] = room;
            reservablesById[room.id] = room;
            if (room.slug == selectedRoomSlug){
                selectedRoom = room;
            }
        });
        teachers_done_callback = function(teachers){
            $.each(teachers, function(i, teacher){
                reservablesById[teacher.id] = teacher;
            });
            done_fn();
        }
        getExternalData_UrnikApi_MultiObjects_Recursive(teachersUrl, teachers_done_callback, tmp);
    }
    getExternalData_UrnikApi_MultiObjects_Recursive(classroomsUrl, rooms_done_callback, tmp);
}

function showClassrooms() {
    try {
        var sezHtml = "";
        for (room_slug in roomsBySlug) {
            sezHtml += '<a href="' + indexFileUrl + '?room=' + room_slug + '">' + room_slug + " - " + roomsBySlug[room_slug].id + '</a><br>';
        };
        $('#message_errorRoomNotSelected').html(sezHtml).show();
        $('#logo-container').html("Select room to continue");

        $('#message_errorData').hide();
    } catch (e) {
        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku.   ");
        $('#message_errorData').show();
    }
}


function rebuildUI() {
    var checkedReservation_isFree = false;
    var myULhtml = "";
    var count = 1;
    var checkedReservation = null;

    var dayTimeMin = selectedDate + "T" + "00:00:00";//new Date(new Date( selectedDate + "T" + "00:00:00"  ).getTime() + dataTimeOffset); // 00:00
    var dayTimeMax = selectedDate + "T" + "23:59:00";//new Date(new Date( selectedDate + "T" + "23:59:00"  ).getTime() + dataTimeOffset); // 23:59 ..mora biti z datimom vred!

    if (dataReservations.length == 0) { //cel dan prazen
        checkedReservation = getFakeLineElement(dayTimeMin, dayTimeMax);
        myULhtml += nextTimeLineElement(checkedReservation, count, currentDT); //???!! preveri ce to drzi
        checkedReservation_isFree = true;
        count++;
    } else {

        // ce je prvi fake

        var lastStartTime = new Date(new Date(dayTimeMin).getTime() + dataTimeOffset);
        var lastEndTime = lastStartTime;
        var lastStartTimeText = dayTimeMin;
        var lastEndTimeText = dayTimeMin;

        // ce je fake/nefake vmes
        $.each(dataReservations, function (i, item) {

            var startDT = new Date(new Date(item.start).getTime() + dataTimeOffset);
            var endDT = new Date(new Date(item.end).getTime() + dataTimeOffset);

            var resStatus = statusOfReservation(startDT, endDT, currentDT); // -1 old, 0 current , 1 following

            if (lastEndTime < startDT) {
                //vstavi le aktualnega
                //instert fake as trenuten termin

                myULhtml += nextTimeLineElement(getFakeLineElement(lastEndTimeText, dataReservations[i].start), count, true);

                count++;
                //insert next termin
                //   myULhtml+=nextTimeLineElement(item,count, currentDT);
            } else if (lastEndTime == startDT) {
            }

            lastEndTimeText = dataReservations[i].end;
            lastEndTime = new Date(new Date(dataReservations[i].end).getTime() + dataTimeOffset);
            //vstavi praznega + aktualnega
            myULhtml += nextTimeLineElement(item, count, false);

            if (i == dataReservations.length - 1 && lastEndTime < new Date(new Date(dayTimeMax).getTime() + dataTimeOffset)) { //fake na koncu
                count++;
                //insert fake termin

                myULhtml += nextTimeLineElement(getFakeLineElement(lastEndTimeText, dayTimeMax), count, true);
                //checkedReservation_isFree = true;

            }


            if (i == 0 && resStatus == 1) { //fake na zacetku
                checkedReservation = getFakeLineElement(dayTimeMin, dataReservations[i].start);
                checkedReservation_isFree = true;

            } else if (resStatus == 1 && checkedReservation == null) { ///fake vmes
                checkedReservation = getFakeLineElement(dataReservations[i - 1].end, dataReservations[i].start);
                checkedReservation_isFree = true;

            } else if (resStatus == 0) { // izbran je tudi trenuten termin
                checkedReservation = item;

            } else if (i == dataReservations.length - 1 && resStatus == -1) { //fake na koncu
                checkedReservation = getFakeLineElement(dataReservations[i].end, dayTimeMax);
                checkedReservation_isFree = true;

            } else { // ostali ? cel dan prazen

            }

            count++;

        });


    }//else


    $('#timeline').html(myULhtml);
    var halfPadding = ((window.innerHeight - 150 - (count * 69))) / count;


    $('#timeline li').css({'margin': ' ' + halfPadding + 'px 0 ' + halfPadding + 'px 0  ', "height": ""}); //css('margin') = "margin: 60px 0 "+(930-(count*70))/count +"px 0";
//$('#timeline li').css({'margin': ' ' + halfPadding + 'px 0 0px 0  '}).css({"height": (halfPadding +69)+ "px"});
    //  $('#timeline li').autoSizr();


    //
    var currR_h = window.innerHeight - 150;
    $('#work').css("height", currR_h + "px");

    $('div[class*="currentReservation-label"]').css({
        "height": (currR_h * 0.0559) + "px",
        "margin-top": (currR_h * 0.0215)
    }).autoSizr();//.style.height=currR_h *0.0376;

    $(' #timelineFrame  label').css({'height': '69px ', "font-size": "1.21em"}).autoSizr();//.css({"line-height":"0.85em"});


    var startDT = new Date(new Date(checkedReservation.start).getTime() + dataTimeOffset);
    var endDT = new Date(new Date(checkedReservation.end).getTime() + dataTimeOffset);
    $('div[id^="currentReservation-"]').attr("class", "fred");//.removeClass( "fgreen" ).addClass( "fred" );

    $('#currentReservation-termin').html(startDT.getHoursMY() + ':' + startDT.getMinutesMY() + " - " + endDT.getHoursMY() + ':' + endDT.getMinutesMY()).css("height", (currR_h * 0.0891) + "px");
    $('#currentReservation-namen').html(checkedReservation.reason).css("height", (currR_h * 0.3225) + "px");

    $('#currentReservation-organizatorji').html(checkedReservation.teachersText).css("height", (currR_h * 0.1182) + "px");//checkedReservation.owners.toString()   //bivsi reservablesText
    $('#currentReservation-opombe').html(checkedReservation.roomsText).css("height", (currR_h * 0.05913 ) + "px"); //bivsi requirementsText

    if (checkedReservation_isFree) {
        $('div[id^="currentReservation-"]').attr("class", "fgreen");//.removeClass( "fred" ).addClass( "fgreen" );//css({});
        $('#timelineFrame .radio:checked + .relative .circle ').css("background", "#48b379");
        // background: #48b379;
    }

    $('div[id^="currentReservation-"]').autoSizr(); //auto change text size to fit in allocated area
    //  $('#currentReservation-namen').autoSizr();
    //  $('#currentReservation-organizatorji').autoSizr();
    //  $('#currentReservation-opombe').autoSizr();

}


function nextTimeLineElement(item, count, isFreeReservation) {

    var startDT = new Date(new Date(item.start).getTime() + dataTimeOffset);
    var endDT = new Date(new Date(item.end).getTime() + dataTimeOffset);

    var resStatus = statusOfReservation(startDT, endDT, currentDT); // -1 old, 0 current , 1 following

    var myLI = '<li class="work  ' + (resStatus == -1 ? "fgrey" : "") + '">' +
        '<input class="radio" id="work' + count + '" name="works" type="radio"  ' + (resStatus == 0 ? "checked" : "") + '>' +
        '<div class="relative">' +
        '<label for="work' + count + '">  ' + item.reason + ' </label>' + //unescape(x);  //JSON.parse('"' + item.reason.replace('"', '\\"') + '"')
        '<div class="date"> <b> ' + ( startDT.getHoursMY() + ':' + startDT.getMinutesMY() ) + ' </b><br> <div style="">   ' + (endDT.getHoursMY() + ':' + endDT.getMinutesMY() ) + '    </div> </div> ' +
        '<span class="circle ' + (resStatus == -1 ? "grey" : (isFreeReservation ? "green" : "")) + '"></span>' +
        '</div> ' +
        ' <div class="content"> ' +
        ' <p>   </p>' +
        '  </div>  </li>';

    return myLI;
}

function getFakeLineElement(startDT, endDT) {
    var fkLn = JSON.parse('{"reason": "PROST TERMIN", "start": "' + startDT + '", "end": "' + endDT + '", "owners": [ ], "reservables": [], "requirements": [], "id": 0} ');//"2016-09-27T13:00:00"
    fkLn.teachersText = "-";
    fkLn.roomsText = "-";
    return fkLn;
}


////


function loadReservations(done_fn) { //loadReservations new
    var urlGDOC = dataUrl + 'reservations/?start=' + selectedDate + '%2000:00&end=' + selectedDate + '%2023:59&reservables=' + selectedRoom.id + '&format=json';
    var data = new Array();

    // delete expired delete  //!! CLEAN OLD DATA!!!!!
    if (expirationOfData_DT == null) {
        expirationOfData_DT = currentDT;
    }
    if (compareDates(expirationOfData_DT, currentDT) <= 0) {
        dataReservations = null;
        dataCache_tmp = {}; // clean cached data
    }


    done_callback = function(data){
        dataReservations_tmp = data;

        //SORT!!!!!!!
        dataReservations_tmp.sort(comp);

        //convert all  id numbers to names
        $.each(dataReservations_tmp, function (i, item) {
            var teachersN = 0, roomsN = 0;
            var teachers = "", rooms = "";

            dataReservations_tmp[i].reason = textClean(dataReservations_tmp[i].reason).replace(/\(/g, ' \(').replace(/'/g, '');

            // for rooms/teachers
            $.each(item.reservables, function (j, item) {
                var reservable = reservablesById[item];
                if (reservable != null && reservable.type === "teacher") {
                    if (teachersN > 0) {
                        teachers += "; ";
                    }
                    teachersN++;
                    teachers += textClean(reservable.name);
                } else if (reservable != null && reservable.type === "classroom") {
                    if (roomsN > 0) {
                        rooms += "; ";
                    }
                    roomsN++;
                    rooms += textClean(reservable.slug);
                } else {
                }   //skupine = groups .. ne rabim

            });

            dataReservations_tmp[i].roomsText = rooms;   //..shrani kot nov parameter   //requirementsText =rooms
            dataReservations_tmp[i].teachersText = (teachers === "" ? "-" : teachers);// teachers; ///..shrani  //reservablesText = teachers
            //"-" == dekanat default
        });
        dataReservations = jQuery.extend(true, [], dataReservations_tmp);//deep copy//  (true, {}, dataReservations_tmp)
        try {
            $('#message_errorData').html("");
            $('#message_errorData').hide();
            //{"count": 0, "next": null, "previous": null, "results": []}   // ce je prazno https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-09-27%2023:00&end=2016-09-27%2023:40&reservables=3155&format=json

            lastSuccessfulDataServerConnectionTime = currentDT;//new Date();
            expirationOfData_DT = new Date(lastSuccessfulDataServerConnectionTime.getFullYear(), lastSuccessfulDataServerConnectionTime.getMonth(), lastSuccessfulDataServerConnectionTime.getDate() + expirationOfData_inDays);

            dataServerFailedConnAttempts_counter=0;

        } catch (e) {
            $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Težave pri procesiranju podatkov, prosimo obvestite skrbnika!");
            $('#message_errorData').show();
        }
        done_fn();
    };
    getExternalData_UrnikApi_MultiObjects_Recursive(urlGDOC, done_callback, data);
}

function onDataRecvFail(){
    dataServerFailedConnAttempts_counter=dataServerFailedConnAttempts_counter+1;

    if( dataServerFailedConnAttempts_counter >= dataServerFailedConnAttempts_max){
        var d = lastSuccessfulDataServerConnectionTime;
        var sDate = ('0' + d.getDate()).slice(-2) + "/" + ('0' + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();  //selectedDate;//d.getFullYear() + "-" +  ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) ;
        var sTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);//selectedTime;//('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) ;//+ ":" + ('0' + d.getSeconds()).slice(-2);;

        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od " + sDate + " " + sTime);//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
        // --niso več aktualni ---minut oz sekund od zadnje osvezitve ... Težave pri pridobivanju podatkov. Možne težave z omrežjem ali potekajo dela na strežniku.
        $('#message_errorData').show();
        $('#message_errorData').autoSizr();

    }

}

//### DATA API HELPER func. ###//


function getED_ReservableByID(resID) { // same for organizer/room/group
    var url = dataUrl + 'reservables/' + resID + '/?format=json';
    return getExternalData_singleObjectByURL_sync(url);
}



function getED_AllClassrooms(url) { // return as hashTable
    var url = dataUrl + "sets/rezervacije_fri/types/classroom/reservables/?format=json";// //'reservables/' + sifra + '/?format=json';
    //  var url;
}



///external AJAX calls

// generic
function getExternalData_singleObjectByURL_sync(urlGDOC) {   //   var urlGDOC = dataUrl + 'reservables/' + resID + '/?format=json';
    var response = null;

    $.ajax({
        timeout: ajaxTimeout, //  timeout
        url: urlGDOC,
        async: true,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            response = data;
        } catch (e) {
        }
    }).fail(function () { //= null
    }).always(function () {
    });

    return response;
}

//specific to UrnikApi - data in multipage model
function getExternalData_UrnikApi_MultiObjects_Recursive(url, done_fn, dest_array) {
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: url,
        async: true,//!!
        dataType: "json"
    }).done(function (data) {
        dest_array = dest_array.concat(data.results);//response.concat( data.results  );
        if (data.next != null) {  //RECURSIVELY
            var nextDataUrl_viaProxy = data.next.replace(originalDataApiUrl, dataUrl); // change https://urnik.fri.uni-lj.si/reservations/ to owr server domain/data.php/...
            getExternalData_UrnikApi_MultiObjects_Recursive(nextDataUrl_viaProxy, done_fn, dest_array);
        } else {
            done_fn(dest_array);
        }
    }).fail(function () {
        onDataRecvFail();
    }).always(function () {        //
    });
}




//#### BASIC/PRIMITIVE functions ###//

// cache rooms(id/name) and organizers  | wipe cache at least once a day, so those data are also up to date !!!!!!!!!!!!!!!!!!!!!
function getDataFromCache(id, fun) {
    if (id in dataCache_tmp) {  //if cache empty, get data from function , store data in cache, and return
        return dataCache_tmp[id];
    } else {
        var tmp = fun(id);
        if (tmp != null && tmp != "*") {
            dataCache_tmp[id] = tmp; //save only valid data
        }
        return tmp;
    }
}

function textClean(text) {
    return JSON.parse('"' + text + '"'); //    Ra\u010dunalni\u0161ka arhitektura  => Računalniška arhitektura
}

function statusOfReservation(start, end, current) {
    if (start <= current && current < end) { //current   - start inclusive, end exclusive
        return 0;
    } else if (current >= end) {  //older
        return -1;
    } else if (current < start) {//next
        return 1;
    }

}


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    //http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
    //use as   myvar = getURLParameter('myvar');
}


function comp(a, b) { //date comparison
    return new Date(a.start).getTime() - new Date(b.start).getTime();
}


function compareDates(d1, d2) {
    return new Date(d1).getTime() - new Date(d2).getTime();
}

// add date leading zero  -izpis z dvema stevilkama  npr. ura 9:3 => 09:03
Date.prototype.getHoursMY = function (key) {
    return ('0' + this.getHours()).slice(-2);
};

Date.prototype.getMinutesMY = function (key) {
    return ('0' + this.getMinutes()).slice(-2);
};


/////
// test http://jsfiddle.net/mn4rr/1/
//orig https://gist.github.com/iamkirkbater/ee9741a02431290682e6
$.fn.autoSizr = function () {
    var el, elements, _i, _len, _results;
    elements = $(this);
    if (elements.length < 0) {
        return;
    }
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        _results.push((function (el) {
            var resizeText, _results1;
            resizeText = function () {
                var elNewFontSize;
                elNewFontSize = (parseInt($(el).css('font-size').slice(0, -2)) - 1) + 'px';
                return $(el).css('font-size', elNewFontSize);
            };
            _results1 = [];
            while (el.scrollHeight > el.offsetHeight) {
                _results1.push(resizeText());
            }
            return _results1;
        })(el));
    }
    return $(this);
};




