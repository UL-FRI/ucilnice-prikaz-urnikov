<?php

// Prevent caching.
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 01 Jan 1996 00:00:00 GMT');

// The JSON standard MIME header.
header('Content-type:application/json;charset=utf-8');

$ip =  $_SERVER['REMOTE_ADDR'];
$data = '{"ip":"'.$ip.'"}';//array("ip", $ip);
echo $data; //json_encode($data);

?>