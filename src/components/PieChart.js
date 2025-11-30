import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PieChart = ({ data, size = 160, strokeWidth = 28, colors, centerText, centerValue }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // Generate arc segments
  const generateArcPath = (startAngle, endAngle, r) => {
    const start = polarToCartesian(center, center, r, endAngle);
    const end = polarToCartesian(center, center, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (r * Math.cos(angleInRadians)),
      y: centerY + (r * Math.sin(angleInRadians))
    };
  };

  // Build segments
  let currentAngle = 0;
  const segments = data.filter(item => item.value > 0).map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle - 1; // Small gap between segments
    currentAngle += angle;
    
    return {
      ...item,
      startAngle,
      endAngle: Math.min(endAngle, startAngle + angle - 0.5),
      percentage
    };
  });

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyRing, { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors?.cardLight || '#2a2a2a'
        }]} />
        <View style={styles.centerLabel}>
          <Text style={[styles.centerAmount, { color: colors?.text || '#fff' }]}>₹0</Text>
          <Text style={[styles.centerText, { color: colors?.textMuted || '#888' }]}>No expenses</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[styles.backgroundRing, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: colors?.cardLight || '#2a2a2a'
      }]} />
      
      {/* Colored segments using borders */}
      {segments.map((segment, index) => {
        const segmentStyle = {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: segment.color,
          borderRightColor: segment.percentage > 25 ? segment.color : 'transparent',
          borderBottomColor: segment.percentage > 50 ? segment.color : 'transparent',
          borderLeftColor: segment.percentage > 75 ? segment.color : 'transparent',
          transform: [{ rotate: `${segment.startAngle}deg` }],
        };
        
        return <View key={segment.key || index} style={segmentStyle} />;
      })}

      {/* Inner circle to create donut effect */}
      <View style={[styles.innerCircle, { 
        width: size - strokeWidth * 2, 
        height: size - strokeWidth * 2, 
        borderRadius: (size - strokeWidth * 2) / 2,
        backgroundColor: colors?.card || '#1a1a1a'
      }]} />
      
      {/* Center label */}
      <View style={styles.centerLabel}>
        <Text style={[styles.centerAmount, { color: colors?.text || '#fff' }]}>
          {centerValue !== undefined ? centerValue : segments.length}
        </Text>
        <Text style={[styles.centerText, { color: colors?.textMuted || '#888' }]}>
          {centerText || 'categories'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundRing: {
    position: 'absolute',
  },
  emptyRing: {
    position: 'absolute',
  },
  innerCircle: {
    position: 'absolute',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  centerText: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default PieChart;
