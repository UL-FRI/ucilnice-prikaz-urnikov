<?php
/**
 * Created by PhpStorm.
 * User: GregAs
 * Date: 25/02/2017
 *
 *  remote configure of device
 *  - global (all devices/classrooms)
 *  - explicit (specific device/classroom)
 */


//http://cid.fri1.uni-lj.si/demo6.4.2/remoteConfig.php?selectedRoomID=3158&selectedRoomName=P01


// auto refresh/reload complete web page if changed!  |  will cause auto reload page - can cause infinity reload loop if not set correctly!!
$app_version="0.6.4.2"; //!!! use carefully, also change js/main.js with the same value !!!


$ip =  $_SERVER['REMOTE_ADDR'];//filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP); // $_GET['id'];


$selectedRoomID = filter_input(INPUT_GET, 'selectedRoomID', FILTER_SANITIZE_SPECIAL_CHARS); //$foo = filter_input(INPUT_POST, 'foo', FILTER_SANITIZE_STRING, array('options' => array('default' => NULL)));
//$selectedRoomID =  is_null($selectedRoomID) ? "": $selectedRoomID;
$selectedRoomName  = filter_input(INPUT_GET, 'selectedRoomName', FILTER_SANITIZE_SPECIAL_CHARS);


////////// TMP !! TEST detekcije localIP naprav - neuspesno, tudi server bi moral biti na isti strani routerja kot naprave !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
$localIP1=$localIP2=$localIP3= "";

//$command="/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'";
//$localIP1 = exec ($command);

//server local ip?!
$sock = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
socket_connect($sock, "8.8.8.8", 53);
socket_getsockname($sock, $name); // $name passed by reference
//$localIP1= $name;

//$localIP2 = getHostByName(getHostName());
//$localIP3=  gethostbyaddr($ip);   //$computerName =

//$localIP2 = $_SERVER['HTTP_CLIENT_IP'];
//$localIP3 = $_SERVER['HTTP_X_FORWARDED_FOR'];
//    $ip = $_SERVER['REMOTE_ADDR'];
///////////////////////////////


//log data into file
$response = array('ip'=> $ip,'lastConnection'=> date(DateTime::ISO8601),'selectedRoomID'=> $selectedRoomID,'selectedRoomName'=>$selectedRoomName,     'localIP1'=>$localIP1, 'localIP2'=>$localIP2, 'localIP3'=>$localIP3); ////date(DateTime::ISO8601); ==  date('Y-m-d\TH:i:sO'); ==date('c');
$file='log-ip/';
if (!file_exists($file)) {
    if (!mkdir($file, 0777, true)) {// die('Failed to create folders...');
    }
}

$fname= $file .''. $ip .'-'. $selectedRoomID;
$fp = fopen($fname, 'w')  ; //or die("Unable to open file!".$file .''. $ip) ; //.'.json' //a+
fwrite($fp, json_encode($response));
fclose($fp);
chmod($fname, 0777);
chmod($file , 0777);



// Prevent caching.
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 01 Jan 1996 00:00:00 GMT');

// The JSON standard MIME header.
header('Content-type:application/json;charset=utf-8');


$classId=""; // device IP to classId //todo - sedaj deluje preko myIPtoClassId.js

$data = '{"device_ip":"'.$ip.'", "app_version":"'.$app_version.'","device_classid":"'.$classId.'","sleep_start_time":"00:15","sleep_stop_time":"06:15"}';
echo $data; //json_encode($data);

?>