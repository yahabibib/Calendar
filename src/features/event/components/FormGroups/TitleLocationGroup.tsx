// src/features/event/components/FormGroups/TitleLocationGroup.tsx
import React from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native'

interface TitleLocationGroupProps {
  title: string
  onChangeTitle: (text: string) => void
  location: string
  onChangeLocation: (text: string) => void
}

export const TitleLocationGroup: React.FC<TitleLocationGroupProps> = ({
  title,
  onChangeTitle,
  location,
  onChangeLocation,
}) => {
  return (
    <View style={styles.group}>
      <TextInput
        style={[styles.input, styles.titleInput]}
        placeholder="Title"
        value={title}
        onChangeText={onChangeTitle}
        clearButtonMode="while-editing"
      />
      <View style={styles.separator} />
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="Location"
          value={location}
          onChangeText={onChangeLocation}
        />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert('Map Integration', 'Call Apple MapKit here')}>
          <Text style={{ fontSize: 18 }}>📍</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  input: {
    fontSize: 17,
    paddingHorizontal: 16,
    height: 48,
    color: 'black',
    backgroundColor: 'white',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  locationInput: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
  iconBtn: {
    padding: 8,
  },
})
