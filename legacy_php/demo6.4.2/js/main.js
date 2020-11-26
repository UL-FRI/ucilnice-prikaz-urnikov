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
var app_version="0.6.4.2"; //!!! use carefully, also change remoteConfig.php with the same value !!!
var device_ip="";//will load from server
var device_classid="";


var selectedRoom_id;
var selectedRoom_name;
var selectedDate;
var selectedTime;
var urlTimeSet = false;
var urlDateSet = false;

var dataReservations; //ajax response;
var dataReservations_tmp; // new attempt to cennect to server, if anything ok then data=data_tmp;

//var tomorrowDT = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

var currentDT; // =date or based on url parameters
var lastSuccessfulServerConnectionTime;  //streznik Strani //TODO!! not yet implemented  // if more than xx seconde/minutes then prompt offline mode error
var lastSuccessfulDataServerConnectionTime; // Urnik API
var lastSuccessfulLDAPServerConnectionTime; // LDAP //TODO!! not yet implemented
var dataServerFailedConnAttempts_max=3; // SHOW ERROR  old data  ... refreshDataInterval_showPageErrorAfterNfailedAttempts
var dataServerFailedConnAttempts_counter=0; // ... till refreshDataInterval_showPageErrorAfterNfailedAttempts refreshDataInterval_counterOfFailedConnAttempts


var expirationOfData_DT; //do not change, it is auto calculated . //= new Date(lastSuccessfulDataServerConnectionTime.getFullYear(), lastSuccessfulDataServerConnectionTime.getMonth(), lastSuccessfulDataServerConnectionTime.getDate()+expirationOfData_inDays);
var expirationOfData_inDays = 1; // change only if you loaded enough of data in advance, default is 1 day

var dataTimeOffset;

var pageUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));   //"";//"../"; //  // "http://cid.fri1.uni-lj.si/demo5/"   //"http://cid.fri1.uni-lj.si";  // SET "" on server!!
//var pageUrl= "http://cid.fri1.uni-lj.si/demo5"; //za lokalni razvoj!
var indexFileUrl = location.protocol + "//" + location.hostname + location.pathname; //"http://cid.fri1.uni-lj.si/demo6/index.html"
var originalDataApiUrl = "https://urnik.fri.uni-lj.si/reservations/";
var dataUrl = pageUrl + "/data.php/";//"http://193.2.72.115/data.php/";//   "http://193.2.72.115/data.php/" -temp,on localhost , "data.php/" -on server, "https://urnik.fri.uni-lj.si/reservations/" -original
var ldapUrl = pageUrl + "/ldap.php";
var myIpUrl = pageUrl + "/myip.php";
var remoteConfigUrl= pageUrl+ "/remoteConfig.php";


var refreshDataInterval = 5 * 60 * 1000; //every 60s x 5= 5min   |  page -> data.php -> data server
var refreshUIInterval = 30 * 1000; //every 30s
//var refreshFullPageInterval= 60 * 60 * 100; //every hour ?!  // DO not work yet.. use config force-refresh:1, to force refresh

var ajaxTimeout = 2000;//3000; // sets ajax timeout to 2 seconds

var sifrantRooms = Object.create(null);//= {};;
var sifrantRooms_Loaded = false;

var status_dataServer = false;
var status_pageServer = false;

var dataCache_tmp = Object.create(null);//= {};  // clean at least once a day ! | store almost static data like rooms(id+name) and organisers(id+names)

//### INIT ###
$(document).ready(function () {
    lastSuccessfulServerConnectionTime = new Date();
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
    var ip = myIPtoClassId(getMyIP().toString());
    if (ip != "") { //"192.168.1.102" =>
        selectedRoom_id = ip;
    }

    //via Url atribut  !! url attribut overwrites if not empty !!
    if (getURLParameter('room') != null) {
        selectedRoom_id = getURLParameter('room');
    }

    if (selectedRoom_id == null) { // show list on posssible Rooms and finish script !!!!!!!!
        setInterval(showListOfAllClassrooms, refreshUIInterval); //try to query (multipletimes) until you get data
        showListOfAllClassrooms();

    } else {

        remoteConfig();
        setInterval(remoteConfig, refreshDataInterval);// refreshUIInterval

        //  refresh Data & UI periodically
        setInterval(refreshData, refreshDataInterval);
        setInterval(refreshUI, refreshUIInterval);

        //first time load manually
        refreshUI();//sync
        refreshData();//async
        refreshUI();
    }

});//end init





//###  ESSENTIAL functions ###//


//TODO //get data from remoteconfig file - info about e.g. app-version (to hard page reload), sleep mode data, ... messages
function remoteConfig() {//refreshPage
    console.log("remoteConfig started");
    var data = getED_RemoteConfig();
    if(data !=null){
        lastSuccessfulServerConnectionTime = new Date();
        try {
            if(app_version != data.app_version){ //!test first, priority!
                window.location = window.location.href+'?eraseCache=true';
                location.reload(true);//(true);         //FORCE PAGE RELOAD if app version changed!!
                //console.log("remoteConfig app_version != data.app_version  || will reload page");
            }
            device_ip= data.device_ip;
            device_classid=data.device_classid;


        }catch (e){}
    }else{
        // server error or not reachable
    }

}

function showListOfAllClassrooms() { // only if no room selected
    if (sifrantRooms_Loaded) {
        return -1;//force stop
    } else {
        loadClassrooms_showHtmlList();
    }
}


function refreshData() {
    //get Room name, if unknown
    if (selectedRoom_name == null || selectedRoom_name === "") {
        var tmp = getDataFromCache(selectedRoom_id,getED_ReservableByID ); // getED_ReservableByID(selectedRoom_id).slug
        selectedRoom_name =  tmp.slug;//slug is attribut from json file
    }
    loadData();
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

    // delete expired delete  //!! CLEAN OLD DATA!!!!!
    if (expirationOfData_DT == null) {
        expirationOfData_DT = currentDT;
    }
    if (compareDates(expirationOfData_DT, currentDT) <= 0) {
        dataReservations = null;
        dataCache_tmp = {}; // clean cached data

//        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali podatkovnega strežnika.");//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku. ");

        $('#message_errorData').show();
    }

    if (selectedRoom_name != "" && dataReservations != null) {   //dataReservations -uporabi zadnje shranjene podatke
        $('#logo-container').html("Učilnica " + selectedRoom_name + " / Seznam rezervacij");

        //show time table
        $('#work').show();
        $('#loading').hide();
        rebuildUI(currentDT);

    } else {
        //$('#logo-container').html("Room info loading...");
        $('#work').hide();
        $('#loading').show();
    }

}




//###  SUB-ESSENTIAL functions ###//


function loadClassrooms_showHtmlList() {
    var urlGDOC = dataUrl + "sets/rezervacije_fri/types/classroom/reservables/?format=json";// //'reservables/' + sifra + '/?format=json';
    var dataLoaded = false;
    try {
        //getExternalData_UrnikAPI_AllClassrooms_IDsAndNames_sync(urlGDOC);
        sifrantRooms = getED_AllClassroms_IDsAndNames(urlGDOC); //if null == error
        sifrantRooms_Loaded = true;

        var sezHtml = "";
        for (var roomID in sifrantRooms) {
            sezHtml += '<a href="' + indexFileUrl + '?room=' + roomID + '">' + sifrantRooms[roomID] + " - " + roomID + '</a><br>';
        }
        $('#message_errorRoomNotSelected').html(sezHtml).show();
        $('#logo-container').html("Select room to continue");

        $('#message_errorData').hide();
    } catch (e) {
        dataLoaded = false;
        //show error!
        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku.   ");
        $('#message_errorData').show();

    }
    // }

}


function rebuildUI(currentDT) {
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

                myULhtml += nextTimeLineElement(getFakeLineElement(lastEndTimeText, dataReservations[i].start), count, currentDT, true);

                count++;
                //insert next termin
                //   myULhtml+=nextTimeLineElement(item,count, currentDT);
            } else if (lastEndTime == startDT) {
            }

            lastEndTimeText = dataReservations[i].end;
            lastEndTime = new Date(new Date(dataReservations[i].end).getTime() + dataTimeOffset);
            //vstavi praznega + aktualnega
            myULhtml += nextTimeLineElement(item, count, currentDT, false);

            if (i == dataReservations.length - 1 && lastEndTime < new Date(new Date(dayTimeMax).getTime() + dataTimeOffset)) { //fake na koncu
                count++;
                //insert fake termin

                myULhtml += nextTimeLineElement(getFakeLineElement(lastEndTimeText, dayTimeMax), count, currentDT, true);
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


function nextTimeLineElement(item, count, currentDT, isFreeReservation) {

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


function loadData() { //loadReservations new

    var urlGDOC = dataUrl + 'reservations/?start=' + selectedDate + '%2000:00&end=' + selectedDate + '%2023:59&reservables=' + selectedRoom_id + '&format=json';
    var data;
    var dataLoadedOK = true;
    try {
        data = getExternalData_UrnikApi_MultiObjects_Recursive_sync(urlGDOC);
    } catch (e) { // if software exeption thrown
        dataLoadedOK = false;

        dataServerFailedConnAttempts_counter=Math.min(dataServerFailedConnAttempts_counter+1,dataServerFailedConnAttempts_max);

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


    if (dataLoadedOK) {

        try {
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
                    var reservation = getDataFromCache(item, getED_ReservableByID);
                    if (reservation != null && reservation.type === "teacher") {
                        if (teachersN > 0) {
                            teachers += "; ";
                        }
                        teachersN++;
                        teachers += textClean(getDataFromCache(reservation.name, getED_FullOrganizerNameByEmail));
                    } else if (reservation != null && reservation.type === "classroom") {
                        if (roomsN > 0) {
                            rooms += "; ";
                        }
                        roomsN++;
                        rooms += textClean(reservation.slug);////getSifrant_RoomName_sync(item) )  ;
                    } else {
                    }   //skupine = groups .. ne rabim

                });

                dataReservations_tmp[i].roomsText = rooms;   //..shrani kot nov parameter   //requirementsText =rooms
                dataReservations_tmp[i].teachersText = (teachers === "" ? "-" : teachers);// teachers; ///..shrani  //reservablesText = teachers
                //"-" == dekanat default
            });


            dataReservations = jQuery.extend(true, [], dataReservations_tmp);//deep copy//  (true, {}, dataReservations_tmp)

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
    }

}


//### DATA API HELPER func. ###//


function getED_RemoteConfig() { //
    var params=(selectedRoom_id!=null)?("?selectedRoomID="+selectedRoom_id):("");
    var params = params + ( (selectedRoom_name!=null)?("&selectedRoomName="+selectedRoom_name):("")) ;
    var url = remoteConfigUrl+params;
    return getExternalData_singleObjectByURL_sync(url);
}

function getED_ReservableByID(resID) { // same for organizer/room/group
    var url = dataUrl + 'reservables/' + resID + '/?format=json';
    return getExternalData_singleObjectByURL_sync(url);
}



function getED_FullOrganizerNameByEmail(email) {
    var url = ldapUrl + '?userPrincipalName=' + email;
    var data = getExternalData_singleObjectByURL_sync(url); // ==null if error/fail
    try {
        if (data.error === "") {// "" ==no error
            data = data.displayname; // textClean( data.slug.toString() ); // {"error":"", "displayname":"Bosnić, Zoran","userprincipalname":"zbosnic@fri1.uni-lj.si" }
        }
    } catch (e) {
        data = "*"; //null?
    }
    return data;
}


function getED_AllClassroms_IDsAndNames(url) { // return as hashTable
    //  var url;
    var data = {};

    try {
        var tmp_data = getExternalData_UrnikApi_MultiObjects_Recursive_sync(url);
        if (tmp_data != null) {
            // for each room on current page
            $.each(tmp_data, function (i, item) {
                data[item.id.toString()] = textClean(item.slug.toString()); //slug : "PR08" ,id : 3146  // sifrantRooms is GLOBAL!!
            });

        } else {                //return nothing ?!
        }
    } catch (e) {
        data = null; // throw "Oh no! Can not connect to server or  strange data!";
    }
    return data;
}



///external AJAX calls

// generic
function getExternalData_singleObjectByURL_sync(urlGDOC) {   //   var urlGDOC = dataUrl + 'reservables/' + resID + '/?format=json';
    var response = null;

    $.ajax({
        timeout: ajaxTimeout, //  timeout
        url: urlGDOC,
        async: false,//!!
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
function getExternalData_UrnikApi_MultiObjects_Recursive_sync(url) {

    var response = Object.create(null);//= {};
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: url,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            if (data.count >= 0) {
                response = data.results;//response.concat( data.results  );
                if (data.next != null) {  //RECURSIVELY
                    var nextDataUrl_viaProxy = data.next.replace(originalDataApiUrl, dataUrl); // change https://urnik.fri.uni-lj.si/reservations/ to owr server domain/data.php/...
                    var tmp = getExternalData_UrnikApi_MultiObjects_Recursive_sync(nextDataUrl_viaProxy); // next : "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=2&format=json"
                    response = response.concat(tmp);
                }
            } else { //return nothing ?!
            }
        } catch (e) {
            throw "Oh no! Can not connect to server or  strange data!";
        }

    }).fail(function () {
        throw "Oh no! Can not connect to server  !";
    }).always(function () {        //
    });
    return response;
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


// make short data documentation/////////////////


/*
 demo DATA patterns


 // var dataReservations = '[{"reason": "J. CimpriÄ", "start": "2016-09-12T08:00:00", "end": "2016-09-12T10:00:00", "owners": [662], "reservables": [3159], "requirements": [], "id": 3340759}, {"reason": "APS1 pisni izpit", "start": "2016-09-12T12:00:00", "end": "2016-09-12T14:00:00", "owners": [21, 252, 3, 106], "reservables": [3158], "requirements": [], "id": 539358}, {"reason": "APS1 pisni izpit", "start": "2016-09-12T12:00:00", "end": "2016-09-12T14:00:00", "owners": [21, 252, 3, 106], "reservables": [3157], "requirements": [], "id": 539359}, {"reason": "Zagovori diplomskih del", "start": "2016-09-12T09:00:00", "end": "2016-09-12T14:00:00", "owners": [666], "reservables": [3151], "requirements": [], "id": 3952464}, {"reason": "Zagovori zakljuÄnih del", "start": "2016-09-12T08:00:00", "end": "2016-09-12T15:00:00", "owners": [666], "reservables": [3156], "requirements": [], "id": 3952465}, {"reason": "zagovori zakljuÄnih del", "start": "2016-09-12T08:00:00", "end": "2016-09-12T20:00:00", "owners": [666], "reservables": [3152], "requirements": [], "id": 3347488}, {"reason": "zagovori zakljuÄnih del", "start": "2016-09-12T08:00:00", "end": "2016-09-12T20:00:00", "owners": [666], "reservables": [3153], "requirements": [], "id": 3347489}, {"reason": "zagovori diplomskih del ", "start": "2016-09-01T08:00:00", "end": "2016-10-01T16:00:00", "owners": [666], "reservables": [3150], "requirements": [], "id": 3315786}, {"reason": "Vpis ĹĄtudentov", "start": "2016-09-12T08:00:00", "end": "2016-09-12T17:00:00", "owners": [688], "reservables": [3142], "requirements": [], "id": 3839223}]';
 //var dataReservations= '[{"reason": "Teorija informacij in sistemov(63216)_P", "start": "2016-04-12T12:00:00", "end": "2016-04-12T15:00:00", "owners": [], "reservables": [3158, 3249], "requirements": [], "id": 3511946}, {"reason": "RaÄunalniĹĄke komunikacije(63708)_P", "start": "2016-04-12T09:00:00", "end": "2016-04-12T12:00:00", "owners": [], "reservables": [3158, 3286], "requirements": [], "id": 3511950}] ';

 //https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-04-12%2000:00&end=2016-04-12%2023:40&reservables=3151&format=json
 // var dataReservations='[{"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2595699}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2615525}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2639402}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2644072}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2620376}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2644132}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2600711}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2644180}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2625160}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2605724}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2629912}, {"reason": "Vhodno-izhodne naprave(63728)_P", "start": "2016-04-12T09:00:00", "end": "2016-04-12T12:00:00", "owners": [], "reservables": [3151, 3274], "requirements": [], "id": 3511939}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 3511942}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2585621}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2634657}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2610656}, {"reason": "Umetna inteligenca 1(63501)_P", "start": "2016-04-12T17:00:00", "end": "2016-04-12T20:00:00", "owners": [], "reservables": [3151, 3288, 4578], "requirements": [], "id": 2590667}]';

 //https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-04-12%2000:00&end=2016-04-12%2023:40&reservables=3156&format=json
 //var dataReservations ='[{"reason": "RK pisni izpit", "start": "2016-04-12T09:00:00", "end": "2016-04-12T12:00:00", "owners": [118], "reservables": [3156], "requirements": [], "id": 2949952}, {"reason": "Izbrana poglavja iz umetne inteligence 2(63835B)_P", "start": "2016-04-12T16:00:00", "end": "2016-04-12T19:00:00", "owners": [], "reservables": [3156], "requirements": [], "id": 3511931}, {"reason": "Aktualno raziskovalno podroÄje II(63546C)_P", "start": "2016-04-12T12:00:00", "end": "2016-04-12T15:00:00", "owners": [], "reservables": [3156, 3220], "requirements": [], "id": 3511998}]';


 //https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-05-16%2000:00&end=2016-05-16%2023:40&reservables=3137&format=json
 //LAST OK var dataReservations='[{"reason": "Programiranje 2(63278)_LV", "start": "2016-05-16T13:00:00", "end": "2016-05-16T15:00:00", "owners": [], "reservables": [3137, 3294], "requirements": [], "id": 3513668}, {"reason": "Programiranje 2(63278)_LV", "start": "2016-05-16T15:00:00", "end": "2016-05-16T17:00:00", "owners": [], "reservables": [3137, 1422], "requirements": [], "id": 3513673}, {"reason": "Principi programskih jezikov(63220)_LV", "start": "2016-05-16T09:00:00", "end": "2016-05-16T11:00:00", "owners": [], "reservables": [3137, 1447], "requirements": [], "id": 3513674}, {"reason": "Osnove verjetnosti in statistike(63710)_LV", "start": "2016-05-16T11:00:00", "end": "2016-05-16T13:00:00", "owners": [], "reservables": [3137, 3298], "requirements": [], "id": 3513680}, {"reason": "Digitalno procesiranje signalov(63744)_LV", "start": "2016-05-16T07:00:00", "end": "2016-05-16T09:00:00", "owners": [], "reservables": [3137], "requirements": [], "id": 3513698}]';

 /!*   var dt = new Date();
 var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
 var datum= dt.getFullYear()+"-"+dt.getMonth()+"-"+dt.getDay();

 var room=3156;*!/

 // GDOC obvestilo
 // LAST  var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservations/?start='+selectedDate+'%2000:00&end='+selectedDate+'%2023:59&reservables='+selectedRoom_id+'&format=json';//http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-05-16%2000:00&end=2016-05-16%2023:40&reservables=3137&format=json';
 //https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-09-12%2012:00&end=2016-09-12%2012:40&reservables=3156&format=json'; //"http://cors.io/?u=http://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-09-12%2012:00&end=2016-09-12%2012:40&reservables=3156&format=json";  //"https://docs.google.com/document/d/18WneQRkPoUWD8DrTPL-71r3zwqSCXAAesAQAL0AzvJ0/export?exportFormat=txt";


 var urlGDOC= dataUrl+'reservations/?start='+selectedDate+'%2000:00&end='+selectedDate+'%2023:59&reservables='+selectedRoom_id+'&format=json';

 // var urlGDOC= "https://urnik.fri.uni-lj.si/reservations/reservations/?start="+datum+"%2000:00&end="+datum+"%2023:59&reservables="+room+"&format=json";  //"https://docs.google.com/document/d/18WneQRkPoUWD8DrTPL-71r3zwqSCXAAesAQAL0AzvJ0/export?exportFormat=txt";
 //var urlGDOC='http://webproxy.to/browse.php/Uyknn661/3LXVghWC/pj6pXX_2/BKq8HAiW/C8H6vHjN/QoNYh4Rt/MK1mo8ek/DfFM1p1q/CJhxUrLB/8CAzqZV6/95r1PPXZ/VHHhxeTu/DLzsP3os/FsbaRMGI/8ScUhm9z/vd0bocQ3/FE8LaY6M/jPVfaptB/4RtgSyuv/DpAjdHhT/PD_2FPGc/zdYHYw_3/D_3D/b0/fnorefer';
 //                        'https://proxy-nl.hide.me/go.php?u=V97%2BOXUp5KeQDcc7Gh0rOhcHVVyR0hnUvSKrNizfvu4Z%2B%2BEdwvv5fIJtGdQwfYaFYITX%2BT%2BYvacPTMkG5I289baP2F3o4%2FJJE20Qq4jY0cY0Ek2cKX38eMMwKtjQKVKEgIlN39%2FGjxV1huzt6xzVKxiW%2FDVGj6790vuUP6f2vg%3D%3D&b=0&f=norefer';

 //original
 //https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?format=json
 //"next": "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=2&format=json"
 //"next": null

 //{"count": 32, "next": null, "previous": "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=1&format=json", "results": [{"id": 3157, "slug": "P22", "type": "classroom", "name": "Avditorna 100", "nresources_set": [{"id": 1469, "resource": {"id": 12, "slug": "delovno-mesto"
 // results [{slug},{slug},...]


 //"id": 1487, "slug": "zbosnicfri1uni-ljsi", "type": "teacher", "name": "zbosnic@fri1.uni-lj.si",


 */



