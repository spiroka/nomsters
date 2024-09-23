import { useLoaderData, useRouter } from '@tanstack/react-router';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { eat } from './api';

function Map() {
  const router = useRouter();
  const { nomsters, profile } = useLoaderData({ from: '/' });

  return (
    <div className="map-container">
      <p>Food monsters are roaming the streets. Find and eat them to earn points!</p>
      <MapContainer className="map-container__map" center={[36.72, -4.42]} zoom={13}>
        <span className="map-container__points">Points: {profile.points}</span>
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {nomsters?.map((nomster) => (
          <Marker key={nomster.id} position={[ nomster.latitude, nomster.longitude ]}>
            <Popup maxWidth={600}>
              <h3>{nomster.name}</h3>
              <h4>{nomster.restaurant}</h4>
              <div>
                <img src={nomster.image_url} alt="" />
                <div>
                  <p>
                    {nomster.description}
                  </p>
                  <button onClick={() => {
                    eat(nomster.id).then(() => router.invalidate());
                  }}>Eat for {nomster.times_eaten === 0 ? nomster.points : 1} point(s)</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
