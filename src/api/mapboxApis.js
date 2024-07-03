// all Api calls related to mapbox

import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1Ijoiam9lbGFhcm9uIiwiYSI6ImNsbmRpaWlkbDA0ZHEya21rNnVqd2t0MDgifQ.tWei82YsyHOpERaAUq_Vuw";

// Function to update tileset source
async function updateTilesetSource() {
    const response = await fetch('https://api.mapbox.com/tilesets/v1/{tileset_id}/recipe' + mapboxgl.accessToken, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 'example-source',
            tileset: 'mapbox://tileset-id'
        })
    });

    const data = await response.json();
    console.log(data);
}
  