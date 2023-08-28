import React, { useState, useEffect, useMemo, useRef } from "react";
import { ScrollView, TouchableOpacity, Pressable, Alert } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import MapView from "react-native-maps";
import { Geojson } from "react-native-maps";
import * as Location from "expo-location";
import moment from "moment";
import * as TaskManager from "expo-task-manager";

import { Text, View } from "../../components/Themed";
import {
  useStatePersisted,
  PATH_STORAGE_PATH,
  calculateLength,
  isLatLngInRegion,
} from "../../helpers";

const LOCATION_TRACKING = "location-tracking";

export default function Home() {
  const { colors } = useTheme();
  const [paths, setPaths] = useStatePersisted({}, PATH_STORAGE_PATH);
  const [startTime, setStartTime] = useState(null);
  const [running, setRunning] = useState(false);
  const [raceTime, setRaceTime] = useState(null);

  const mapRef = useRef();

  useEffect(() => {
    TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
      if (error) {
        console.log("LOCATION_TRACKING task ERROR:", error);
        return;
      }
      if (data) {
        const { locations } = data;
        locations.map(updateLocation);
      }
    });
  }, []);

  const startLocationTracking = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
    });
  };

  const getCurrentLocation = async () => {
    const { status: backgroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (backgroundStatus !== "granted" || foregroundStatus !== "granted") {
      Alert.alert(
        "Missing Permission",
        "Permission to access location was denied"
      );
      return null;
    }
    return Location.getCurrentPositionAsync({});
  };

  const updateLocation = async (location) => {
    if (!startTime || !running) return;

    setPaths((p) => ({
      ...p,
      [startTime]: [
        {
          ...location,
          order:
            new Date().valueOf() -
            (p?.[startTime]?.[0]?.timestamp || new Date().valueOf()),
          time:
            (p?.[startTime]?.[0]?.time || 0) +
            new Date().valueOf() -
            (p?.[startTime]?.[0]?.timestamp || new Date().valueOf()),
        },
        ...(p?.[startTime] || []),
      ],
    }));
  };

  const start = async (rT?: string) => {
    setRaceTime(rT || null);
    setRunning(true);
    setStartTime(new Date().valueOf());

    const location = await getCurrentLocation();

    mapRef.current.animateToRegion({
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      latitudeDelta: 0.0042,
      longitudeDelta: 0.0011,
    });

    startLocationTracking();
  };

  const points = [...(paths?.[startTime] || [])].reverse();
  const latestPoint = points?.slice(-1)?.[0];

  const snapPoints = useMemo(() => ["10%", "20%", "40%"], []);

  return (
    <View>
      <MapView
        ref={mapRef}
        followsUserLocation
        showsUserLocation
        onUserLocationChange={(event) =>
          updateLocation(event.nativeEvent.coordinate)
        }
        // region={
        //   manualRegion?.region ||
        //   (startTime && points.length
        //     ? {
        //         latitude: latestPoint?.coords?.latitude,
        //         longitude: latestPoint?.coords?.longitude,
        //         latitudeDelta: 0.0042,
        //         longitudeDelta: 0.0011,
        //       }
        //     : undefined)
        // }
        style={{ width: "100%", height: "100%" }}
      >
        {!!raceTime && !!paths[raceTime] && latestPoint && (
          <Geojson
            geojson={
              {
                type: "FeatureCollection",
                features: [
                  {
                    geometry: {
                      type: "LineString",
                      coordinates: paths[raceTime]
                        .filter(
                          (p) =>
                            p.time <
                            (latestPoint.time || latestPoint.order || 0)
                        )
                        .map((p) => [p.longitude, p.latitude]),
                    },
                  },
                ],
              } as any
            }
            strokeColor="blue"
            strokeWidth={15}
          />
        )}
        <Geojson
          geojson={
            {
              type: "FeatureCollection",
              features: [
                {
                  geometry: {
                    type: "LineString",
                    coordinates: points.map((p) => [p.longitude, p.latitude]),
                  },
                },
              ],
            } as any
          }
          strokeColor="red"
          strokeWidth={5}
        />
      </MapView>
      {!!startTime && (
        <TouchableOpacity
          style={{
            width: "90%",
            height: 50,
            backgroundColor: running ? "orange" : "green",
            position: "absolute",
            bottom: 25,
            borderRadius: 50,
            justifyContent: "center",
            alignContent: "center",
            left: "5%",
          }}
          onPress={() => {
            setRunning(!running);
          }}
          onLongPress={() => {
            TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING).then(
              (tracking) => {
                if (tracking) {
                  Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
                }
              }
            );
            setStartTime(null);
          }}
        >
          <Text
            style={{ textAlign: "center", color: "white", fontWeight: "bold" }}
          >
            {running ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>
      )}
      {!!latestPoint && (
        <View
          style={{
            position: "absolute",
            top: 50,
            right: 25,
            height: 100,
            width: 75,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              marginTop: 15,
              fontSize: 50,
              textAlign: "center",
              textAlignVertical: "center",
            }}
          >
            {Math.round((latestPoint?.coords?.speed || 0) * 2.23694)}
          </Text>
          <Text>MPH</Text>
        </View>
      )}
      {!startTime && (
        <BottomSheet index={1} snapPoints={snapPoints}>
          <View style={{ flex: 1, paddingBottom: 20 }}>
            <ScrollView>
              <Pressable
                style={{
                  padding: 15,
                  borderColor: "black",
                  borderBottomWidth: 1,
                }}
                onPress={() => {
                  start();
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold" }}>Start</Text>
              </Pressable>
              {Object.keys(paths)
                .reverse()
                .map((k: string) => (
                  <Pressable
                    key={k}
                    style={{
                      padding: 15,
                      borderColor: "black",
                      borderBottomWidth: 1,
                    }}
                    onPress={() => {
                      start(k);
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: "bold" }}>
                      {moment(parseInt(k, 10)).format("M/DD h:mm a")}
                      {" -- "}
                      {calculateLength(
                        paths[k].map((p) => [p.longitude, p.latitude])
                      )}{" "}
                      miles
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}
