export const calculateCalories = (distanceKm, durationMinutes, weight = 70) => {
  // TODO: Calculate estimated calories burned
  // Using Karvonen formula / running metrics
  // Average calorie burn: 100 calories per km
  if (distanceKm === 0) {
    return 0;
  }

  // Adjusted for weight: heavier people burn more calories
  const baseCalories = 100;
  const weightFactor = weight / 70; // Normalized to 70kg
  const calories = distanceKm * baseCalories * weightFactor;

  return Math.round(calories);
};

export const calculateCaloriesBurnedByDuration = (durationMinutes, intensity = 'moderate') => {
  // TODO: Alternative calculation based on duration and intensity
  // Light: 6 cal/min, Moderate: 10 cal/min, Intense: 16 cal/min
  const intensityMap = {
    light: 6,
    moderate: 10,
    intense: 16,
  };

  const factor = intensityMap[intensity] || intensityMap.moderate;
  return Math.round(durationMinutes * factor);
};

export const calculateCaloriesBurnedByHeartRate = (
  averageHeartRate,
  durationMinutes,
  gender = 'M',
  age = 30,
) => {
  // TODO: Calculate calories using Karvonen formula
  // More accurate when heart rate data is available
  const maxHR = gender === 'M' ? 220 - age : 226 - age;
  const restingHR = 70; // Average resting heart rate

  const hrReserve = maxHR - restingHR;
  const intensityFactor = (averageHeartRate - restingHR) / hrReserve;

  // VO2 estimation
  const vo2 = 15 * intensityFactor; // mL/kg/min

  // Weight assumed to be 70kg
  const weight = 70;
  const calories = (vo2 * weight * durationMinutes) / 5;

  return Math.round(calories);
};

export default {
  calculateCalories,
  calculateCaloriesBurnedByDuration,
  calculateCaloriesBurnedByHeartRate,
};
