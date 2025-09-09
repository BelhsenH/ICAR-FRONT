import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import VehicleService from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';
import { useAuth } from '../contexts/AuthContext';
import tw from 'twrnc';

interface VehicleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  visible,
  onClose,
  onSelectVehicle,
  selectedVehicleId,
}) => {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const userVehicles = await VehicleService.getUserVehicles(token);
      setVehicles(userVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Erreur', 'Impossible de charger vos véhicules');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible && token) {
      loadVehicles();
    }
  }, [visible, token, loadVehicles]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle);
    onClose();
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={[
        tw`bg-white rounded-xl p-4 mb-3 border`,
        selectedVehicleId === item._id 
          ? tw`border-blue-600 bg-blue-50` 
          : tw`border-gray-200`
      ]}
      onPress={() => handleSelectVehicle(item)}
    >
      <View style={tw`flex-row items-center`}>
        {/* Vehicle doesn't have photos in the current interface, so always show placeholder */}
        <View style={tw`w-16 h-16 rounded-lg bg-gray-200 items-center justify-center`}>
          <Ionicons name="car" size={24} color="#9CA3AF" />
        </View>
        
        <View style={tw`flex-1 ml-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-1`}>
            {item.marque} {item.modele}
          </Text>
          <Text style={tw`text-sm text-gray-600 mb-1`}>
            Année {new Date(item.datePremiereMiseEnCirculation).getFullYear()}
          </Text>
          <View style={tw`flex-row items-center`}>
            <Ionicons name="card" size={14} color="#6B7280" />
            <Text style={tw`text-sm text-gray-600 ml-1`}>
              {item.numeroImmatriculation}
            </Text>
          </View>
        </View>

        <View style={tw`items-center justify-center ml-2`}>
          {selectedVehicleId === item._id ? (
            <View style={tw`w-6 h-6 rounded-full bg-blue-600 items-center justify-center`}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          ) : (
            <View style={tw`w-6 h-6 rounded-full border-2 border-gray-300`} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`bg-white border-b border-gray-200 p-4 flex-row items-center justify-between`}>
          <Text style={tw`text-xl font-bold text-gray-900`}>
            Sélectionnez un véhicule
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center`}
          >
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={tw`flex-1 p-4`}>
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={tw`text-gray-600 mt-4`}>Chargement de vos véhicules...</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Ionicons name="car-outline" size={64} color="#9CA3AF" />
              <Text style={tw`text-xl font-semibold text-gray-700 mt-4 mb-2`}>
                Aucun véhicule
              </Text>
              <Text style={tw`text-gray-500 text-center px-8 mb-6`}>
                Vous devez d&apos;abord ajouter un véhicule pour pouvoir commander des pièces.
              </Text>
              <TouchableOpacity
                style={tw`bg-blue-600 px-6 py-3 rounded-lg flex-row items-center`}
                onPress={() => {
                  onClose();
                  // Navigate to add vehicle screen
                  // This would need to be implemented in the parent component
                }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={tw`text-white font-semibold ml-2`}>Ajouter un véhicule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={tw`text-gray-600 mb-4`}>
                Choisissez le véhicule pour lequel vous voulez commander cette pièce :
              </Text>
              <FlatList
                data={vehicles}
                renderItem={renderVehicleItem}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-4`}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default VehicleSelectionModal;
