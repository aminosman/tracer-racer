import { StyleSheet, View, Text, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import moment from "moment";

export default function Routes({ paths, setRaceTime, close }) {
  // const { paths, setRaceTime } = useLocalSearchParams();
  // const navigation = useNavigation();

  const routes = JSON.parse(paths as string);

  return (
    <View style={[{ padding: 10 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 32,
            marginBottom: 15,
          }}
        >
          Paths
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Pressable style={{ padding: 10 }} onPress={() => close()}>
            <Text style={{ fontSize: 20 }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView>
        {Object.keys(routes).map((k: string) => (
          <Pressable
            style={{ padding: 10 }}
            onPress={() => {
              setRaceTime(k);
              close();
            }}
          >
            <Text key={k}>{moment(k).format("MM/DD/YYYY")}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
