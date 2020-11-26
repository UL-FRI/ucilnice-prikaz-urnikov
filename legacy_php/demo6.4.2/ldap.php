<?php
/* Created by GregorŠ  ; Nov,2016

todo
- !zamenjaj uporabniske podatke za specializiranega uporabnika
- ![zacasno ok, spremeni ce imas boljsi predlog]  precisti input!!!!

-[ok] v json "error":"none" ali " izpisi napake"
- blokiraj zunanje poizvedbe, dovoli le poizvedbe iz uredne domene/strani/ip-range .

*/ 

//LDAP init
require_once('../ldapConfig.php');

$errorMSG="";
$displayName="";	


$UPN="";
if(isset($_GET['userPrincipalName']) ){
  $UPN= urldecode( $_GET['userPrincipalName'] );

  //$UPN = filter_var( $_GET['userPrincipalName'] , FILTER_SANITIZE_EMAIL); //test or clean up all strange characters !!!!
  if ( ! filter_var( $UPN , FILTER_VALIDATE_EMAIL)) { //?! change test function if one have better suggestion ?!
    $UPN=""; //This email address is considered invalid, so set var to "". 
  }
}


if( isset($UPN) && $UPN != "" ){
   if( $ldap= @ldap_connect($adServer, $port)){  // test server 
    ldap_set_option($ldap, LDAP_OPT_PROTOCOL_VERSION, 3);
    ldap_set_option($ldap, LDAP_OPT_REFERRALS, 0);

    if ( $bind= @ldap_bind($ldap, $fullUsername,$password) ) { // test usr & pass
		   
      if( $search = @ldap_search( $ldap, "DC=uni-lj,DC=si", "(userPrincipalName=$UPN)") ){ //test search filter    
	if(ldap_count_entries($ldap, $search) >0 ){	//test if any results
		$info = ldap_get_entries($ldap, $search);
		$displayName= $info[0]["displayname"][0] ;
	}else{ $errorMSG .= " Search for userPrincipalName=$UPN return no results - unknown user. ";
	}
      }else {
		$errorMSG .= " Unable to search ldap server. ";
      }
    
      @ldap_close($ldap);
    } else{  $errorMSG .= " Could not bind = bad server  or invalid email / password. ";
    }
  }else { $errorMSG .= " Could not connect to $adServer. ";
  }  
}else{  $errorMSG .= " GET parameter userPrincipalName is invalid or not set!";
}

//print json response
echo '{"error":"'.$errorMSG.'", "displayname":"'.$displayName.'","userprincipalname":"'.$UPN.'"  } '; 
?> 
