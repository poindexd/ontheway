/*  ontheway main.js
 *  initializes maps and grabs places
 */

//Types of places to grab from Google Places API
var types = ['bakery', 'bar', 'cafe', 'convenience_store', 'department_store', 'food', 'gas_station', 'grocery_or_supermarket', 'night_club', 'restaurant', 'store', 'shopping_mall'];
var type_names = ['bakery', 'bar', 'cafe', 'convenience store', 'department store', 'food', 'gas station', 'grocery store', 'night club', 'restaurant', 'store', 'shopping mall'];

//From snazzymaps.com
var map_style = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];

//Array to hold trips from Automatic user
var trips = [];

//Initialiaze array tp hold markers
var markers = new Array(types.length);
$.each(markers, function(i,v){
  markers[i] = [];
});

//Authorize with dummy Automatic account
$.ajax({
  url: "https://api.automatic.com/trip/",
  headers: {
    'Authorization': 'Bearer 8fb6bd2a78ebeb220db03b2f04f93a05587791d9'
  },
  success: function(data, status) {
    trips = data.results;
    process_trips(trips);
  }
});

//Initialize each of the trip maps on the right side
function process_trips(trips){
  if (trips.length <=0)
    return false;
  $.each(trips, function(i, trip){

    if (trip.path == null)
      return true;

    var trip_div = $('<div id=trip'+i+'></div>').addClass('trip').appendTo('#trips');
    draw_trip(trip, trip_div[0], false);

  });
}

//Draw a trip map onto a dom element, return the map object
function draw_trip(trip, map_element, editable){
  var path = google.maps.geometry.encoding.decodePath(trip.path);

  var map = new google.maps.Map(map_element, {
    center: new google.maps.LatLng(trip.start_location.lat, trip.start_location.lon),
    zoom: 15,
    styles: map_style,
    scrollwheel: editable,
    draggable: editable,
    panControl: editable,
    zoomControl: editable,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: editable
  });

  map.fitBounds(get_bounds(path));

  var polyline = new google.maps.Polyline({
    map: map,
    path: path,
    strokeColor: 'orange'
  });

  return map;
}

//helper to get lat/lng bounds given a path
function get_bounds(path){
  var bounding_rect = new google.maps.LatLngBounds();

  $.each(path, function(i,v){
    bounding_rect.extend(v);
  })

  return bounding_rect;
}

//Query Google places and place markers for the results
//TODO: Error checking
function draw_markers(trip, map){

  var path = google.maps.geometry.encoding.decodePath(trip.path);

  var request = {
    bounds: get_bounds(path),
    types: types
  };

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, function(results, status) {

    if (status != google.maps.places.PlacesServiceStatus.OK)
      return false;

      $.each(results, function(i, place){

        var image = {
          url: place.icon,
          scaledSize: new google.maps.Size(32,32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(0, 32)
        };

        var marker = new google.maps.Marker({
          map: map,
          position: place.geometry.location,
          icon: image
        });

        marker.content = '<p>'+place.name+'</p>';
        var infowindow = new google.maps.InfoWindow();

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(this.content);
          infowindow.open(this.getMap(), this);
        });

        var idx = 0;
        while((types.indexOf(place.types[idx])==-1) && (idx < place.types.length))
          idx++;

        markers[types.indexOf(place.types[idx])].push(marker);

      });

      apply_filters();
  });
}

//When a trip is clicked, move it to the big pane
//TODO: cache trips/markers
$(document).on('click', '.trip', function(){

  if ($(this).hasClass('selected'))
    return true;

  $('#map').html('<div class="preloader-wrapper big active"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>')
  
  var id = $(this).attr('id').replace(/trip/, '');
  var map = draw_trip(trips[id], $('#map')[0], true);

  draw_markers(trips[id], map);
  
  $(this).siblings().removeClass('selected');
  $(this).addClass('selected');
})

//init filters
function apply_filters(){
  $('input[type=checkbox]').each(function(){
    $(this).attr('checked','checked').trigger('change');
  });
}

//init checkboxes
$.each(types, function(i, v){
  $('#filters').append('<div><input type="checkbox" id="'+v+'" /><label for="'+v+'">'+type_names[i]+'</label><div>');
});

//Update map when checkbox clicked
$('input[type=checkbox]').change(function(){
  var id = types.indexOf($(this).attr('id'));
  var checked = $(this).is(":checked");
  $.each(markers[id], function(i,v){
    v.setVisible(checked);
  });
  return true;
});