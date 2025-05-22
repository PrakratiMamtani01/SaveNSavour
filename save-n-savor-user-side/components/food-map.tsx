"use client"

import { useEffect, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "400px",
}

interface FoodMapProps {
  location: string // e.g., "Dubai, UAE"
}

export default function FoodMap({ location }: FoodMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        )
        const data = await res.json()

        if (data.status === "OK" && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location
          setCoords({ lat, lng })
        } else {
          throw new Error("Could not geocode location")
        }
      } catch (err) {
        console.error("Geocoding failed:", err)
        setError("Failed to load map coordinates")
      }
    }

    fetchCoordinates()
  }, [location])

  if (!isLoaded) return <p>Loading map script...</p>
  if (error) return <p>{error}</p>
  if (!coords) return <p>Loading coordinates...</p>

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={coords} zoom={14}>
      <Marker position={coords} title={location} />
    </GoogleMap>


  )
}
