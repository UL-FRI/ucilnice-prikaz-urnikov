<!DOCTYPE html><!-- index5 from  demo5live - v1- public demo -->
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"/>
    <meta name="author" content="Gregor Šobar">

    <title>UNI-LJ/FRI ClassROOM INFO DISPLAY</title>


    <!-- android web app-->
    <link rel="manifest" href="manifest.json">
    <meta name="viewport" content="width=device-width">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="icon" sizes="192x192" href="/img/webapp/launcher-icon-4x.png">



    <!-- CSS  -->
    <link href="css/materialize.css" type="text/css" rel="stylesheet">

    <link href="css/style.css" type="text/css" rel="stylesheet">
    <link href="css/timeline.css" type="text/css" rel="stylesheet">

</head>
<body id="top" class="scrollspy">


<!-- Pre Loader ?!?! tmp delete-->
<div id="loader-wrapper">
    <div id="loader"></div>

    <div class="loader-section section-left"></div>
    <div class="loader-section section-right"></div>

</div>


<div class="navbar-fixed">
    <nav id="nav_f" class="default_color" role="navigation">
        <div class="container">
            <div class="nav-wrapper">
                <div id="site-name">
                    <a class="ir-fixed" rel="home" title="Home" href="http://www.fri.uni-lj.si">FRI website</a>
                </div>
                <!--<a id="logo-container" href="#top" class="brand-logo">Učilnica P1 / Seznam rezervacij</a>-->
<div>
                <a id="logo-container" href="#top" class="brand-logo active">Room info loading...</a>
                <!--<ul id="nav-mobile" class="right side-nav">
                  <li><a href="#intro">Service</a></li>
                  <li><a href="#work">Work</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>--><a href="#" data-activates="nav-mobile" class="button-collapse"><i
                    class="mdi-navigation-menu"></i></a>
    </div>
            </div>
        </div>
    </nav>
</div>


<div id="messageBox" class=" scrollspy" style="">
    <div id="message_errorData" style="display: none;"></div>
    <div id="message_errorRoomNotSelected" style="display: none;"></div>
</div>


<div id="loading" class="section1 scrollspy1" style=" ">
    loading...
</div>


<div id="work" class="section1 scrollspy1" style="  display: none;">
    <div class="row" style="margin-bottom: 0; height: 100%;">

        <div id="currentReservation" class="col s7 " style="padding: 20px 40px;">
            <!-- default template-->
            <div class="row2 currentReservation-label">TRENUTEN TERMIN</div>
            <div id="currentReservation-termin" class="row">...-...</div>

            <div class="row2 currentReservation-label">NAMEN</div>
            <div id="currentReservation-namen" class="row">...</div>

            <div class="row2 currentReservation-label">ORGANIZATORJI</div>
            <div id="currentReservation-organizatorji" class="row">...</div>

            <div class="row2 currentReservation-label">OPOMBE</div>
            <div id="currentReservation-opombe" class="row">...</div>

        </div>
        <div id="timelineFrame" class="col s5" style=" height: 100%;">

            <ul id="timeline" class="z-depth-3" style=" height: 100%;padding-top: 20px;">
                <!--
                <li class='work'>
                    <input class='radio' id='work1' name='works' type='radio'>
                    <div class="relative">
                        <label for='work1'>Lorem ipsum dolor sit amet</label>
                        <div class="date"><b>15:15</b><br><div style="/* font-size:small; */">16:15</div></div>
                        <span class='circle'></span>
                    </div>
                    <div class='content'>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odio ea necessitatibus quo velit natus cupiditate qui alias possimus ab praesentium nostrum quidem obcaecati nesciunt! Molestiae officiis voluptate excepturi rem veritatis eum aliquam qui laborum non ipsam ullam tempore reprehenderit illum eligendi cumque mollitia temporibus! Natus dicta qui est optio rerum.
                        </p>
                    </div>
                </li>-->
            </ul>

        </div>

    </div>
</div>


<footer id="footer" class="page-footer default_color scrollspy" style="    position: fixed;   bottom: 0; width: 100%;">

    <div class="footer-copyright default_color">
        <div class="container row" style=" /* line-height: 1px; */margin-bottom: 0;">
            <div class="col s6 " style=""> 2016 &copy; <a class="white-text"
                                                          href="http://www.fri.uni-lj.si">UNI-LJ/FRI</a></div>
            <div id="currentDateAndTime" class="col s6 " style="text-align:right"></div>
        </div>
    </div>
</footer>



<!-- Java Script -->
<script src="js/jquery-2.1.1.min.js"></script>
<script src="js/js.cookie.js"></script>
<script src="js/modernizr.js"></script> <!-- Modernizr -->
<script src="js/materialize.js"></script>
<script src="js/init.js"></script>

<script src="js/myIPtoClassId.js"></script>
<script src="js/main.js"></script>

</body>
</html>
