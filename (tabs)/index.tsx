import { StyleSheet } from "react-native";

import { View } from "../components/Themed";
import HomeScreen from "../app/(screens)/home";

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <HomeScreen path="app/(screens)/home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
