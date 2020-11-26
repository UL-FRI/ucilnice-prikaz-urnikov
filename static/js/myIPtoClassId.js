/**
 * Created by GregorS on 25/11/2016.
 *
 *  match IP address with classroom ID
 */
function myIPtoClassId(ip)
{
    switch (ip)
    {
        //PR06 test
        case "45.79.84.183": return "3137";

        //P01 test
       // case "212.85.170.126" : return "3158";



        //P01
        case "192.168.1.101": return "3158";

        //P02
        case "192.168.1.102": return "3151";

        //P03
        case "192.168.1.103": return "3155";

        //P04
        case "192.168.1.104": return "3156";

        //PR05
        case "192.168.1.105": return "3138";

        //PR06
        case "192.168.1.106": return "3137";

        //PR07
        case "192.168.1.107": return "3149";

        //PR08
        case "192.168.1.108": return "3146";

        //PR09
        case "192.168.1.109": return "3147";

        //PR10
        case "192.168.1.110": return "3145";

        //PR11
        case "192.168.1.111": return "3148";

        //PR12
        case "192.168.1.112": return "3144";

        //PR13 ?!?!?!?

        //PR14
        case "192.168.1.114": return "3142";

        //PR16
        case "192.168.1.115": return "3140";

        //PR15
        case "192.168.1.116": return "3141";

        //PR17
        case "192.168.1.117": return "3139";

        //P18
        case "192.168.1.118": return "3150";

        //P19
        case "192.168.1.119": return "3152";

        //P20
        case "192.168.1.120": return "3153";

        //P21
        case "192.168.1.121": return "3154";

        //P22
        case "192.168.1.122": return "3157";

        default: return ""; //!! pazi //return "";  / null
    }
}




function getMyIP() {
    // tmp test  proxy to avoid ajax same origin  policy  http://cors.io/?https://urnik.fri... ;

    var urlGDOC = myIpUrl;//"http://cid.fri1.uni-lj.si/demoXY/myip.php";

    var response="" ;
    $.ajax({
        timeout: ajaxTimeout, // sets timeout
        url: urlGDOC,
        async: false,//!!
        dataType: "json"
    }).done(function (data) {
        try {
            //if(data.error ==""){// "" ==no error
                response = data.ip;
           // }
        } catch (e) {
            // response = "";
        }
    }).fail(function () {
        // response = "";
    }).always(function () {
    });

    return response;
}





/*
 //ZACASNO!!
 var sifrantRooms;
 sifrantRooms = Object.create(null);//= {};



 / *
 sifrantRooms["3143"] = "1129-1r";
 sifrantRooms["3190"] = "DS";
 sifrantRooms["3302"] = "MALA-DVORANA";
 sifrantRooms["3193"] = "MSS";//"Sejna soba";//"MSS";
 sifrantRooms["3158"] = "P01";
 sifrantRooms["3151"] = "P02";
 sifrantRooms["3155"] = "P03";
 sifrantRooms["3156"] = "P04";
 sifrantRooms["3150"] = "P18";
 sifrantRooms["3152"] = "P19";
 sifrantRooms["3153"] = "P20";
 sifrantRooms["3154"] = "P21";
 sifrantRooms["3157"] = "P22";
 sifrantRooms["3159"] = "PA";
 sifrantRooms["4538"] = "PKS";//Profesorski klub spodaj
 sifrantRooms["4539"] = "PKZ";
 sifrantRooms["3138"] = "PR05";
 sifrantRooms["3137"] = "PR06";
 sifrantRooms["3149"] = "PR07";
 sifrantRooms["3146"] = "PR08";
 sifrantRooms["3147"] = "PR09";
 sifrantRooms["3145"] = "PR10";
 sifrantRooms["3148"] = "PR11";
 sifrantRooms["3144"] = "PR12";
 sifrantRooms["3142"] = "PR14";
 sifrantRooms["3141"] = "PR15";
 sifrantRooms["3140"] = "PR16";
 sifrantRooms["3139"] = "PR17";
 sifrantRooms["3191"] = "SS2";//R.1N.07.12
 sifrantRooms["3192"] = "SS3";//Seminarska soba
 sifrantRooms["3301"] = "VFP";//Velika fizikalna predavalnica
 sifrantRooms["3194"] = "VSS";//Sejna soba
 * /



 */