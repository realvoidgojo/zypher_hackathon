import { LatLngTuple } from "leaflet";

export async function getRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  quantity: number = 1,
) {
  // 📍 Using the primary OSRM routing service
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM Down");

    const data = await res.json();
    if (!data.routes || data.routes.length === 0)
      throw new Error("No route found");

    const routeData = data.routes[0];

    // 🗺️ This maps the real road geometry
    const coords: LatLngTuple[] = routeData.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple,
    );

    const distanceKm = routeData.distance / 1000;
    const durationMin = (routeData.duration / 60).toFixed(0);

    // B2B Freight Profit Calculation
    // Industry-standard Indian logistics rates (configurable)
    const COST_PER_KM = 18; // ₹18/km — Diesel + Driver + Tolls + Wear
    const REVENUE_PER_KM = 28; // ₹28/km — Base freight contract rate
    const REVENUE_PER_UNIT = 150; // ₹150/unit — Handling charge per unit
    const cost = distanceKm * COST_PER_KM;
    const revenue = distanceKm * REVENUE_PER_KM + quantity * REVENUE_PER_UNIT;
    const profitEstimate = (revenue - cost).toFixed(0);

    return {
      coordinates: coords,
      distance: distanceKm.toFixed(1),
      duration: durationMin,
      profitEstimate: profitEstimate,
    };
  } catch (error) {
    console.warn(
      "⚠️ Road Fetch Failed - Falling back to straight line briefly",
      error,
    );

    // Fallback: Haversine distance + estimated duration when OSRM is down
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(endLat - startLat);
    const dLon = toRad(endLng - startLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(startLat)) *
        Math.cos(toRad(endLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const fallbackDist = Math.round(
      R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3,
    ); // ×1.3 for road factor
    const fallbackDuration = Math.round((fallbackDist / 60) * 60).toString(); // ~60 km/h avg speed → minutes
    const COST_PER_KM = 18;
    const REVENUE_PER_KM = 28;
    const REVENUE_PER_UNIT = 150;
    const fallbackProfit = (
      fallbackDist * REVENUE_PER_KM +
      quantity * REVENUE_PER_UNIT -
      fallbackDist * COST_PER_KM
    ).toFixed(0);

    return {
      coordinates: [
        [startLat, startLng],
        [endLat, endLng],
      ] as LatLngTuple[],
      distance: fallbackDist.toString(),
      duration: fallbackDuration,
      profitEstimate: fallbackProfit,
    };
  }
}
