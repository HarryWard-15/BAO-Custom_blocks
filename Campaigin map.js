Map Custom Code
<!DOCTYPE html>
<html>
<head>
    <title>Google Maps Custom Map</title>
    <style>
        #googleMap {
            width: auto;
            height: 500px;
        }
    </style>
</head>
<body>
<h1 style="text-align: center; margin-bottom: 25px;">My Properties</h1>
<div id="googleMap"></div>
<select id="type" onchange="filterMarkers(this.value);" style="width: 100%;
    color: rgb(158, 158, 158);
    border-color: rgb(158, 158, 158);
    padding: 0.5rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;">
    <option value="all"> All Options</option>
    <option value="suitable">Opportunuty</option>
    <option value="unsuitable">Unsuitable</option>
    <option value="">Amenities</option>
</select>

<script>
async function fetchDataFromAirtable() {
    try {
        const response = await fetch('https://api.airtable.com/v0/[Table Record]?view=PublicAPI', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer [Auth Key]',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.records;
    } catch (error) {
        console.error('There was a problem fetching data from Airtable:', error);
        return []; // Return an empty array in case of error
    }
}

async function initializeMap() {
    try {
        const properties = await fetchDataFromAirtable();
        // Process the properties and initialize the map
        let locations = properties.map(property => ({
            name: property.fields['Property Address'],
            latitude: parseFloat(property.fields['Latitude (from Property)'][0]),
            longitude: parseFloat(property.fields['Longitude (from Property)'][0]),
            opinion: (property.fields.Opinion || '').toLowerCase(),
            price: property.fields['Advertised Price (from Property)'] || '-',
            imageUrl: property.fields.Images[0].url,
            mapButtonUrl: window.location.origin + property.fields.MapButton,
            propertyBuyers: property.fields.Buyer
        }));
        initialize(locations);
    } catch (error) {
        console.error('There was a problem initializing the map:', error);
    }
}

function initialize(locations) {
    var myCenter = { lat: -31.9514, lng: 115.8617 };
    var mapProp = {
        center: myCenter,
        zoom: 12,
        scrollwheel: false,
        draggable: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    var markers = [];
    var infoWindows = [];

    locations.forEach(location => {
        let buyers = location.propertyBuyers;
         if (!buyers.some(buyer => buyer == window.logged_in_user.record_id)) return;
        var marker = new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map: map,
            icon: getIcon(location.opinion),
            title: location.name,
            category: location.opinion
        });

        var infoWindowContent = '<img width="100%" style="max-width:250px; padding-bottom: 15px;" src="' + location.imageUrl + '"></br><strong>' + location.name + '</strong><br><br><div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">' + location.price + '<button style="background-color: rgb(224, 169, 76); border: none; padding: 0.5rem 1rem; border-radius: 5px;"><a style="color: white;" href="' + location.mapButtonUrl + '">View property</a></button></div>';

        var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
        });

        markers.push(marker);
        infoWindows.push(infoWindow);

        marker.addListener('click', function () {
            infoWindows.forEach(infoWindow => infoWindow.close());
            infoWindow.open(map, marker);
        });
    });

    filterMarkers = function(category) {
        for (var i = 0; i < markers.length; i++) {
        console.log(category, markers[i].category);
            var marker = markers[i];
            if (category === 'all' || marker.category === category) {
                marker.setVisible(true);
            } else {
                marker.setVisible(false);
            }
        }
    };
}

function getIcon(option) {
    var iconBase = 'https://maps.google.com/mapfiles/kml/paddle/';
    var iconColor;

    switch (option) {
        case 'suitable':
            iconColor = 'grn';
            break;
        case 'unsuitable':
            iconColor = 'red';
            break;
        default:
            iconColor = 'ylw';
            break;
    }

    return {
        url: iconBase + iconColor + '-blank.png',
        scaledSize: new google.maps.Size(50, 50)
    };
}

// Call initializeMap when the page loads
initializeMap();
</script>

<script src="https://maps.googleapis.com/maps/api/js?key=[Api Key]"></script>

</body>
</html>
