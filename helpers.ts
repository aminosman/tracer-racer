import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PATH_STORAGE_PATH = "points-8";

const dataCache = {};

export function useStatePersisted<T>(
  defaultValue: T,
  key: string
): [T, (v: T | ((vv: T) => T)) => void, boolean] {
  const [value, setValue] = useState<any>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const loadFromStorage = async () => {
    try {
      const storedValue = await getItem(key);
      if (storedValue) {
        if (defaultValue instanceof Set) {
          setValue(new Set(JSON.parse(storedValue)));
        } else {
          setValue(JSON.parse(storedValue));
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  };
  useEffect(() => {
    loadFromStorage().then(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) {
      if (value instanceof Set) {
        setItem(key, JSON.stringify([...value]));
      } else {
        setItem(key, JSON.stringify(value));
      }
    }
  }, [value]);
  return [value, setValue, loaded];
}

export async function getItem(key: string) {
  try {
    if (dataCache[key]) return dataCache[key];
    const value = await AsyncStorage.getItem(key);
    dataCache[key] = value;
    return value;
  } catch (error) {
    console.error(error);
  }
  return null;
}

export async function setItem(key: string, value: string) {
  if (!value) {
    delete dataCache[key];
    return removeItem(key);
  }
  try {
    dataCache[key] = value;
    return AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(error);
  }
  return null;
}

export function calculateLength(lineString) {
  if (lineString.length < 2) return 0;
  let result = 0;
  for (let i = 1; i < lineString.length; i++)
    result += distance(
      lineString[i - 1][0],
      lineString[i - 1][1],
      lineString[i][0],
      lineString[i][1]
    );
  return Math.round((result / 1000) * 100 * 0.621371) / 100;
}

/**
 * Calculate the approximate distance between two coordinates (lat/lon)
 *
 * © Chris Veness, MIT-licensed,
 * http://www.movable-type.co.uk/scripts/latlong.html#equirectangular
 */
export function distance(λ1, φ1, λ2, φ2) {
  let R = 6371000;
  Δλ = ((λ2 - λ1) * Math.PI) / 180;
  φ1 = (φ1 * Math.PI) / 180;
  φ2 = (φ2 * Math.PI) / 180;
  let x = Δλ * Math.cos((φ1 + φ2) / 2);
  let y = φ2 - φ1;
  let d = Math.sqrt(x * x + y * y);
  return R * d;
}

export function isLatLngInRegion(region, { latitude, longitude }) {
  if (!region) return true;

  const {
    latitude: regLat,
    latitudeDelta,
    longitude: regLon,
    longitudeDelta,
  } = region;
  const latMin = regLat - latitudeDelta / 2;
  const latMax = regLat + latitudeDelta / 2;
  const lonMin = regLon - longitudeDelta / 2;
  const lonMax = regLon + longitudeDelta / 2;

  let long = longitude;

  if (lonMin < -180 && longitude > 0) {
    long = longitude - 360;
  }

  if (lonMax > 180 && longitude < 0) {
    long = longitude + 360;
  }

  return (
    latitude >= latMin && latitude <= latMax && long >= lonMin && long <= lonMax
  );
}
