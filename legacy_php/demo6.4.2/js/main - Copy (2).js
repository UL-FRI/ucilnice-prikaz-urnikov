/*
 * Created by GregorS
 *
 * version: v6 beta publicDemo6 - 28/11/2016. delete expirated data (default next day) and hide main panel
 * version: v5 beta publicDemo5 - 26/11/2016. glede na ip doloci prikaz podatkov neke ucilnice
 * version: v4 beta publicDemo4 - 16/11/2016. v timetable so vrinjeni tudi prosti termini
 * version: v3 beta publicDemo3 - 16/11/2016.
 * version: v1.0 beta publicDemo - 27/9/2016.
 *-----------------------------------------------------------------------------------
 *
 * Main JS =   dataAPI & functionality & graphicUI manipulation
 -----------------------------------------------------------------------------------*/

/* to-do
* dayLight time shift!! upostevaj !! - preko mreze uporabi NTP za pravilen cas in bo vse ok!
*
* - connect cookies and getURLParameter('room')
* - global json settings (to reset/refresh page, global control)
* - add colors on vertical timeline ..= as intervals .. if room free/reserved
* -
* - 1dan v naprej podatke si zapomni
* - ldap , proxy .. mora biti backup, round-robin...!!!
* - pisi za licence za android app
* - barvaj vertikalno casovno skalo prosto/zasedeno
*
* - text resize na desni strani ... omeji kvader kamor se lahko  razsiri  tekst
*
* - code cleanup
* */

//### GLOBAL VARIABLEs ###
var selectedRoom_sifra;
var selectedRoom_ime;
var selectedDate;
var selectedTime;
var urlTimeSet = false;
var urlDateSet = false;

var dataReservations; //ajax response;
var data_tmp; // new attempt to cennect to server, if anything ok then data=data_tmp;

//var tomorrowDT = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

var lastSuccessfulServerConnectionTime;  //streznik Strani //TODO!! not yet implemented  // if more than xx seconde/minutes then prompt offline mode error
var lastSuccessfulDataServerConnectionTime; // Urnik API
var lastSuccessfulLDAPServerConnectionTime; // LDAP //TODO!! not yet implemented

var expirationOfData_DT; //do not change, it is calculated auto. //= new Date(lastSuccessfulDataServerConnectionTime.getFullYear(), lastSuccessfulDataServerConnectionTime.getMonth(), lastSuccessfulDataServerConnectionTime.getDate()+expirationOfData_inDays);
var expirationOfData_inDays=1; //do not change //change only if you loaded enough of data in advance, default is 1 day

var dataTimeOffset;
var pageUrl= window.location.origin +   window.location.pathname.substring(0,window.location.pathname.lastIndexOf("/"));   //"";//"../"; //  // "http://cid.fri1.uni-lj.si/demo5/"   //"http://cid.fri1.uni-lj.si";  // SET "" on server!!
var dataUrl = pageUrl+"/data.php/";//"http://193.2.72.115/data.php/";//   "http://193.2.72.115/data.php/" -temp,on localhost , "data.php/" -on server, "https://urnik.fri.uni-lj.si/reservations/" -original
var ldapUrl= pageUrl+"/ldap.php";
var myIpUrl=  pageUrl+"/myip.php";

var configDataUrl="config.json";
var refreshDataInterval=5 * 60 * 1000; //every 60s x 5= 5min
var refreshUIInterval= 30 * 1000; //every 30s
var refreshFullPageInterval= 60 * 60 * 100; //every hour ?!  // DO not work yet.. use config force-refresh:1, to force refresh

var ajaxTimeout= 3000; // sets timeout to 3 seconds

var sifrantRooms;
var sifrantRooms_Loaded=false;

var status_dataServer=false;
var status_pageServer=false;


//### INIT ###
$(document).ready(function () {
    lastSuccessfulServerConnectionTime = new Date();
    //ZACASNO!!
    sifrantRooms = Object.create(null);//= {};
// myIPtoClassId.js  ..


    //// get DATE
    //from url -   http://localhost:63342/classroominfodisplay-fri/materialtheme/demo2.2live.html?room=3137&date=2016-05-16&time=12:00
    selectedDate = getURLParameter('date');//2016-09-12
    selectedTime = getURLParameter('time');//12:00

    //or from current Date()
    var d = new Date();

    if (selectedDate == null) {
        selectedDate = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);//"2016-05-16"; //
        urlDateSet=false;
    }else{urlDateSet=true;}

    if (selectedTime == null) {
        selectedTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);//+ ":" + ('0' + d.getSeconds()).slice(-2);;
        urlTimeSet = false;
    } else {
        urlTimeSet = true;
    }




    dataTimeOffset = new Date().getTimezoneOffset() * 60000; // !! podatki so zapisani na UTC 00 v resnici pa so v casovnem pasu  +1 oz +2!!!!!!!!!!!!!!!!!!!!




    //get Room sifra and Name

   /* COOKIJI ?!?! underConstruction

    //1. test cookie
//    selectedRoom_id= $.cookie('device_id');
    if($.cookie('device_id') === undefined){ //selectedRoom_id==null){ //set cookie
        $.cookie('device_id', 'device'+Math.floor(Math.random() * (99999 - 10000 + 1) + 100000)   , { expires: 2147483647 , path: '/' }); //2^31 - 1 = 2147483647 = 2038-01-19 04:14:07    //Math.floor(Math.random() * (max - min + 1) + min);
    }else{
        selectedRoom_id= $.cookie('device_id');
        //get pair  deviceID and roomID

        //if exists use paired roomID
        ///else set as null
    }
*/

   //test IP
    if ( myIPtoClassId( getMyIP().toString() ) != "" ) { //"192.168.1.102"
        selectedRoom_sifra= myIPtoClassId( getMyIP().toString() );
    }

    //test url atribut  !! url overwrite if not empty!!
    if (getURLParameter('room') != null) {
        selectedRoom_sifra = getURLParameter('room');
    }


    if (selectedRoom_sifra == null) { //ce ni v url atribut Room dolocena sifra koncaj!! in izpisi seznam povezav do prostorov!!!!!!!!!


        setInterval(refreshSifrantRooms, refreshUIInterval);
        refreshSifrantRooms();

    }else{

        //refreshData();
        setInterval(refreshData, refreshDataInterval);

        // refreshUI();
        setInterval(refreshUI, refreshUIInterval);



        //first time load manually
        refreshData();
        refreshUI();


    }






//hack hide chrome search bar
    window.scrollTo(0,1);
   // document.body.requestFullscreen();

});//end init


//### 2 ESSENTIAL functions ###//

//TODO //get data about page config info e.g. time to hard page reset
function refreshPage() {
//if not set ,can not communicate to webSERVER .. try on 5 min
    //before hard reset ping web server inf is accesible ... if it is hard refresh, it it is not do not refresh -push error

    //normaly refresh at midnight  every day

}

function refreshSifrantRooms() {
    if( sifrantRooms_Loaded){

        return -1;//force stop
        //
    }else {
        loadData_Classrooms();
         }
}


function refreshData() {

    //get Room name, if not known yet
    if (selectedRoom_ime == null || selectedRoom_ime == "") {
        selectedRoom_ime = getFullReservationByID_sync(selectedRoom_sifra).slug; // getSifrant_RoomName_sync(selectedRoom_id);//sifrantRooms[selectedRoom_id.toString()]
    }
    loadData();


    // ce je tezava z vzpostavitvijo do server api ...izpisi error
    // ce je cas zadnje osvezitve daljsi kot xxxx error
    // ce je nov dan ... podatki so iz prejsnjega dne... pocisti stran in podaj obvestilo (ali pobrisi data objekt in bo samo javilo ..)
}


function refreshUI() {
  //  $('#message_errorData').hide();
    // update TIME
    if (urlTimeSet == false) { // if false use current time if true use url time
        var d = new Date();
        selectedTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);//+ ":" + ('0' + d.getSeconds()).slice(-2);;
    }

    // update Date
    if (urlDateSet == false) { // if false use current date if true use url time
        var d = new Date();
        selectedDate = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);//"2016-05-16"; //
    }

    // var currentDate = ;//"2016-05-16T11:01:00";//"2016-04-12T16:01:00";//"2016-09-12T14:15:00";///TEST!!
    var currentDT = new Date(new Date( selectedDate + "T" + selectedTime  ).getTime()  + dataTimeOffset);
    var currentDTFormat = ('0' + currentDT.getDate()).slice(-2) + "/" + ('0' + (currentDT.getMonth() + 1)).slice(-2) + "/" + currentDT.getFullYear() + " " + ('0' + currentDT.getHours()).slice(-2) + ":" + ('0' + currentDT.getMinutes()).slice(-2) ;//+ ":" + ('0' + currentDT.getSeconds()).slice(-2);
    $('#currentDateAndTime').html(currentDTFormat);

    // delete expired delete  //!! CLEAN OLD DATA!!!!!
    if(compareDates(expirationOfData_DT, currentDT)<= 0){
        dataReservations=null;
//        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali podatkovnega strežnika.");//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku. " );

        $('#message_errorData').show();
    }

    if (selectedRoom_ime != "" && dataReservations != null) {
        //dataReservations -uporabi zadnje shranjene podatke

        $('#logo-container').html("Učilnica " + selectedRoom_ime + " / Seznam rezervacij");

        //show time table zaslon
        $('#work').show();
        $('#loading').hide();
        rebuildUI(currentDT);


    } else {
        /// izpisi error ... cakam na podatke, lahko gre za tezavo z internetno povezavo
        //$('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali podatkovnega strežnika.");//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
       // $('#message_errorData').show();
        //$('#logo-container').html("Room info loading...");
        $('#work').hide();
        $('#loading').show();
    }
  //  window.scrollTo(0,1);
}


//### 2 SUB-ESSENTIAL functions ###//

// tmp
function nextTimeLineElement(item,count, currentDT,isFreeReservation) {

    var startDT = new Date(new Date(item.start).getTime() + dataTimeOffset);
    var endDT = new Date(new Date(item.end).getTime() + dataTimeOffset);

    var resStatus = statusOfReservation(startDT, endDT, currentDT); // -1 old, 0 current , 1 following

    var myLI = '<li class="work  ' + (resStatus == -1 ? "fgrey" : "") + '">' +
        '<input class="radio" id="work' + count + '" name="works" type="radio"  ' + (resStatus == 0 ? "checked" : "") + '>' +
        '<div class="relative">' +
        '<label for="work' + count + '">  ' +    item.reason   + ' </label>' + //unescape(x);  //JSON.parse('"' + item.reason.replace('"', '\\"') + '"')
        '<div class="date"> <b> ' + ( startDT.getHoursMY() + ':' + startDT.getMinutesMY() ) + ' </b><br> <div style="">   ' + (endDT.getHoursMY() + ':' + endDT.getMinutesMY() ) + '    </div> </div> ' +
        '<span class="circle ' + (resStatus == -1 ? "grey" : (isFreeReservation?"green":"")) + '"></span>' +
        '</div> ' +
        ' <div class="content"> ' +
        ' <p>   </p>' +
        '  </div>  </li>';

    return myLI;
   /* myULhtml += myLI;
    count++;
    if (resStatus == 0) {
        checkedReservation = item;
    }*/
}

function getFakeLineElement(startDT,endDT) {
    var fkLn= JSON.parse('{"reason": "PROST TERMIN", "start": "'+startDT+'", "end": "'+endDT+'", "owners": [ ], "reservables": [], "requirements": [], "id": 0} ' );//"2016-09-27T13:00:00"
    fkLn.teachersText="-";
    fkLn.roomsText="-";
    return fkLn;
}

function rebuildUI(currentDT) {
    var checkedReservation_isFree=false;
    var myULhtml = "";
    var count = 1;
    var checkedReservation = null;

    var dayTimeMin= selectedDate + "T" + "00:00:00";//new Date(new Date( selectedDate + "T" + "00:00:00"  ).getTime() + dataTimeOffset); // 00:00
    var dayTimeMax= selectedDate + "T" + "23:59:00";//new Date(new Date( selectedDate + "T" + "23:59:00"  ).getTime() + dataTimeOffset); // 23:59 ..mora biti z datimom vred!

    if(dataReservations.length ==0){ //cel dan prazen
        checkedReservation =getFakeLineElement(dayTimeMin,dayTimeMax);
            myULhtml+=nextTimeLineElement( checkedReservation , count, currentDT ); //???!! preveri ce to drzi
        checkedReservation_isFree=true;
        count++;
    }else{

        // ce je prvi fake

        var lastStartTime= new Date(new Date(dayTimeMin).getTime() + dataTimeOffset);
        var lastEndTime= lastStartTime;
        var lastStartTimeText=dayTimeMin;
        var lastEndTimeText= dayTimeMin;

        // ce je fake/nefake vmes
        $.each(dataReservations, function (i, item) {

            var startDT = new Date(new Date(item.start).getTime() + dataTimeOffset);
            var endDT = new Date(new Date(item.end).getTime() + dataTimeOffset);

            var resStatus = statusOfReservation(startDT, endDT, currentDT); // -1 old, 0 current , 1 following

            if( lastEndTime < startDT ){
                //vstavi le aktualnega
                //instert fake as trenuten termin

                myULhtml+=nextTimeLineElement(  getFakeLineElement(lastEndTimeText,dataReservations[i].start)  ,count, currentDT, true);


                // checkedReservation_isFree=true;
                count++;
                //insert next termin
             //   myULhtml+=nextTimeLineElement(item,count, currentDT);
            } else if(lastEndTime == startDT) {

            }
            lastEndTimeText=dataReservations[i].end; lastEndTime= new Date(new Date( dataReservations[i].end ).getTime() + dataTimeOffset);
            //vstavi praznega + aktualnega
            myULhtml+=nextTimeLineElement(item,count, currentDT, false);

            if(i== dataReservations.length -1 && lastEndTime < new Date(new Date( dayTimeMax ).getTime() + dataTimeOffset)) { //fake na koncu
            count++;
           //insert fake termin

           myULhtml += nextTimeLineElement(  getFakeLineElement(lastEndTimeText, dayTimeMax)  , count, currentDT,true);
           //checkedReservation_isFree = true;

       }



            if(i==0 && resStatus == 1){ //fake na zacetku
                checkedReservation = getFakeLineElement(dayTimeMin,dataReservations[i].start);
               checkedReservation_isFree=true;

            }else if (resStatus==1 && checkedReservation==null){ ///fake vmes
               checkedReservation =getFakeLineElement(dataReservations[i-1].end,dataReservations[i].start);
               checkedReservation_isFree=true;

            }else if(resStatus==0){ // izbran je tudi trenuten termin
                checkedReservation = item;

            }else if(i== dataReservations.length -1 && resStatus ==-1){ //fake na koncu
                checkedReservation =getFakeLineElement(dataReservations[i].end,dayTimeMax);
                checkedReservation_isFree=true;

            }else{ // ostali ? cel dan prazen

            }



            count++;

            });


        }//else




    $('#timeline').html(myULhtml);
    var halfPadding = ((930 - (count * 69))) / count;
    $('#timeline li').css({'margin': ' ' + halfPadding + 'px 0 ' + halfPadding + 'px 0  '}); //css('margin') = "margin: 60px 0 "+(930-(count*70))/count +"px 0";



    var startDT = new Date(new Date(checkedReservation.start).getTime() + dataTimeOffset);
    var endDT = new Date(new Date(checkedReservation.end).getTime() + dataTimeOffset);
    $('div[id^="currentReservation-"]').attr("class", "fred");//.removeClass( "fgreen" ).addClass( "fred" );

    $('#currentReservation-termin').html(startDT.getHoursMY() + ':' + startDT.getMinutesMY() + " - " + endDT.getHoursMY() + ':' + endDT.getMinutesMY());
    $('#currentReservation-namen').html(checkedReservation.reason);

    $('#currentReservation-organizatorji').html(checkedReservation.teachersText);//checkedReservation.owners.toString()   //bivsi reservablesText
    $('#currentReservation-opombe').html(checkedReservation.roomsText); //bivsi requirementsText

    if(checkedReservation_isFree){
        $('div[id^="currentReservation-"]').attr("class", "fgreen");//.removeClass( "fred" ).addClass( "fgreen" );//css({});
        $('#timelineFrame .radio:checked + .relative .circle ').css("background","#48b379");
           // background: #48b379;
    }

    $('div[id^="currentReservation-"]').autoSizr();//.resizeText();
  //  $('#currentReservation-namen').autoSizr();//.resizeText();
  //  $('#currentReservation-organizatorji').autoSizr();
  //  $('#currentReservation-opombe').autoSizr();

}


function loadData() {

    var urlGDOC = dataUrl + 'reservations/?start=' + selectedDate + '%2000:00&end=' + selectedDate + '%2023:59&reservables=' + selectedRoom_sifra + '&format=json';

    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: urlGDOC,
        async: false//true//,
        //dataType: 'jsonp'//,                dataType: "jsonp"
    }).done(function (data) {

        $('#message_errorData').html("");
        $('#message_errorData').hide();

        //{"count": 0, "next": null, "previous": null, "results": []}   // ce je prazno https://urnik.fri.uni-lj.si/reservations/reservations/?start=2016-09-27%2023:00&end=2016-09-27%2023:40&reservables=3155&format=json

        lastSuccessfulDataServerConnectionTime = new Date();
        expirationOfData_DT= new Date(lastSuccessfulDataServerConnectionTime.getFullYear(), lastSuccessfulDataServerConnectionTime.getMonth(), lastSuccessfulDataServerConnectionTime.getDate()+expirationOfData_inDays);


        data = $.trim(data);
        dataReservations = data;

        // convert string to JSON
        dataReservations = $.parseJSON(dataReservations);
        //SORT!!!!!!!


        dataReservations=dataReservations.results;// tmp!!
        dataReservations.sort(comp);


        //convert all  id numbers to names
        $.each(dataReservations, function (i, item) {
            var teachersN=0,roomsN=0;
            var teachers="",rooms="";

            dataReservations[i].reason= textClean( dataReservations[i].reason );

            // for rooms/teachers
            $.each(item.reservables, function (j, item) {
                var reservation = getFullReservationByID_sync(item);
                if(reservation!=null &&   reservation.type=="teacher"){
                    if(teachersN>0){  teachers += "; "; }
                    teachersN++;
                    teachers += textClean( getFullNameByEmail_sync( reservation.name) );  ////getSifrant_OrganizatorName_sync(item) )  ;
                }else if(reservation!=null && reservation.type=="classroom"){
                    if(roomsN>0){  rooms += "; "; }
                    roomsN++;
                    rooms += textClean( reservation.slug);////getSifrant_RoomName_sync(item) )  ;
                }else{}   //skupine = groups .. ne rabim

            });
            dataReservations[i].roomsText = rooms;   //..shrani kot nov parameter   //requirementsText =rooms
            dataReservations[i].teachersText = (teachers ==""? "DEKANAT":teachers);// teachers; ///..shrani  //reservablesText = teachers

        });

     /*   if (data == "[]") {  //  "[]" ?! if empty
            //  }else {
            $('#message_errorData').html("Prostor je cel dan brez rezervacij!"); /// ustvari fiktiven razdelek 6:00 - 21:00 ?!
            $('#message_errorData').show();

        }
       */

    }).fail(function () {
         var d=lastSuccessfulServerConnectionTime;//new Date(lastSuccessfulServerConnectionTime);
        var sDate = ('0' + d.getDate()).slice(-2) + "/" +  ('0' + (d.getMonth() + 1)).slice(-2) + "/" +   d.getFullYear() ;  //selectedDate;//d.getFullYear() + "-" +  ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) ;
        var sTime = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) ;//selectedTime;//('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) ;//+ ":" + ('0' + d.getSeconds()).slice(-2);;
     //   lastSuccessfulServerConnectionTime = new Date(selectedDate + "T" + selectedTime);


        $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od " + sDate + " " + sTime);//ajax napaka: fail, data refresh! --Težave pri pridobivanju podatkov - motnje zaradi omrežja ali del na strežniku. V tem času podatki lahko niso točni! Podatki od
        // --niso več aktualni ---minut oz sekund od zadnje osvezitve ... Težave pri pridobivanju podatkov. Možne težave z omrežjem ali potekajo dela na strežniku.
        $('#message_errorData').show();
        $('#message_errorData').autoSizr();
    }).always(function () {
        //   alert( "complete" );
    });

}//end loadData


//### DATA API HELPER func. ###//

function getFullReservationByID_sync(resID) {
    //var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservables/'+sifra+'/?format=json';
    var urlGDOC = dataUrl + 'reservables/' + resID + '/?format=json';

    var response=null ;
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: urlGDOC,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            response = data; // textClean( data.slug.toString() );
        } catch (e) {
           // response = "";
        }
    }).fail(function () {
       // response = "";
    }).always(function () {
    });

    return response;
}


function getFullNameByEmail_sync(email) {
    //var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservables/'+sifra+'/?format=json';
    var urlGDOC = ldapUrl + '?userPrincipalName=' + email;// + '/?format=json';//?userPrincipalName=zbosnic@fri1.uni-lj.si

    var response=null ;
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: urlGDOC,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            if(data.error ==""){// "" ==no error
                response = data.displayname; // textClean( data.slug.toString() ); // {"error":"", "displayname":"Bosnić, Zoran","userprincipalname":"zbosnic@fri1.uni-lj.si" }
            }
        } catch (e) {
            // response = "";
        }
    }).fail(function () {
        // response = "";
    }).always(function () {
    });

    return response;
}



//original
//https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?format=json
//"next": "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=2&format=json"
//"next": null

//{"count": 32, "next": null, "previous": "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=1&format=json", "results": [{"id": 3157, "slug": "P22", "type": "classroom", "name": "Avditorna 100", "nresources_set": [{"id": 1469, "resource": {"id": 12, "slug": "delovno-mesto"
// results [{slug},{slug},...]
function loadData_Classrooms() { //"id": 1487, "slug": "zbosnicfri1uni-ljsi", "type": "teacher", "name": "zbosnic@fri1.uni-lj.si",
    //var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservables/'+sifra+'/?format=json';
    var urlGDOC = dataUrl + "sets/rezervacije_fri/types/classroom/reservables/?format=json";// //'reservables/' + sifra + '/?format=json';

    var dataLoaded=false;
  //  while(!dataLoaded) { // try to get data
        try {
            loadAllClassrooms_sync(urlGDOC);
            sifrantRooms_Loaded=true;

            var sezHtml = "";
            var fileName ;//= location.href.split("/").slice(-1)[0].split('.', 1)[0]; // index , index5 , ...

            fileName="index";//TMP-zacasno, zgormnja funkcija se ni testirana!!!!
            for (var key in sifrantRooms) {
                sezHtml += '<a href="' + fileName + '.html?room=' + key + '">' + sifrantRooms[key] + " - " + key + '</a><br>';
            }
            $('#message_errorRoomNotSelected').html(sezHtml).show();
            $('#logo-container').html("Select room to continue");

            $('#message_errorData').hide();
        } catch (e) {
            dataLoaded=false;

            $('#message_errorData').html('<i  class="mdi-image-flash-on"></i>' + "Motnje pri pridobivanju podatkov -  zaradi omrežja ali del na strežniku.   ");
            $('#message_errorData').show();
            //show error!
        }
   // }


}


function loadAllClassrooms_sync(url) { //"id": 1487, "slug": "zbosnicfri1uni-ljsi", "type": "teacher", "name": "zbosnic@fri1.uni-lj.si",

    var response = "";
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: url,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        //data = $.trim(data);
        // convert string to JSON
      //  data = $.parseJSON(data);

        try {
            if (data.count > 0) {

                // for each room on current page
                $.each(data.results, function (i, item) {
                    sifrantRooms[ item.id.toString() ] = textClean ( item.slug.toString() ); //slug : "PR08" ,id : 3146
                    // sifrantRooms  GLOBAL!!
                });
                if (data.next != null) {  //RECURSIVELY
                    loadAllClassrooms_sync(data.next); // next : "https://urnik.fri.uni-lj.si/reservations/sets/rezervacije_fri/types/classroom/reservables/?page=2&format=json"
                }

            } else {
                //return nothing ?!
            }

        } catch (e) {
            throw "Oh no! Can not connect to server or  strange data!";
        }

    }).fail(function () {
        response = "";

        throw "Oh no! Can not connect to server or  strange data!";

    }).always(function () {        //
    });

}



/* //NE POTREBUJEM VEC
function getSifrant_OrganizatorName_sync(sifra) { //"id": 1487, "slug": "zbosnicfri1uni-ljsi", "type": "teacher", "name": "zbosnic@fri1.uni-lj.si",
    //var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservables/'+sifra+'/?format=json';
    var urlGDOC = dataUrl + 'reservables/' + sifra + '/?format=json';

    var response = "";
    $.ajax({
        url: urlGDOC,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            if(data.detail=="Not found"){
                response = "Dekanat";
            }else{
                response = "@" + textClean(data.name.toString()).split('@', 1)[0]; //@zbosnic
            }
        } catch (e) {
            response = "";
        }
    }).fail(function () {
        response = "";
    }).always(function () {        //   alert( "complete" );
    });

    return response;
}

*/
/* //NE POTREBUJEM VEC
function getSifrant_RoomName_sync(sifra) {  //"id": 3156, "slug": "P04", "type": "classroom", "name": "Avditorna 50 5"
    //var urlGDOC= 'http://cors.io/?https://urnik.fri.uni-lj.si/reservations/reservables/'+sifra+'/?format=json';
    var urlGDOC = dataUrl + 'reservables/' + sifra + '/?format=json';

    var response = "";
    $.ajax({
        url: urlGDOC,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            response = textClean( data.slug.toString() );
        } catch (e) {
            response = "";
        }
    }).fail(function () {
        response = "";
    }).always(function () {
    });

    return response;
}
*/

//#### BASIC/PRIMITIVE functions ###//


function textClean(text) {
   return JSON.parse('"' + text  + '"'); //    Ra\u010dunalni\u0161ka arhitektura  => Računalniška arhitektura
}

function statusOfReservation(start, end, current) {
    if (start <= current && current < end) { //current    - start incluziven, end excluziven .. ce se premeni politika , popravi
        return 0;
    } else if (current > end) {  //older
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


function compareDates(d1,d2) {
    return new Date(d1).getTime() - new Date(d2).getTime();
}

// add date leading zero  -izpis z dvema stevilkama  npr. ura 9:3 => 09:03
Date.prototype.getHoursMY = function (key) {
    return ('0' + this.getHours()).slice(-2);
};

Date.prototype.getMinutesMY = function (key) {
    return ('0' + this.getMinutes()).slice(-2);
};





$.fn.resizeText = function () {
    var width = $(this).innerWidth();
    var height = $(this).innerHeight();
    var newElem = $("<div>", {
        html: $(this).html(),
        style: "display: inline-block;overflow:hidden;font-size:0.1em;padding:0;margin:0;border:0;outline:0"
    });

    $(this).html(newElem);
    $.resizeText.increaseSize(10, 0.1, newElem, width, height);

    $(window).resize(function () {
        if ($.resizeText.interval)
            clearTimeout($.resizeText.interval)

        $.resizeText.interval = setTimeout(function () {
            elem.html(elem.find("div.createdResizeObject").first().html());
            elem.resizeText();
        }, 300);
    });
}

$.resizeText = {
    increaseSize: function (increment, start, newElem, width, height) {
        var fontSize = start;

        while (newElem.outerWidth() <= width && newElem.outerHeight() <= height) {
            fontSize += increment;
            newElem.css("font-size", fontSize + "em");
        }

        if (newElem.outerWidth() > width || newElem.outerHeight() > height) {
            fontSize -= increment;
            newElem.css("font-size", fontSize + "em");
            if (increment > 0.1) {
                $.resizeText.increaseSize(increment / 10, fontSize, newElem, width, height);
            }
        }
    }
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
        _results.push((function(el) {
            var resizeText, _results1;
            resizeText = function() {
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



/*
function setCookie(key, value) { //  max  2^31 - 1 = 2147483647 = 2038-01-19 04:14:07   $.cookie('subscripted_24', true, { expires: 2147483647 });
    var expires = new Date();
    expires.setTime(expires.getTime() + 31536000000*15); //20  years
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

setCookie('test', '5');
alert(getCookie('test'));

*/

/*
 demo DATA patterns

 function loadData() {

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


 */



