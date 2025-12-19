// src/features/event/components/FormGroups/MetaGroup.tsx
import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'

interface MetaGroupProps {
  url: string
  onChangeUrl: (text: string) => void
  description: string
  onChangeDescription: (text: string) => void
}

export const MetaGroup: React.FC<MetaGroupProps> = ({
  url,
  onChangeUrl,
  description,
  onChangeDescription,
}) => {
  return (
    <View style={styles.group}>
      <TextInput
        style={styles.input}
        placeholder="URL"
        value={url}
        onChangeText={onChangeUrl}
        keyboardType="url"
        autoCapitalize="none"
      />
      <View style={styles.separator} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notes"
        value={description}
        onChangeText={onChangeDescription}
        multiline
      />
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
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
})
