import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketDebugger: React.FC = () => {
  const { isConnected, connectionState, getConnectionInfo, forceReconnect, connect, disconnect } = useWebSocket({ autoConnect: false });
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const updateDebugInfo = () => {
    const info = getConnectionInfo();
    setDebugInfo(info);
    console.log('WebSocket Debug Info:', info);
  };

  useEffect(() => {
    // Update debug info every 2 seconds
    const interval = setInterval(updateDebugInfo, 2000);
    setRefreshInterval(interval);
    
    // Initial update
    updateDebugInfo();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleConnect = () => {
    console.log('Debug: Manual connect triggered');
    connect();
  };

  const handleDisconnect = () => {
    console.log('Debug: Manual disconnect triggered');
    disconnect();
  };

  const handleForceReconnect = () => {
    console.log('Debug: Force reconnect triggered');
    forceReconnect();
  };

  const showConnectionInfo = () => {
    const info = getConnectionInfo();
    Alert.alert(
      'WebSocket Connection Info',
      JSON.stringify(info, null, 2),
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#4CAF50';
      case 'CONNECTING': return '#FF9800';
      case 'CLOSED': return '#F44336';
      case 'CLOSING': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Debugger</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Connection Status:</Text>
        <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Text>
        </View>
      </View>

      {debugInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Debug Information:</Text>
          <Text style={styles.infoText}>Status: <Text style={{ color: getStatusColor(debugInfo.status) }}>{debugInfo.status}</Text></Text>
          <Text style={styles.infoText}>Ready State: {debugInfo.readyState}</Text>
          <Text style={styles.infoText}>URL: {debugInfo.url || 'Not connected'}</Text>
          <Text style={styles.infoText}>Reconnect Attempts: {debugInfo.attempts}/5</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleConnect}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.disconnectButton]} onPress={handleDisconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.reconnectButton]} onPress={handleForceReconnect}>
          <Text style={styles.buttonText}>Force Reconnect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showConnectionInfo}>
          <Text style={styles.buttonText}>Show Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 10,
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  reconnectButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default WebSocketDebugger;