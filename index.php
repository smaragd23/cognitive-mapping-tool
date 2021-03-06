<?php
/*** PREVENT THE PAGE FROM BEING CACHED BY THE WEB BROWSER ***/header("Cache-Control: no-cache, must-revalidate");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");

//echo dirname(__FILE__) . "/wp-authenticate.php";
require_once(dirname(__FILE__) . "/wp-authenticate.php");

/*** REQUIRE USER AUTHENTICATION ***/login();

/*** RETRIEVE LOGGED IN USER INFORMATION ***/$user = wp_get_current_user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1 user-scalable=0">

	<title>Cognitive Mapping BETA</title>
	<meta name="description" content="Tool for measuring perceptions of community security" />

	<link rel="stylesheet" href="libs/bootstrap/css/bootstrap.min.css" />
	<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/themes/css/cartodb.css" />
	<!--[if lte IE 8]>
	<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/themes/css/cartodb.ie.css" />
	<![endif]-->
	<!--link rel="stylesheet" href="libs/leaflet.draw/leaflet.draw.css" /-->
	<!--[if lte IE 8]><link rel="stylesheet" href="libsLeaflet.draw/leaflet.draw.ie.css" /><![endif]-->
	<link rel="stylesheet" href="css/hoodstyles.css">
	<!--[if lt IE 9]>
	<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<script>alert('This site may not work in your browser! OH NO!')</script>
	<![endif]-->
</head>
<body>
<?php if (is_user_logged_in()) : ?>
      <!-- GENERAL MODAL****************************************************************-->
	<div id="generalModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" >
	         <div class="modal-dialog">
	    <div class="modal-content">
	             <div class="modal-header">
	        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
	        <h3 id="myModalLabel">Hey hey!</h3>
	      </div>
	            <div class="modal-body">
	            </div>
	        <div class="modal-footer">
	        <button class="btn btn-default" data-dismiss="modal" aria-hidden="true">OK</button>
	      </div>
	           </div>
	  	</div>
	</div>
	<!-- INFO MODAL****************************************************************-->
	<div id="aboutModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" >
	    <div class="modal-dialog">
	    	<div class="modal-content">
	            <div class="modal-header">
	        		<!--button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button-->
	        		<h3 id="myModalLabel">Enumerator Instructions</h3>
	      		</div>
	      		<div class="modal-body">
	      		<form class="form-horizontal" style="margin-bottom:0px">
	      			<div class="form-group">
			            <label for="respondentId" class="col-xs-4 control-label">1) Input respondent ID <br><span style="color:#FF0000;font-weight:normal;font-style:italic;">*Required</span></label>
			            <div class="col-xs-8">
		              		<input class="form-control typeahead noEnterSubmit neighborhoodName" id="respondentId" autocomplete="off" data-provide="typeahead">
		               	</div>
		          	</div> 
	      		</form>
	        	<!--p> 1) Input respondent ID. INSERT PLACE TO ENTER ID HERE </p-->
	        	<p> 2) Respondent marks point for home </p>
	        	<p> 3) Respondent marks point for work </p>
	        	<p> 4) Respondent draws areas where agberos can punish </p>
	        	<p> 5) Respondent draws areas where police can project  </p>
	        	<p> This is technology is based on <a href="http://bostonography.com" target="_blank">Bostonography</a></p>
	        	<!--p><b>NEW download a shapefile of the data contributed so far, or get the source code!</b> Check the buttons in the bottom right.</p>
	        	<p> <b>- Thanks!</b> </p-->
	      		</div>
	        	<div class="modal-footer">
	        	<!--button class="btn" id="modalInfoBtn">More Info Here</button-->
	        	<button id="startMappingBtn" class="btn btn-default" data-dismiss="modal" aria-hidden="true">Start Mapping!</button>
	      		</div>
	        </div>
	  	</div>
	</div>
	<!--END MODAL-->

	<!--flag modal-->
	<div id="flagModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	         <div class="modal-dialog">
	    <div class="modal-content">
	             <div class="modal-header">
	        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
	        <h3 id="myModalLabel">Flagging</h3>
	      </div>
	      <div class="modal-body">
	        <p><b>Please don't flag a neighborhood if you simply disagree with the border or description.</b>.</p>
	        <p> Only flag content that is offensive or just rubbish. Flagged content will be temporarily removed. 
	          Once reviewed it will either be reinstated if found to be flagged in error, or remain hidden if
	          found to be junk. Thanks!</p>
	      </div>
	      <div class="modal-footer">
	        <button class="btn btn-danger" id="flagBtn" >No Really, Flag It!</button>
	        <button class="btn btn-success" data-dismiss="modal" aria-hidden="true">Never Mind</button>
	      </div>
	           </div>
	  </div>
	 </div>
	<--END MODAL-->

	<!-- SUBMIT MODAL ***********************************************************************-->
	<div id="submitModal"  class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-header">
	        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
	        <h3 id="myModalLabel">Just a few more things</h3>
	      </div>
	      <div class="modal-body">
	        <form class="form-horizontal" style="margin-bottom:0px"> 
	          <div id="alertHolder2"></div> 
	          <!--neighborhood name-->
	          <div class="form-group">
	            <label for="neighborhoodName" class="col-xs-4 control-label">Neighborhood Name <br><span style="color:#FF0000;font-weight:normal;font-style:italic;">*Required</span></label>
	            <div class="col-xs-8">
	              <input class="form-control typeahead noEnterSubmit neighborhoodName" id="neighborhoodName" autocomplete="off" data-provide="typeahead">
	               </div>
	          </div> 
	          <div class="form-group">
	            <label for="cityName" class="col-xs-4 control-label">City/Town Name</label>
	            <div class="col-xs-8">
	              <input class="form-control typeahead noEnterSubmit cityName" id="cityName" autocomplete="off" data-provide="typeahead">
	               </div>
	          </div>
	          <!--location toggle-->
	          <!-- **disableing location didn't get a lot of love**
	          <div class="form-group">
	            <div class="col-sm-offset-4 col-sm-8">
	              <div class="checkbox">
	              <label>
	                <input type="checkbox" checked="checked"> Enable Location
	              </label>
	            </div>
	            </div>
	          </div>
	        -->
	          <!--years in city-->  
	          <div class="form-group"> 
	            <label  class="col-xs-4 control-label" >How many years have you lived in this city/town?</label>
	              <div id="cityLivingGroup" class="btn-group cty-group col-xs-8">
	                <button type="button" class="btn btn-default" name="0">Never</button>
	                <button type="button" class="btn btn-default" name="1">&lt; 1</button>
	                <button type="button" class="btn btn-default" name="2">1-5</button>
	                <button type="button" class="btn btn-default" name="3">6-10</button>
	                <button type="button" class="btn btn-default" name="4">&gt; 10</button>
	              </div>
	          </div>  
	          <div class="form-group"> 
	            <label   class="col-xs-4 control-label" >How many years have you lived in this neighborhood?</label>
	              <div id="neighborhoodLivingGroup" class="btn-group nbr-group col-xs-8">
	                <button type="button" class="btn btn-default" name="0">Never</button>
	                <button type="button" class="btn btn-default" name="1">&lt; 1</button>
	                <button type="button" class="btn btn-default" name="2">1-5</button>
	                <button type="button" class="btn btn-default" name="3">6-10</button>
	                <button type="button" class="btn btn-default" name="4">&gt; 10</button>
	              </div>
	          </div>  
	          <div class="form-group"> 
	            <label   class="col-xs-4 control-label" >Describe or share a story about your neighborhood:</label>
	            <div class="col-xs-8">
	            <textarea id="neighborhoodDescription" class="form-control" rows="3"></textarea>
	          </div>
	          </div>
	        </form>
	      </div>
	      <div class="modal-footer">
	        <button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
	        <button id="allSubmitBtn" class="btn btn-success">Save Neighborhood!</button>
	      </div> 
	    </div>
	  </div>
	</div>
	<!--END MODAL-->

	<!--download modal-->
	<div id="downloadModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	         <div class="modal-dialog">
	    <div class="modal-content">
	             <div class="modal-header">
	        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
	        <h3 id="myModalLabel">Is this the data you are looking for?</h3>
	      </div>
	      <div class="modal-body">
	        <p>You are about to download the entire neighborhood shapefile. It contains all polygons, including those that have been flagged as junk or inappropriate. Those items can be identified where the flag field=true. There are some great things to map here, so if you get the data, please let us know what you do with it!.</p>
	      </div>
	      <div class="modal-footer">
	        <button class="btn btn-success" id="downloadBtn" >Gimme My Data!</button>
	        <button class="btn btn-default" data-dismiss="modal" aria-hidden="true">Never Mind</button>
	      </div>
	           </div>
	  </div>
	 </div>
	<!--END MODAL-->
	<img src="img/heart.svg" id="loveIcon" class="loveIcon noMouse"></img>

	<div id="map"></div>

	<div style="position:absolute; top: 50px; left: 10px; z-index:999;pointer-events:none">
	  <div  id="btnBar" class="noMouse">
	    <button id="startBlackMarkerBtn" class="btn btn-default btn-lg yesMouse start-btn bg-grey" type="button"> <i class="glyphicon glyphicon-pushpin icon-white"> </i></button> <!--  Mark your home neighborhood-->
	    <button id="startGreyPolyBtn" class="btn btn-default btn-lg yesMouse start-btn bg-grey" type="button"> <i class="glyphicon glyphicon-pencil icon-white"> </i>
	    <button id="startRedMarkerBtn" class="btn btn-default btn-lg yesMouse start-btn bg-red" type="button"> <i class="glyphicon glyphicon-pushpin icon-white"> </i></button> <!-- Mark your work neighborhood -->
	    <button id="startBluePolyBtn" class="btn btn-default btn-lg yesMouse start-btn bg-blue" type="button"> <i class="glyphicon glyphicon-pencil icon-white"> </i></button> <!-- Draw areas with agbero control -->
	    <button id="startGreenPolyBtn" class="btn btn-default btn-lg yesMouse start-btn bg-green" type="button"> <i class="glyphicon glyphicon-pencil icon-white"> </i></button> <!-- Draw areas with police control -->
	    <button id="deletePolyBtn" style:""  class="btn btn-default yesMouse" type="button"> <i class="glyphicon glyphicon-trash icon-white"> </i> Cancel</button>
	    <button id="submitPolyBtn" style="display:none;" class="btn btn-default btn-success  yesMouse" type="button">Save</button>
	  </div>
	</div>
	<div class="noMouse" style="position:absolute; top: 50px; left: 30px; z-index:999;pointer-events:none;min-width:300px;">
	  <div id="resultBar" class="noMouse viewMap" style="display:none;">
	  
	<!--
	    <button id="resultsInSpace" class="btn  btn-default details spaceBtn yesMouse" type="button" data-toggle="button" >Show/Hide Base Map</button>
	-->

	  </div>
	</div>

	<div id="descriptionDiv" class="noMouse vieMap">
	  <div class="panel-group" id="accordion">
	  </div>
	</div>
	<!-- REMOVING GITHUB AND TWITTER BUTTONS ON SIDE
	<div  style="" class="linksbackground"></div>
	<a style="bottom:60px;" class="link-icons enableTooltipsLeft" title="Information" href="#aboutModal" data-toggle="modal"><i class="glyphicon glyphicon-info-sign"></i></a>
	-->
	<!--a style="bottom:60px;" class="link-icons enableTooltipsLeft download-btn" title="Download Data"  ><i class="glyphicon glyphicon-download-alt"></i></a-->
	<!--
	<a id="githubBtn" style="bottom:40px;" class="link-icons enableTooltipsLeft" title="Get it on GitHub"> 

	  <img  class="links glyphicon" style="width:15px;height15px;" src="img/GitHub-Mark-32px.png"/>
	</a>
	<a id="twitterbtn" href="http://twitter.com/bostonography" style="bottom:20px;" class="link-icons enableTooltipsLeft" title="Bostonography on Twitter" target="_blank">
	  <img  class="links glyphicon" style="width:15px;height15px;" src="img/bird_black_32_0.png"/>
	</a>
	    -->
	     <!--div id="navDiv" class="navbar navbar-inverse navbar-fixed-top" >
	          <ul class="nav navbar-nav" id="mapItMenu"-->
	                <!--
	                <li style="top:-9px;padding-left:10px;position:relative"><h3 class="navText">{</h3></li>
	                <li id="makeMapModeBtn" class="active mapState"><a href="#make">Make Maps</a></li>
	                <li id="resultMapBtn" class="mapState"><a href="#view">View Maps</a></li>
	                -->
	                <!--<li><a href="#contact">Contact</a></li>
	                <li style="top:-9px;position:relative"><h3 class="navText">}</h3></li>               
	                <!--CITY BUTTONS CREATED IN hooscript.js -->
	           <!--/ul>
	    </div-->

	<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	<script src="libs/bootstrap/js/bootstrap.min.js"></script>
	<script src="http://libs.cartocdn.com/cartodb.js/v3/cartodb.js"></script>
	<script src="js/jquery.slimscroll.min.js"></script>
	<script src="js/typeahead.min.js"></script>
	<script src="bower_components/d3/d3.min.js"></script>
	<script type="text/javascript" src="bower_components/evispa-timo-jsclipper/clipper.js"></script>
	<script type="text/javascript" src="bower_components/graham_scan/graham_scan.min.js"></script>
	<script type="text/javascript" src="bower_components/concavehull/dist/concavehull.min.js"></script>
	<script src="bower_components/leaflet.freedraw/dist/leaflet.freedraw-src.js"></script>
	<script src="libs/Leaflet.Editable.js"></script>
	<script src="js/names.js"></script>
	<script src="js/hoodscript.js"></script>
	<!-- REMOVING GOOGLE ANALYTICS SCRIPT
	<script src="js/googleanalytics.js"></script>
	-->

	</script>
<?php else: ?>
	<p>you should autorize</p>
<?php endif; ?>
</body>
</html>