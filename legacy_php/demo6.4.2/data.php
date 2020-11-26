<?php
/* Created by GregorS
*
* v1.1: 26.11.2016 - code cleanup/mini documentation
* v1:25-9-2016
*-------------------------
*   Special mini proxy (route only urnik API - https://urnik.fri.uni-lj.si/reservations )
*   => proxy to go around the Same-Origin Policy in ajax requeuests
*--------------------------
*
*
*   Route:
*   from       (my server)              http://193.2.72.115/data.php/reservables/3156/?format=json
*   to        (api server)  https://urnik.fri.uni-lj.si/reservations/reservables/3156/?format=json
*
*   Other options:
*   /reservations/?start=2016-09-12%2012:00&end=2016-09-12%2013:00&reservables=3156&format=json
*   /reservables/3156/?format=json
*   ...
*/


$myurl=$_SERVER['REQUEST_URI']; //    "/data.php/3156/?format=json"

//$pos = strpos($myurl, ".php");

//$fileUrl= $_SERVER['SCRIPT_NAME']; //  "/demo/data.php"  //DOES NOT WORK IF USING virtual filder .htap rewrite
$myurl= strstr_after($myurl, '.php'); // str_replace( $fileUrl ,  "",$myurl); //remove file name!

$url= "https://rezervacije.fri.uni-lj.si".$myurl;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Blindly accept the certificate - for selfsigned!
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
curl_close($ch);

echo $response;






function strstr_after($haystack, $needle, $case_insensitive = false) {
    $strpos = ($case_insensitive) ? 'stripos' : 'strpos';
    $pos = $strpos($haystack, $needle);
    if (is_int($pos)) {
        return substr($haystack, $pos + strlen($needle));
    }
    // Most likely false or null
    return $pos;
}
// Example
//$email = 'name@example.com';
//$domain = strstr_after($email, '@');
//echo $domain; // prints example.com

?>
