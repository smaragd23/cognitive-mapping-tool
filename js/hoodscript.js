/*---------------------------
----- Config Vars: Change these to configure for your city or cities-------------
---------------------------*/
var myCities = [  //NAME AND BOUNDS OF CITIES 
  {name:"Lagos",bnds:[[42.195649,-71.285258],[42.550992,-70.836535]]}
]
,pointTblName = "mapping_output_point" // cartoDB table name (Points)
,polyTblName = "mapping_output_poly" // cartoDB table name (Polygons)
,usrName = "acmiller24" // your cartoDB username
,api_key = 'ba78d9df38a16fd6ce981d7b4c5a4dc92d631fce' // your cartoDB API key (only for backendless)
,brandText = "Cognitive Mapping BETA" // top left text and link on site
,brandLink = "http://mit.edu" //top left link on site
,giturl = "https://github.com/enam/neighborhoods" //Only change this if you want to link to a fork you made, otherwise you can leave the link to the original repo
,twiturl = "https://twitter.com/andrewmiller802" //Links to my twit acct, change it if you want or remove twitter link altogether
,myPath = "http://acmiller24.cartodb.com/api/v2"; //this is the root path to your cartoDB instance with the v2 api param

/*---------------------------
----- Application Vars -------------
---------------------------*/
var selectedCity = myCities[0]//selected city defaults to first myCities city.
,hoodsLayer
,map
,freeDrawLayer
,geoJsonLayer
,highlightHoods=[]
,highlightCount = 0
,c = new L.Control.Zoom({position:'topright'})
,lg = new L.layerGroup()
,overlg = new L.layerGroup()
,getJSON = {abort: function () {}}
,downloadURL = myPath+"/sql?format=shp&q=select+*+from+"+pointTblName
,ajaxrunning = false
,flagIndex = null
,poly//var for leaflet draw 
,marker
,geomType
,drawnItems//var for drawn polys
,nbrhdYears = 999//no data value
,cityYears = 999//no data value
,hStyle = {
    "stroke":true,
    "color":"#cd0000",//data.rows[i].strokeColor,
    "weight":2,
    "opacity":1,
    "fill":false,
    "clickable":false
}
//fill array from color brewer
//,fillArr = ['#8DD3C7','#FFED6F','#BEBADA','#FB8072','#80B1D3','#FDB462','#B3DE69','#FCCDE5','#D9D9D9','#BC80BD','#CCEBC5','#FFFFB3']
//fill array from tools.medialab.sciences-po.fr/iwanthue/index.php
,fillArr = ["#E7C265","#8AD4E2","#ECACC1","#95D18F","#E9D5B3","#E1EF7E","#F69D92","#9CD7BF","#B2BD75","#D1D3CF","#DAC1E1","#B3C69F","#D1AB6D","#E9D898","#B0CBE6","#D9B5AB","#86E9E1","#DBEA97","#D1F1E4","#DDEBBB","#DFB991","#F3AD8E","#8CDEB5","#EDAF69","#B9F2A6","#8DC8C4","#C2E887","#E5D670","#EAD483","#C4BF6A"]

,toner = L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
    attribution: '<a href="http://stamen.com/" target="_blank" >Stamen</a> | &copy; <a href="http://openstreetmap.org/" target="_blank" >OpenStreetMap</a> contributors'
})
,sat = L.tileLayer("http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})

// Make object for zoomed out layer
// ,sat = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
//  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// });

,respondentId
,instructed={}
,isShowingEditingInstructions=false
,isShowingDrawingInstructions=false
,isShowingInstructions=false
,editModeActivated=false;

/*---------------------------
----- $(window).load -------
---------------------------*/
function go(){
  $( 'body' ).attr('class','make');
  $('#deletePolyBtn').hide();
  $('#submitPolyBtn').hide();
  $('.modal-body').css( 'max-height', window.innerHeight - 180 );
  map = new L.Map('map', {
    zoomControl:false,
    center: [0,0], 
    zoom: 15,
    editable: true,
    dragging: false,
    maxZoom: 15,
    minZoom: 15
  });
  var baseMaps = {
    "Lagos Island": toner,
    "Lagos": sat
  };
  // NO MAP ZOOM
  // c.addTo(map);
  L.control.layers(baseMaps).addTo(map);
  lg.addTo(map);
  overlg.addTo(map);
  toner.addTo(map);
  map.fitBounds(selectedCity.bnds);
  map.setView([6.455700, 3.394000],14) // Lagos: [6.455757, 3.394018] // Boston: [42.360418, -81.070722]

  //draw controls
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  
    //-----------------------------END DRAW CONTROLS---------------------------------------

	//make teh nav and city buttons---------------|<>o|----thhppt---------City buttons Y'All!
  $('<a class="navbar-brand" href="#" target="_blank">'+brandText+'</a>').click(function(e){
    e.preventDefault();
    askForRespondentId(true);//$('#aboutModal').modal('show');
  }).prependTo('#navDiv');
  $("#navDiv").prepend('<a class="navbar-brand abbrev" href="'+brandLink+'" target="_blank">'+myCities[0].name+'</a>');
  
  //add listeners------------------------------------------------------------------------------------------------------LIsteners Y'All!
	  /*$('#aboutModal').modal('show').on('hidden.bs.modal',function(){
      if ( $('body').hasClass('make') ) showInstructions();
    })*/
    askForRespondentId(true);
	  $("#resultMapBtn").click(function(e){ });
  $('#resultsInSpace').click (
    function (e) {
      mapBackground = !$('#resultsInSpace').hasClass('active');
      if(!$('#resultsInSpace').hasClass('active')){
        toner.setOpacity(0);
        sat.setOpacity(0);
      }else{
        toner.setOpacity(1);
        sat.setOpacity(1);
      }
  });
  $("#flagBtn").on('click',function(){
    $('#flagModal').modal('hide');
    $('.flag-btn[name="' + flagIndex + '"]').addClass('flagged');
    postData( "php/flag.php",{
      id: flagIndex
    });
  });
  $("#downloadBtn").on('click',function(){
    window.open(downloadURL);
    $('#downloadModal').modal('hide');
  });
  $("#accordion").slimScroll({ height:'100%', position: 'left', distance:0, railcolor:'#ffffff', color:'#555555'});

// DRAW POLYGON BUTTONS
  $('#startBluePolyBtn').
  on('click', $.proxy(onClickPolyBtn,
    {
      'buttonId' : '#startBluePolyBtn',
      'color' : 'blue',
      'hide' : [
        ////'#startBluePolyBtn',
        //'#startGreenPolyBtn',
        //'#submitPolyBtn',
        //'#startBlackMarkerBtn',
        //'#startRedMarkerBtn'
      ],
      'style' : {color:'blue',fillColor:'aqua'}
    }
  ));

  $('#startGreenPolyBtn').
  on('click', $.proxy(onClickPolyBtn,
    {
      'buttonId' : '#startGreenPolyBtn',
      'color' : 'green',
      'hide' : [
        //'#startBluePolyBtn',
        ////'#startGreenPolyBtn',
        //'#submitPolyBtn',
        //'#startBlackMarkerBtn',
        //'#startRedMarkerBtn'
      ],
      'style' : {color:'green',fillColor:'LightGreen'}
    }
  ));

  //
  $('#startGreyPolyBtn').
  on('click', $.proxy(onClickPolyBtn,
    {
      'buttonId' : '#startGreyPolyBtn',
      'color' : 'grey',
      'hide' : [
        //'#startBluePolyBtn',
        ////'#startGreenPolyBtn',
        //'#submitPolyBtn',
        //'#startBlackMarkerBtn',
        //'#startRedMarkerBtn'
      ],
      'style' : {color:'grey',fillColor:'LightGrey'}
    }
  ));

  $('#deletePolyBtn').on('click',function(){
    if ( freeDrawLayer ){
      map.removeLayer(freeDrawLayer);
      freeDrawLayer = undefined;
      map.dragging.enable();
      $(".leaflet-container").removeClass("drawing");
    }
    getRidOfDrawnItems();
    editModeActivated = false;
    updateUIVisibility();
    //map.off("editable:editing").off("editable:drawing:commit");
    askForRespondentId(false); //$('#aboutModal').modal('show');
  });
 
 // DRAW MARKER BUTTONS
  $('#startRedMarkerBtn').
  on('click', $.proxy(onClickMarkerBtn, 
    {
      'buttonId' : '#startRedMarkerBtn',
      'color' : 'red',
      'hide' : [
        //'#startBluePolyBtn',
        //'#startGreenPolyBtn',
        //'#submitPolyBtn',
        //'#startBlackMarkerBtn'
      ],
      'icon' : L.icon({
          iconUrl: 'img/leaflet-color-markers/marker-icon-red.png',
          iconRetinaUrl: 'img/leaflet-color-markers/marker-red-2x-orange.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
          //shadowUrl: 'my-icon-shadow.png',
          //shadowRetinaUrl: 'my-icon-shadow@2x.png',            
          //shadowAnchor: [22, 94]
      })
    }
  ));
  $('#startBlackMarkerBtn').
  on('click', $.proxy(onClickMarkerBtn, 
    {
      'buttonId' : '#startBlackMarkerBtn',
      'color' : 'black',
      'hide' : [
        //'#startBluePolyBtn',
        //'#startGreenPolyBtn',
        //'#submitPolyBtn',
        //'#startRedMarkerBtn'
      ],
      'icon' : L.icon({
          iconUrl: 'img/leaflet-color-markers/marker-icon-black.png',
          iconRetinaUrl: 'img/leaflet-color-markers/marker-black-2x-orange.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
          //shadowUrl: 'my-icon-shadow.png',
          //shadowRetinaUrl: 'my-icon-shadow@2x.png',            
          //shadowAnchor: [22, 94]
      })
    }
  ));
  
  $("#submitPolyBtn").click(function(e){
    /*$(".cty-group > button.btn").removeClass('active');
    $(".nbr-group > button.btn").removeClass('active');
    $('.typeahead').unbind();*/

    //insertDataThroughPhp();
    //insertDataDirectly_v2(
    insertDataThroughProxy(
      buildUnitedDBQuery, 
      //function() { showAlert("Done!","Your poll has been saved!"); }
      function() { ; }
    );
   
    editModeActivated = false;
    getRidOfDrawnItems();
    updateUIVisibility();
    //showAlert("Done!","Your poll has been saved!");
    askForRespondentId(false);
  });
  $(".cty-group > button.btn").on("click", function(){
    num = this.name;
    cityYears = num;
  });
  $(".nbr-group > button.btn").on("click", function(){
    num = this.name;
    console.log(num)
    nbrhdYears = num;
  });
  $("#startMappingBtn").click(function(e){
    respondentId = document.getElementById('respondentId').value;
  });
  
  $("#allSubmitBtn").click(function(e){
  
  //CHECK IF Neighborhood has a name
    if (!notEmpty(document.getElementById('neighborhoodName'))){
      alert('Please enter a neighborhood name, Thanks!');  
      return;
    };
    currentNeighborhood = document.getElementById('neighborhoodName').value;
    currentDescription = document.getElementById('neighborhoodDescription').value;
    currentCity = document.getElementById('cityName').value;
    document.getElementById('neighborhoodName').value = '';
    document.getElementById('neighborhoodDescription').value= '';
    document.getElementById('cityName').value= '';
    /*$('#deletePolyBtn').hide();
    $('#submitPolyBtn').hide();
    $('#startBluePolyBtn').show();
    $('#startGreenPolyBtn').show();
    $('#startBlackMarkerBtn').show();
    $('#startRedMarkerBtn').show();
    $("#submitModal").modal('hide');*/
    $(".cty-group > button.btn").removeClass('active');
    $(".nbr-group > button.btn").removeClass('active');
    $('.typeahead').unbind();

    //insertDataThroughPhp();
    insertDataDirectly();
    
    /*drawnItems.eachLayer(function(l){
      if ( l.setStyle ) l.setStyle({clickable:false});
    });*/
    
    editModeActivated = false;
    getRidOfDrawnItems();
    showAlert("Done!","Your neighborhood has been added! Draw more neighborhoods, or take a look at what has been added so far by clicking 'View Maps'.");
    askForRespondentId(false); //$('#aboutModal').modal('show');
  });
  $(".enableTooltipsLeft").tooltip({container:"body",placement:"left"});
  if(window.location.hash) {
    if(window.location.hash.substr(1)==="view"){
      $('#resultMapBtn').addClass('active');
      $('#makeMapModeBtn').removeClass('active');
      //goViewState();
    }
  } else {
    // Fragment doesn't exist so, what are ya gonna do?
  }
  map.on("editable:editing",function(event){
    $(".leaflet-container").removeClass("drawing");
    //$('#submitPolyBtn').show();
    updateUIVisibility();
  }).on("editable:drawing:commit",function(event){    
    showEditingInstructions();
    if (event.layer instanceof L.Marker) {
      drawnItems.addLayer( event.layer );
      //map.editTools.featuresLayer.removeLayer( event.layer );
    }
    $(".leaflet-container").removeClass("drawing");
    //$('#submitPolyBtn').show();
    updateUIVisibility();
  });
}

function insertDataThroughPhp() {
  postData( "php/add.php",{
    ext: tableExt,
    coords: coords,
    city: currentCity,
    description: (currentDescription.replace(/'/g,"''")).replace(/"/g,"''"),
    name: (currentNeighborhood.replace(/'/g,"''")).replace(/"/g,"''"),
    cityYears: cityYears,
    hoodYears: nbrhdYears
  });
}

function insertDataDirectly_v2(queryBuilder, postSuccess) {
  var separatedFeatures = separateDrawnItems();
  var url = 'https://' + usrName + '.carto.com/api/v2/sql';

  var userId = (respondentId.replace(/'/g,"''")).replace(/"/g,"''");
  
  var query = [];
  if (0 != separatedFeatures.markers.length) {
    // buildUnitedDBQuery(tableName, user_id, features, geomComposer, colorGetter)
    query.push( queryBuilder.call(
      null,
      pointTblName,
      userId,
      separatedFeatures.markers,
      function(feature) {
        return '{"type":"Point","coordinates":' 
          + '[' + feature.getLatLng().lng + ',' 
          + feature.getLatLng().lat + ']' + '}';
      },
      function(feature) { return feature._colorId; }
    ));
  }
  if (0 != separatedFeatures.polygons.length) {
    // buildUnitedDBQuery(tableName, user_id, features, geomComposer, colorGetter)
    query.push( queryBuilder.call(
      null,
      polyTblName,
      userId,
      separatedFeatures.polygons,
      function(feature) {
        var latLngs = feature.getLatLngs();
          coordsArr = [];
        for (var j = 0; j < latLngs.length; j++) {
          var lat = (latLngs[j].lat);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          var lng = (latLngs[j].lng);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          coordsArr.push('['+lng + ',' + lat+']');
        }
        var coords = coordsArr.join(',');
        return '{"type":"MultiPolygon","coordinates":[[[' + coords + ']]]}';
      },
      function(feature) { return feature._colorId; }
    ));
  }
  
  $.post( url, { 'q' : query.join('; '), 'api_key' : api_key }, postSuccess );
}

function insertDataThroughProxy(queryBuilder, postSuccess) {
  var separatedFeatures = separateDrawnItems();
  var url = 'https://' + usrName + '.carto.com/api/v2/sql';

  var userId = (respondentId.replace(/'/g,"''")).replace(/"/g,"''");
  
  var query = [];
  if (0 != separatedFeatures.markers.length) {
    // buildUnitedDBQuery(tableName, user_id, features, geomComposer, colorGetter)
    query.push( queryBuilder.call(
      null,
      pointTblName,
      userId,
      separatedFeatures.markers,
      function(feature) {
        return '{"type":"Point","coordinates":' 
          + '[' + feature.getLatLng().lng + ',' 
          + feature.getLatLng().lat + ']' + '}';
      },
      function(feature) { return feature._colorId; }
    ));
  }
  if (0 != separatedFeatures.polygons.length) {
    // buildUnitedDBQuery(tableName, user_id, features, geomComposer, colorGetter)
    query.push( queryBuilder.call(
      null,
      polyTblName,
      userId,
      separatedFeatures.polygons,
      function(feature) {
        var latLngs = feature.getLatLngs();
          coordsArr = [];
        for (var j = 0; j < latLngs.length; j++) {
          var lat = (latLngs[j].lat);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          var lng = (latLngs[j].lng);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          coordsArr.push('['+lng + ',' + lat+']');
        }
        var coords = coordsArr.join(',');
        return '{"type":"MultiPolygon","coordinates":[[[' + coords + ']]]}';
      },
      function(feature) { return feature._colorId; }
    ));
  }
  
  $.post( "php/cartodbProxy.php", { 'q' : query.join('; ') }, postSuccess );
}

function insertDataDirectly() {
  var separatedFeatures = separateDrawnItems();
  var url = 'https://' + usrName + '.carto.com/api/v2/sql';

  var city = currentCity,
      description = (currentDescription.replace(/'/g,"''")).replace(/"/g,"''"),
      name = (currentNeighborhood.replace(/'/g,"''")).replace(/"/g,"''"),
      cityYears = cityYears,
      hoodYears = nbrhdYears;
  //q=INSERT INTO test_table (column_name, column_name_2, the_geom) VALUES ('this is a string', 11, ST_SetSRID(ST_Point(-110, 43),4326))&api_key={api_key}
  //sql
  //cartodb_id,the_geom,flag,nbrhd_yrs,city_yrs,city,description,name,loved,updated_at,created_at
  
  var tableName = pointTblName; //tblName + '_point';
  for (i=0, arrLen = separatedFeatures.markers.length; i < arrLen; i++) {
    var marker = separatedFeatures.markers[i]/*,
        coords = "ST_SetSRID(ST_GeomFromGeoJSON('"
          + '{"type":"Point","coordinates":' 
          + '[' + marker.getLatLng().lng + ',' + marker.getLatLng().lat + ']'
          + "}'" + "),4326)'";*/
    $.post(
      url,
      { 
        'q' : buildCartoDBQuery(
                tableName,
                '{"type":"Point","coordinates":' + '[' + marker.getLatLng().lng + ',' + marker.getLatLng().lat + ']' + '}',
                city, description, name, cityYears, hoodYears, 
                marker._colorId
              ), 
        'api_key' : api_key 
      }, 
      function(d) {
        console.log(d);
      }
    );
  }

  var tableName = polyTblName; //tblName;
  for (i=0, arrLen = separatedFeatures.polygons.length; i < arrLen; i++) {
    var poly = separatedFeatures.polygons[i],
        latLngs = poly.getLatLngs();
        coordsArr = [];
    for (var j = 0; j < latLngs.length; j++) {
      var lat = (latLngs[i].lat);//.toFixed(4); // rid of rounding that was there for url length issue during dev
      var lng = (latLngs[i].lng);//.toFixed(4); // rid of rounding that was there for url length issue during dev
      coordsArr.push('['+lng + ',' + lat+']');
    }
    var coords = coordsArr.join(',');
    $.post(
      url,
      { 
        'q' : buildCartoDBQuery(
                tableName,
                '{"type":"MultiPolygon","coordinates":[[[' + coords + ']]]}',
                city, description, name, cityYears, hoodYears, 
                poly._colorId
              ), 
        'api_key' : api_key 
      }, 
      function(d) {
        console.log(d);
      }
    );
  }
}

//q=INSERT INTO test_table (column_name, column_name_2, the_geom) VALUES ('this is a string', 11, ST_SetSRID(ST_Point(-110, 43),4326))&api_key={api_key}
function buildCartoDBQuery(tableName, the_geom, city, description, name, cityYears, hoodYears, colorId, flag,loved) {
  var resArray = ['INSERT INTO '];

  resArray.push( tableName );
  resArray.push( ' (the_geom, city, description, name, city_yrs, nbrhd_yrs, color_id, flag, loved)' );
  resArray.push( ' VALUES (' );
  resArray.push( "ST_SetSRID(ST_GeomFromGeoJSON('" + the_geom + "'),4326)" );
  resArray.push( ",'");
  resArray.push( city );
  resArray.push( "','");
  resArray.push( description );
  resArray.push( "','");
  resArray.push( name );
  resArray.push( "','");
  resArray.push( cityYears );
  resArray.push( "','");
  resArray.push( hoodYears );
  resArray.push( "','");
  resArray.push( colorId );
  resArray.push( "','");  
  resArray.push( "false','0')" );
  //resArray.push( ')' );
  
  return resArray.join('');
}

//q=INSERT INTO test_table (column_name, column_name_2, the_geom) VALUES ('this is a string', 11, ST_SetSRID(ST_Point(-110, 43),4326))&api_key={api_key}
function buildCartoDBQuery_v2(tableName, the_geom, user_id, geom_color) {
  var resArray = ['INSERT INTO '];

  resArray.push( tableName );
  resArray.push( ' (the_geom, user_id, geom_color, created_at)' );
  resArray.push( ' VALUES (' );
  resArray.push( "ST_SetSRID(ST_GeomFromGeoJSON('" + the_geom + "'),4326)" );
  resArray.push( ",'");
  resArray.push( user_id );
  resArray.push( "','");
  resArray.push( geom_color );
  //resArray.push( "', NOW())" );
  resArray.push( "', CURRENT_TIMESTAMP)" );
  //resArray.push( ')' );
  
  return resArray.join('');
}

/* build united query per a table*/
function buildUnitedDBQuery(tableName, user_id, features, geomComposer, colorGetter) {
  var resArray = ['INSERT INTO '];

  resArray.push( tableName );
  resArray.push( ' (the_geom, user_id, geom_color, created_at)' );
  resArray.push( ' VALUES ' );
  var values = [];
  for (var i=0, arrLen = features.length; i < arrLen; i++) {
    var feature = features[i],
      the_geom = geomComposer.call( null, feature),
      geom_color = colorGetter.call( null, feature),
      value = [];
    value.push( "(ST_SetSRID(ST_GeomFromGeoJSON('" + the_geom + "'),4326)" );
    value.push( ",'");
    value.push( user_id );
    value.push( "','");
    value.push( geom_color );
    //resArray.push( "', NOW())" );
    value.push( "', CURRENT_TIMESTAMP)" );
    values.push( value.join('') );
  }
  resArray.push( values.join(',') );
  
  return resArray.join('');
}

function separateDrawnItems() {
  var sortedFeatures = { 'markers' : [], 'polygons' : [] };
  drawnItems.getLayers().forEach( function( item, arrIndex, arr ) {
    if (item instanceof L.Marker) {
      this.markers.push(item);
    } else if (item instanceof L.Path) {
      this.polygons.push(item);
    } else {
      console.log('Incorrect type of feature', item);
    }
  }, sortedFeatures);
  return sortedFeatures;
}

function askForRespondentId(setHandlers) {
  var modal = $('#aboutModal').modal({ backdrop: 'static', keyboard: false , show: true });
  //var modal = $('#aboutModal').modal('show');
  if (setHandlers) {    
    modal.on('hide.bs.modal',function(){
      if (!notEmpty(document.getElementById('respondentId'))){
        alert('Please enter a respondent Id, Thanks!', 30);  
        return false;
      };
    });
    modal.on('hidden.bs.modal',function(){
      if ( $('body').hasClass('make') ) showInstructions();
      document.getElementById('respondentId').value= '';
    });
  }
}
/*---------------------------
----- Some Functions -------------
---------------------------*/
var loadHoods = function(){
  //remove curren tresults layer
  lg.clearLayers();
  cartodb.createLayer(map, {
    user_name: usrName,
    table_name: tblName+"_point",
    zIndex:'999',
    type: 'cartodb',
    cartodb_logo: false,
    query: "SELECT * FROM "+tblName+"_point where flag = false",
    tile_style:'#'+tblName+'_point {marker-fill-opacity: 0.75;marker-line-color: #cd0000;marker-line-width: 5;marker-line-opacity: .25;marker-placement: point;marker-type: ellipse;marker-width: 10;marker-fill: #cd0000;marker-allow-overlap: true;[zoom<12]{marker-width:5;marker-line-width:2.5}}',
    interactivity: 'cartodb_id,name, description',
    featureClick: function(ev, latlng, pos, data){pointClicky(ev, latlng, pos, data)},
  })
  .done(function(layer) {
    lg.addLayer(layer);
  });
  cartodb.createLayer(map, {
    user_name: usrName,
    table_name: tblName,
    zIndex:'999',
    type: 'cartodb',
    cartodb_logo: false,
    query: "SELECT * FROM "+tblName+" where flag = false",
    tile_style:'#'+tblName+' {line-opacity:.8;line-color: #cd0000;line-width:0.5;polygon-fill:#fff;polygon-opacity:0.1;}::accent{image-filters: agg-stack-blur(3,3);line-opacity:.2;line-color: #cd0000;line-join:round;polygon-opacity:.01;[zoom=10] { line-width: 1; } [zoom=11] { line-width: 2; } [zoom=12] { line-width: 3; } [zoom>12] { line-width: 4; }}',
    interactivity: 'cartodb_id,name, description',
    featureClick: function(ev, latlng, pos, data){hoodClickHandler(ev, latlng, pos, data)},
    featureOver: function(ev, latlng, pos, data){hoodOverHandler(ev, latlng, pos, data)},
    featureOut: function(ev,latlng, pos, data){hoodOutHandler(ev,latlng,pos,data)}
  })
  .done(function(layer) {
    lg.addLayer(layer);
  });
}
var hoodOverHandler = function(ev,latlng,pos,data){
  $('#map').css('cursor', 'pointer');
}
var hoodOutHandler = function(ev,latlng,pos,data){
  $('#map').css('cursor', 'auto');
}
var hoodClickHandler = function(ev,latlng,pos,data){
  console.log(data);
  //$('#map').css('cursor', 'auto');
  hoodClickGetter(latlng);
}
var pointClicky = function(ev,latlng,pos,data){
  console.log(data);
}
var hoodClickGetter = function(ll){
  getJSON.abort();
  getJSON = $.ajax(
    {url:myPath+"/sql?q=SELECT name FROM "+tblName+" WHERE ST_Intersects( the_geom, ST_SetSRID((ST_POINT("+ll.lng+", "+ll.lat+")) , 4326)) AND flag = false GROUP BY name ORDER BY name ASC",
    crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
                    if (text_status != "abort") {
                       // get_data_from_server();  // Try request again.
                    }
                }
      }).done(function(data) {
        var pgArr = '{';
        var unique = false;
        //build array for geojson query and see if the hood is already highlighted
        for(var i = 0;i<data.rows.length;i++){
          boo = true;
          for(var h=0;h<highlightHoods.length;h++){
              if(data.rows[i].name===highlightHoods[h].name){
                boo = false;
                break;
              }
          }
          if(boo){pgArr+=data.rows[i].name+',';unique = true;}
        }
        if(!unique){
          return;
        }
        pgArr = pgArr.substring(0, pgArr.length - 1)+'}';
        pgArr = pgArr.replace(/'/g,"''");
        pgArr = pgArr.replace(/"/g,"''");
        getNewHoods(pgArr);
      });

}
var getNewHoods = function (arr){//takes array of neighborhood names, gets and draws geojson
  var bnds = map.getBounds()
  ,top = bnds.getNorth()
  ,right = bnds.getEast()
  ,left = bnds.getWest()
  ,bottom = bnds.getSouth();
  console.log("ltrb: "+left+','+top+","+right+","+bottom);
 getJSON = $.ajax(
  
    {url:myPath+"/sql?q=SELECT name,COUNT(name),array_agg(description)as description,array_agg(loved)as loved,array_agg(cartodb_id) as cartodb_id,array_agg(ST_AsGeoJSON(the_geom)) as the_geom FROM hoods WHERE name = ANY('"+arr+"') AND flag = false AND ST_Intersects(ST_Envelope(the_geom), ST_MakeEnvelope("+left+","+bottom+","+right+","+top+",4326)) GROUP BY name ORDER BY name ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
                    if (text_status != "abort") {
                      //  get_data_from_server();  // Try request again.
                    }
                }
      }).done(function(data) {
        console.log(data);
        var currentHoodsCount = highlightCount;
        console.log(currentHoodsCount);
       
        var newHoodCount = data.rows.length;
        if((currentHoodsCount+newHoodCount)>fillArr.length){
          console.log('too many hoods!');
          var diff = (currentHoodsCount+newHoodCount);
          var spliceOff = diff-fillArr.length;
            clearSomeHoods(spliceOff);
          
        }
        for(var i = 0;i<data.rows.length;i++){
          highlightCount++;
          var count = data.rows[i].count;//this is the number of versions of that specific neighborhood
          var name = data.rows[i].name;
          var op = 1-(Math.pow(.2,1/count));
          data.rows[i].layers=[];
          data.rows[i].fillColor = fillArr[0];
          fillArr.push(fillArr.shift());
          highlightHoods.push(data.rows[i]);
          var nStyle = {
                  "stroke":true,
                  "color":"#cccccc",//data.rows[i].strokeColor,
                  "weight":1,
                  "opacity":1,
                  "fill":true,
                  "fillColor":data.rows[i].fillColor,
                  "fillOpacity":op,
                  "clickable":false
          }; var tmpName = highlightHoods.length-1;

          $("#accordion").prepend('<div class="panel panel-default yesMouse '+(tmpName)+'" > '+
            '<div class="panel-heading yesMouse" data-toggle="collapse" style="background-color:'+data.rows[i].fillColor+';"><h4 class="panel-title" >'+
               '<a data-toggle="collapse"  href="#collapse'+(tmpName)+'" >'+
              '<span id="glyphicon'+(tmpName)+'" class="glyphicon glyphicon-chevron-up"></span>    '+
               name+
               '</a><button id='+(tmpName)+' type="button" class="close highlightedHood-btn" >×</button></h4>'+
            '</div>'+
            '<div id="collapse'+(tmpName)+'" class="panel-collapse collapse in">'+// add class 'in' if you want to add it open
              '<div class="panel-body detailText">'+
                //TODO add handler for description array
                getTheText(data.rows[i],tmpName)+
              '</div>'+
            '</div>'+
          '</div><div style="height:5px;" class="yesMouse '+(tmpName)+'"></div>'+
          '<script>'+
          '$("#collapse'+tmpName+'").on("hidden.bs.collapse", function () {$("#glyphicon'+tmpName+'").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");resizeHandler()});'+
          '$("#collapse'+tmpName+'").on("shown.bs.collapse", function () {$("#glyphicon'+tmpName+'").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");resizeHandler()});'+
          '$(".enableTooltips").tooltip({container:"body",placement:"right"});'+
          '</script>'
          );
          resizeHandler();
          for (var n = 0;n<count;n++){
              var geom = data.rows[i].the_geom[n];
              var polygons = jQuery.parseJSON(geom);
              var lyr = L.geoJson(polygons, {
                  style: nStyle
              });
              data.rows[i].layers.push(lyr);
              data.rows[i].layers[data.rows[i].layers.length-1].addTo(overlg);
          }
      }
  })
}
var getTheText = function(d,tmpName){
  var ret ="";
  for(var di = 0;di<d.description.length;di++){
   var geom = d.the_geom[di];
     
          var rand = Math.floor((Math.random()*999999)+1);
    ret += '<div class="row"><div class= "col-xs-3">'+
    '<div class="row"><div class="col-xs-12"><div id="map'+rand+'" style="height:50px;width:50px;"></div></div></div>'+
    '<div class="row icon-row">'+
    '<div class="col-xs-6"><span name="'+d.cartodb_id[di]+'" class="loveflag glyphicon glyphicon-flag flag-btn enableTooltips yesMouse" title="Flag for Inappropriate Content"></span></div>'+
    '<div class="col-xs-6"><span name="'+d.cartodb_id[di]+'" class="loveflag glyphicon glyphicon-heart heart-btn enableTooltips yesMouse" title="Love This Neighborhood Image!"></span></div>'+
    '</div></div>'+
    '<div class="col-xs-9">'+
    '<script>var map'+rand+' = L.map("map'+rand+'",{zoomControl:false,attributionControl:false});'+
    'var geom = '+geom+';'+
    'var lyr = L.geoJson('+geom+',{style:hStyle}).addTo(map'+rand+');'+
    'L.tileLayer("http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png", {attribution: "OpenStreetMap",opacity:0.4}).addTo(map'+rand+');'+
    'map'+rand+'.fitBounds(lyr.getBounds());'+
    '</script><span>';

    if(d.description[di]===''){
      ret+='No story given.'
    }else{
      ret+=d.description[di];
    }
    ret+='</span><p  class="lovecount"><b>'+d.loved[di]+'</b> love.</p></div></div>'
  }
  return ret;
}
var clearSomeHoods = function(cnt){
  for(var i=0;i<cnt;i++){
    for(var h=0;h<highlightHoods.length;h++){
      if(highlightHoods[h].name != ''){
        clearHighlightedHood(h);
        break;
      }
    }
  }
}
function notEmpty(elem){
  if(elem.value.length == 0){
    elem.focus(); // set the focus to this input
    return false;
  }
  return true;
}
var clearHighlightedHood = function(idx){
  highlightCount--;
  $( "."+idx+"" ).remove();
  var lyrs = highlightHoods[idx].layers;
  highlightHoods[idx].name = '';
  for(var l=0;l<lyrs.length;l++){
    overlg.removeLayer(lyrs[l]);
  }
  //todo shift color to end start of fill array
  var find = highlightHoods[idx].fillColor;
  for(var i = 0;i<fillArr.length;i++){
    //console.log(find + '?' + fillArr[i]);
    if(fillArr[i]===find){
      console.log('found')
      element = fillArr[i];
      fillArr.unshift(fillArr.splice(i, 1));
    }
  }
  resizeHandler();
}
var resizeHandler = function(){
  vph = $(window).height();
  var position = $('#descriptionDiv').position().top;
  contentHeight = $('#accordion')[0].scrollHeight;
  }
var postData = function(url,data){
  if ( !url || !data ) return;
  data.cache = false;
  data.timeStamp = new Date().getTime()
  $.post(url,
    data, function(d) {
      console.log(d);
    });
}
var getExistingNeighborhoodNames = function(){
  $.ajax(
    {url:myPath+"/sql?q=SELECT name,COUNT(name) FROM "+tblName+" WHERE flag = false GROUP BY name ORDER BY name ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
      }
    }).done(function(data) {
      var newARR=[].concat(hoodNames);  // names.js
      $.each(data.rows, function() {
        if ( newARR.indexOf( this.name ) == -1 )
      newARR.push(this.name);
    });
    $('#neighborhoodName').typeahead({
      name:"y",
      local: newARR
    });
  });
}
var getExistingCityNames = function(){
  $.ajax(
    {url:myPath+"/sql?q=SELECT city,COUNT(city) FROM "+tblName+" WHERE flag = false GROUP BY city ORDER BY city ASC",
      crossDomain:true,
      dataType:"jsonp",
      error: function (xhr, text_status, error_thrown) {
        console.log(text_status)
      }
    }).done(function(data) {
      var newARR=[].concat(cityNames);
      $.each(data.rows, function() {
        if ( newARR.indexOf( this.city ) == -1 )
      newARR.push(this.city);
    });
    $('#cityName').typeahead({
      name:"yy",
      local: newARR
    });
  });
}
var animateHeart = function(ex,wy){
  $("#loveIcon").css({left:ex-10,top:wy-10,opacity:1,width:20,height:20});
  $( "#loveIcon" ).animate({
    top: '-=' + $("#loveIcon").height()/2,
    left: '-=' + $("#loveIcon").width()/2,
    width: $("#loveIcon").width()*2,
    height: $("#loveIcon").height()*2,
    opacity: 0
  }, 600 );
}
var goViewState = function(e){
  $('body').attr('class','view');
  loadHoods(); 
  map.removeLayer(drawnItems);
  $('#btnBar').fadeOut('fast', function() {
    $('.viewMap').fadeIn('fast', function() {
    });
  });
}
var goMakeState = function(){
  $('body').attr('class','make');
  $('.viewMap').fadeOut('fast', function() {
    $('#btnBar').fadeIn('fast', function() {
    });
  });
  
  if($('#resultsInSpace').hasClass('active')){
    $('#resultsInSpace').button('toggle');
    
  };
  mapBackground = false;
  toner.setOpacity(1);
  sat.setOpacity(1);
  lg.clearLayers();
  map.addLayer( drawnItems );

  if ( poly ) drawnItems.removeLayer( poly );
  if ( marker ) drawnItems.removeLayer( marker );
  poly = undefined;
  marker = undefined;
  if ( freeDrawLayer ){
    map.removeLayer(freeDrawLayer);
    freeDrawLayer = undefined;
    map.dragging.enable();
    $(".leaflet-container").removeClass("drawing");
  }

  clearSomeHoods(highlightCount);
  $('#deletePolyBtn').hide();
  $('#startBluePolyBtn').show();
  $('#startGreenPolyBtn').show();
  $('#startGreyPolyBtn').show();
  $('#startBlackMarkerBtn').show();
  $('#startRedMarkerBtn').show();
  $('#submitPolyBtn').hide();

  if ( !instructed ) showInstructions();
}

/*-----------------------------------------
---------UI helper stuff
-------------------------------------------*/
function showInstructions(){
  if ( (instructed.poly && instructed.point) || !isShowingInstructions) return;
  var action = L.Browser.touch ? 'tap' : 'click';
  var title = 'Draw your first neighborhood!',
    text = 'To get started, zoom to your area of interest, then ' + action + ' the <b>neighborhood SHAPE</b> or <b>neighborhood POINT</b> button.',
    src = 'img/instructions1.gif';
  showAlert( title, text, src );
}
function showDrawingInstructions(){
  if ( instructed[geomType] || !isShowingDrawingInstructions) return;
  if ( geomType == "poly" ){
    var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
    var title = 'Now trace the neighborhood',
      text = action + ' to draw the shape of the neighborhood. You won\'t be able to move the map while drawing, but don\'t worry, you can make changes after you finish.',
      src = 'img/instructions2_poly.gif';
    showAlert( title, text, src );
    //$('#generalModal').on('hide.bs.modal',enableDrawing)
  } else {
    var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
    var title = 'Now place the marker',
      text = L.Browser.touch ? 'Drag the marker to the desired location, then tap <b>Save Neighborhood</b>.'
        : 'Move your mouse to the desired location, then click to drop the marker.'
      src = L.Browser.touch ? 'img/instructions3_point.gif' : 'img/instructions2_point.gif';
      if ( L.Browser.touch ) instructed[geomType] = true;
    showAlert( title, text, src );
  }
  
}
function showEditingInstructions(){
  if ( instructed[geomType] || !isShowingEditingInstructions) return;
  instructed[geomType] = true;
  if ( geomType == "poly" ){
    var action = L.Browser.touch ? 'tap' : 'click';
    var title = 'Looking good!',
      text = 'You can now adjust the shape of the neighborhood. Drag the white squares to change the shape, or ' + action + ' them to delete corners. When you are satisfied with the shape, ' + action + ' <b>Save Neighborhood</b> to submit it.',
      src = 'img/instructions3_poly.gif';
    showAlert( title, text, src );
  } else {
    if ( L.Browser.touch ) return;
    var title = 'Looking good!',
      text = 'You can click and drag the marker to edit its location. When you are satisfied, click <b>Save Neighborhood</b> to submit it.',
      src = 'img/instructions3_point.gif';
    showAlert( title, text, src );
  }
}
function showAlert( title, text, imageSrc, buttonLabel ){
  var m = $("#generalModal");
  $('.modal-body', m).empty();

  $('h3',m).html(title);
  
  if ( imageSrc ){
    $('<div class="img-container">')
      .html('<img src="'+imageSrc+'">')
      .appendTo( $('.modal-body', m) );
  }

  $('<p>')
    .html(text)
    .appendTo( $('.modal-body', m) );

  buttonLabel = buttonLabel || 'OK';
  $('.btn-default',m).html(buttonLabel);

  m.modal('show');
}

function onClickMarkerBtn(){
  var geomType = "point";
  //$('#deletePolyBtn').show();
  this.hide.forEach( function( item, arrIndex, arr ) {
    $(item).hide();  
  });
  var marker = map.editTools.startMarker();
  marker.setIcon(this.icon);
  marker._colorId = this.color;
  editModeActivated = true;
  //drawnItems.addLayer( marker );
  showDrawingInstructions();  
  //updateUIVisibility();
}

function onClickPolyBtn(){
  geomType = "poly";
  //$('#deletePolyBtn').show();
  this.hide.forEach( function( item, arrIndex, arr ) {
    $(item).hide();  
  });
  drawnItems.eachLayer(function(l){
    if ( l.setStyle ) l.setStyle({clickable:false});
  });
  if ( !instructed.poly ){
    showDrawingInstructions();
    //return;
  }
  enablePolyDrawing(this.style, this.color);
}

function enablePolyDrawing(polyStyle, colorId){
  editModeActivated = true;
  freeDrawLayer = new L.FreeDraw({mode: L.FreeDraw.MODES.ALL})
    .on( 'created', function(e){
      var originalPoly = this.polygons[0];
      poly = L.polygon( originalPoly.getLatLngs(), this.options.polyStyle );
      poly._colorId = this.options.colorId;
      map.removeLayer( originalPoly );
      map.removeLayer(freeDrawLayer);
      freeDrawLayer = undefined;
      drawnItems.addLayer( poly );
      poly.enableEdit();
      $(".leaflet-container").removeClass("drawing");
      //$('#submitPolyBtn').show();
      showEditingInstructions();
      updateUIVisibility();
    })
  L.extend(freeDrawLayer.options, { 'polyStyle' : polyStyle, 'colorId' : colorId });
  map.addLayer(freeDrawLayer);
  $(".leaflet-container").addClass("drawing");
  //$('#generalModal').off('hide.bs.modal',enableDrawing)
}

function isDrawingEnabled() {
  return (editModeActivated || drawnItems.getLayers().length > 0)
  //return (map.editTools.featuresLayer.lenght + map.editTools. > 0)
}

function getRidOfDrawnItems() {
  drawnItems.clearLayers();
  map.editTools.stopDrawing();
  map.editTools.featuresLayer.clearLayers();
}

function updateUIVisibility() {
  if (isDrawingEnabled()) {
    $('#deletePolyBtn').show();
    $('#submitPolyBtn').show();
  } else {
    $('#deletePolyBtn').hide();
    $('#submitPolyBtn').hide();
  }
}

/*-----------------------------------------
---------Hey, Listeners! Lookout behind you! |o| |<{}>| |o| 
-------------------------------------------*/
$('.mapState').click(function() {
		$('.mapState').removeClass('active');
		$(this).addClass('active');
});
$("#resultMapBtn").click(function(e){
	goViewState();
});
$("#makeMapModeBtn").click(function(e){
	goMakeState();
});
$("#githubBtn").click(function(e){
  window.open(giturl, '_blank');
});
$("#twitterBtn").click(function(e){
  window.open(twiturl, '_blank');
});
$("#modalInfoBtn").click(function(e){
  window.open(brandLink, '_blank');
});
//kludge for stupid bootstrap btn group conflict I couldn't figure out.
$('.btn-group button').click(function()
{
    $(this).parent().children().removeClass('active');
    $(this).addClass('active');
});
$(document).on('click', ".highlightedHood-btn", function() {
  var removeIndex = $(this).attr("id");
  clearHighlightedHood(removeIndex);
});
$(document).on('click',".download-btn",function(){
  $('#downloadModal').modal('show');
});
$(document).on('click',".flag-btn",function(){
  flagIndex = $(this).attr("name");
  $('#flagModal').modal('show');

});
$(document).on('click',".heart-btn",function(event){
  var heartIndex = $(this).attr("name"),
    op;
  if ( !$(this).hasClass('flagged') ){
    op = "+ 1";
    animateHeart(event.clientX,event.clientY);
    $(this).addClass('flagged')
  } else {
    op = "- 1";
    $(this).removeClass('flagged')
  }
  postData( "php/heart.php", {
    id: heartIndex,
    op: op
  });
});
$(document).on("hidden.bs.collapse", ".collapse", function () {resizeHandler()});
$(window).resize(function(){resizeHandler()});
$(window).ajaxStart(function() {
    ajaxrunning = true;
});
$(window).ajaxStop(function() {
    ajaxrunning = false;
});
$(window).load(go);