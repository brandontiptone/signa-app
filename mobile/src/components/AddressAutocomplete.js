import React, { useState, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

// Autocomplétion basée sur l'API Adresse du gouvernement français
// (https://api-adresse.data.gouv.fr) — gratuite, officielle, sans clé API.
// Renvoie des adresses réelles et géocodées, ce qui évite les fautes de saisie
// et permet en plus de récupérer latitude/longitude pour le GPS plus tard.
export default function AddressAutocomplete({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef(null);

  const search = (text) => {
    onChange(text);
    setShowList(true);
    clearTimeout(debounceRef.current);

    if (!text || text.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`
        );
        const json = await res.json();
        setSuggestions(json.features || []);
      } catch (err) {
        console.log('Erreur autocomplétion adresse', err);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce pour ne pas spammer l'API à chaque frappe
  };

  const select = (feature) => {
    onChange(feature.properties.label);
    setSuggestions([]);
    setShowList(false);
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder={placeholder || 'Commence à taper une adresse...'}
        value={value}
        onChangeText={search}
        onFocus={() => setShowList(true)}
      />
      {loading && <ActivityIndicator style={styles.loader} size="small" color="#2563eb" />}

      {showList && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((f) => (
            <TouchableOpacity key={f.properties.id} style={styles.item} onPress={() => select(f)}>
              <Text style={styles.itemLabel}>{f.properties.name}</Text>
              <Text style={styles.itemCity}>{f.properties.postcode} {f.properties.city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.hint}>Suggestions officielles (API Adresse — gouv.fr)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, marginBottom: 4, fontSize: 15 },
  loader: { position: 'absolute', right: 14, top: 16 },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLabel: { fontSize: 13.5, fontWeight: '600', color: '#1a1a2e' },
  itemCity: { fontSize: 11.5, color: '#888', marginTop: 1 },
  hint: { fontSize: 10.5, color: '#999', marginTop: 4, marginBottom: 10, marginLeft: 2 },
});
