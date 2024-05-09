<!DOCTYPE html>
<html>
<head>
    <title>Google Maps Custom Map</title>
    <style>
        #googleMap {
            width: auto;
            height: 500px;
        }
          @media screen and (max-width: 767px) {
            .filterBar {
              flex-direction: column;
              gap: 0 !important;
              & .dealDropdown, .optionDropdown {
                  width: 94% !important;
                  margin: 0.5rem auto !important;
              }
              & button, #list4 {
                  width: 100% !important;
                  margin: 0 !important;
              }
              & .css-gg4vpm {
                  display: none;
              }
            }
        }
    </style>
</head>
<body>
<h1 style="text-align: center; margin-bottom: 25px;">My Properties</h1>
<div class="filterBar" style="display:flex; gap: 1%; width: 100%;">
<select class="dealDropdown" id="dealDropdown" onchange="filterMarkers(this.value, document.getElementById('optionDropdown').value);" style="width: 50%;
    flex-grow: 1;
    color: rgb(158, 158, 158);
    border-color: rgb(158, 158, 158);
    padding: 0.5rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;">
    <option value="all"> All Campaigns</option>
</select>
<select class="optionDropdown" id="optionDropdown" onchange="filterMarkers(document.getElementById('dealDropdown').value, this.value);" style="width: 30%;
    color: rgb(158, 158, 158);
    flex-grow: 1;
    border-color: rgb(158, 158, 158);
    padding: 0.5rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0 1.5rem 8px;">
    <option value="all"> All Options</option>
    <option value="suitable">Opportunuty</option>
    <option value="unsuitable">Unsuitable</option>
    <option value="">Amenities</option>
</select>
</div>
<div id="googleMap"></div>

<script>
async function fetchDataFromAirtable() {
    try {
        const response = await fetch('https://api.airtable.com/v0/[table?view=PublicAPI', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer [key]',
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
async function fetchDealsFromAirtable() {
    try {
        const response = await fetch('https://api.airtable.com/v0/[table]?view=Grid%20view', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer [key]',
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
document.addEventListener("DOMContentLoaded", function() {
    let filterBar = document.querySelector(".filterBar");
    let listBox = document.querySelector("#list4 section div > div > div");
    let list = document.querySelector("#list4");
    filterBar.appendChild(list);
    list.style.width = "20%";
    list.style["min-width"] = "max-content";
    list.style["margin-left"] = "-1%";
    listBox.style.display = "none";
});

async function populateDropdown() {
    const deals = await fetchDealsFromAirtable();
    let dropdown = document.querySelector(".dealDropdown");
    let userDeals = deals.map(deal => {
        if (deal.fields.Buyers.includes(window.logged_in_user.record_id)) {
            let el = document.createElement("option");
            el.value = deal.id;
            el.innerHTML = deal.fields.Name;
            dropdown.appendChild(el);
        }
    });
};
populateDropdown();

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
            imageUrl: property.fields.Images[0].url || '',
            mapButtonUrl: window.location.origin + property.fields.MapButton,
            propertyBuyers: property.fields.Buyer || property.fields["Client Added"],
            propertyDeals: property.fields.Deals || ""
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
         if (!buyers.includes(window.logged_in_user.record_id)) return;
        var marker = new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map: map,
            icon: getIcon(location.opinion),
            title: location.name,
            category: [location.opinion, location.propertyDeals]
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

    filterMarkers = function(deal, option) {
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if ((marker.category.includes(option) && marker.category[1].includes(deal)) || (deal === 'all' && marker.category.includes(option)) || (option === 'all' && marker.category[1].includes(deal)) || (option === 'all' && deal === 'all')) {
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
        case 'client owned':
            iconColor = 'blu';
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

<script src="https://maps.googleapis.com/maps/api/js?key=]key]"></script>

</body>
</html>
