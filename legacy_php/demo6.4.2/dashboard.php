<?php
/**
 * Created by: GregAs
 * Date: 26/02/2017
 */




$fileDir='log-ip/';
if (!file_exists($fileDir)) {
    echo "Folder does not exist - no ip logs";
}else{
    //$directory = $fileDir;//'/path/to/my/directory';
   // $scanned_directory = array_diff(scandir($directory), array('..', '.'));

    $files = array_slice(scandir($fileDir), 2); //'/path/to/directory/'
    if (count ($files) == 0) { echo "no log ip files == no data";

    }else{

        $devices = array();
        //load
        foreach ($files as $file){
            $string = file_get_contents($fileDir . $file);
            $json_a = json_decode($string, true);

            $devices[$file]=$json_a;
           }

        //sort
        usort($devices, "cmp");

        //show

        $nowtime= (new DateTime ()) -> format('Y-m-d H:i:s');
        echo "</br> <b>Page shows which devices are/were alive</b></br></br>";
        echo "</br> <b>Current date/time: $nowtime </b> (page will refresh automatically after 30s)</br></br>";
        echo '<table style="width:800px;text-align: center;"> <tr>  <th></th>  <th>lapsedTime </th>     <th>IP</th>   <th>roomID</th> <th>roomName</th> <th>lastConnection</th></tr>';
        foreach ($devices as $device){
            $dteDiff  = (new DateTime())->diff( new DateTime($device['lastConnection']) );//$dteDiff->format("%R days, %H:%I:%S")
            echo' <tr>';
            echo ' <td>'.statusImg( new DateTime($device['lastConnection']) ).' </td>  <td> '. ago(  new DateTime($device['lastConnection'])  ) .'</td> <td> ' .$device['ip']. '</td> <td> ' .$device['selectedRoomID']. '</td> <td> ' .$device['selectedRoomName']. '</td> <td> ' .$device['lastConnection']. '</td>' ;
         echo' </tr>';
        }
         echo '</table>';

    }
}


/// functions


function pluralize( $count, $text ){
    return $count . ( ( $count == 1 ) ? ( " $text" ) : ( " ${text}s" ) );
}

function ago( $datetime ){
    $interval = date_create('now')->diff( $datetime );
    $suffix = ( $interval->invert ? ' ago' : '' );
    if ( $v = $interval->y >= 1 ) return pluralize( $interval->y, 'year' ) . $suffix;
    if ( $v = $interval->m >= 1 ) return pluralize( $interval->m, 'month' ) . $suffix;
    if ( $v = $interval->d >= 1 ) return pluralize( $interval->d, 'day' ) . $suffix;
    if ( $v = $interval->h >= 1 ) return pluralize( $interval->h, 'hour' ) . $suffix;
    if ( $v = $interval->i >= 1 ) return pluralize( $interval->i, 'minute' ) . $suffix;
    return pluralize( $interval->s, 'second' ) . $suffix;
}

function status( $datetime ){
    $interval = date_create('now')->diff( $datetime );
    if ( $v = $interval->d >= 1 || $v = $interval->m >= 1||$v = $interval->y >= 1  ) return "red";//-1; //older than 1 day
    elseif ( $v = $interval->h >= 1 ) return "yellow";//0; // older then 1 hour
    else return "green";//1; // less then hour

}

function statusImg($date){
return '<div style="width:20px;height:20px;border-radius:50%;background: '.status($date).'" > </div>  ';
}

function cmp($a, $b){
    return  ($a['lastConnection']) <   ($b['lastConnection']);
}





?>

<script>

    window.onload = function() {//$(document).ready(function () {
        setInterval( function(){location.reload(true)} , 30*1000);//reload on 30 sec
    };

</script>
